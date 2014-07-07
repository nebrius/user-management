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

var MongoClient = require('mongodb').MongoClient;

module.exports = function() {

  var loaded = false;
  var tokens = {};
  var collection;

  /*
   * Options:
   * - hostname: The MongoDB server hostname. Default: 'localhost'
   * - port: The MongoDB server port. Default: 27017
   * - database: The MongoDB database. Default: 'user_management'
   * - collection: The MongoDB collection name. Default: 'users'
   */
  this.load = function load(options, cb) {
    options = options || {};
    if (loaded) {
      console.warn('User management already loaded. Not reloading');
      return;
    }
    MongoClient.connect('mongodb://' +
      (options.hostname || 'localhost') + ':' +
      (options.port || '27017') + '/' +
      (options.database || 'user_management'),
      function(err, db) {
        if (err) {
          cb(err);
          return;
        }
        db.collection(options.collection || 'users', function(err, col) {
          if (err) {
            cb(err);
            return;
          }
          collection = col;
          loaded = true;
          cb(null);
        });
      });
  };

  this.userExists = function userExists(username, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    cb();
  };

  this.createUser = function createUser(username, password, permissions, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    cb();
  };

  this.authenticateUser = function authenticateUser(username, password, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    cb();
  };

  this.validateToken = function validateToken(username, token) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    return tokens[username] === token;
  };

  this.removeUser = function removeUser(username, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    cb();
  };

  this.checkPermission = function checkPermission(username, permission, cb) {
    if (!loaded) {
      throw new Error('Cannot call "userExists" on unloaded user management object');
    }
    cb();
  };
}