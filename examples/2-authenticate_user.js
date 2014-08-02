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

// NOTE: This test assumes you have already run the create_user example

var UserManagement = require('../');

var USERNAME = 'foo';
var PASSWORD = 'bar';

var users = new UserManagement();
users.load(function(err) {
  if (err) {
    console.log('Error: ' + err);
    users.close();
    return;
  }
  users.authenticateUser(USERNAME, PASSWORD, function(err, result) {
    if (err) {
      console.log('Error: ' + err);
    } else if (!result.userExists) {
      console.log('Invalid username');
    } else if (!result.passwordsMatch) {
      console.log('Invalid password');
    } else {
      console.log('User authenticated and their token is: ' + result.token);
    }
    users.close();
  });
});
