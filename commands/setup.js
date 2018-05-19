const argv = require('minimist')(process.argv.slice(2))
const async = require('async')
const fs = require('fs')
const readline = require('readline')
const stripFields = require('../utils/strip-fields').default

module.exports = (config, region, defaults) => {
    const hasSettings = !Object.keys(config).length || !config[region]
    if (hasSettings) {
        console.error('Config already has settings')
        process.exit(1)
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    let name
    let description

    async.series(
        [
            callback => {
                rl.question('App/Widget name: ', function(input) {
                    name = input
                    callback()
                })
            },
            callback => {
                rl.question('App/Widget description: ', function(input) {
                    description = input
                    callback()
                })
            }
        ],
        () => {
            const widgetID = config[region].widget_json.id
            const url = `/api/apps/widgets/${widgetID}`
            const marketplacePayload = {
                type: 'marketplace',
                source: `/cmp/api/storage/buckets/${widgetID}/${defaults.entry}`
            }
            const payload = Object.assign(
                {},
                defaults.widget,
                marketplacePayload
            )

            config[region] = {}
            config[region].app_json = JSON.parse(api(url, payload, 'put'))
            config[region].widget_json.id = widgetID

            stripFields(config[region].widget_json)

            fs.writeFileSync('config.json', JSON.stringify(config, null, 4))
            rl.close()
        }
    )
}
