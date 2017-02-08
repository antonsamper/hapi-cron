'use strict';


/*********************************************************************************
 1. Dependencies
 *********************************************************************************/

const Hoek = require('hoek');
const CronJob = require('cron').CronJob;
const PluginPack = require('../package.json');


/*********************************************************************************
 2. Internals
 *********************************************************************************/

const internals = {};

internals.trigger = (server, job) => {

    return () => {

        server.log([PluginPack.name], job.name);

        server.inject(job.request, job.callback);
    };
};

internals.onPostStart = (jobs) => {

    return (server, done) => {

        for (const key of Object.keys(jobs)) {
            jobs[key].start();
        }

        done();
    };
};

internals.onPreStop = (jobs) => {

    return (server, done) => {

        for (const key of Object.keys(jobs)) {
            jobs[key].stop();
        }

        done();
    };
};

/*********************************************************************************
 3. Exports
 *********************************************************************************/

exports.register = (server, options, next) => {

    const jobs = {};

    if (!options.jobs || !options.jobs.length) {
        server.log([PluginPack.name], 'No cron jobs provided.');
    }
    else {
        options.jobs.forEach((job) => {

            Hoek.assert(!jobs[job.name], 'Job name has already been defined');
            Hoek.assert(job.name, 'Missing job name');
            Hoek.assert(job.time, 'Missing job time');
            Hoek.assert(job.timezone, 'Missing job time zone');
            Hoek.assert(job.request, 'Missing job request options');
            Hoek.assert(job.request.url, 'Missing job request url');

            try {
                jobs[job.name] = new CronJob(job.time, internals.trigger(server, job), null, false, job.timezone);
            }
            catch (ex) {
                if (ex.message === 'Invalid timezone.') {
                    Hoek.assert(!ex, 'Invalid timezone. See https://momentjs.com/timezone for valid timezones');
                }
                else {
                    Hoek.assert(!ex, 'Time is not a cron expression');
                }
            }
        });
    }

    server.expose('jobs', jobs);
    server.ext('onPostStart', internals.onPostStart(jobs));
    server.ext('onPreStop', internals.onPreStop(jobs));

    return next();
};

exports.register.attributes = {
    pkg: PluginPack
};

