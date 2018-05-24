const { writeFileSync } = require('fs')
const argv = require('minimist')(process.argv.slice(2))
const async = require('async')
const getFile = require('./../utils/get-file')
const readline = require('readline')

module.exports = config

/**
 * Sets up global settings file
 *
 * @param  {[string]} settingsPath path to configuration file
 */
function config(settingsPath) {
    const usingFlags =
        (argv.u || argv.url) && (argv.k || argv.key) && (argv.s || argv.secret)

    const settings = getFile(settingsPath)
    if (!settings) {
        this.logger.error('No settings file found at', settingsPath)
        process.exit(1)
    }

    const hasRegions = settings.regions || Object.keys(settings.regions).length
    if (!hasRegions) {
        this.logger.warn(`Settings file at ${settingsPath} has no regions`)
        settings.regions = {}
    }

    if (usingFlags) {
        generateConfigWithFlags(settings, settingsPath)
    } else {
        generateConfigWithoutFlags(settings, settingsPath)
    }
}

function generateConfigWithFlags(settings, settingsPath) {
    settings.regions[argv.n || 'default'] = {
        region: argv.u || argv.url,
        key: argv.k || argv.key,
        secret: argv.s || argv.secret
    }

    writeFileSync(settingsPath, JSON.stringify(settings, null, 4), {
        flag: 'w'
    })
}

function generateConfigWithoutFlags(settings, settingsPath) {
    // set the defaults
    let regionName = 'default'
    let region = {
        region: 'core-cmp.nflex.io',
        key: null,
        secret: null
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    async.series(
        [
            callback => {
                rl.question(
                    'Region name (default is "default", leave blank if unsure): ',
                    function(input) {
                        if (input) {
                            regionName = input
                        }
                        callback()
                    }
                )
            },
            callback => {
                rl.question(
                    'CMP URL (default is "core-cmp.nflex.io"): ',
                    function(input) {
                        if (input) {
                            region.region = input
                        }
                        callback()
                    }
                )
            },
            callback => {
                rl.question('CMP API Key: ', function(input) {
                    region.key = input
                    callback()
                })
            },
            callback => {
                rl.question('CMP API Secret: ', function(input) {
                    region.secret = input
                    callback()
                })
            }
        ],
        () => {
            settings.regions[regionName] = region
            writeFileSync(settingsPath, JSON.stringify(settings, null, 4), {
                flag: 'w'
            })
            rl.close()
        }
    )
}
