/*
The MIT License (MIT)

Copyright (c) 2014 Bryan Hughes <bryan@theoreticalideations.com> (http://theoreticalideations.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var crypto = require('crypto');
var async = require('async');
var DB = require('./mongodb');

var SALT_LENGTH = 64; // Length of the salt, in bytes
var TOKEN_LENGTH = 64;
var HASH_LENGTH = 64; // Length of the hash, in bytes
var HASH_ITERATIONS = 1000; // Number of pbkdf2 iterations

/*
 * Options:
 * - hostname: The MongoDB server hostname. Default: 'localhost'
 * - port: The MongoDB server port. Default: 27017
 * - database: The MongoDB database. Default: 'user_management'
 * - tokenExpiration: The amount of time, in hours, that a token is valid for. Default is 168 (a week).
 */
module.exports = function(options) {

  options = options || {};

  var tokenExpiration = 24 * 7;
  if ( typeof options.tokenExpiration == 'number') {
    if (options.tokenExpiration > 0 && options.tokenExpiration < 8760) {
      tokenExpiration = options.tokenExpiration;
    } else {
      console.warn('Token Expiration must be between 1 hour and 8760 hours (1 year). Using the default of 168 (a week)');
    }
  } else if (typeof options.tokenExpiration != 'undefined') {
    console.warn('Token Expiration must be a number. Using the default of 168 (a week)');
  }
  tokenExpiration *= 1000 * 60 * 60;

  var loaded = false;
  var db = new DB(options);

  var COLLECTION = 'users';

  function generateSalt(cb) {
    crypto.randomBytes(SALT_LENGTH, cb);
  }

  function generateToken(cb) {
    crypto.randomBytes(TOKEN_LENGTH, cb);
  }

  function hash(data, salt, cb) {
    crypto.pbkdf2(data, salt, HASH_ITERATIONS, HASH_LENGTH, function(err, hash) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, {
        salt: salt,
        hash: hash
      });
    });
  }

  function saltAndHash(data, cb) {
    generateSalt(function(err, salt) {
      if (err) {
        cb(err);
        return;
      }
      hash(data, salt, cb);
    });
  }

  this.load = function load(cb) {
    if (loaded) {
      console.warn('User management already loaded. Not reloading');
      return;
    }
    db.connect(function(err) {
      if (err) {
        cb(err);
        return;
      }
      db.loadCollection(COLLECTION, function(err) {
        if (err) {
          cb(err);
          return;
        }
        loaded = true;
        cb(null);
      });
    });
  };

  this.close = function close(cb) {
    db.disconnect(cb);
  };

  this.getUserList = function getUserList(cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    db.findAll(COLLECTION, function(err, items) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, (items || []).map(function(item) {
        return item.username;
      }));
    });
  };

  this.userExists = function userExists(username, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    db.find(COLLECTION, {
      username: username
    }, function(err, item) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, !!item);
    });
  };

  this.createUser = function createUser(username, password, extras, cb) {
    if (!loaded) {
      throw new Error('Cannot call "createUser" on unloaded user management object');
    }
    this.userExists(username, function(err, exists) {
      if (err) {
        cb(err);
        return;
      } else if(exists) {
        cb('User already exists');
        return;
      }
      saltAndHash(password, function(err, results) {
        if (err) {
          cb(err);
          return;
        }
        db.create(COLLECTION, {
          username: username,
          password: results.hash.toString('base64'),
          passwordSalt: results.salt.toString('base64'),
          extras: extras,
          token: null,
          tokenExpires: null
        }, cb);
      });
    });
  };

  this.removeUser = function removeUser(username, cb) {
    if (!loaded) {
      throw new Error('Cannot call "removeUser" on unloaded user management object');
    }
    db.delete(COLLECTION, { username: username }, function(err) {
      cb(err);
    });
  };

  this.authenticateUser = function authenticateUser(username, password, cb) {
    if (!loaded) {
      throw new Error('Cannot call "authenticateUser" on unloaded user management object');
    }
    var SUPPRESS = '#@suppress callback';
    var item;
    async.series([

      // Make sure the user exists
      function(next) {
        this.userExists(username, function(err, exists) {
          if (err) {
            next(err);
          } else if (!exists) {
            cb(null, {
              userExists: false,
              passwordsMatch: null,
              token: null
            });
            next(SUPPRESS);
          } else {
            next();
          }
        });
      }.bind(this),

      // Look up the user
      function(next) {
        db.find(COLLECTION, {
          username: username
        }, function(err, i) {
          item = i;
          next(err);
        });
      }.bind(this),

      // Salt and hash the password, and check it against the DB. We do these two operations in one step to avoid having to
      // cache the hashed salt and password anymore than we have to
      function(next) {
        hash(password, new Buffer(item.passwordSalt, 'base64'), function(err, hashedPassword) {
          if (err) {
            next(err);
          } else if (item.password != hashedPassword.hash.toString('base64')) {
            cb(null, {
              userExists: true,
              passwordsMatch: false,
              token: null
            });
            next(SUPPRESS);
          } else {
            next();
          }
        });
      }.bind(this),

      // Generate the token and store it to the database
      function(next) {
        generateToken(function(err, token) {
          if (err) {
            next(err);
            return;
          }
          token = token.toString('base64');
          db.update(COLLECTION, { username: username }, { token: token, tokenExpires: Date.now() + tokenExpiration }, function(err) {
            if (err) {
              next(err);
              return;
            }
            cb(null, {
              userExists: true,
              passwordsMatch: true,
              token: token
            });
            next(SUPPRESS);
          });
        });
      }.bind(this),
    ], function(err, result) {
      if (err != SUPPRESS) {
        cb(err || null, result);
      }
    });
  };

  this.expireToken = function expireToken(token, cb) {
    db.update(COLLECTION, { token: token }, { token: null, tokenExpires: null }, function(err) {
      cb(err);
    });
  };

  this.isTokenValid = function isTokenValid(token, cb) {
    if (!loaded) {
      throw new Error('Cannot call "isTokenValid" on unloaded user management object');
    }
    db.find(COLLECTION, { token: token }, function(err, item) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, !!item && item.tokenExpires >= Date.now());
    });
  };

  this.getUsernameForToken = function getUsernameForToken(token, cb) {
    if (!loaded) {
      throw new Error('Cannot call "getUsernameForToken" on unloaded user management object');
    }
    db.find(COLLECTION, { token: token }, function(err, item) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, item && item.username);
    });
  };

  this.getTokenForUsername = function getTokenForUsername(username, cb) {
    if (!loaded) {
      throw new Error('Cannot call "getTokenForUsername" on unloaded user management object');
    }
    db.find(COLLECTION, { username: username }, function(err, item) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, item && item.token);
    });
  };

  function getExtras(filter, cb) {
    if (!loaded) {
      throw new Error('Cannot call "getExtrasForUsername" on unloaded user management object');
    }
    db.find(COLLECTION, filter, function(err, item) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, item && item.extras);
    });
  }

  this.getExtrasForUsername = function getExtrasForUsername(username, cb) {
    getExtras({ username: username }, cb);
  };

  this.getExtrasForToken = function getExtrasForToken(token, cb) {
    getExtras({ token: token }, cb);
  };

  function setExtras(filter, value, cb) {
    if (!loaded) {
      throw new Error('Cannot call "setExtrasForUsername" on unloaded user management object');
    }
    db.update(COLLECTION, filter, { extras: value }, cb);
  }

  this.setExtrasForUsername = function setExtrasForUsername(username, extras, cb) {
    setExtras({ username: username }, extras, cb);
  };

  this.setExtrasForToken = function setExtrasForToken(token, extras, cb) {
    setExtras({ token: token }, extras, cb);
  };

  this.changePassword = function changePassword(token, oldPassword, newPassword, cb) {
    if (!loaded) {
      throw new Error('Cannot call "changePassword" on unloaded user management object');
    }
    var username;
    var newToken;
    async.series([

      // Validate the token
      function(next) {
        this.isTokenValid(token, function(err, valid) {
          if (err) {
            next(err);
          } else if (!valid) {
            next('Invalid token');
          } else {
            next();
          }
        });
      }.bind(this),

      // Fetch the username
      function(next) {
        this.getUsernameForToken(token, function(err, user) {
          if (err) {
            next(err);
          } else if (!user) {
            next('Invalid token');
          } else {
            username = user;
            next();
          }
        });
      }.bind(this),

      // Validate the old password by doing a quick auth
      function(next) {
        this.authenticateUser(username, oldPassword, function(err, result) {
          if (err) {
            next(err);
          } else if (!result.userExists) {
            next('Internal error: could not look up username');
          } else if (!result.passwordsMatch) {
            next('Invalid password');
          } else {
            newToken = result.token;
            next();
          }
        });
      }.bind(this),

      // Salt and hash the password, and store it in the DB. We do these two operations in one step to avoid having to
      // cache the hashed salt and password anymore than we have to
      function(next) {
        saltAndHash(newPassword, function(err, results) {
          if (err) {
            next(err);
            return;
          }
          db.update(COLLECTION, { username: username }, {
            password: results.hash.toString('base64'),
            passwordSalt: results.salt.toString('base64'),
            token: null,
            tokenExpires: null
          }, next);
        });
      }.bind(this)
    ], function(err) {
      cb(err || null);
    });
  };

  this.resetPassword = function resetPassword(username, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    crypto.randomBytes(8, function(err, newPassword) {
      if (err) {
        cb(err);
        return;
      }
      newPassword = newPassword.toString('base64');
      saltAndHash(newPassword, function(err, results) {
        if (err) {
          cb(err);
          return;
        }
        db.update(COLLECTION, { username: username }, {
          password: results.hash.toString('base64'),
          passwordSalt: results.salt.toString('base64'),
          token: null,
          tokenExpires: null
        }, function(err) {
          if (err) {
            cb(err);
            return;
          }
          cb(null, newPassword);
        });
      });
    });
  };

  Object.defineProperty(this, '_resetForTests', {
    value: function(cb) {
      db.dropCollection(COLLECTION, cb);
    }
  });
}