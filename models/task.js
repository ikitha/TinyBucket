"use strict";

var Promise = require('bluebird/js/main/promise')();

module.exports = function(sequelize, DataTypes) {
  var Task = sequelize.define("Task", {
    title: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Task.hasMany(models.User, { through: 'UsersTasks' });
      },
      createNewTask: function(userTask, err, success) {
        Task.create({
          title: userTask.task,
        }).done(function(error, user) {
          if(error) {
            err();
          } else {
            success();
          }
        });
      },
      getRandomTask: function() {
        var models = require('./index');
        return models.Task.findAll()
          .then(function(tasks) {
            return new Promise(function(resolve, reject) {
              resolve(tasks[Math.floor(Math.random() * tasks.length)].values);
            });            
          });
      },
      getRandomTaskForUser: function(currentUser) {
        var models = require('./index'),
            whereClause = {},
            randomTask;
            // get a random task
            //find user id thats logged in
            //find them in the userstasks table
            //compare to task.id
            //if no match, show, if not, pick new random number
        return models.UsersTasks.findAll({ where: {UserId: currentUser}, attributes: ['TaskId']})
          .then(function(userstasks) {
            console.log("This is: ", userstasks);
            if (userstasks.length){
              whereClause = {where: ['id not in (?)', userstasks] };
            }
            return models.Task.findAll(whereClause);
          })
          .then(function(tasks) {
            return new Promise(function(resolve, reject) {
              resolve(tasks[Math.floor(Math.random() * tasks.length)].values);
            });
          })
      }
    }
  });


  return Task;
};
