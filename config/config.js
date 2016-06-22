'use strict';

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Load dotenv
const path = require('path');
require('dotenv').config({
    path: path.join(__dirname, '..', '.env')
});

// Set log4js config
process.env.LOG4JS_CONFIG = path.join(__dirname, '..', 'log4js.json');

const _ = require('lodash');

let config = {
    node_id: parseInt(process.env.NODE_ID || 0),
    database: {
        url: process.env.MYSQL_URI,
        dialect: 'mysql',
        migrationStorageTableName: 'sequelize_migrations',
        pool: {
            max: 5,
            min: 1,
            idle: 10000
        }
    },
    shutdownInterval: 1000,
    workers: require('./workers')
};

// For sequelize-cli
_.each(['development', 'production'], env => {
    config[env] = config.database;
});

module.exports = config;
