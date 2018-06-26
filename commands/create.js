const async = require('async')
const { writeFileSync } = require('fs')
const readline = require('readline')

module.exports = createConfig

function createConfig(defaults, region) {
    
    let config = {};
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    async.series(
        [
            callback => {

                if(region !== defaults.region) {

                    config[defaults.region] = {
                        defaultRegion: region
                    }

                    config[region] = {
                        app_json: {
                            distribution: ['all']
                        },
                        widget_json: {
                            use_public_widget: true
                        }
                    }
                    
                    callback()
                }

                rl.question(
                    `Which region do you want to use? (default one is ${region})`,
                    function(input) {

                        let newRegion = input.trim()

                        if(!input) {

                            newRegion = region
                        } else {

                            config[region] = {
                                defaultRegion: newRegion
                            }
                        }

                        config[newRegion] = {
                            app_json: {
                                distribution: ['all']
                            },
                            widget_json: {
                                use_public_widget: true
                            }
                        }
                        
                        callback()
                    }
                )
            }
        ],() => {
            writeFileSync('config.json', JSON.stringify(config, null, 4))
            console.info('Created a config.json!')
            rl.close()
            // rl.close()
        }
    )

    return config;
}
