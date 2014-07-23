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

var UM = require('../');

var USERNAME = 'foo';
var PASSWORD = 'bar';

var um = new UM();
um.load(function(err) {
  if (err) {
    console.log('Error: ' + err);
    process.exit(1);
  }
  console.log('Checking if the user exists');
  um.userExists(USERNAME, function(err, result) {
    if (err) {
      console.error('  Error: ' + err);
      process.exit(1);
    } else if (result) {
      console.log('  User already exists');
      process.exit();
    } else {
      console.log('  User does not exist');
      console.log('Creating the user');
      um.createUser(USERNAME, PASSWORD, { admin: true }, function (err) {
        if (err) {
          console.log('  Error: ' + err);
          process.exit(1);
        }
        console.log('  User created');
        process.exit();
      });
    }
  });
});
