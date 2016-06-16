'use strict';

const config = require('../config/config');

const _ = require('lodash');
const ip = require('ip');
const moment = require('../lib/moment');
const Worker = require('../components/worker');
const models = require('../models');

class NodeStats extends Worker {

    constructor(name, conf) {
        super(name, conf);
        this.conf = _.defaults({}, this.conf, {
            changeToken: 86400000 // 1 day
        });
    }

    start() {
        models.Node.findOrCreate({
            where: {
                id: config.node_id
            },
            defaults: {
                hostname: ip.address()
            },
            paranoid: false
        }).then(() => {
            super.start();
        });
    }

    loop() {
        return models.Node.find({
            where: {
                id: config.node_id
            }
        }).then(node => {
            if (node) {
                node.checked_at = moment().toMySQL();
                if (!node.token_changed_at || moment(node.token_changed_at).isBefore(moment().subtract(this.conf.changeToken).utc())) {
                    node.old_token = node.token;
                    node.token = models.Node.generateToken();
                    node.token_changed_at = moment().toMySQL();
                }
                return node.save();
            }
        });
    }

}

module.exports = NodeStats;
