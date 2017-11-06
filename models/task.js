'use strict';

const moment = require('moment');

module.exports = function modelTask(sequelize, Sequelize) {
    return sequelize.define('Task', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        node_id: {
            type: Sequelize.INTEGER,
        },
        queue: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        status: {
            type: Sequelize.ENUM,
            values: ['pending', 'working', 'done', 'failure'],
            defaultValue: 'pending',
            allowNull: false,
        },
        attempts: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        priority: {
            type: Sequelize.INTEGER,
            defaultValue: 10,
            allowNull: false,
        },
        body: {
            type: Sequelize.TEXT,
            set(body) {
                return this.setDataValue('body', JSON.stringify(body));
            },
            get() {
                try {
                    return JSON.parse(this.getDataValue('body'));
                } catch (e) {
                    return null;
                }
            },
        },
        start_at: {
            type: Sequelize.DATE,
        },
        finish_at: {
            type: Sequelize.DATE,
        },
        worker_node_id: {
            type: Sequelize.INTEGER,
        },
        worker_started_at: {
            type: Sequelize.DATE,
        },
        checked_at: {
            type: Sequelize.DATE,
        },
    }, {
        tableName: 'tasks',
        freezeTableName: true,
        underscored: true,

        scopes: {
            forWork(queue, nodeId) {
                return {
                    where: {
                        queue,
                        node_id: {
                            $or: [
                                null,
                                nodeId,
                            ],
                        },
                        status: 'pending',
                        start_at: {
                            $or: [
                                null,
                                {
                                    $lt: moment().toDate(),
                                },
                            ],
                        },
                        finish_at: {
                            $or: [
                                null,
                                {
                                    $gte: moment().toDate(),
                                },
                            ],
                        },
                    },
                    order: [
                        ['priority', 'DESC'],
                        ['attempts', 'ASC'],
                        [
                            sequelize.fn(
                                'IFNULL',
                                sequelize.col('start_at'),
                                sequelize.col('created_at')
                            ),
                            'ASC',
                        ],
                    ],
                };
            },
        },

        instanceMethods: {
            fail(delay, options) {
                this.start_at = delay ? moment().add(delay, 'ms').toDate() : null;
                this.attempts = sequelize.literal('attempts + 1');
                this.status = 'failure';
                return this.save(options);
            },
            complete(options) {
                this.status = 'done';
                return this.save(options);
            },
            work(nodeId, options) {
                this.status = 'working';
                this.worker_node_id = nodeId;
                this.worker_started_at = moment().toDate();
                return this.save(options);
            },
            check(options) {
                this.checked_at = moment().toDate();
                return this.save(options);
            },
        },

        classMethods: {
            associate(models) {
                models.Task.belongsTo(models.Node, {foreignKey: 'node_id'});
            },
        },
    });
};
