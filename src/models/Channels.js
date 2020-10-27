const MySQL = require('../helpers/mysqlUtils.js')
const Sequelize = require('sequelize');
const Channels = MySQL.define('channels', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: Sequelize.STRING,
    },
    username: {
        type: Sequelize.STRING,
    },
    channelName: {
        type: Sequelize.STRING,
    }
}, {
    timestamps: false,
    freezeTableName: true
});

// User.sync({ force: true });

module.exports = Channels;