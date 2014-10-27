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
      }
    }
  });


  return Task;
};
