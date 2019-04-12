'use strict';

const path = require('path');
const intel = require('intel');
const logrotate = require('logrotate-stream');

module.exports = (config) => {
    intel.setLevel(config.level);

    const fileFormatter = new intel.Formatter({
        format: '[%(date)s] [%(levelname)s] %(name)s - %(message)s',
    });
    const consoleFormatter = new intel.Formatter({
        format: '[%(date)s] [%(levelname)s] %(name)s - %(message)s',
        colorize: true,
    });

    intel.addHandler(new intel.handlers.Console({
        formatter: consoleFormatter,
    }));
    intel.addHandler(new intel.handlers.Stream({
        stream: logrotate({
            file: path.join(config.path, 'debug.log'),
            size: config.size,
            keep: config.keep,
        }),
        formatter: fileFormatter,
    }));
    intel.addHandler(new intel.handlers.Stream({
        level: intel.INFO,
        stream: logrotate({
            file: path.join(config.path, 'info.log'),
            size: config.size,
            keep: config.keep,
        }),
        formatter: fileFormatter,
    }));
    intel.addHandler(new intel.handlers.Stream({
        level: intel.WARN,
        stream: logrotate({
            file: path.join(config.path, 'error.log'),
            size: config.size,
            keep: config.keep,
        }),
        formatter: fileFormatter,
    }));
};
