'use strict';
const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(path.resolve(__dirname, 'populate_system_id_and_migrate.sql'), 'utf8');

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(sql);
  },

  async down (queryInterface, Sequelize) {
      
  }
};
