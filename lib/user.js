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
  var tokens = {};
  var db = new DB(options);

  var COLLECTION = 'users';

  function generateSalt(cb) {
    crypto.randomBytes(SALT_LENGTH, cb);
  }

  function saltAndHash(data, cb) {
    generateSalt(function(err, salt) {
      if (err) {
        cb(err);
        return;
      }
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
    });
  }

  function compareBuffers(a, b) {
    if (a.length != b.length) {
      return false;
    }
    for (var i = 0, len = a.length; i < len; i++) {
      if (a[i] != b[i]) {
        return false;
      }
    }
    return true;
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
        cb();
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

  this.createUser = function createUser(username, password, permissions, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
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
        permissions: permissions
      }, cb);
    });
  };

  this.authenticateUser = function authenticateUser(username, password, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    throw new Error('Not Implemented');
  };

  this.removeUser = function removeUser(username, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    throw new Error('Not Implemented');
  };

  this.getPermission = function checkPermission(username, permission, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    throw new Error('Not Implemented');
  };

  this.changePermission = function changePermission(username, permission, value, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    throw new Error('Not Implemented');
  };

  this.changePassword = function changePassword(username, oldPassword, newPassword, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    throw new Error('Not Implemented');
  };

  this.resetPassword = function resetPassword(username, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    throw new Error('Not Implemented');
  };
}