'use strict';

const fs = require('fs');
const path = require('path');
const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-datetime'));
const faker = require('faker');

function importTest(name, file) {
    describe(name, function () {
        require(path.join(__dirname, file));
    });
}

function importTests(name, dir) {
    describe(name, function () {
        fs.readdirSync(path.join(__dirname, dir)).filter(file => {
            return (file.indexOf('.') !== 0) && (file.slice(-3) === '.js');
        }).forEach(file => {
            importTest(path.basename(file, '.js'), path.join(dir, file));
        });
    });
}

module.exports = {
    chai: chai,
    expect: chai.expect,
    faker: faker,
    importTest: importTest,
    importTests: importTests,
};
