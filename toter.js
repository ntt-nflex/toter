#!/usr/bin/env node

const workingDir     = process.env.PWD
const argv           = require('minimist')(process.argv.slice(2));
const { execSync }   = require('child_process')
const fs             = require('fs');
const readline       = require('readline');
const async          = require('async');
const settingsPath   = getUserHome() + '/.toter.json'

let config
try {
    config = require(process.env.PWD + '/config.json')
} catch(e) {
    config = {}
}

let settings
try {
    settings = require(settingsPath);
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
let widgetDefaults

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

if(!['help', 'config'].includes(command)) {
    if(settings && !settings.regions) {
        console.log('Please run config')
        setupError = true
    } else {
        let selectedRegion = argv.r || argv.region || 'default'
        key    = settings.regions[selectedRegion].key
        secret = settings.regions[selectedRegion].secret
        region = settings.regions[selectedRegion].region

        if(!key || !secret) {
            console.log('Please add a key and secret to your setting file')
            setupError = true
        }
    }
}

if(setupError) {
    process.exit(1)
}

function getUserHome() {
    return process.env.HOME || process.env.USERPROFILE;
}

function stripFields(thing) {
    Object.keys(thing).forEach((key) => {
        if(strippedFields.includes(key)) {
            delete thing[key]
        }
    })
}

function curlHelper(api, data, method = 'post', contentType = 'json') {
    const tar1 = (contentType === 'x-tar') ? 'tar -vC ' + folder + ' -c . | ' : ''
    const tar2 = (contentType === 'x-tar') ? '-T -' : ''
    const dataString = (data) ? '-d \'' + JSON.stringify(data) + '\'' : ''
    const secureString = region.split('.').length === 4 ? '-k ': ''

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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

switch(command) {
    case 'config':
        let newRegion = {}

        if(!Object.keys(settings).length || !settings.regions || !Object.keys(settings.regions).length) {
            settings.regions = {}
        }

        async.series([
            (callback) => {
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
            settings.regions.default = newRegion
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), {flag: 'w'})
            rl.close()
        })
        break;
    case 'setup':
        if(!Object.keys(config).length) {
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
                widgetDefaults = {
                    title: name,
                    description: description,
                    minx: 4,
                    miny: 4,
                    sizex: 7,
                    sizey: 7,
                    icon: 'html'
                }

                // TODO: Deal with errors nicely
                config.app_json = JSON.parse(curlHelper('/api/apps', {
                    name: name,
                    description: description
                }))

                stripFields(config.app_json)

                // TODO: Deal with errors nicely
                config.widget_json = JSON.parse(curlHelper('/api/apps/widgets', Object.assign({}, widgetDefaults, config.widget_json, {
                    app_id: config.app_json.id,
                    type: 'marketplace',
                    source: 'test'
                })))

                curlHelper('/api/storage/buckets/' + config.widget_json.id, {
                    type: 'public'
                }, 'put')

                config.widget_json.source = JSON.parse(curlHelper('/api/apps/widgets/' + config.widget_json.id, Object.assign({}, widgetDefaults, config.widget_json, {
                    app_id: config.app_json.id,
                    type: 'marketplace',
                    source: '/cmp/api/storage/buckets/' + config.widget_json.id + '/' + entry
                }), 'put')).source

                stripFields(config.widget_json)

                fs.writeFileSync('config.json', JSON.stringify(config, null, 4))
                rl.close()
            })
        } else {
            console.log('Cannot setup - config contains settings already')
        }
        break;
    case 'update':
        if(!config.widget_json || config.widget_json && !config.widget_json.id) {
            console.log('Please run setup first - widget has no ID')
        } else {
            let curlObj = Object.assign({}, widgetDefaults, config.widget_json, {
                type: 'marketplace',
                source: '/cmp/api/storage/buckets/' + config.widget_json.id + '/' + entry
            });

            let widgetID = curlObj.id;
            delete curlObj.id;
            let curlData = curlHelper('/api/apps/widgets/' + config.widget_json.id, curlObj, 'put');
            config.widget_json = Object.assign({id: widgetID}, JSON.parse(curlData));
            stripFields(config.widget_json)
        }

        if(!config.app_json || config.app_json && !config.app_json.id) {
            console.log('Please run setup first - app has no ID')
        } else {
            config.app_json = JSON.parse(curlHelper('/api/apps', config.app_json))

            stripFields(config.app_json)
        }
        fs.writeFileSync('config.json', JSON.stringify(config, null, 4))
        break;
    case 'upload':
        if(config.widget_json && config.widget_json.id) {
            // Needs to be two commands due to the first and second curls
            // having different data bodies
            curlHelper('/api/storage/buckets/' + config.widget_json.id, {
                type: 'public'
            }, 'put')
            curlHelper('/api/storage/archive/' + config.widget_json.id, false, 'put', 'x-tar')
        } else {
            console.log('Run setup first')
        }
        break;
    case 'submit':
        if(config.app_json && config.app_json.id) {
            curlHelper('/api/apps/' + config.app_json.id + '/submit', false,
                'post')
        } else {
            console.log('You don\'t appear to have an app id')
        }
        break;
    case 'approve':
        if(config.app_json && config.app_json.id) {
            curlHelper('/api/apps/' + config.app_json.id + '/approve', false,
                'post')
        } else {
            console.log('You don\'t appear to have an app id')
        }
        break;
    case 'help':
    default:
        console.log([
            'usage: toter [command] [options]',
            '',
            'commands:',
            '  config       Configure toter with your auth credentials',
            '  setup        Setup your repository as a Marketplace widget',
            '  upload       Upload the contents of your dist/ folder to StormDrive',
            '  submit       Submit your widget for review',
            '  help         Print this list and exit',
            '',
            // 'options:',
            // '  -r --region  Region to use other than default',
            // ''
        ].join('\n'));
        process.exit();
        break;
}
process.exit();
