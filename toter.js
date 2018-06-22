#!/usr/bin/env node

const { writeFileSync } = require('fs')
const argv = require('minimist')(process.argv.slice(2))
const defaults = require('./constants/defaults')
const getFile = require('./utils/get-file')

const command = argv._[0] || 'help'
const region = argv.r || argv.region || defaults.region

const verbose = argv.v || argv.verbose

// logger is essentially a wrapper around console that
// only prints debug only if verbose flag is active
let logger = console
if (!verbose) {
    logger.debug = () => {}
}

// only config and help commands do not require config.json
// in order to be executed as intended

const commandsWithoutConfig = ['config', 'help' ]

let api, config
if (!commandsWithoutConfig.includes(command)) {
    const defaultConfig = {
        default: {
            app_json: {
                distribution: ['all']
            },
            widget_json: {
                use_public_widget: true
            }
        }
    }

    config = getFile(defaults.configPath) || defaultConfig

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

    const settings = getFile(defaults.settingsPath)
    if (!settings) {
        console.error('No settings file found at', defaults.settingsPath)
        process.exit(1)
    }
    const credentials = require('./utils/credentials')(settings, region)

    // inject the bare minimum properties required for api to work
    // since properties such as credentials use file IO so it should
    // only be done once

    api = require('./api/api').bind({
        credentials: credentials,
        folder: defaults.folder,
        logger: logger
    })
} 

const commands = {
    approve: require('./commands/approve').bind(
        { logger },
        api,
        config,
        region
    ),
    config: require('./commands/config').bind(
        { logger },
        defaults.settingsPath
    ),
    help: require('./commands/help').bind({ logger }),
    setup: require('./commands/setup').bind(
        { logger },
        api,
        config,
        region,
        defaults
    ),
    submit: require('./commands/submit').bind({ logger }, api, config, region),
    update: require('./commands/update').bind({ logger }, api, config, region),
    upload: require('./commands/upload').bind(
        { logger },
        api,
        defaults.configPath,
        region
    ),
    remove: require('./commands/remove').bind(
        { logger },
        api,
        config,
        region
    )
}

// run the command
commands[command]()
