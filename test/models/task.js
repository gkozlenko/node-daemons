'use strict';

const common = require('../common');
const expect = common.expect;
const faker = common.faker;

const moment = require('moment');
const models = require('../../models');

function invokeMethod(instanceParams, method, methodArguments) {
    return models.Task.create(instanceParams).then(function(value) {
        return value[method].apply(value, methodArguments || []);
    }).then(function(value) {
        return value.reload();
    });
}

describe('#fail', function() {

    let task = null;
    let attempts = faker.random.number(10);

    before(function() {
        return invokeMethod({
            queue: faker.lorem.word(),
            body: {},
            attempts: attempts
        }, 'fail').then(function(value) {
            task = value;
        });
    });

    it('should increase number of attempts', function() {
        return expect(task.attempts).to.be.eq(attempts + 1);
    });

    it('should change status', function() {
        return expect(task.status).to.be.eq('failure');
    });

    it('should not change start_at', function() {
        return expect(task.start_at).to.be.null;
    });

    describe('with delay', function() {

        let delay = faker.random.number({min: 100000, max: 999999});

        before(function() {
            return invokeMethod({
                queue: faker.lorem.word(),
                body: {},
                attempts: attempts
            }, 'fail', [delay]).then(function(value) {
                task = value;
            });
        });

        it('should change start_at', function() {
            return expect(task.start_at).to.be.ok;
        });

        it('should change start_at correctly', function() {
            return [
                expect(task.start_at).to.beforeTime(moment(task.updated_at).add(delay + 1000, 'ms').toDate()),
                expect(task.start_at).to.afterTime(moment(task.updated_at).add(delay - 1000, 'ms').toDate())
            ];
        });

    });

});

describe('#complete', function() {

    let task = null;

    before(function() {
        return invokeMethod({
            queue: faker.lorem.word(),
            body: {}
        }, 'complete').then(function(value) {
            task = value;
        });
    });

    it('should change status', function() {
        return expect(task.status).to.be.eq('done');
    });

});

describe('#work', function() {

    let task = null;
    let nodeId = faker.random.number();

    before(function() {
        return invokeMethod({
            queue: faker.lorem.word(),
            body: {}
        }, 'work', [nodeId]).then(function(value) {
            task = value;
        });
    });

    it('should change status', function() {
        return expect(task.status).to.be.eq('working');
    });

    it('should assign worker_node_id', function() {
        return expect(task.worker_node_id).to.be.eq(nodeId);
    });

    it('should change worker_started_at', function() {
        return expect(task.worker_started_at).to.be.ok;
    });

});

describe('#check', function() {

    let task = null;

    before(function() {
        return invokeMethod({
            queue: faker.lorem.word(),
            body: {}
        }, 'check').then(function(value) {
            task = value;
        });
    });

    it('should change checked_at correctly', function() {
        return [
            expect(task.checked_at).to.beforeTime(moment().add(1000, 'ms').toDate()),
            expect(task.checked_at).to.afterTime(moment().subtract(1000, 'ms').toDate())
        ];
    });

});
