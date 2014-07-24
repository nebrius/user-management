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
  var NEW_PASSWORD = 'bar2';
  var PERMISSIONS = {
    perm1: true,
    perm2: false
  };

  var token;

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
      token = result.token;
      done();
    });
  });

  it('Expects the token to be valid', function(done) {
    um.isTokenValid(token, function(err, valid) {
      expect(err).toBeNull();
      expect(valid).toBe(true);
      done();
    });
  });

  it('Expects a bad token to be invalid', function(done) {
    um.isTokenValid('bad', function(err, valid) {
      expect(err).toBeNull();
      expect(valid).toBe(false);
      done();
    });
  });

  it('Can get the username from a token', function(done) {
    um.getUsernameForToken(token, function(err, username) {
      expect(err).toBeNull();
      expect(username).toBe(USERNAME);
      done();
    });
  });

  it('Cannot get the username from a bad token', function(done) {
    um.getUsernameForToken('bad', function(err, username) {
      expect(err).toBeNull();
      expect(username).toBeNull();
      done();
    });
  });

  it('Can get the token from a username', function(done) {
    um.getTokenForUsername(USERNAME, function(err, foundToken) {
      expect(err).toBeNull();
      expect(foundToken).toBe(token);
      done();
    });
  });

  it('Cannot get the token from a bad username', function(done) {
    um.getTokenForUsername('bad', function(err, foundToken) {
      expect(err).toBeNull();
      expect(foundToken).toBeNull();
      done();
    });
  });

  it('Can set extras for username', function(done) {
    um.setExtrasForUsername(USERNAME, { name: 'foo bar'}, function(err) {
      expect(err).toBeNull();
      done();
    });
  });

  it('Cannot set extras for bad username', function(done) {
    um.setExtrasForUsername('bad', { name: 'foo bar'}, function(err) {
      expect(err).toBeNull();
      done();
    });
  });

  it('Can get extras for username', function(done) {
    um.getExtrasForUsername(USERNAME, function(err, extras) {
      expect(err).toBeNull();
      expect(typeof extras).toBe('object');
      expect(extras.name).toBe('foo bar');
      done();
    });
  });

  it('Cannot get extras for bad username', function(done) {
    um.getExtrasForUsername('bad', function(err, extras) {
      expect(err).toBeNull();
      expect(extras).toBeNull();
      done();
    });
  });

  it('Can set extras for token', function(done) {
    um.setExtrasForToken(token, { name: 'bar foo' }, function(err) {
      expect(err).toBeNull();
      done();
    });
  });

  it('Cannot set extras for bad token', function(done) {
    um.setExtrasForToken('bad', { name: 'bar foo' }, function(err) {
      expect(err).toBeNull();
      done();
    });
  });

  it('Can get extras for token', function(done) {
    um.getExtrasForToken(token, function(err, extras) {
      expect(err).toBeNull();
      expect(typeof extras).toBe('object');
      expect(extras.name).toBe('bar foo');
      done();
    });
  });

  it('Cannot get extras for bad token', function(done) {
    um.getExtrasForToken('bad', function(err, extras) {
      expect(err).toBeNull();
      expect(extras).toBeNull();
      done();
    });
  });

  it('Can Expire Token', function(done) {
    um.expireToken(token, function (err) {
      expect(err).toBeNull();
      done();
    });
  });

  it('Expects the token to be invalid after expire', function(done) {
    um.isTokenValid(token, function(err, valid) {
      expect(err).toBeNull();
      expect(valid).toBe(false);
      done();
    });
  });

  it('Succeeds when authenticating after expiring token', function(done) {
    um.authenticateUser(USERNAME, PASSWORD, function(err, result) {
      expect(err).toBeNull();
      expect(result.userExists).toBe(true);
      expect(result.passwordsMatch).toBe(true);
      expect(typeof result.token).toBe('string');
      token = result.token;
      done();
    });
  });

  /*it('Can change the user\'s password', function(done) {
    um.changePassword(token, PASSWORD, NEW_PASSWORD, function(err) {
      expect(err).toBeNull();
      done();
    });
  });

  it('Expects the user token to be expired after changing password', function(done) {
    um.isTokenValid(token, function(err, valid) {
      expect(err).toBeNull();
      expect(valid).toBe(false);
      done();
    });
  });

  it('Can authenticate with the new password', function(done) {
    um.authenticateUser(USERNAME, NEW_PASSWORD, function(err, result) {
      expect(err).toBeNull();
      expect(result.userExists).toBe(true);
      expect(result.passwordsMatch).toBe(true);
      expect(typeof result.token).toBe('string');
      token = result.token;
      done();
    });
  });*/

  it('Can remove the user', function(done) {
    um.removeUser(USERNAME, function(err) {
      expect(err).toBeNull();
      done();
    });
  });

  it('Can check that the test user no longer exist\'s', function(done) {
    um.userExists(USERNAME, function(err, exists) {
      expect(err).toBeNull();
      expect(exists).toBe(false);
      done();

      // The process won't exit on its own, so we wait a bit for Jasmine to finish and force an exit
      setTimeout(function() {
        process.exit();
      }, 500);
    });
  });
});
