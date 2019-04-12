'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const intel = require('intel');
const EventEmitter = require('events');
const WorkerConst = require('./worker_const');

class Worker extends EventEmitter {

    constructor(name, conf) {
        super();
        this.name = name;
        this.conf = _.defaults({}, conf, {
            sleep: 1000,
            silence: false,
        });
        this.logger = intel.getLogger(`worker-${name}`);
        if (this.conf.silence) {
            this.logger.setLevel(intel.NONE);
        }
        this.stopped = true;
        this.timer = null;
        this.state = null;
    }

    start() {
        this.logger.info('Start');
        this.stopped = false;
        this.state = WorkerConst.STATE_IDLE;
        return this.startLoop();
    }

    stop() {
        this.logger.info('Stop');
        this.stopped = true;
        if (this.state === WorkerConst.STATE_IDLE) {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.state = WorkerConst.STATE_STOP;
            this.emit('stop');
        }
    }

    /**
     * @return Promise<any>|any value
     */
    loop() {}

    startLoop() {
        this.state = WorkerConst.STATE_WORK;
        return Promise.resolve(this.loop()).catch(err => {
            this.logger.warn('Loop error:', err);
        }).finally(() => {
            this.state = WorkerConst.STATE_IDLE;
            if (!this.stopped) {
                this.timer = setTimeout(() => {
                    this.startLoop();
                }, this.conf.sleep);
            } else {
                this.state = WorkerConst.STATE_STOP;
                this.emit('stop');
            }
        });
    }

}

module.exports = Worker;
