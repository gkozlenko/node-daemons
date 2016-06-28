'use strict';

module.exports = {
    task_manager: {
        enabled: true,
        sleep: 30000,
        maxUpdate: 30000,
        maxCompleted: 3600000, // 1 hour
        maxFailed: 259200000, // 3 days
    },
    sample: {
        enabled: false,
        sleep: 5000,
        count: 2,
        queue: 'sample',
        maxAttempts: 3,
        delayRatio: 300000, // 5 minutes
    },
};
