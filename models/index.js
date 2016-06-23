'use strict';

const config = require('../config/config');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const logger = require('log4js').getLogger('sequelize');
const Sequelize = require('sequelize');

let dbConf = config[config.env] || config.database;
let sequelize = new Sequelize(dbConf.url, _.merge({}, dbConf, {
    logging: config.env !== 'test' ? function() {
        logger.debug.apply(logger, arguments);
    } : false
}));
let db = {};
let basename = path.basename(__filename);
fs.readdirSync(__dirname).filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
}).forEach(file => {
    let model = sequelize['import'](path.join(__dirname, file));
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
