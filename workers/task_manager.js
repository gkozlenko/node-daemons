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
            maxFailed: 259200000    // 3 days
        });
    }

    loop() {
        return Promise.resolve()
            .then(() => {
                return this._failFrozenTasks();
            })
            .then(() => {
                return this._restoreFailedTasks();
            })
            .then(() => {
                return this._deleteDeadTasks();
            })
            .then(() => {
                return this._deleteCompletedTasks();
            })
            .then(() => {
                return this._deleteFailedTasks();
            });
    }
    
    _failFrozenTasks() {
        return models.Task.update({
            status: 'failure',
            attempts: models.sequelize.literal('attempts + 1')
        }, {
            where: {
                status: 'working',
                checked_at: {
                    $lt: moment().subtract(this.conf.maxUpdate).toDate()
                }
            }
        }).spread(count => {
            if (count > 0) {
                this.logger.info('Restore frozen tasks:', count);
            }
        });
    }

    _restoreFailedTasks() {
        return models.Task.update({
            status: 'pending',
            worker_node_id: null,
            worker_started_at: null
        }, {
            where: [
                {status: 'failure'},
                {$or: this._failedTasksConditions()}
            ]
        }).spread(count => {
            if (count > 0) {
                this.logger.info('Restore failure tasks:', count);
            }
        });
    }

    _deleteDeadTasks() {
        return models.Task.destroy({
            where: {
                status: 'pending',
                finish_at: {
                    $lt: moment().toDate()
                }
            }
        }).then(count => {
            if (count > 0) {
                this.logger.info('Delete dead tasks:', count);
            }
        });
    }

    _deleteCompletedTasks() {
        return models.Task.destroy({
            where: {
                status: 'done',
                checked_at: {
                    $lt: moment().subtract(this.conf.maxCompleted).toDate()
                }
            }
        }).then(count => {
            if (count > 0) {
                this.logger.info('Delete completed tasks:', count);
            }
        });
    }

    _deleteFailedTasks() {
        return models.Task.destroy({
            where: [
                {status: 'failure'},
                {$or: this._failedTasksConditions()},
                {checked_at: {
                    $lt: moment().subtract(this.conf.maxFailed).toDate()
                }}
            ]
        }).then(count => {
            if (count > 0) {
                this.logger.info('Delete failed tasks:', count);
            }
        });
    }

    _failedTasksConditions() {
        return _.chain(config.workers).filter(worker => {
            return !!worker.queue;
        }).map(worker => {
            return {
                queue: worker.queue,
                attempts: {
                    $lt: worker.maxAttempts || WorkerConst.MAX_ATTEMPTS
                }
            };
        }).value();
    }

}

module.exports = TaskManager;
