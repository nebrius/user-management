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

var UserManagement = require('../');

var USERNAME = 'foo';
var PASSWORD = 'bar';
var EXTRAS = {
  name: 'Finnius F. Bar'
};

var users = new UserManagement();
users.load(function(err) {
  if (err) {
    console.log('Error: ' + err);
    users.close();
    return;
  }
  console.log('Checking if the user exists');
  users.userExists(USERNAME, function(err, exists) {
    if (err) {
      console.error('  Error: ' + err);
      users.close();
    } else if (exists) {
      console.log('  User already exists');
      users.close();
    } else {
      console.log('  User does not exist');
      console.log('Creating the user');
      users.createUser(USERNAME, PASSWORD, EXTRAS, function (err) {
        if (err) {
          console.log('  Error: ' + err);
        } else {
          console.log('  User created');
        }
        users.close();
      });
    }
  });
});
