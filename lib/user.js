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
 */
module.exports = function(options) {

  options = options || {};

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
  };

  this.authenticateUser = function authenticateUser(username, password, cb) {
    if (!loaded) {
      throw new Error('Cannot call "authenticateUser" on unloaded user management object');
    }
    this.userExists(username, function(err, exists) {
      if (err) {
        cb(err);
        return;
      }
      if (!exists) {
        cb(null, {
          userExists: false,
          passwordsMatch: null,
          token: null
        });
        return;
      }
      db.find(COLLECTION, {
        username: username
      }, function(err, item) {
        if (err) {
          cb(err);
          return;
        }
        hash(password, new Buffer(item.passwordSalt, 'base64'), function(err, hashedPassword) {
          if (err) {
            cb(err);
            return;
          }
          if (item.password != hashedPassword.hash.toString('base64')) {
            cb(null, {
              userExists: true,
              passwordsMatch: false,
              token: null
            });
            return;
          }
          generateToken(function(err, token) {
            if (err) {
              cb(err);
              return;
            }
            token = token.toString('base64');
            db.update(COLLECTION, { username: username}, 'token', token, function(err) {
              if (err) {
                cb(err);
                return;
              }
              cb(null, {
                userExists: true,
                passwordsMatch: true,
                token: token
              });
            });
          });
        });
      });
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
      cb(null, !!item);
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
    db.find(COLLECTION, filter, function(err, item) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, item && item.extras);
    });
  }

  this.getExtrasForUsername = function getExtrasForUsername(username, cb) {
    if (!loaded) {
      throw new Error('Cannot call "getExtrasForUsername" on unloaded user management object');
    }
    getExtras({ username: username }, cb);
  };

  this.getExtrasForToken = function getExtrasForToken(token, cb) {
    if (!loaded) {
      throw new Error('Cannot call "getExtrasForToken" on unloaded user management object');
    }
    getExtras({ token: token }, cb);
  };

  function setExtras(filter, value, cb) {
    db.update(COLLECTION, filter, 'extras', value, cb);
  }

  this.setExtrasForUsername = function setExtrasForUsername(username, extras, cb) {
    if (!loaded) {
      throw new Error('Cannot call "setExtrasForUsername" on unloaded user management object');
    }
    setExtras({ username: username }, extras, cb);
  };

  this.setExtrasForToken = function setExtrasrForToken(token, extras, cb) {
    if (!loaded) {
      throw new Error('Cannot call "setExtrasrForToken" on unloaded user management object');
    }
    setExtras({ token: token }, extras, cb);
  };

  this.changePassword = function changePassword(token, oldPassword, newPassword, cb) {
    if (!loaded) {
      throw new Error('Cannot call "changePassword" on unloaded user management object');
    }
    throw new Error('Not Implemented');
  };

  this.removeUser = function removeUser(username, cb) {
    if (!loaded) {
      throw new Error('Cannot call "removeUser" on unloaded user management object');
    }
    db.delete(COLLECTION, { username: username }, function(err) {
      cb(err || null);
    });
  };

  this.resetPassword = function resetPassword(username, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    throw new Error('Not Implemented');
  };

  Object.defineProperty(this, '_resetForTests', {
    value: function(cb) {
      db.dropCollection(COLLECTION, cb);
    }
  });
}