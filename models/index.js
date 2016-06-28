'use strict';

const config = require('../config/config');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const logger = require('log4js').getLogger('sequelize');
const Sequelize = require('sequelize');

const dbConf = config[config.env] || config.database;
const sequelize = new Sequelize(dbConf.url, _.merge({}, dbConf, {
    logging: config.env !== 'test' ? function dbLogger() {
        logger.debug.apply(logger, arguments);
    } : false,
}));
const db = {};
const basename = path.basename(__filename);
fs.readdirSync(__dirname).filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
}).forEach(file => {
    const model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
});
_.keys(db, modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
