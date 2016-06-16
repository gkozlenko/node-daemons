'use strict';

const _ = require('lodash');
const moment = require('../lib/moment');
const Promise = require('bluebird');
const Worker = require('../components/worker');
const models = require('../models');
const config = require('../config/config');

class Manager extends Worker {

    constructor(name, conf) {
        super(name, conf);
        this.conf = _.defaults({}, this.conf, {
            maxUpdate: 30000,       // 30 seconds
            maxCompleted: 3600000,  // 1 hour
            maxFailed: 259200000    // 3 days
        });
    }

    loop() {
        return models.sequelize.transaction(t => {
            return Promise.resolve()
                .then(() => {
                    return this._restoreFrozenTasks(t);
                })
                .then(() => {
                    return this._restoreFailedTasks(t);
                })
                .then(() => {
                    return this._deleteDeadTasks(t);
                })
                .then(() => {
                    return this._deleteCompletedTasks(t);
                })
                .then(() => {
                    return this._deleteFailedTasks(t);
                });
        });
    }

    _restoreFrozenTasks(t) {
        return models.Task.update({
            status: 'failure',
            attempts: models.sequelize.literal('attempts + 1')
        }, {
            where: {
                status: 'working',
                updated_at: {
                    $lt: moment().subtract(this.conf.maxUpdate).toMySQL()
                }
            },
            transaction: t
        }).spread(count => {
            if (count > 0) {
                this.logger.info('Restore frozen tasks:', count);
            }
        });
    }

    _restoreFailedTasks(t) {
        let where = [{status: 'failure'}];
        let conditions = this._failedTasksConditions();
        if (conditions.length) {
            where.push({$or: conditions});
        }

        return models.Task.update({
            status: 'pending',
            worker_node_id: null,
            worker_started_at: null
        }, {
            where: where,
            transaction: t
        }).spread(count => {
            if (count > 0) {
                this.logger.info('Restore failure tasks:', count);
            }
        });
    }

    _deleteDeadTasks(t) {
        return models.Task.destroy({
            where: {
                status: 'pending',
                finish_at: {
                    $lt: moment().toMySQL()
                }
            },
            transaction: t
        }).then(count => {
            if (count > 0) {
                this.logger.info('Delete dead tasks:', count);
            }
        });
    }

    _deleteCompletedTasks(t) {
        return models.Task.destroy({
            where: {
                status: 'done',
                updated_at: {
                    $lt: moment().subtract(this.conf.maxCompleted).toMySQL()
                }
            },
            transaction: t
        }).then(count => {
            if (count > 0) {
                this.logger.info('Delete completed tasks:', count);
            }
        });
    }

    _deleteFailedTasks(t) {
        let where = [
            {status: 'failure'},
            {updated_at: {
                $lt: moment().subtract(this.conf.maxFailed).toMySQL()
            }}
        ];
        let conditions = this._failedTasksConditions();
        if (conditions.length) {
            where.push({$or: conditions});
        }
        return models.Task.destroy({
            where: where,
            transaction: t
        }).then(count => {
            if (count > 0) {
                this.logger.info('Delete failed tasks:', count);
            }
        });
    }

    _failedTasksConditions() {
        let conditions = [];
        _.each(config.workers, (worker) => {
            if (worker.queue) {
                let item = {queue: worker.queue};
                if (worker.maxAttempts !== undefined) {
                    item.attempts = {
                        $lt: worker.maxAttempts
                    };
                }
                conditions.push(item);
            }
        });
        return conditions;
    }

}

module.exports = Manager;
