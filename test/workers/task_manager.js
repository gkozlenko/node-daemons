'use strict';

const common = require('../common');
const expect = common.expect;
const faker = common.faker;

const _ = require('lodash');
const moment = require('moment');
const models = require('../../models');
const Worker = require('../../workers/task_manager');

describe('#loop', function() {

    let worker = null;

    before(function() {
        worker = new Worker('task_manager', {
            silence: true,
            maxUpdate: 30000,
            maxCompleted: 3600000, // 1 hour
            maxFailed: 259200000 // 3 days
        });
    });

    describe('#_failFrozenTasks', function() {

        let otherTasks = [
            {queue: faker.lorem.word(), body: {}},
            {queue: faker.lorem.word(), body: {}, status: 'done'},
            {queue: faker.lorem.word(), body: {}, status: 'working', checked_at: moment().toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'working', checked_at: moment().subtract(10000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'working', checked_at: moment().add(50000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'pending', checked_at: moment().subtract(50000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'done', checked_at: moment().subtract(50000).toDate()}
        ];
        let actualTasks = [
            {queue: faker.lorem.word(), body: {}, status: 'working', checked_at: moment().subtract(50000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'working', checked_at: moment().subtract(150000).toDate(), attempts: 2}
        ];

        before(function() {
            return models.Task.destroy({truncate: true}).then(() => {
                return models.Task.bulkCreate(_.shuffle(_.concat(otherTasks, actualTasks))).then(() => {
                    return worker._failFrozenTasks();
                });
            });
        });

        it('should fail frozen tasks', function() {
            return models.Task.findAll({
                where: {
                    status: 'failure'
                }
            }).then(function(rows) {
                expect(rows.length).to.be.eq(actualTasks.length);
                expect(_.map(rows, 'attempts')).have.members([1, 3]);
            });
        });

    });

    describe('#_restoreFailedTasks', function() {

        it('should restore failed tasks');

    });

    describe('#_deleteDeadTasks', function() {

        let queue = 'dt-' + faker.lorem.word();
        let otherTasks = [
            {queue: faker.lorem.word(), body: {}},
            {queue: faker.lorem.word(), body: {}, status: 'done'},
            {queue: faker.lorem.word(), body: {}, status: 'working', checked_at: moment().toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'working', checked_at: moment().subtract(10000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'working', checked_at: moment().add(50000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'pending', checked_at: moment().subtract(50000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'done', checked_at: moment().subtract(50000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'done', finish_at: moment().subtract(50000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'failure', finish_at: moment().subtract(50000).toDate()}
        ];
        let actualTasks = [
            {queue: queue, body: {}, status: 'pending', finish_at: moment().subtract(1000).toDate()},
            {queue: queue, body: {}, status: 'pending', finish_at: moment().subtract(150000).toDate()}
        ];

        before(function() {
            return models.Task.destroy({truncate: true}).then(() => {
                return models.Task.bulkCreate(_.shuffle(_.concat(otherTasks, actualTasks))).then(() => {
                    return worker._deleteDeadTasks();
                });
            });
        });

        it('should delete dead tasks', function() {
            return models.Task.findAll().then(function(rows) {
                expect(rows.length).to.be.eq(otherTasks.length);
                expect(_.map(rows, 'queue')).to.not.include.members([queue]);
            });
        });

    });

    describe('#_deleteCompletedTasks', function() {

        let queue = 'ct-' + faker.lorem.word();
        let otherTasks = [
            {queue: faker.lorem.word(), body: {}},
            {queue: faker.lorem.word(), body: {}, status: 'done'},
            {queue: faker.lorem.word(), body: {}, status: 'working', checked_at: moment().toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'working', checked_at: moment().subtract(10000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'working', checked_at: moment().add(50000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'pending', checked_at: moment().subtract(50000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'done', checked_at: moment().subtract(50000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'done', checked_at: moment().add(5000000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'done', finish_at: moment().subtract(50000).toDate()},
            {queue: faker.lorem.word(), body: {}, status: 'failure', finish_at: moment().subtract(50000).toDate()}
        ];
        let actualTasks = [
            {queue: queue, body: {}, status: 'done', checked_at: moment().subtract(3600001).toDate()},
            {queue: queue, body: {}, status: 'done', checked_at: moment().subtract(5000000).toDate()}
        ];

        before(function() {
            return models.Task.destroy({truncate: true}).then(() => {
                return models.Task.bulkCreate(_.shuffle(_.concat(otherTasks, actualTasks))).then(() => {
                    return worker._deleteCompletedTasks();
                });
            });
        });

        it('should delete completed tasks', function() {
            return models.Task.findAll().then(function(rows) {
                expect(rows.length).to.be.eq(otherTasks.length);
                expect(_.map(rows, 'queue')).to.not.include.members([queue]);
            });
        });

    });

    describe('#_deleteFailedTasks', function() {

        it('should delete failed tasks');

    });

});