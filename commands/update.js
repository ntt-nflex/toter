const { writeFileSync } = require('fs')
const stripFields = require('./../utils/strip-fields')

module.exports = update

/**
 * Updates widget via HTTP endpoint based on configuration file
 *
 * @param  {[function]} api api client
 * @param  {[object]} config configuration file's data
 * @param  {[string]} region region to filter the configuration file
 */
function update(api, config, region) {
    const hasWidgetId =
        config[region].widget_json && config[region].widget_json.id
    if (!hasWidgetId) {
        this.logger.error('Please run setup first - widget has no ID')
        process.exit(1)
    }

    const app = config[region].app_json

    Promise.resolve()
        .then(() => api('/api/apps', app))
        .then(res => {
            config[region].app_json = stripFields(res)
            writeFileSync('config.json', JSON.stringify(config, null, 4))

            this.logger.info('Widget updated successfully')
            this.logger.debug(res)
        })
        .catch(err => {
            this.logger.error(`Unable to update widget: ${JSON.stringify(err)}`)
            process.exit(1)
        })
}
