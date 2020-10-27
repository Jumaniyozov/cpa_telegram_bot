const MySQL = require('../helpers/mysqlUtils.js')
const Sequelize = require('sequelize');
const User = MySQL.define('users', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: Sequelize.STRING,
        unique: true,
    },
    username: {
        type: Sequelize.STRING
    },
    lastName: {
        type: Sequelize.STRING,
    },
    firstName: {
        type: Sequelize.STRING,
    },
    chosenLanguage: {
        type: Sequelize.STRING,
    },
    phone: {
        type: Sequelize.STRING,
    }
}, {
    timestamps: false,
    freezeTableName: true
});

// User.sync({ force: true });

module.exports = User;