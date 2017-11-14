/*********************************************************************************
 1. Dependencies
 *********************************************************************************/

const Hoek = require('hoek');
const CronJob = require('cron').CronJob;
const PluginPackage = require('../package.json');


/*********************************************************************************
 2. Internals
 *********************************************************************************/

const internals = {};

internals.trigger = (server, job) => {

    return async () => {

        server.log([PluginPackage.name], job.name);

        await server.inject(job.request);

        job.onComplete();
    };
};

internals.onPostStart = (jobs) => {

    return async () => {

        for (const key of Object.keys(jobs)) {
            await jobs[key].start();
        }
    };
};

internals.onPreStop = (jobs) => {

    return async () => {

        for (const key of Object.keys(jobs)) {
            await jobs[key].stop();
        }
    };
};


/*********************************************************************************
 3. Exports
 *********************************************************************************/

const PluginRegistration = (server, options) => {

    const jobs = {};

    if (!options.jobs || !options.jobs.length) {
        server.log([PluginPackage.name], 'No cron jobs provided.');
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
            catch (err) {
                if (err.message === 'Invalid timezone.') {
                    Hoek.assert(!err, 'Invalid timezone. See https://momentjs.com/timezone for valid timezones');
                }
                else {
                    Hoek.assert(!err, 'Time is not a cron expression');
                }
            }
        });
    }

    server.expose('jobs', jobs);
    server.ext('onPostStart', internals.onPostStart(jobs));
    server.ext('onPreStop', internals.onPreStop(jobs));
};

exports.plugin = {
    register: PluginRegistration,
    pkg: PluginPackage
};
