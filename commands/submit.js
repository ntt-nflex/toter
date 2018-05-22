module.exports = submit

function submit(api, config, region) {
    const hasAppId = config[region].app_json && config[region].app_json.id
    if (!hasAppId) {
        console.error('App ID required in config.json')
        process.exit(1)
    }

    const appId = config[region].app_json.id
    const url = `/api/apps/${appId}`

    api(url, false, region)
        .then(res =>
            console.info(
                `Widget submitted successfully: ${JSON.stringify(res)}`
            )
        )
        .catch(err => {
            console.error(`Unable to submit widget: ${JSON.stringify(err)}`)
            process.exit(1)
        })
}
