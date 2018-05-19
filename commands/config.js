const { settingsPath } = require('../constants/defaults')
const argv = require('minimist')(process.argv.slice(2))
const async = require('async')
const fs = require('fs')
const getFile = require('../utils/get-file')
const readline = require('readline')

module.exports = () => {
    const isInstalledGlobally = isGlobal || (argv.f || argv.force)
    if (!isInstalledGlobally) {
        console.warn(
            `Toter is not installed globally, running this command 
            will create or add to the ".toter.json" settings file 
            in this directory. If you are sure you want to store 
            settings in your project please make sure you .gitignore
            ".toter.json" file. Otherwise, run "npm uninstall toter" 
            in this directory and reinstall it with the -g flag`
        )
        process.exit(1)
    }

    const usingFlags =
        (argv.u || argv.url) && (argv.k || argv.key) && (argv.s || argv.secret)

    if (usingFlags) {
        generateConfigWithFlags(settingsPath)
    } else {
        generateConfigWithoutFlags()
    }
}

function generateConfigWithFlags(settingsPath) {
    const settings = getFile(settingsPath)
    const hasRegions = settings.regions || Object.keys(settings.regions).length

    if (!hasRegions) {
        console.warn(`Settings file at ${settingsPath} has no regions`)
        settings.regions = {}
    }

    settings.regions[argv.n || 'default'] = {
        region: argv.u || argv.url,
        key: argv.k || argv.key,
        secret: argv.s || argv.secret
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), {
        flag: 'w'
    })
}

function generateConfigWithoutFlags() {
    const settings = require(settingsPath)
    const hasRegions = settings.regions || Object.keys(settings.regions).length

    if (!hasRegions) {
        console.warn(`Settings file at ${settingsPath} has no regions`)
        settings.regions = {}
    }

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
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), {
                flag: 'w'
            })
            rl.close()
        }
    )
}
