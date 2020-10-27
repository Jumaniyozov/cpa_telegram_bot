const MySQL = require('../helpers/mysqlUtils.js')
const Sequelize = require('sequelize');
const Analytics = MySQL.define('analytics', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: Sequelize.STRING,
    },
    username: {
        type: Sequelize.STRING
    },
    referralUserId: {
        type: Sequelize.STRING,
    },
    referralChannel: {
        type: Sequelize.STRING,
    },
    offer_id: {
        type: Sequelize.INTEGER
    }
}, {
    timestamps: false,
    freezeTableName: true
});

// Analytics.sync({force: true});

module.exports = Analytics;