'use strict';

const _ = require('lodash');
const path = require('path');
const intel = require('intel');

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Load dotenv
require('dotenv').config({
    path: path.join(__dirname, '..', '.env'),
    silent: true,
});

const config = {
    env: process.env.NODE_ENV,
    node_id: parseInt(process.env.NODE_ID || 0, 10),
    shutdownInterval: 1000,

    logger: {
        level: intel.DEBUG,
        path: path.resolve('./logs'),
        size: '50m',
        keep: 10,
    },

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

    workers: require('./workers'),
};

// Sequelize environments
_.each(['development', 'production', 'test'], env => {
    config[env] = _.clone(config.database);
    if (env === 'test') {
        config[env].url = process.env.MYSQL_URI_TEST;
    }
});

// Setup logger
require('./logger')(config.logger);

module.exports = config;
