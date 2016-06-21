'use strict';

const config = require('../config/config');

const _ = require('lodash');
const Promise = require('bluebird');
const Worker = require('./worker');
const models = require('../models');

class TaskWorker extends Worker {

    constructor(name, conf) {
        super(name, conf);
        this.conf = _.defaults({}, this.conf, {
            maxAttempts: 3,
            delayRatio: 300000,
            count: 1,
            queue: '',
            update: 3000
        });
        this.count = 0;
    }

    loop() {
        if (this.count < this.conf.count) {
            return this._getTask().then(task => {
                if (task) {
                    this.count++;
                    // Touch task
                    let interval = setInterval(() => {
                        return models.sequelize.transaction(t => {
                            return task.touch({transaction: t});
                        });
                    }, this.conf.update);
                    // Handle task
                    this.handleTask(task.get({plain: true})).then(() => {
                        return models.sequelize.transaction(t => {
                            return task.complete({transaction: t}).then(() => {
                                this.logger.info('Task completed:', task.id);
                            });
                        });
                    }).catch(err => {
                        this.logger.warn('Handle error:', err);
                        return this.delay(task).then(delay => {
                            return models.sequelize.transaction(t => {
                                return task.fail(delay, {transaction: t}).then(() => {
                                    this.logger.warn('Task failed:', task.id);
                                });
                            });
                        });
                    }).finally(() => {
                        clearInterval(interval);
                        this.count--;
                    }).done();
                    return null;
                }
            });
        } else {
            return Promise.resolve();
        }
    }

    handleTask() {
        return Promise.resolve();
    }
    
    delay(task) {
        return Promise.resolve().then(() => {
            return task.attempts * this.conf.delayRatio;
        });
    }

    _getTask() {
        return models.sequelize.transaction({autocommit: false}, t => {
            return models.Task.scope({
                method: ['forWork', this.conf.queue, config.node_id]
            }).find({transaction: t, lock: t.LOCK.UPDATE}).then(task => {
                if (task) {
                    return task.work(config.node_id, {transaction: t});
                }
            });
        });
    }

}

module.exports = TaskWorker;
