"use strict";

module.exports = function(sequelize, DataTypes) {
  var UserTask = sequelize.define("UsersTasks", {
    UserId: DataTypes.INTEGER,
    TaskId: DataTypes.INTEGER,
    post: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        UserTask.hasOne(models.User, { foreignKey: "id" });
        UserTask.hasOne(models.Task, { foreignKey: "id" });
      }
    }
  });

  return UserTask;
};
