'use strict';

const moment = require('moment');

moment.fn.toMySQL = function() {
    return this.clone().utc().format('YYYY-MM-DD HH:mm:ss');
};

module.exports = moment;