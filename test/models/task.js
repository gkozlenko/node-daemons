'use strict';

const common = require('../common');
const expect = common.expect;
const faker = common.faker;

const _ = require('lodash');
const moment = require('moment');
const models = require('../../models');

function invokeMethod(instanceParams, method, methodArguments) {
    return models.Task.create(instanceParams).then(function (value) {
        return value[method].apply(value, methodArguments || []);
    }).then(function (value) {
        return value.reload();
    });
}

describe('#fail', function () {

    let task = null;
    let attempts = faker.random.number(10);

    before(function () {
        return invokeMethod({
            queue: faker.lorem.word(),
            body: {},
            attempts: attempts
        }, 'fail').then(function (value) {
            task = value;
        });
    });

    it('should increase number of attempts', function () {
        return expect(task.attempts).to.be.eq(attempts + 1);
    });

    it('should change status', function () {
        return expect(task.status).to.be.eq('failure');
    });

    it('should not change start_at', function () {
        return expect(task.start_at).to.be.null;
    });

    describe('with delay', function () {

        let delay = faker.random.number({min: 100000, max: 999999});

        before(function () {
            return invokeMethod({
                queue: faker.lorem.word(),
                body: {},
                attempts: attempts
            }, 'fail', [delay]).then(function (value) {
                task = value;
            });
        });

        it('should change start_at', function () {
            return expect(task.start_at).to.be.ok;
        });

        it('should change start_at correctly', function () {
            return [
                expect(task.start_at).to.beforeTime(moment().add(delay + 3000, 'ms').toDate()),
                expect(task.start_at).to.afterTime(moment().add(delay - 3000, 'ms').toDate())
            ];
        });

    });

});

describe('#complete', function () {

    let task = null;

    before(function () {
        return invokeMethod({
            queue: faker.lorem.word(),
            body: {}
        }, 'complete').then(function (value) {
            task = value;
        });
    });

    it('should change status', function () {
        return expect(task.status).to.be.eq('done');
    });

});

describe('#work', function () {

    let task = null;
    let nodeId = faker.random.number();

    before(function () {
        return invokeMethod({
            queue: faker.lorem.word(),
            body: {}
        }, 'work', [nodeId]).then(function (value) {
            task = value;
        });
    });

    it('should change status', function () {
        return expect(task.status).to.be.eq('working');
    });

    it('should assign worker_node_id', function () {
        return expect(task.worker_node_id).to.be.eq(nodeId);
    });

    it('should change worker_started_at', function () {
        return expect(task.worker_started_at).to.be.ok;
    });

});

describe('#check', function () {

    let task = null;

    before(function () {
        return invokeMethod({
            queue: faker.lorem.word(),
            body: {}
        }, 'check').then(function (value) {
            task = value;
        });
    });

    it('should change checked_at correctly', function () {
        return [
            expect(task.checked_at).to.beforeTime(moment().add(3000, 'ms').toDate()),
            expect(task.checked_at).to.afterTime(moment().subtract(3000, 'ms').toDate())
        ];
    });

});

describe('.scope', function () {

    describe('.forWork', function () {

        let queue = 'fw-' + faker.lorem.word();
        let nodeId = faker.random.number();
        let otherTasks = [
            // another queue
            {queue: faker.lorem.word(), body: {}},
            // another node
            {queue: queue, node_id: nodeId + 1, body: {}},
            // not pending tasks
            {queue: queue, status: 'done', body: {}},
            {queue: queue, status: 'working', body: {}},
            {queue: queue, status: 'failure', body: {}},
            // future tasks
            {queue: queue, start_at: moment().add(10, 'm').toDate(), body: {}},
            // past tasks
            {queue: queue, finish_at: moment().subtract(10, 'm').toDate(), body: {}}
        ];
        let actualTasks = [
            {queue: queue, body: {}},
            {queue: queue, node_id: nodeId, body: {}},
            {queue: queue, start_at: moment().subtract(10, 'm').toDate(), body: {}},
            {queue: queue, finish_at: moment().add(10, 'm').toDate(), body: {}}
        ];

        before(function () {
            return models.Task.bulkCreate(_.shuffle(_.concat(otherTasks, actualTasks)));
        });

        it('should return right tasks', function () {
            return models.Task.scope({
                method: ['forWork', queue, nodeId]
            }).findAll().then(function (rows) {
                expect(rows.length).to.be.eq(actualTasks.length);
                expect(_.map(rows, 'queue')).have.members(_.times(rows.length, _.constant(queue)));
                expect(_.map(rows, 'status')).have.members(_.times(rows.length, _.constant('pending')));
            });
        });

    });

});
