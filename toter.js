#!/usr/bin/env node

const argv           = require('minimist')(process.argv.slice(2))
const { execSync }   = require('child_process')
const fs             = require('fs')
const readline       = require('readline')
const async          = require('async')
const isGlobal       = require('is-installed-globally')
const api            = require('./utils/api')

const widgetDefaults = {
    minx: 4,
    miny: 4,
    sizex: 7,
    sizey: 7,
    icon: 'html'
}

const getFile = path => {
    if (!fs.existsSync(path)) {
        console.error(`${path} required`)
        process.exit(1)
    }
    return require(path)
}

const getUserHome = () => process.env.HOME || process.env.USERPROFILE;

// const settingsPath = isGlobal ? getUserHome() + '/.toter.json' : '/.toter.json'
const settingsPath = `${getUserHome()}/.toter.json`

const config = getFile(`${process.env.PWD}/config.json`)
const settings = getFile(settingsPath)

const originalConfig = JSON.stringify(config, null, 4)
const command        = argv._[0] || 'help'
const entry          = 'index.html'
const folder         = 'dist'

let key
let secret
let region
let selectedRegion

const strippedFields = [
    'customer_id',
    'user_id',
    'subscribers',
    'updated_at',
    'created_at',
    'type',
    'module_id',
    'source_module_id',
    'status',
    'distribution'
]
const getCredentials = (settings, argv) => {
    if (settings && !settings.regions) {
        console.error('Please run config')
        process.exit(1)
    }

    const selectedRegion = argv.r || argv.region || 'default'
    const key    = settings.regions[selectedRegion].key
    const secret = settings.regions[selectedRegion].secret

    if (!key || !secret) {
        console.error('Please add a key and secret to your setting file')
        process.exit(1)
    }

    const region = settings.regions[selectedRegion].region

    return {
        key,
        secret,
        region
    }

}
const { key, secret, region } = getCredentials()

const isSetupCommand = command => ['help', 'config'].includes(command)
if(!isSetupCommand(command)) {
    if(settings && !settings.regions) {
        console.error('Please run config')
        process.exit(1)
    }

    selectedRegion = argv.r || argv.region || 'default'
    key    = settings.regions[selectedRegion].key
    secret = settings.regions[selectedRegion].secret
    region = settings.regions[selectedRegion].region

    if(!key || !secret) {
        console.error('Please add a key and secret to your setting file')
        process.exit(1)
    }
}

// This is a migration script, remove in a few versions time
if(config.app_json || config.widget_json) {
    config = {
        default: {
            app_json: config.app_json,
            widget_json: config.widget_json
        }
    }
    fs.writeFileSync('config.json', JSON.stringify(config, null, 4))
}

function stripFields(thing) {
    Object.keys(thing).forEach((key) => {
        if(strippedFields.includes(key)) {
            delete thing[key]
        }
    })
}

function setConfig() {
    if(isGlobal || (argv.f || argv.force)) {
        if((argv.u || argv.url) && (argv.k || argv.key) && (argv.s || argv.secret)) {
            if(!settings.regions || !Object.keys(settings.regions).length) {
                settings.regions = {}
            }

            settings.regions[argv.n || 'default'] = {
                region: argv.u || argv.url,
                key: argv.k || argv.key,
                secret: argv.s || argv.secret
            }
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), {flag: 'w'})
        } else {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            })

            let newRegionName
            let newRegion = {}

            if(!Object.keys(settings).length || !settings.regions || !Object.keys(settings.regions).length) {
                settings.regions = {}
            }

            async.series([
                (callback) => {
                    rl.question('Region name (default is "default", leave blank if unsure): ', function(input) {
                        newRegionName = (!input) ? 'default' : input
                        callback()
                    })
                }, (callback) => {
                    rl.question('CMP URL (default is "core-cmp.nflex.io"): ', function(input) {
                        newRegion.region = (!input) ? 'core-cmp.nflex.io' : input
                        callback()
                    })
                }, (callback) => {
                    rl.question('CMP API Key: ', function(input) {
                        newRegion.key = input
                        callback()
                    })
                }, (callback) => {
                    rl.question('CMP API Secret: ', function(input) {
                        newRegion.secret = input
                        callback()
                    })
                }
            ], () => {
                settings.regions[newRegionName] = newRegion
                fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), {flag: 'w'})
                rl.close()
            })
        }
    } else {
        console.warn(
            `Toter is not installed globally, running this command will create or
            add to the ".toter.json" settings file in this directory. If you are sure you
            want to store settings in your project please make sure you .gitignore
            ".toter.json" file. Otherwise, run "npm uninstall toter" in this directory
            and reinstall it with the -g flag`
        )
    }
}

function setup() {
    if(!Object.keys(config).length || !config[selectedRegion]) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
        let name
        let description
        async.series([
            (callback) => {
                rl.question('App/Widget name: ', function(input) {
                    name = input
                    callback()
                })
            }, (callback) => {
                rl.question('App/Widget description: ', function(input) {
                    description = input
                    callback()
                })
            }
        ], () => {
            const setupDetails = {
                title: name,
                description: description
            }

            config[selectedRegion] = {}

            // TODO: Deal with errors nicely
            config[selectedRegion].app_json = JSON.parse(api('/api/apps/widgets/' + widgetID, Object.assign({}, widgetDefaults, config[selectedRegion].widget_json, {
                type: 'marketplace',
                source: '/cmp/api/storage/buckets/' + widgetID + '/' + entry
            }), 'put'))
            config[selectedRegion].widget_json.id = widgetID

            stripFields(config[selectedRegion].widget_json)

            fs.writeFileSync('config.json', JSON.stringify(config, null, 4))
            rl.close()
        })
    } else {
        console.log('Cannot setup - config contains settings already')
    }
}

function update() {
    if(!config[selectedRegion].widget_json || config[selectedRegion].widget_json && !config[selectedRegion].widget_json.id) {
        console.log('Please run setup first - widget has no ID')
    } else {
        let curlObj = Object.assign({}, widgetDefaults, config[selectedRegion].widget_json, {
            type: 'marketplace',
            source: '/cmp/api/storage/buckets/' + config[selectedRegion].widget_json.id + '/' + entry
        })

        let widgetID = curlObj.id
        delete curlObj.id
        let curlData = api('/api/apps', config[selectedRegion].app_json))

        stripFields(config[selectedRegion].app_json)
    }
    fs.writeFileSync('config.json', JSON.stringify(config, null, 4))
}

function upload() {
    if(config[selectedRegion].widget_json && config[selectedRegion].widget_json.id) {
        // Needs to be two commands due to the first and second curls
        // having different data bodies
        api('/api/storage/archive/' + config[selectedRegion].widget_json.id, false, 'put', 'x-tgz')
    } else {
        console.log('Run setup first')
    }
}

function submit() {
    if(config[selectedRegion].app_json && config[selectedRegion].app_json.id) {
        api('/api/apps/' + config[selectedRegion].app_json.id + '/submit', false, 'post')
    } else {
        console.log('You don\'t appear to have an app id')
    }
}

function approve() {
    if(config[selectedRegion].app_json && config[selectedRegion].app_json.id) {
        api('/api/apps/' + config[selectedRegion].app_json.id + '/approve', false,
            'post')
    } else {
        console.log('You don\'t appear to have an app id')
    }
}

const commands = {
    config: setConfig,
    setup,
    update,
    upload,
    submit,
    approve,
    help: require('./commands/help'),
}

commands[command]()
