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
  async.series([
    function(next) {
      console.log('Checking if the user exists');
      um.userExists(USERNAME, function(err, result) {
        if (err) {
          console.error('  Error: ' + err);
        } else if (result) {
          console.log('  User already exists');
        } else {
          console.log('  User does not exist');
        }
        next(err || result);
      });
    },
    function(next) {
      console.log('Creating user');
      um.createUser(USERNAME, PASSWORD, { admin: true }, function(err) {
        if (err) {
          console.log('  Error: ' + err);
          return;
        }
        console.log('  User created');
        next();
      });
    }
  ], function() {
    process.exit();
  });
});
