"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn(
    	'Users',
    	'current_task_id',
    	DataTypes.INTEGER
	);
    done();
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('Users', 'current_task_id');
    done();
  }
};
