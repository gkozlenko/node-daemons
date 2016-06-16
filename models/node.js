'use strict';

const uuid = require('node-uuid');
const moment = require('../lib/moment');

module.exports = function(sequelize, Sequelize) {

    let Node = sequelize.define('Node', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        hostname: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        status: {
            type: Sequelize.ENUM,
            values: ['active', 'paused'],
            defaultValue: 'active',
            allowNull: false
        },
        is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        token: {
            type: Sequelize.STRING
        },
        old_token: {
            type: Sequelize.STRING
        },
        token_changed_at: {
            type: Sequelize.DATE
        },
        checked_at: {
            type: Sequelize.DATE
        }
    }, {
        tableName: 'nodes',
        freezeTableName: true,
        underscored: true,
        paranoid: true,

        scopes: {
            active: {
                where: {
                    status: 'active',
                    is_active: true
                }
            }
        },

        hooks: {
            beforeCreate: function(model) {
                if (!model.token) {
                    model.token = Node.generateToken();
                    model.token_changed_at = moment().toMySQL();
                }
            }
        },

        classMethods: {
            associate: function(models) {
                models.Node.hasMany(models.Task, {foreignKey: 'node_id'});
            },
            generateToken: function() {
                return uuid.v4();
            }
        }
    });

    return Node;

};
