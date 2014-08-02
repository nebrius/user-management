User Management
===============

A MongoDB-based User Management system with session tokens. Passwords are salted and hashed using PBKDF2.

## Installing

To install user-management:

```
npm install user-management
```

Before you can use user-management, you first need to install and configure MongoDB. See the
[MongoDB Docs](docs.mongodb.org/manual/installation/) for installation instructions for your platform. Once MongoDB is
installed, you will need to create the user-management database.

First, start MongoDB:

```
$ mongod
```

Then, connect to a mongo shell:

```
$ mongo
```

Inside the shell, create the database:

```
> use user_management
```

User-management supports configurable database names, so feel free to use your own. Just specify the name in the user-management
constructor, as documented in the [API section](#api) below.

## Usage

Don't forget to make sure MongoDB is running before you run your code! Also note that none of these examples include
error handling for brevity, but should not be ignored in practice!

### Create a user

Here is some example code for creating a user called ```foo``` with password ```bar```. This is just an example of course,
in a real application you should never hard code a username or password in code!

```javascript
var UserManagement = require('user-management');

var USERNAME = 'foo';
var PASSWORD = 'bar';
var EXTRAS = {
  name: 'Finnius F. Bar'
};

var users = new UserManagement();
users.load(function(err) {
  console.log('Checking if the user exists');
  users.userExists(USERNAME, function(err, exists) {
    if (exists) {
      console.log('  User already exists');
      users.close();
    } else {
      console.log('  User does not exist');
      console.log('Creating the user');
      users.createUser(USERNAME, PASSWORD, EXTRAS, function (err) {
        console.log('  User created');
        users.close();
      });
    }
  });
});
```

Before the user can be created, the user management library must be loaded. The ```load``` method connects to MongoDB and
loads the user management database. Once the database is loaded, you should check if a user exists or not using the ```userExists```
method. The ```createUser``` method does _not_ check if the user exists before attempting to create it.

### Authenticate a user

Authenticating a user validates the supplied username and password against the database. If authentication is successful,
a token is generated for the user. Tokens have an expiration of 1 week by default, but this can be modified with the
```tokenExpiration``` property passed to the User Management constructor.

```javascript
var UserManagement = require('user-management');

var USERNAME = 'foo';
var PASSWORD = 'bar';

var users = new UserManagement();
users.load(function(err) {
  users.authenticateUser(USERNAME, PASSWORD, function(err, result) {
    if (!result.userExists) {
      console.log('Invalid username');
    } else if (!result.passwordsMatch) {
      console.log('Invalid password');
    } else {
      console.log('User token is: '+ result.token);
    }
    users.close();
  });
});

```

The ```authenticateUser``` method checks first if the user exists and then if the password is valid, returning the results
of both checks. In the case of a failure, you should _not_ report if it was the username or password that failed to the user.
Doing so is considered a security risk. However, you may want to consider logging this information for your own purposes.
This can also be used to implement a user lock out scheme if there are enough failed attempts.

### Working with tokens

In typical web applications, once a user has authenticated, all operations are performed using tokens. You can convert
between tokens and usernames, usernames and tokens, and easily check if a token is valid.

```javascript
var UserManagement = require('user-management');

var USERNAME = 'foo';

var users = new UserManagement();
users.load(function(err) {
  users.getTokenForUsername(USERNAME, function(err, token) {
    console.log('The user\'s token is: ' + token);
    users.getUsernameForToken(token, function(err, username) {
      console.log('The username for the token is: ' + username);
    });
    users.isTokenValid(token, function(err, valid) {
      if (!valid) {
        console.log('The token is not valid');
      } else {
        console.log('The token is valid');
      }
      users.close();
    });
  });
});
```

Note that the ```isTokenValid``` method checks both that the token is an actual token that was issued and that it has not
expired.

### Working with extras

You can store any form of JSON-serializable data with users by making use of the extras field in user creation, and using
the ```getExtrasForToken```, ```getExtrasForUsername```, ```setExtrasForToken```, and ```setExtrasForUsername``` methods.

```javascript
var UserManagement = require('user-management');

var USERNAME = 'foo';

var users = new UserManagement();
users.load(function(err) {
  users.getExtrasForUsername(USERNAME, function(err, extras) {
    console.log('Name: ' + extras.name);
  });
  users.getTokenForUsername(USERNAME, function(err, token) {
    users.setExtrasForToken(token, { address: '123 Fake St.' }, function(err) {
      console.log('Updated the address');
      users.getExtrasForToken(token, function(err, extras) {
        console.log('The address is: ' + extras.address);
        users.close();
      });
    });
  });
});
```

The ```getExtrasForUsername``` and ```setExtrasForUsername``` methods should be used with care. They should _never_ be
accessible by an ordinary user. These methods exist specifically to allow an administrator to be able to manage other
users. Allowing anyone other than an admin to access these methods, even indirectly, could lead to a security vulnerability
where users can modify other users settings.

### Changing passwords

Once a user has been created, there are two ways to set a new password: changing a password and resetting a password.
These APIs are designed such that only a user can choose a specific password. Changing a password allows you to set
any password desired, but you must provide the old password and a valid token for it to work.

```javascript```
var UserManagement = require('user-management');

var USERNAME = 'foo';
var OLD_PASSWORD = 'bar';
var NEW_PASSWORD = 'baz';

var users = new UserManagement();
users.load(function(err) {
  users.getTokenForUsername(USERNAME, function(err, token) {
    users.changePassword(token, OLD_PASSWORD, NEW_PASSWORD, function(err) {
      users.isTokenValid(token, function(err, valid) {
        if (!valid) {
          console.log('The token is not valid, as expected');
        } else {
          console.log('The token is valid, but should not be');
        }
        users.authenticateUser(USERNAME, NEW_PASSWORD, function(err, result) {
          if (!result.userExists) {
            console.log('Invalid username');
          } else if (!result.passwordsMatch) {
            console.log('Invalid password');
          } else {
            console.log('User token is: ' + result.token);
          }
          users.close();
        });
      });
    });
  });
});
```

### Resetting passwords

In the case that a user has forgotten their password, you can reset the password which will generate a random password
only. This should be used as a temporary password only.

```javascript
var UserManagement = require('../');

var USERNAME = 'foo';

var users = new UserManagement();
users.load(function(err) {
  users.resetPassword(USERNAME, function(err, newPassword) {
    console.log('User\'s password reset to: ' + newPassword);
    users.authenticateUser(USERNAME, newPassword, function(err, result) {
      if (!result.userExists) {
        console.log('Invalid username');
      } else if (!result.passwordsMatch) {
        console.log('Invalid password');
      } else {
        console.log('User token is: ' + result.token);
      }
      users.close();
    });
  });
});
```

## API

### new _constructor_(options)

Creates a new instance of user-management with the given options (optional). Options is a dictionary with the following
possible keys:
- hostname (string): The MongoDB server hostname. Default: 'localhost'
- port (integer): The MongoDB server port. Default: 27017
- database (string): The MongoDB database. Default: 'user_management'
- tokenExpiration (number): The amount of time, in hours, that a token is valid for. Default is 168 (a week).

### _instance_.load(cb(err: string|null))

Connects to the database and loads the user management information. Callback takes a single argument, err.

### _instance_.close(cb(err: string|null))

Closes the connection to the database. Callback takes a single argument, err. If you do not call this method, the node
process will not terminate on it's own without calling ```process.exit()```.

### _instance_.userExists(username, cb(err: string|null, exists:boolean|undefined))

Checks to see if a user exists. If an error occurs, exists is undefined, otherwise it is a boolean.

### _instance_.createUser(username, password, extras, cb(err: string|null))

Creates a new user with the supplied username, password, and extras. If the username is already taken, an error is returned.
It is recommended that you call ```userExists``` before calling ```createUser``` to more appropriately handle the case where
the username is already taken

### _instance_.removeUser(username, cb(err: string|null))

Removes a user. This operation _cannot_ be undone. Any tokens and extras are also deleted.

### _instance_.authenticateUser(username, password, cb(err: string|null, results: object|undefined))

Authenticates a user. The results are undefined if an error occured, otherwise an object with the following properties:
- userExists (boolean): Whether or not the user exists
- passwordsMatch (boolean): Whether or not the password is valid
- token (string|null): The user's token, if userExists and passwordsMatch is true, otherwise undefined. 

### _instance_.expireToken(token, cb(err: string|null))

Expires a given token. If the token is unknown, no error is returned. Use this method to logout a user.

### _instance_.isTokenValid(token, cb(err: string|null, valid: boolean|undefined))

Checks if a given token is valid. If an error occurred, then valid is undefined, otherwise it's a boolean indicated the
validity of the token.

### _instance_.getUsernameForToken(token, cb(err: string|null, username: string|undefined))

Converts a token to a username. Username is undefined if an error occurred or the token is invalid.

### _instance_.getTokenForUsername(username, cb(err: string|null))

Converts a username to a token. Token is undefined if an error occurred or the username is invalid.

### _instance_.getExtrasForUsername(username, cb(err: string|null, extras: any|undefined))

Gets the extras for the given username. Extras is undefined if an error occurred. This method should only be accessible
by administrators for security reasons.

### _instance_.getExtrasForToken(token, cb(err: string|null))

Gets the extras for the given token. Extras is undefined if an error occurred.

### _instance_.setExtrasForUsername(username, extras, cb(err: string|null))

Sets the extras for the given username. This method should only be accessible by administrators for security reasons.

### _instance_.setExtrasForToken(token, extras, cb(err: string|null))

Sets the extras for the given token.

### _instance_.changePassword(token, oldPassword, newPassword, cb(err: string|null))

Changes the password for a given user. Use this method if you want to provide a way for user's to change their password.

### _instance_.resetPassword(username, cb(err: string|null))

Resets the password for a given user to a random password. Only use this method as part of a "forgot your password?" flow.

License
=======

The MIT License (MIT)

Copyright (c) 2014 Bryan Hughes bryan@theoreticalideations.com (https://theoreticalideations.com)

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