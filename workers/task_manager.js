'use strict';

const config = require('../config/config');
const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const Worker = require('../components/worker');
const WorkerConst = require('../components/worker_const');
const models = require('../models');

class TaskManager extends Worker {

    constructor(name, conf) {
        super(name, conf);
        this.conf = _.defaults({}, this.conf, {
            maxUpdate: 30000,       // 30 seconds
            maxCompleted: 3600000,  // 1 hour
            maxFailed: 259200000,   // 3 days
        });
    }

    loop() {
        return Promise.resolve()
            .then(() => {
                return this.failFrozenTasks();
            })
            .then(() => {
                return this.restoreFailedTasks();
            })
            .then(() => {
                return this.deleteDeadTasks();
            })
            .then(() => {
                return this.deleteCompletedTasks();
            })
            .then(() => {
                return this.deleteFailedTasks();
            });
    }

    failFrozenTasks() {
        return models.Task.update({
            status: 'failure',
            attempts: models.sequelize.literal('attempts + 1'),
        }, {
            where: {
                status: 'working',
                checked_at: {
                    $lt: moment().subtract(this.conf.maxUpdate).toDate(),
                },
            },
        }).spread(count => {
            if (count > 0) {
                this.logger.info('Restore frozen tasks:', count);
            }
        });
    }

    restoreFailedTasks() {
        return models.Task.update({
            status: 'pending',
            worker_node_id: null,
            worker_started_at: null,
        }, {
            where: {
                status: 'failure',
                $or: this.failedTasksConditions(),
            },
        }).spread(count => {
            if (count > 0) {
                this.logger.info('Restore failure tasks:', count);
            }
        });
    }

    deleteDeadTasks() {
        return models.Task.destroy({
            where: {
                status: 'pending',
                finish_at: {
                    $lt: moment().toDate(),
                },
            },
        }).then(count => {
            if (count > 0) {
                this.logger.info('Delete dead tasks:', count);
            }
        });
    }

    deleteCompletedTasks() {
        return models.Task.destroy({
            where: {
                status: 'done',
                checked_at: {
                    $lt: moment().subtract(this.conf.maxCompleted).toDate(),
                },
            },
        }).then(count => {
            if (count > 0) {
                this.logger.info('Delete completed tasks:', count);
            }
        });
    }

    deleteFailedTasks() {
        return models.Task.destroy({
            where: {
                status: 'failure',
                checked_at: {
                    $lt: moment().subtract(this.conf.maxFailed).toDate(),
                },
                $or: this.failedTasksConditions(),
            },
        }).then(count => {
            if (count > 0) {
                this.logger.info('Delete failed tasks:', count);
            }
        });
    }

    failedTasksConditions() {
        return _.chain(config.workers).filter(worker => {
            return !!worker.queue;
        }).map(worker => {
            return {
                queue: worker.queue,
                attempts: {
                    $lt: worker.maxAttempts || WorkerConst.MAX_ATTEMPTS,
                },
            };
        }).value();
    }

}

module.exports = TaskManager;
