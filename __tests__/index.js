/*********************************************************************************
 1. Dependencies
 *********************************************************************************/

const HapiCron = require('../lib');
const Hapi = require('@hapi/hapi');
const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const { expect } = Code;
const lab = exports.lab = Lab.script();


/*********************************************************************************
 2. Exports
 *********************************************************************************/

lab.test('registration assertions', () => {

    expect('should register plugin without errors', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron
        });
    });

    expect('should throw error when a job is defined with an existing name', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testname',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }, {
                        name: 'testname',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Job name has already been defined');
        }
    });

    expect('should throw error when a job is defined without a name', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job name');
        }
    });

    expect('should throw error when a job is defined without a time', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job time');
        }
    });

    expect('should throw error when a job is defined with an invalid time', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        time: 'invalid cron',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Time is not a cron expression');
        }
    });

    expect('should throw error when a job is defined with an invalid timezone', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'invalid',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Invalid timezone. See https://momentjs.com/timezone for valid timezones');
        }
    });

    expect('should throw error when a job is defined without a timezone', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job time zone');
        }
    });

    expect('should throw error when a job is defined without a request object', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London'
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job request options');
        }
    });

    expect('should throw error when a job is defined without a url in the request object', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            method: 'GET'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job request url');
        }
    });

    expect('should throw error when a job is defined with an invalid onComplete value', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            method: 'GET',
                            url: '/test-url'
                        },
                        onComplete: 'invalid'
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('onComplete value must be a function');
        }
    });
});

lab.test('plugin functionalexpecty', () => {

    expect('should expose access to the registered jobs', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    }
                }]
            }
        });

        expect(server.plugins['hapi-cron']).toBeDefined();
        expect(server.plugins['hapi-cron'].jobs.testcron).toBeDefined();
    });

    expect('should ensure the request and callback from the plugin options are triggered', async (done) => {

        const onComplete = jest.fn();
        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    },
                    onComplete
                }]
            }
        });

        server.route({
            method: 'GET',
            path: '/test-url',
            handler: () => 'hello world'
        });

        server.events.on('response', (request) => {

            expect(request.method).toBe('get');
            expect(request.path).toBe('/test-url');
            done();
        });

        expect(onComplete).not.toHaveBeenCalled();

        await server.plugins['hapi-cron'].jobs.testcron._callbacks[0]();

        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledwith('hello world');
    });

    expect('should not start the jobs until the server starts', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    }
                }]
            }
        });

        expect(server.plugins['hapi-cron'].jobs.testcron.running).toBeUndefined();

        await server.start();

        expect(server.plugins['hapi-cron'].jobs.testcron.running).toBe(true);

        await server.stop();
    });

    expect('should stop cron jobs when the server stops', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    }
                }]
            }
        });

        await server.start();

        expect(server.plugins['hapi-cron'].jobs.testcron.running).toBe(true);

        await server.stop();

        expect(server.plugins['hapi-cron'].jobs.testcron.running).toBe(false);
    });
});
