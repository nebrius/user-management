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

// NOTE: This test assumes you have already run the create_user and authenticate_user examples

var UM = require('../');

var USERNAME = 'foo';

var um = new UM();
um.load(function(err) {
  if (err) {
    console.log('Error: ' + err);
    process.exit(1);
  }
  um.getExtrasForUsername(USERNAME, function(err, extras) {
    if (err) {
      console.log('Error: ' + err);
      process.exit(1);
    }
    console.log('Name: ' + extras.name);
  });
  um.getTokenForUsername(USERNAME, function(err, token) {
    if (err) {
      console.log('Error: ' + err);
      process.exit(1);
    }
    um.setExtrasForToken(token, { address: '123 Fake St.' }, function(err) {
      if (err) {
        console.log('Error: ' + err);
        process.exit(1);
      }
      console.log('Updated the address');
      um.getExtrasForToken(token, function(err, extras) {
        if (err) {
          console.log('Error: ' + err);
          process.exit(1);
        }
        console.log('The address is: ' + extras.address);
        process.exit();
      });
    });
  });
});
