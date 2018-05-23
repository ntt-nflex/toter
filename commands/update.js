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

    Promise.resolve()
        .then(() => updateApp(api, config[region].app_json))
        .then(res => {
            config[region].app_json = stripFields(res)
            writeFileSync('config.json', JSON.stringify(config, null, 4))

            console.info('Widget updated successfully')
        })
        .catch(err => {
            console.error(`Unable to update widget: ${JSON.stringify(err)}`)
            process.exit(1)
        })
}

function updateApp(api, app) {
    return new Promise((resolve, reject) => {
        api('/api/apps', app)
            .then(res => resolve(res))
            .catch(err => reject(err))
    })
}
