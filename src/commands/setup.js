const async = require('async')
const { writeFileSync } = require('fs')
const readline = require('readline')
const stripFields = require('./../utils/strip-fields')
const getFile = require('../utils/get-file')
const isEmpty = require('../utils/empty-file')

module.exports = setup

/**
 * Sets up widget configuration file
 *
 * @param  {string} region region to filter the configuration file
 * @param  {object} defaults default values used throughout the project
 */
function setup(region, defaults) {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
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

    let config = {},
        setDefaultRegion = false,
        api

    async.series(
        {
            region: callback => {

                if(region !== defaults.region) {

                    setDefaultRegion = true
                    callback(null, region)

                } else {

                    rl.question(
                        `Which region do you want to use? (default one is ${defaults.region}) `,
                        function(input) {

                            let newRegion = input.trim()

                            if(!input) {
                                newRegion = defaults.region
                            } else {
                                setDefaultRegion = true
                            }

                            callback(null, newRegion)
                        }
                    )
                }
            },
            title: callback => {
                rl.question('App/Widget name (en): ', function(input) {
                    callback(null, input)
                })
            },
            description: callback => {
                rl.question('App/Widget description: (en): ', function(input) {
                    callback(null, input)
                })
            },
            titleJa: callback => {
                rl.question('App/Widget name (ja): ', function(input) {
                    callback(null, input)
                })
            },
            descriptionJa: callback => {
                rl.question('App/Widget description (ja): ', function(input) {
                    callback(null, input)
                })
            },
            distribution: callback => {
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

                        regions = Array.from(regions)
                        callback(null, regions)
                    }
                )
            }
        },
        (err, info) => {

            if(err) {
                this.logger.error('There has been a problem with toter setup ',
                err)
            }

            const settings = getFile(defaults.settingsPath)

            if (!settings) {
                this.logger.error('No settings file found at', defaults.settingsPath)
                process.exit(1)
            }

            const credentials = require('../utils/credentials')(settings, info.region)

            api = require('../api/api').bind({
                credentials: credentials,
                folder: defaults.folder,
                logger: this.logger
            })

            const translations = {
                en: {
                    title: info.title,
                    description: info.description
                }
            };
            if(info.titleJa && info.descriptionJa) {
                translations.ja = {
                    title: info.titleJa,
                    description: info.descriptionJa
                }
            }

            return Promise.resolve()
                .then(() => createApp(this.logger, api, translations))
                .then(res =>
                    createWidget(this.logger, api, res, translations,
                        defaults.widget)
                )
                .then(res =>
                    createBucket(this.logger, api, res)
                )
                .then(res => createBucketEntry(this.logger, api, res))
                .then(res => uploadWidget(this.logger, api, res, defaults))
                .then(res => {

                    const schema = getFile(defaults.schemaPath)

                    if(setDefaultRegion) {
                        config['region'] = info.region
                    }

                    config[info.region] = {
                        app_json: {},
                        widget_json: {
                            use_public_widget: true
                        }
                    }

                    config[info.region].app_json = res.app
                    config[info.region].app_json.distribution = info.distribution

                    config[info.region].widget_json = stripFields(res.widget)
                    config[info.region].widget_json.use_public_bucket = true

                    if(schema && !isEmpty(schema)) {

                        config[info.region].widget_json.schema = schema.schema
                    } else {

                        this.logger.info(`Schema can be added automatically by adding schema.json file in the project folder.`)
                    }

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

function createApp(logger, api, translations, distribution = ['all']) {


    const name = translations.en.title,
        description = translations.en.description,
        app = {
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

function createWidget(logger, api, settings, translations, widgetDefaults) {

    const widget = Object.assign(
        {
            app_id: settings.app.id,
            source: 'test',
            translations: translations,
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
            .catch(err => {
                console.error(err)
                reject(err)
            })
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
