"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable("UsersTasks", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      UserId: {
        type: DataTypes.INTEGER
      },
      TaskId: {
        type: DataTypes.INTEGER
      },
      post: {
        type: DataTypes.STRING
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    }).done(done);
  },
  down: function(migration, DataTypes, done) {
    migration.dropTable("UsersTasks").done(done);
  }
};