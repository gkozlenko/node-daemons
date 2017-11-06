'use strict';

process.env.NODE_ENV = 'test';

require('../config/config');
const models = require('../models');
const common = require('./common');

describe('node-daemons', function () {

    this.timeout(10000);

    before(function () {
        return models.sequelize.sync({force: true});
    });

    after(function () {
        models.sequelize.close();
    });

    common.importTests('models', './models');
    common.importTests('workers', './workers');
});
