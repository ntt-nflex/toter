#!/usr/bin/env node

const { writeFileSync } = require('fs')
const argv = require('minimist')(process.argv.slice(2))
const defaults = require('./constants/defaults')
const getFile = require('./utils/get-file')

const command = argv._[0] || 'help'

// only config and help commands do not require config.json
// in order to be executed as intended
const commandsWithoutConfig = ['config', 'help']

let config
if (commandsWithoutConfig.includes(command)) {
    config = getFile(`${process.env.PWD}/config.json`)

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
}

const region = argv.r || argv.region || defaults.region
const commands = {
    approve: require('./commands/approve').bind(null, config, region),
    config: require('./commands/config'),
    help: require('./commands/help'),
    setup: require('./commands/setup').bind(null, config, region, defaults),
    submit: require('./commands/submit').bind(null, config, region),
    update: require('./commands/update').bind(null, config, region),
    upload: require('./commands/upload').bind(null, config, region)
}

// run the command
commands[command]()
