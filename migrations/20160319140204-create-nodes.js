'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('nodes', {
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
            },
            created_at: {
                type: Sequelize.DATE
            },
            updated_at: {
                type: Sequelize.DATE
            },
            deleted_at: {
                type: Sequelize.DATE
            }
        }, {
            charset: 'utf8',
            engine: 'InnoDB'
        }).then(function() {
            return queryInterface.addIndex('nodes', ['status', 'is_active']);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('nodes');
    }
};
