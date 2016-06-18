'use strict';

const moment = require('moment');

module.exports = function(sequelize, Sequelize) {

    return sequelize.define('Task', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        node_id: {
            type: Sequelize.INTEGER
        },
        queue: {
            type: Sequelize.STRING,
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM,
            values: ['pending', 'working', 'done', 'failure'],
            defaultValue: 'pending',
            allowNull: false
        },
        attempts: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        priority: {
            type: Sequelize.INTEGER,
            defaultValue: 10,
            allowNull: false
        },
        body: {
            type: Sequelize.TEXT,
            set: function(body) {
                return this.setDataValue('body', JSON.stringify(body));
            },
            get: function() {
                try {
                    return JSON.parse(this.getDataValue('body'));
                } catch (e) {
                    return null;
                }
            }
        },
        start_at: {
            type: Sequelize.DATE
        },
        finish_at: {
            type: Sequelize.DATE
        },
        worker_node_id: {
            type: Sequelize.INTEGER
        },
        worker_started_at: {
            type: Sequelize.DATE
        }
    }, {
        tableName: 'tasks',
        freezeTableName: true,
        underscored: true,

        scopes: {
            forWork: function(queue, node_id) {
                return {
                    where: {
                        node_id: [
                            null,
                            node_id
                        ],
                        queue: queue,
                        status: 'pending',
                        start_at: {
                            $or: [
                                null,
                                {
                                    $lt: moment().toDate()
                                }
                            ]
                        },
                        finish_at: {
                            $or: [
                                null,
                                {
                                    $gte: moment().toDate()
                                }
                            ]
                        }
                    },
                    order: [
                        ['priority', 'DESC'],
                        ['attempts', 'ASC'],
                        [sequelize.fn('IFNULL', sequelize.col('start_at'), sequelize.col('created_at')), 'ASC']
                    ]
                };
            }
        },

        instanceMethods: {
            fail: function(delay, options) {
                this.start_at = delay ? moment().add(delay, 'ms').toDate() : null;
                this.attempts = sequelize.literal('attempts + 1');
                this.status = 'failure';
                return this.save(options);
            },
            complete: function(options) {
                this.status = 'done';
                return this.save(options);
            },
            work: function(node_id, options) {
                this.status = 'working';
                this.worker_node_id = node_id;
                this.worker_started_at = moment().toDate();
                return this.save(options);
            },
            touch: function(options) {
                this.changed('updated_at', true);
                return this.save(options);
            }
        },

        classMethods: {
            associate: function(models) {
                models.Task.belongsTo(models.Node, {foreignKey: 'node_id'});
            }
        }
    });

};
