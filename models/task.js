'use strict';

const moment = require('moment');
const Sequelize = require('sequelize');

module.exports = function modelTask(sequelize, DataTypes) {
    const Task = sequelize.define('Task', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        node_id: {
            type: DataTypes.INTEGER,
        },
        queue: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM,
            values: ['pending', 'working', 'done', 'failure'],
            defaultValue: 'pending',
            allowNull: false,
        },
        attempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        priority: {
            type: DataTypes.INTEGER,
            defaultValue: 10,
            allowNull: false,
        },
        body: {
            type: DataTypes.TEXT,
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
            type: DataTypes.DATE,
        },
        finish_at: {
            type: DataTypes.DATE,
        },
        worker_node_id: {
            type: DataTypes.INTEGER,
        },
        worker_started_at: {
            type: DataTypes.DATE,
        },
        checked_at: {
            type: DataTypes.DATE,
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
                            [Sequelize.Op.or]: [
                                null,
                                nodeId,
                            ],
                        },
                        status: 'pending',
                        start_at: {
                            [Sequelize.Op.or]: [
                                null,
                                {
                                    [Sequelize.Op.lt]: moment().toDate(),
                                },
                            ],
                        },
                        finish_at: {
                            [Sequelize.Op.or]: [
                                null,
                                {
                                    [Sequelize.Op.gte]: moment().toDate(),
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
    });

    Task.associate = function associate(models) {
        models.Node.hasMany(models.Node, {foreignKey: 'node_id'});
    };

    Task.prototype.fail = function fail(delay, options) {
        this.start_at = delay ? moment().add(delay, 'ms').toDate() : null;
        this.attempts = sequelize.literal('attempts + 1');
        this.status = 'failure';
        return this.save(options);
    };

    Task.prototype.complete = function complete(options) {
        this.status = 'done';
        return this.save(options);
    };

    Task.prototype.work = function work(nodeId, options) {
        this.status = 'working';
        this.worker_node_id = nodeId;
        this.worker_started_at = moment().toDate();
        return this.save(options);
    };

    Task.prototype.check = function check(options) {
        this.checked_at = moment().toDate();
        return this.save(options);
    };

    return Task;
};
