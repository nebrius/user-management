var UM = require('../lib/user');
var async = require('async');

var USERNAME = 'foo';
var PASSWORD = 'bar';

var um = new UM();
um.load(function(err) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }
  um.authenticateUser(USERNAME, PASSWORD, function(err, result) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    if (!result.userExists) {
      console.log('Invalid username');
    } else if (!result.passwordsMatch) {
      console.log('Invalid password');
    } else {
      console.log('User authenticated and their token is: ' + result.token);
    }
    process.exit();
  });
});
