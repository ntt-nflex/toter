module.exports = approve

/**
 * Approves widget via HTTP endpoint based on configuration file
 *
 * @param  {function} api api client
 * @param  {object} config configuration file's data
 * @param  {string} region region to filter the configuration file
 */
function approve(api, config, region) {
    const hasAppId = config[region].app_json && config[region].app_json.id
    if (!hasAppId) {
        this.logger.error('App ID required in config.json')
        process.exit(1)
    }

    const id = config[region].app_json.id

    Promise.resolve()
        .then(() => api(`/api/apps/${id}/approve`))
        .then(res => {
            this.logger.debug(res)
            this.logger.info('Widget approved successfully')
        })
        .catch(err => {
            this.logger.error('Unable to approve widget:', err)
            process.exit(1)
        })
}
