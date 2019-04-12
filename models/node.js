'use strict';

const moment = require('moment');

module.exports = function modelNode(sequelize, DataTypes) {
    const Node = sequelize.define('Node', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        hostname: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        status: {
            type: DataTypes.ENUM,
            values: ['active', 'paused'],
            defaultValue: 'active',
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        checked_at: {
            type: DataTypes.DATE,
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
    });

    Node.associate = function associate(models) {
        models.Node.hasMany(models.Task, {foreignKey: 'node_id'});
    };

    Node.prototype.check = function check(options) {
        this.is_active = true;
        this.checked_at = moment().toDate();
        return this.save(options);
    };

    return Node;
};
