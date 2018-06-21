module.exports = deleteWidget

/**
 * Uploads widget for approval via HTTP endpoint based on configuration file
 *
 * @param  {[function]} api api client
 * @param  {[object]} config configuration file's data
 * @param  {[string]} region region to filter the configuration file
 */
function deleteWidget(api, config, region) {

    this.logger.info('Yo my maaaan!')
/*
    const hasAppId =
        config[region].app_json && config[region].app_json.id
    const hasWidgetId =
        config[region].widget_json && config[region].widget_json.id

    if (!hasWidgetId || hasAppId) {
        this.logger.error('Please run setup first - app or widget ID is missing!')
        process.exit(1)
    }

    const idApp = config[region].widget_json.id
    const idWidget = config[region].widget_json.id
    // let widget = config[region].app_json_json

    const bucket = { type: 'public' }

    
    Promise.resolve()
        .then(() => updateWidget(this.logger, api, widget))
        .then(() => api(`/api/storage/buckets/${id}`, bucket, 'put'))
        .then(res => {
            this.logger.debug('Bucket updated')
            this.logger.debug(res)
            return api(`/api/storage/archive/${id}`, false, 'put', 'x-tgz')
        })
        .then(res => {
            this.logger.debug('Archive updated')
            this.logger.debug(res)
            this.logger.info('Widget uploaded successfully')
        })
        .catch(err => {
            this.logger.error('Unable to upload widget:', err)
            process.exit(1)
        })
    */
}

function updateWidget(logger, api, widget) {
    return new Promise((resolve, reject) => {
        const id = widget.id
        delete widget.id
        logger.debug(`Uploading widget with following configuration: ${widget}`)
        return api(`/api/apps/widgets/${id}`, widget, 'put')
            .then(res => {
                logger.debug(res)
                logger.info('Widget config updated successfully')
                resolve()
            })
            .catch(err => reject(err))
    })
}

function deleteBucket(logger, api, id) {

}

function deleteWidget(logger, api, id) {
    
}

function deleteApp(logger, api, id) {

}



