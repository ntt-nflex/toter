module.exports = approve

function approve(api, config, region) {
    const hasAppId = config[region].app_json && config[region].app_json.id
    if (!hasAppId) {
        console.error('App ID required in config.json')
        process.exit(1)
    }
    const appId = config[region].app_json.id
    const url = `/api/apps/${appId}/approve`

    api(url)
        .then(res =>
            console.info(`Widget approved successfully: ${JSON.stringify(res)}`)
        )
        .catch(err => {
            console.error(`Unable to approve widget: ${JSON.stringify(err)}`)
            process.exit(1)
        })
}
