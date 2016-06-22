'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const log4js = require('log4js');
const EventEmitter = require('events');
const WorkerStates = require('./worker_states');

class Worker extends EventEmitter {

    constructor(name, conf) {
        super();
        this.name = name;
        this.conf = _.defaults({}, conf, {
            sleep: 1000
        });
        this.logger = log4js.getLogger('worker-' + name);
        this.stopped = true;
        this.timer = null;
        this.state = null;
    }

    start() {
        this.logger.info('Start');
        this.stopped = false;
        this.state = WorkerStates.STATE_IDLE;
        return this._startLoop();
    }

    stop() {
        this.logger.info('Stop');
        this.stopped = true;
        if (this.state === WorkerStates.STATE_IDLE) {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.state = WorkerStates.STATE_STOP;
            this.emit('stop');
        }
    }

    loop() {
        return Promise.resolve();
    }

    _startLoop() {
        this.state = WorkerStates.STATE_WORK;
        return this.loop().catch(err => {
            this.logger.warn('Loop error:', err);
        }).finally(() => {
            this.state = WorkerStates.STATE_IDLE;
            if (!this.stopped) {
                this.timer = setTimeout(() => {
                    this._startLoop();
                }, this.conf.sleep);
            } else {
                this.state = WorkerStates.STATE_STOP;
                this.emit('stop');
            }
        });
    }

}

module.exports = Worker;
