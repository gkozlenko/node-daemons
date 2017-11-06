'use strict';

const common = require('../common');
const expect = common.expect;
const faker = common.faker;

const moment = require('moment');
const models = require('../../models');

describe('#check', function () {

    let node = null;

    before(function () {
        return models.Node.create({
            hostname: faker.internet.domainName()
        }).then(function (value) {
            return value.check();
        }).then(function (value) {
            return value.reload();
        }).then(function (value) {
            node = value;
        });
    });

    it('should change checked_at correctly', function () {
        return [
            expect(node.checked_at).to.beforeTime(moment().add(3000, 'ms').toDate()),
            expect(node.checked_at).to.afterTime(moment().subtract(3000, 'ms').toDate())
        ];
    });

    it('should activate node', function () {
        return expect(node.is_active).to.be.true;
    });

});
