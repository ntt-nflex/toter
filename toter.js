#!/usr/bin/env node

const { writeFileSync } = require('fs')
const argv = require('minimist')(process.argv.slice(2))
const defaults = require('./constants/defaults')
const getFile = require('./utils/get-file')

const config = getFile(`${process.env.PWD}/config.json`)

// TODO: This is a migration script, remove in a few versions time
if (config.app_json || config.widget_json) {
    config = {
        default: {
            app_json: config.app_json,
            widget_json: config.widget_json
        }
    }
    writeFileSync('config.json', JSON.stringify(config, null, 4))
}

const selectedRegion = argv.r || argv.region || 'default'

const commands = {
    approve: require('./commands/approve')(config, selectedRegion),
    config: require('./commands/config'),
    help: require('./commands/help'),
    setup: require('./commands/setup')(config, selectedRegion, defaults),
    submit: require('./commands/submit')(config, selectedRegion),
    update: require('./commands/update')(config, selectedRegion),
    upload: require('./commands/upload')(config, selectedRegion)
}

const command = argv._[0] || 'help'

// run the command
commands[command]()
