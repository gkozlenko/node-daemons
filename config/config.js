'use strict';

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Load dotenv
const path = require('path');
require('dotenv').config({
    path: path.join(__dirname, '..', '.env')
});

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
    workers: {
        manager: {
            enabled: true,
            sleep: 30000,
            maxUpdate: 30000,
            maxCompleted: 3600000, // 1 hour
            maxFailed: 259200000 // 3 days
        },
        node_stats: {
            enabled: true,
            sleep: 10000,
            changeToken: 86400000 // 1 day
        },
        sample: {
            enabled: true,
            sleep: 5000,
            count: 1,
            queue: 'sample',
            maxAttempts: 3,
            delayRatio: 300000 // 5 minutes
        }
    }
};

// For sequelize-cli
_.each(['development', 'production'], env => {
    config[env] = config.database;
});

module.exports = config;
