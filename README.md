# hapi-cron [![Build Status](https://travis-ci.org/antonsamper/hapi-cron.svg?branch=master)](https://travis-ci.org/antonsamper/hapi-cron)
A Hapi plugin to setup cron jobs that will call predefined server routes at specified times.


## Requirements
This plugin is compatible with **hapi** v17+ and requires Node v8+.
If you need a version compatible with **hapi** v16 please install version [0.0.3](https://github.com/antonsamper/hapi-cron/releases/tag/v0.0.3).


## Installation
Add `hapi-cron` as a dependency to your project:

```bash
$ npm i -S hapi-cron
```


## Usage
```javascript
const Hapi = require('hapi');
const HapiCron = require('hapi-cron');

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
               onComplete: (res) => {
                 
                   console.info('hapi cron has run');
               }
           }]
        }
    });
}
catch (err) {
   console.info('there was an error');
}

```

## Options
* `name` - [REQUIRED] - The name of the cron job. This can be anything but it must be unique.
* `time` - [REQUIRED] - A valid cron value. [See cron configuration](#cron-configuration)
* `timezone` - [REQUIRED] - A valid [timezone](https://momentjs.com/timezone/).
* `request` - [REQUIRED] - The request object containing the route url path. Other [options](https://hapijs.com/api#serverinjectoptions-callback) can also be passed into the request object.
    * `url` - [REQUIRED] - Route path to request
* `onComplete` - [OPTIONAL] - Callback function to run after the route has been requested. The function will contain the response from the request.


## Cron configuration
This plugin uses the [node-cron](https://github.com/kelektiv/node-cron) module to setup the cron job. 


### Available cron patterns:
```
Asterisk. E.g. *
Ranges. E.g. 1-3,5
Steps. E.g. */2
```
    

[Read up on cron patterns here](http://crontab.org). Note the examples in the link have five fields, and 1 minute as the finest granularity, but the node cron module allows six fields, with 1 second as the finest granularity.

### Cron Ranges
When specifying your cron values you'll need to make sure that your values fall within the ranges. For instance, some cron's use a 0-7 range for the day of week where both 0 and 7 represent Sunday. We do not.

 * Seconds: 0-59
 * Minutes: 0-59
 * Hours: 0-23
 * Day of Month: 1-31
 * Months: 0-11
 * Day of Week: 0-6
