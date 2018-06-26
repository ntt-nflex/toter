const async = require('async')
const { writeFileSync } = require('fs')
const readline = require('readline')
const stripFields = require('./../utils/strip-fields')

module.exports = setup

/**
 * Sets up widget configuration file
 *
 * @param  {function} api api client
 * @param  {object} config configuration file's data
 * @param  {string} region region to filter the configuration file
 * @param  {object} defaults default values used throughout the project
 */
function setup(api, config, region, defaults) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    let name, description, distribution

    const availableRegions = [
        'all',
        'ap',
        'au',
        'core',
        'eu',
        'in',
        'jp',
        'sandbox',
        'us'
    ]
    async.series(
        [
            callback => {
                rl.question('App/Widget name: ', function(input) {
                    name = input
                    callback()
                })
            },
            callback => {
                rl.question('App/Widget description: ', function(input) {
                    description = input
                    callback()
                })
            },
            callback => {
                rl.question(
                    `Widget deployment location (pick one or many separated by comma) [${availableRegions.join(
                        ','
                    )}]: `,
                    function(input) {
                        input = input.replace(/(\s|\n|\t|\r)/g, '') || 'all'

                        // using a Set here to avoid duplicate region entries
                        let regions = new Set(input.trim().split(','))

                        regions.forEach(region => {
                            if (!availableRegions.includes(region)) {
                                console.error('Invalid region', region)
                                process.exit(1)
                            }
                        })

                        // if all is set, no other region should be specified
                        if (regions.has('all')) {
                            regions = ['all']
                        }

                        distribution = Array.from(regions)
                        callback()
                    }
                )
            }
        ],
        () => {
            return Promise.resolve()
                .then(() => createApp(this.logger, api, name, description))
                .then(res =>
                    createWidget(this.logger, api, res, defaults.widget)
                )
                .then(res => createBucket(this.logger, api, res))
                .then(res => createBucketEntry(this.logger, api, res))
                .then(res => uploadWidget(this.logger, api, res, defaults))
                .then(res => {
                    config[region].app_json = res.app
                    config[region].app_json.distribution = distribution

                    config[region].widget_json = stripFields(res.widget)
                    config[region].widget_json.use_public_bucket = true

                    writeFileSync(
                        'config.json',
                        JSON.stringify(config, null, 4)
                    )
                })
                .catch(err => {
                    this.logger.error(err)
                    process.exit(1)
                })
                .then(() => rl.close())
        }
    )
}

function createApp(logger, api, name, description, distribution = ['all']) {
    const app = {
        name,
        description,
        distribution
    }

    return new Promise((resolve, reject) => {
        api('/api/apps', app)
            .then(res => {
                logger.info('Created app')
                logger.debug(res)
                resolve({ app: stripFields(res) })
            })
            .catch(err => reject(err))
    })
}

function createWidget(logger, api, settings, widgetDefaults) {
    const widget = Object.assign(
        {
            app_id: settings.app.id,
            description: settings.app.description,
            source: 'test',
            title: settings.app.name,
            type: 'marketplace',
            use_public_bucket: true
        },
        widgetDefaults
    )

    return new Promise((resolve, reject) => {
        api('/api/apps/widgets', widget)
            .then(res => {
                logger.debug(res)
                logger.info('Created widget')
                resolve({
                    app: settings.app,
                    widget: stripFields(res)
                })
            })
            .catch(err => reject(err))
    })
}

function createBucket(logger, api, settings) {
    const bucket = {
        type: 'shared',
        acl: [
            {
                customer_id: '00000000-0000-0000-0000-000000000000',
                permission: 'ro'
            }
        ]
    }

    return new Promise((resolve, reject) => {
        api(`/api/storage/buckets/${settings.widget.id}`, bucket, 'put')
            .then(res => {
                logger.info('Created bucket')
                logger.debug(res)
                resolve({
                    app: settings.app,
                    widget: settings.widget
                })
            })
            .catch(err => reject(err))
    })
}

function createBucketEntry(logger, api, settings) {
    const bucket = {
        type: 'public'
    }

    return new Promise((resolve, reject) => {
        api(`/api/storage/buckets/${settings.widget.id}/entry`, bucket, 'put')
            .then(res => {
                logger.info('Created bucket entry')
                logger.debug(res)
                resolve({
                    app: settings.app,
                    widget: settings.widget
                })
            })
            .catch(err => reject(err))
    })
}

function uploadWidget(logger, api, settings, defaults) {
    let widgetSettings = Object.assign({}, settings.widget)

    // widget id should not be passed into the payload
    // due to error key 'id' is invalid to update
    delete widgetSettings.id

    const widget = Object.assign(defaults.widget, widgetSettings, {
        type: 'marketplace',
        // the bucket was created with using the widget's id as name
        source: `/cmp/api/storage/buckets/${settings.widget.id}/${
            defaults.entry
        }`
    })

    return new Promise((resolve, reject) =>
        api(`/api/apps/widgets/${settings.widget.id}`, widget, 'put')
            .then(res => {
                logger.info('Uploaded widget')
                logger.debug(res)

                resolve({
                    app: settings.app,
                    widget: Object.assign(
                        {
                            id: settings.widget.id,
                            source: widget.source
                        },
                        stripFields(res)
                    )
                })
            })
            .catch(err => reject(err))
    )
}
