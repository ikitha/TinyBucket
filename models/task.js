"use strict";

var Promise = require('bluebird/js/main/promise')();

module.exports = function(sequelize, DataTypes) {
  var Task = sequelize.define("Task", {
    title: DataTypes.STRING
  }, 
  {
  classMethods: {
    associate: function(models) {
      Task.hasMany(models.User, { through: 'UsersTasks' });
      Task.hasOne(models.UsersTasks);
    },
    createNewTask: function(userTask, err, success) {//custom function to create a new task
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
      var models = require('./index');//require access to other models to get a random task
      return models.Task.findAll()//find all tasks
        .then(function(tasks) {
          return new Promise(function(resolve, reject) {
            resolve(tasks[Math.floor(Math.random() * tasks.length)].values);//randomly shuffle tasks and return result to finish promise in app.js
          });            
        });
    },
    getRandomTaskForUser: function(currentUser) {//get a random task for a user that they have not done yet
      var models = require('./index'),
          whereClause = {},
          randomTask;
          // get a random task
          //find user id thats logged in
          //find them in the userstasks table
          //compare to task.id
          //if no match, show, if not, pick new random number
      return models.UsersTasks.findAll({ where: {UserId: currentUser}, attributes: ['TaskId']})//find all tasks for current user and get taskid column
        .then(function(userstasks) {
          if (userstasks.length){
            whereClause = {
              where: {
                id: {
                  not: userstasks.map(
                    function(task) { return task.dataValues.TaskId; }//parse out task id from array produced above so sequelize will like it.
                  )
                }
              }
            };
          }
          console.log(whereClause);
          return models.Task.findAll(whereClause);//find all tasks where id is not in result of map function
        })
        .then(function(tasks) {
          return new Promise(function(resolve, reject) {
            resolve(tasks[Math.floor(Math.random() * tasks.length)].values);//randomly shuffle tasks and return result to finish promise in app.js
          });
        });
      }
    }
  });
  return Task;
};
