module.exports = approve

function approve(api, config, region) {
    const hasAppId = config[region].app_json && config[region].app_json.id
    if (!hasAppId) {
        console.error('App ID required in config.json')
        process.exit(1)
    }

    const appId = config[region].app_json.id

    Promise.resolve()
        .then(() => approveApp(api, appId))
        .then(() => console.info('Widget approved successfully'))
        .catch(err => {
            console.error('Unable to approve widget:', err)
            process.exit(1)
        })
}

function approveApp(api, id) {
    return new Promise((resolve, reject) => {
        api(`/api/apps/${id}/approve`)
            .then(() => resolve())
            .catch(err => reject(err))
    })
}
