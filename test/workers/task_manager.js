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
            {queue: faker.lorem.word(), body: {}, status: 'working', checked_at: moment().subtract(150000).toDate()}
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
                expect(_.map(rows, 'attempts')).to.eql(_.times(actualTasks.length, _.constant(1)));
            });
        });

    });

});