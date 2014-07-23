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

/*global describe, it, expect*/

var UserManagement = require('../');

describe('User Creation', function() {

  var um = new UserManagement({
    database: 'user_management_tests'
  });

  var USERNAME = 'foo';
  var PASSWORD = 'bar';
  var PERMISSIONS = {
    perm1: true,
    perm2: false
  };

  it('Can connect to the test database ', function(done) {
    um.load(function(err) {
      expect(err).toBeNull();
      done();
    });
  });

  // We actually just want to drop the collection, if it exists. It's not really a test
  it('Can reset the test database', function(done) {
    um._resetForTests(function() {
      done();
    });
  });

  it('Can check that the test user doesn\'t exist (yet)', function(done) {
    um.userExists(USERNAME, function(err, exists) {
      expect(err).toBeNull();
      expect(exists).toBe(false);
      done();
    });
  });

  it('Can create a user', function(done) {
    um.createUser(USERNAME, PASSWORD, PERMISSIONS, function(err) {
      expect(err).toBeNull();
      done();
    });
  });

  it('Can check that the test user now exists', function(done) {
    um.userExists(USERNAME, function(err, exists) {
      expect(err).toBeNull();
      expect(exists).toBe(true);
      done();
    });
  });

  it('Fails when authenticating with a bad username', function(done) {
    um.authenticateUser('bad', 'bad', function(err, result) {
      expect(err).toBeNull();
      expect(result.userExists).toBe(false);
      expect(result.passwordsMatch).toBeNull();
      expect(result.token).toBeNull();
      done();
    });
  });

  it('Fails when authenticating with a bad password', function(done) {
    um.authenticateUser(USERNAME, 'bad', function(err, result) {
      expect(err).toBeNull();
      expect(result.userExists).toBe(true);
      expect(result.passwordsMatch).toBe(false);
      expect(result.token).toBeNull();
      done();
    });
  });

  it('Succeeds when authenticating with good credentials', function(done) {
    um.authenticateUser(USERNAME, PASSWORD, function(err, result) {
      expect(err).toBeNull();
      expect(result.userExists).toBe(true);
      expect(result.passwordsMatch).toBe(true);
      expect(typeof result.token).toBe('string');
      done();
    });
  });

  // The process doesn't exit on its own because of MongoDB
  setTimeout(function() {
    process.exit();
  }, 2000);
});
