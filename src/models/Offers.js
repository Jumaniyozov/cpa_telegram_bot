const MySQL = require('../helpers/mysqlUtils.js')
const Sequelize = require('sequelize');
const Offers = MySQL.define('offers', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    partnerId: {
        type: Sequelize.INTEGER
    },
    offerRu: {
        type: Sequelize.STRING
    },
    offerUz: {
        type: Sequelize.STRING
    },
    descriptionRu: {
        type: Sequelize.STRING
    },
    descriptionUz: {
        type: Sequelize.STRING
    },
    photoUrl: {
        type: Sequelize.STRING
    },
    referalUrl: {
        type: Sequelize.STRING
    }
}, {
    timestamps: false,
    freezeTableName: true
});

// Offers.sync({ force: true });

module.exports = Offers;