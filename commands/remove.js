const argv = require('minimist')(process.argv.slice(2))

module.exports = remove

/**
 * Deletes app, widget and bucket via HTTP endpoint
 * based on configuration file or ids given in the 
 * cli : --idApp or -a for the id of the app and
 * --idWidget or -w for the id of the widget
 *
 * @param  {[function]} api api client
 * @param  {[object]} config configuration file's data
 * @param  {[string]} region region to filter the configuration file
 */
function remove(api, config, region) {

    let idApp = argv.idApp || argv.a;
    let idWidget = argv.idWidget || argv.w;

    if( !idApp && !idWidget ) {

        const hasAppId =
            config[region].app_json && config[region].app_json.id
        const hasWidgetId =
            config[region].widget_json && config[region].widget_json.id

        if (!hasWidgetId || !hasAppId) {
            this.logger.error('Please run setup first - app or widget ID is missing!')
            process.exit(1)
        }
        
        idApp = config[region].app_json.id
        idWidget = config[region].widget_json.id
    }

    idApp = idApp.trim()
    idWidget = idWidget.trim()

    removeProcess(this.logger, idApp, idWidget, api)
}

function removeProcess(logger, idApp, idWidget, api) {

    Promise.resolve()
        .then(() => removeBucket(logger, api, idWidget))
        .then(() => removeWidget(logger, api, idWidget))
        .then(() => removeApp(logger, api, idApp))
        .then(() => logger.info('Widget deleted successfully!'))
        .catch( err => {
            logger.error('Unable to delete the widget:', err)
            process.exit(1)
        })
}

function removeBucket(logger, api, id) {

    logger.debug('--- Deleting bucket ---')

    return new Promise((resolve, reject) => {

        api(`/api/storage/buckets/${id}?force=true`, false, 'delete')
            .then(() => {
                
                resolve()
            })
            .catch(res => {
                if (res.error_code !== 404) {
                    reject(res)
                } else {
                    logger.debug('Widget not found. Already deleted?')
                    resolve()
                }
            })
    })
}

function removeWidget(logger, api, id) {

    logger.debug('--- Deleting widget ---')

    return new Promise((resolve, reject) => {

        api(`/api/apps/widgets/${id}`, false, 'delete')
            .then(() => {
                resolve()
            })
            .catch(res => {
                if (res.error_code !== 404) {
                    reject(res)
                } else {
                    logger.debug('Widget not found. Already deleted?')
                    resolve()
                }
            })
    })
}

function removeApp(logger, api, id) {

    logger.debug('--- Deleting app ---')

    return new Promise((resolve, reject) => {
        api(`/api/apps/${id}`, false, 'delete')
            .then(() => {
                
                resolve()
            })
            .catch(res => {
                if (res.error_code !== 404) {
                    reject(res)
                } else {
                    logger.debug('App not found. Already deleted?')
                    resolve()
                }
            })
    })
}
