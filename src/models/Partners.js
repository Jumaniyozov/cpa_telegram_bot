const MySQL = require('../helpers/mysqlUtils.js')
const Sequelize = require('sequelize');
const Partners = MySQL.define('partners', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    partnerName: {
        type: Sequelize.STRING,
    }
}, {
    timestamps: false,
    freezeTableName: true
});

// Partners.sync({ force: true });

module.exports = Partners;