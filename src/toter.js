#!/usr/bin/env node
const argv = require('minimist')(process.argv.slice(2))
const defaults = require('./constants/defaults')
const getFile = require('./utils/get-file')
const isEmpty = require('./utils/empty-file')

const command = argv._[0] || 'help'
let region = argv.r || argv.region || defaults.region

const verbose = argv.v || argv.verbose

// logger is essentially a wrapper around console that
// only prints debug only if verbose flag is active
let logger = console
if (!verbose) {
    logger.debug = () => {}
}

// only config and help commands do not require config.json
// in order to be executed as intended

const commandsWithoutConfig = ['config', 'help', 'setup']

let api, config

if (!commandsWithoutConfig.includes(command)) {
    
    config = getFile(defaults.configPath)

    if ((!config || isEmpty(config)) && command !== 'remove') {

        logger.info('You have to create a config file first.')

        require('./commands/setup').bind(
            { logger },
            region,
            defaults
        )()

        return;
    }

    if(config.hasOwnProperty('region') &&
    region === defaults.region) {

        region = config.region
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

const approveCommand = require('./commands/approve').bind(
    { logger },
    api,
    config,
    region
)

const configCommand = require('./commands/config').bind(
    { logger },
    defaults.settingsPath
)

const helpCommand = require('./commands/help').bind({ logger })

const setupCommand = require('./commands/setup').bind(
    { logger },
    region,
    defaults
)

const submitCommand = require('./commands/submit').bind(
    { logger },
    api,
    config,
    region
)

const updateCommand = require('./commands/update').bind(
    {
        logger,
        onForce: () => {
            Promise.resolve()
                .then(() => submitCommand())
                .then(() => approveCommand())
        }
    },
    api,
    config,
    region,
    defaults
)

const removeCommand = require('./commands/remove').bind(
    { logger },
    api,
    config,
    region
)

const commands = {
    approve: approveCommand,
    config: configCommand,
    help: helpCommand,
    setup: setupCommand,
    submit: submitCommand,
    update: updateCommand,
    remove: removeCommand
}

// run the command
commands[command]()
