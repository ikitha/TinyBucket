"use strict";

var bcrypt = require("bcrypt"),
    salt = bcrypt.genSaltSync(10);

var passport = require("passport"),
    localStrategy = require("passport-local").Strategy;

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    privacy: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        User.hasMany(models.Task, { through: 'UsersTasks'} );
      },
      hashPass: function(password) {
        return bcrypt.hashSync(password, salt);
      },
      comparePass: function(userpass, dbpass) {
        return bcrypt.compareSync(userpass, dbpass);
      },
      createNewUser: function(userInfo, err, success) {
        User.create({
          first_name: userInfo.firstname,
          last_name: userInfo.lastname,
          username: userInfo.username,
          email: userInfo.email,
          password: User.hashPass(userInfo.password),
          privacy: userInfo.privacy
        }).done(function(error, user) {
          if(error) {
            err();
          } else {
            success();
          }
        });
      }
    }
  });

  passport.use(new localStrategy({
    usernameField: 'username',
    passwordField: 'password'
  }, function(username, password, passfinished) {
    User.find({
      where: {
        username: username
      }
    }).done(function(error, user) {
      if (user) {
        if (User.comparePass(password, user.password)) { // database, user input
          passfinished(null, user); //starts session
        } else { //passwords dont match
          console.log("passwords don't match"); 
          passfinished(null, null);
        }
      } else { //no user was found
        console.log("no user was even found");
        passfinished(null, null);
      }
    });
  }));

  return User;
};
