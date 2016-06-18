'use strict';

const _ = require('lodash');
const moment = require('moment');
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
                    return this._checkCurrentNode(t);
                })
                .then(() => {
                    return this._activateNodes(t);
                })
                .then(() => {
                    return this._pauseNodes(t);
                })
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
    
    _checkCurrentNode(t) {
        return models.Node.findById(config.node_id, {transaction: t}).then(node => {
            if (node) {
                return node.check();
            }
        });
    }

    _activateNodes(t) {
        return models.Node.update({
            is_active: true
        }, {
            where: {
                is_active: false,
                checked_at: {
                    $gte: moment().subtract(2 * this.conf.sleep).toDate()
                }
            },
            transaction: t
        }).spread(count => {
            if (count > 0) {
                this.logger.info('Activate nodes:', count);
            }
        });
    }

    _pauseNodes(t) {
        return models.Node.update({
            is_active: false
        }, {
            where: {
                is_active: true,
                checked_at: {
                    $lt: moment().subtract(2 * this.conf.sleep).toDate()
                }
            },
            transaction: t
        }).spread(count => {
            if (count > 0) {
                this.logger.info('Pause nodes:', count);
            }
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
                    $lt: moment().subtract(this.conf.maxUpdate).toDate()
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
                    $lt: moment().toDate()
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
                    $lt: moment().subtract(this.conf.maxCompleted).toDate()
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
                $lt: moment().subtract(this.conf.maxFailed).toDate()
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
