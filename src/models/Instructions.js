const MySQL = require('../helpers/mysqlUtils.js')
const Sequelize = require('sequelize');
const Instructions = MySQL.define('instructions', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    instructionUz: {
        type: Sequelize.STRING
    },
    instructionRu: {
        type: Sequelize.STRING
    },
}, {
    timestamps: false,
    freezeTableName: true
});

// Instructions.sync({ force: true });

module.exports = Instructions;
