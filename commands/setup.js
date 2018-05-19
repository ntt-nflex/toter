const api = require('../api/api')
const async = require('async')
const fs = require('fs')
const readline = require('readline')
const stripFields = require('../utils/strip-fields').default

module.exports = (config, region, defaults) => {
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

            api(url, payload, region, 'put')
                .then(res => {
                    console.info(`Widget created successfully`)

                    config[region].app_json = res
                    config[region].widget_json.id = widgetID

                    stripFields(config[region].widget_json)
                    fs.writeFileSync(
                        'config.json',
                        JSON.stringify(config, null, 4)
                    )
                })
                .catch(err => {
                    console.error(`Unable to create widget: ${err.error}`)
                    process.exit(1)
                })
                .then(() => {
                    rl.close()
                })
        }
    )
}
