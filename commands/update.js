const stripFields = require('../utils/strip-fields').default

module.exports = (config, region) => {
    const hasWidgetId =
        config[region].widget_json && config[region].widget_json.id
    if (!hasWidgetId) {
        console.error('Please run setup first - widget has no ID')
        process.exit(1)
    }

    api('/api/apps', config[region].app_json)
        .then(res => console.info(`Widget updated successfully: ${res}`))
        .catch(err => {
            console.error(`Unable to update widget: ${err.error}`)
            process.exit(1)
        })

    stripFields(config[region].app_json)
    fs.writeFileSync('config.json', JSON.stringify(config, null, 4))
}
