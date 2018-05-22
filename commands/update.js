const { writeFileSync } = require('fs')
const stripFields = require('./../utils/strip-fields')

module.exports = update

function update(api, config, region) {
    const hasWidgetId =
        config[region].widget_json && config[region].widget_json.id
    if (!hasWidgetId) {
        console.error('Please run setup first - widget has no ID')
        process.exit(1)
    }

    api('/api/apps', config[region].app_json)
        .then(res =>
            console.info(`Widget updated successfully: ${JSON.stringify(res)}`)
        )
        .catch(err => {
            console.error(`Unable to update widget: ${JSON.stringify(err)}`)
            process.exit(1)
        })

    stripFields(config[region].app_json)
    writeFileSync('config.json', JSON.stringify(config, null, 4))
}
