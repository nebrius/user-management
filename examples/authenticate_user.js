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
    console.log(err);
    console.log(result);
  });
});
