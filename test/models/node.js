'use strict';

const common = require('../common');
const expect = common.expect;
const faker = common.faker;

const models = require('../../models');

let nodeId = faker.random.number();

before(function() {
    return models.Node.create({
        id: nodeId,
        hostname: faker.internet.domainName()
    });
});

describe('#check', function() {

    let node = null;

    before(function() {
        return models.Node.findById(nodeId).then(function(value) {
            return value.check().then(function(value) {
                node = value;
            });
        });
    });

    it('should change checked_at field', function() {
        return expect(node.checked_at).to.be.ok;
    });

    it('should activate node', function() {
        return expect(node.is_active).to.be.true;
    });

});
