'use strict';

const config = require('./config/config');

const _ = require('lodash');
const path = require('path');
const cluster = require('cluster');
const ip = require('ip');
const logger = require('log4js').getLogger('app');
const models = require('./models');

let shutdownInterval = null;

if (cluster.isMaster) {
    models.Node.findOrCreate({
        where: {
            id: config.node_id
        },
        defaults: {
            hostname: ip.address()
        },
        paranoid: false
    }).then(() => {
        logger.info('Start workers');
        _.each(config.workers, (conf, name) => {
            if (conf.enabled) {
                startWorker(name);
            }
        });
    });
} else {
    let name = process.env.WORKER_NAME;
    let WorkerClass = require(path.join(__dirname, 'workers', name + '.js'));
    let worker = null;
    if (WorkerClass) {
        worker = new WorkerClass(name, config.workers[name]);
        worker.start();
        worker.on('stop', () => {
            process.exit();
        });
    }
    process.on('message', message => {
        if ('shutdown' === message) {
            if (worker) {
                worker.stop();
            } else {
                process.exit();
            }
        }
    });
}

// Shutdown
process.on('SIGTERM', shutdownCluster);
process.on('SIGINT', shutdownCluster);

function startWorker(name) {
    let worker = cluster.fork({WORKER_NAME: name}).on('online', () => {
        logger.info('Start %s worker #%d.', name, worker.id);
    }).on('exit', status => {
        if ((worker.exitedAfterDisconnect || worker.suicide) === true || status === 0) {
            logger.info('Worker %s #%d was killed.', name, worker.id);
        } else {
            logger.warn('Worker %s #%d was died. Replace it with a new one.', name, worker.id);
            startWorker(name);
        }
    });
}

function shutdownCluster() {
    if (cluster.isMaster) {
        clearInterval(shutdownInterval);
        if (_.size(cluster.workers) > 0) {
            logger.info('Shutdown workers:', _.size(cluster.workers));
            _.each(cluster.workers, worker => {
                try {
                    worker.send('shutdown');
                } catch (err) {
                    logger.warn('Cannot send shutdown message to worker:', err);
                }
            });
            shutdownInterval = setInterval(() => {
                if (_.size(cluster.workers) === 0) {
                    process.exit();
                }
            }, config.shutdownInterval);
        } else {
            process.exit();
        }
    }
}
