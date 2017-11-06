'use strict';

const moment = require('moment');

module.exports = function modelNode(sequelize, Sequelize) {
    return sequelize.define('Node', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        hostname: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
        },
        status: {
            type: Sequelize.ENUM,
            values: ['active', 'paused'],
            defaultValue: 'active',
            allowNull: false,
        },
        is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        checked_at: {
            type: Sequelize.DATE,
        },
    }, {
        tableName: 'nodes',
        freezeTableName: true,
        underscored: true,
        paranoid: true,

        scopes: {
            active: {
                where: {
                    status: 'active',
                    is_active: true,
                },
            },
        },

        instanceMethods: {
            check(options) {
                this.is_active = true;
                this.checked_at = moment().toDate();
                return this.save(options);
            },
        },

        classMethods: {
            associate(models) {
                models.Node.hasMany(models.Task, {foreignKey: 'node_id'});
            },
        },
    });
};
