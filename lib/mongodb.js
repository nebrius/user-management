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

module.exports = function(options) {

  var db;
  var collections = {};

  function nop() {}

  this.connect = function(cb) {
    cb = cb || nop;
    var connectionString = 'mongodb://' +
      (options.hostname || 'localhost') + ':' +
      (options.port || '27017') + '/' +
      (options.database || 'user_management');
    MongoClient.connect(connectionString, function(err, database) {
      if (err) {
        cb(err);
        return;
      }
      db = database;
      cb(null);
    });
  };

  this.loadCollection = function(collection, cb) {
    cb = cb || nop;
    db.collection(collection, function(err, col) {
      if (err) {
        cb(err);
        return;
      }
      collections[collection] = col;
      cb(err);
    });
  };

  this.create = function(collection, document, cb) {
    cb = cb || nop;
    var col = collections[collection];
    if (!col) {
      cb('Attempt to read from unloaded collection "' + collection + '"');
      return;
    }
    col.insert(document, { w: 1 }, function (err) {
      if (typeof cb == 'function') {
        cb(err);
      }
    });
  };

  this.find = function(collection, filter, cb) {
    cb = cb || nop;
    var col = collections[collection];
    if (!col) {
      cb('Attempt to read from unloaded collection "' + collection + '"');
      return;
    }
    col.findOne(filter, function(err, item) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, item);
    });
  };

  this.update = function(collection, filter, key, value, cb) {
    cb = cb || nop;
    var col = collections[collection];
    if (!col) {
      cb('Attempt to read from unloaded collection "' + collection + '"');
      return;
    }
    var setobj = {};
    setobj[key] = value;
    col.update(filter, { $set: setobj }, { w: 1 }, function(err) {
      if (err) {
        cb(err);
        return;
      }
      cb(null);
    });
  };

  this.delete = function(collection, filter, cb) {
    cb = cb || nop;
    var col = collections[collection];
    if (!col) {
      cb('Attempt to read from unloaded collection "' + collection + '"');
      return;
    }
    col.remove(filter, { w: 1 }, function(err) {
      if (err) {
        cb(err);
        return;
      }
      cb(null);
    });
  };

};