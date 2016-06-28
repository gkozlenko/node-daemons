'use strict';

const _ = require('lodash');
const path = require('path');
const workers = require('./workers');

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
// Set log4js config
process.env.LOG4JS_CONFIG = path.join(__dirname, '..', 'log4js.json');

// Load dotenv
require('dotenv').config({
    path: path.join(__dirname, '..', '.env'),
    silent: true,
});

const config = {
    env: process.env.NODE_ENV,
    node_id: parseInt(process.env.NODE_ID || 0, 10),
    database: {
        url: process.env.MYSQL_URI,
        dialect: 'mysql',
        migrationStorageTableName: 'sequelize_migrations',
        pool: {
            max: 5,
            min: 1,
            idle: 10000,
        },
    },
    shutdownInterval: 1000,
    workers,
};

// Sequelize environments
_.each(['development', 'production', 'test'], env => {
    config[env] = _.clone(config.database);
    if (env === 'test') {
        config[env].url = process.env.MYSQL_URI_TEST;
    }
});

module.exports = config;
