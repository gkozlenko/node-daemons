'use strict';

const path = require('path');
process.env.LOG4JS_CONFIG = path.join(__dirname, '..', 'log4js.json');
const log4js = require('log4js');

module.exports = log4js;
