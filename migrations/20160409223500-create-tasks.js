'use strict';

module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('tasks', {
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
            created_at: {
                type: Sequelize.DATE,
            },
            updated_at: {
                type: Sequelize.DATE,
            },
        }, {
            charset: 'utf8',
            engine: 'InnoDB',
        }).then(() => {
            return [
                queryInterface.addIndex('tasks', ['node_id']),
                queryInterface.addIndex('tasks', ['status', 'queue', 'start_at', 'finish_at']),
            ];
        });
    },

    down(queryInterface) {
        return queryInterface.dropTable('tasks');
    },
};
