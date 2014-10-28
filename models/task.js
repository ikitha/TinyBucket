"use strict";

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
      getRandomTask: function(currentUser) {
            //find user id thats logged in
            //find them in the userstasks table
            //compare to task.id
            //if no match, show, if not, pick new random number
        Task.findAll().then(function(taskIds){
         var oneTask = Math.floor(Math.random() * taskIds.length)
       }).then(function(task) {
            models.Users.find({ where: {id: currentUser}})
            .then(function(error, user) {
              user.getTasks().then(function(err, alltasks) {
                alltasks.forEach(function(task) {
                  if (task !== oneTask.id) {
                    console.log("it worked!");
                  }
                })
              })
            })
        })
      }
    }
  });


  return Task;
};
