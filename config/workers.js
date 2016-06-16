'use strict';

module.exports = {
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
        enabled: false,
        sleep: 5000,
        count: 1,
        queue: 'sample',
        maxAttempts: 3,
        delayRatio: 300000 // 5 minutes
    }
};