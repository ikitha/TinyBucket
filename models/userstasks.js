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
        UserTask.belongsTo(models.User);
        UserTask.belongsTo(models.Task);
      },
      createCompletedTask: function(userInfo) {
        return UserTask.create({
          UserId: userInfo.userid,
          TaskId: userInfo.taskid,
          post: userInfo.post
        });
      }
    }
  });

  return UserTask;
};
