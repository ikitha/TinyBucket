"use strict";

var bcrypt = require("bcrypt"),
    salt = bcrypt.genSaltSync(10);

var passport = require("passport"),
    localStrategy = require("passport-local").Strategy;

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    first_name: {
      type: DataTypes.STRING,
      validate: {
        isAlpha: {
          msg: 'Your first name should be at least one character.'
        }
      }
    },
    last_name: {
      type: DataTypes.STRING,
      validate: {
        isAlpha: {
          msg: 'Your last name should be at least one character.'
        }
      }
    },
    username: {
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [2,8],
          msg: 'Your username should be between 2-8 characters.'
        }
      }
    },
    password: DataTypes.STRING,
    privacy: DataTypes.INTEGER,
    current_task_id: DataTypes.INTEGER
  }, 
  {
    classMethods: {
      associate: function(models) {
        User.hasMany(models.Task, { through: 'UsersTasks'} );
        //User.belongsTo(models.UsersTasks);
      },
      hashPass: function(password) {
        return bcrypt.hashSync(password, salt);
      },
      comparePass: function(userpass, dbpass) {
        return bcrypt.compareSync(userpass, dbpass);
      },
      createNewUser: function(userInfo) {//custom function to create a new user
        return User.create({
          first_name: userInfo.firstname,
          last_name: userInfo.lastname,
          username: userInfo.username,
          email: userInfo.email,
          password: User.hashPass(userInfo.password),
          privacy: userInfo.privacy,
          current_task_id: userInfo.current_task_id
        });
      }
    },
    instanceMethods: {
      getCurrentTask: function() {
        var models = require('./index');//require other models, task table
        return models.Task.find(this.current_task_id);//find task based on users current task
    }
  }
});

  passport.use(new localStrategy({//passport local strategy
    usernameField: 'username',
    passwordField: 'password'
  }, function(username, password, passfinished) {
    User.find({
      where: {
        username: username
      }
    }).done(function(error, user) {
      if (user) {
        if (User.comparePass(password, user.password)) { // database, user input //compare passwords for a match
          passfinished(null, user); //starts session
        } else { //passwords dont match
          console.log("passwords don't match"); 
          passfinished(null, null, {message: "Your credentials were incorrect."});
        }
      } else { //no user was found
        console.log("no user was even found");
        passfinished(null, null, {message: "Your credentials were incorrect."});
      }
    });
  }));

  return User;
};
