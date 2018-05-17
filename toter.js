#!/usr/bin/env node

const workingDir     = process.env.PWD
const argv           = require('minimist')(process.argv.slice(2))
const { execSync }   = require('child_process')
const fs             = require('fs')
const readline       = require('readline')
const async          = require('async')
const isGlobal       = require('is-installed-globally')
const settingsPath   = isGlobal ? getUserHome() + '/.toter.json' : '/.toter.json'
const widgetDefaults = {
    minx: 4,
    miny: 4,
    sizex: 7,
    sizey: 7,
    icon: 'html'
}

let config
try {
    config = require(process.env.PWD + '/config.json')
} catch(e) {
    config = {}
}

let settings
try {
    settings = require(settingsPath)
} catch(e) {
    settings = {}
}

const originalConfig = JSON.stringify(config, null, 4)
const command        = argv._[0] || 'help'
const entry          = 'index.html'
const folder         = 'dist'
let setupError       = false
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

function isIP(url) {
    const urlArray = url.split('.')
    if(urlArray.length !== 4) {
        return false
    }

    return !!urlArray.filter((piece) => Number.isInteger(Number(piece))).length
}

if(!['help', 'config'].includes(command)) {
    if(settings && !settings.regions) {
        console.log('Please run config')
        setupError = true
    } else {
        selectedRegion = argv.r || argv.region || 'default'
        key    = settings.regions[selectedRegion].key
        secret = settings.regions[selectedRegion].secret
        region = settings.regions[selectedRegion].region

        if(!key || !secret) {
            console.log('Please add a key and secret to your setting file')
            setupError = true
        }
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

if(setupError) {
    process.exit(1)
}

function getUserHome() {
    return process.env.HOME || process.env.USERPROFILE
}

function stripFields(thing) {
    Object.keys(thing).forEach((key) => {
        if(strippedFields.includes(key)) {
            delete thing[key]
        }
    })
}

function curlHelper(api, data, method = 'post', contentType = 'json') {
    const tar1 = (contentType === 'x-tgz') ? 'COPYFILE_DISABLE=1 tar -zvC ' + folder + ' -c . | ' : ''
    const tar2 = (contentType === 'x-tgz') ? '-T -' : ''
    const dataString = (data) ? '-d \'' + JSON.stringify(data) + '\'' : ''
    const secureString = isIP(region) ? '-k ': ''

    return execSync(
        tar1 +
        'curl -u ' + key + ':' + secret + ' ' +
        'https://' + region + '/cmp/basic' + api + ' ' + secureString +
        '-X ' + method.toUpperCase() + ' ' +
        '-H "Content-Type:application/' + contentType + '" ' +
        dataString +
        tar2
    ).toString('utf8')
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
        console.warn('Toter is not installed globally, running this command will create or' +
            ' add to the ".toter.json" settings file in this directory. If you are sure you' +
            ' want to store settings in your project please make sure you .gitignore' +
            ' ".toter.json" file. Otherwise, run "npm uninstall toter" in this directory' +
            ' and reinstall it with the -g flag')
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
            config[selectedRegion].app_json = JSON.parse(curlHelper('/api/apps', {
                name: name,
                description: description
            }))

            stripFields(config[selectedRegion].app_json)

            // TODO: Deal with errors nicely
            config[selectedRegion].widget_json = JSON.parse(curlHelper('/api/apps/widgets', Object.assign({}, widgetDefaults, setupDetails, config[selectedRegion].widget_json, {
                app_id: config[selectedRegion].app_json.id,
                type: 'marketplace',
                source: 'test'
            })))

            stripFields(config[selectedRegion].widget_json)
            const widgetID = config[selectedRegion].widget_json.id
            delete config[selectedRegion].widget_json.id

            curlHelper('/api/storage/buckets/' + config[selectedRegion].widget_json.id, {
                type: 'public'
            }, 'put')

            config[selectedRegion].widget_json = JSON.parse(curlHelper('/api/apps/widgets/' + widgetID, Object.assign({}, widgetDefaults, config[selectedRegion].widget_json, {
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
        let curlData = curlHelper('/api/apps/widgets/' + config[selectedRegion].widget_json.id, curlObj, 'put')
        config[selectedRegion].widget_json = Object.assign({id: widgetID}, JSON.parse(curlData))
        stripFields(config[selectedRegion].widget_json)
    }

    if(!config[selectedRegion].app_json || config[selectedRegion].app_json && !config[selectedRegion].app_json.id) {
        console.log('Please run setup first - app has no ID')
    } else {
        config[selectedRegion].app_json = JSON.parse(curlHelper('/api/apps', config[selectedRegion].app_json))

        stripFields(config[selectedRegion].app_json)
    }
    fs.writeFileSync('config.json', JSON.stringify(config, null, 4))
}

function upload() {
    if(config[selectedRegion].widget_json && config[selectedRegion].widget_json.id) {
        // Needs to be two commands due to the first and second curls
        // having different data bodies
        curlHelper('/api/storage/buckets/' + config[selectedRegion].widget_json.id, {
            type: 'public'
        }, 'put')
        curlHelper('/api/storage/archive/' + config[selectedRegion].widget_json.id, false, 'put', 'x-tgz')
    } else {
        console.log('Run setup first')
    }
}

function submit() {
    if(config[selectedRegion].app_json && config[selectedRegion].app_json.id) {
        curlHelper('/api/apps/' + config[selectedRegion].app_json.id + '/submit', false, 'post')
    } else {
        console.log('You don\'t appear to have an app id')
    }
}

function approve() {
    if(config[selectedRegion].app_json && config[selectedRegion].app_json.id) {
        curlHelper('/api/apps/' + config[selectedRegion].app_json.id + '/approve', false,
            'post')
    } else {
        console.log('You don\'t appear to have an app id')
    }
}

function help() {
    console.log([
        'usage: toter [command] [options]',
        '',
        'commands:',
        '  config            Configure toter with your auth credentials',
        '    -u --url        Set the region url',
        '    -k --key        Set the key',
        '    -s --secret     Set the secret',
        '    -n --new        Set the region name - used to specify different regions',
        '  setup             Setup your repository as a Marketplace widget',
        '  upload            Upload the contents of your dist/ folder to StormDrive',
        '  submit            Submit your widget for review',
        '  help              Print this list and exit',
        '',
        'options:',
        '  -r --region      Region to use other than default',
        ''
    ].join('\n'))
    process.exit()
}

const commands = {
    config: setConfig,
    setup,
    update,
    upload,
    submit,
    approve,
    help,
}

commands[command]()
