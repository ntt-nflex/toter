module.exports = upload

/**
 * Uploads widget for approval via HTTP endpoint based on configuration file
 *
 * @param  {[function]} api api client
 * @param  {[object]} config configuration file's data
 * @param  {[string]} region region to filter the configuration file
 */
function upload(api, config, region) {
    const hasWidgetId =
        config[region].widget_json && config[region].widget_json.id
    if (!hasWidgetId) {
        this.logger.error('Please run setup first - widget has no ID')
        process.exit(1)
    }

    const id = config[region].widget_json.id
    const bucket = { type: 'public' }

    Promise.resolve()
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
}
