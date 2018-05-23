module.exports = submit

function submit(api, config, region) {
    const hasAppId = config[region].app_json && config[region].app_json.id
    if (!hasAppId) {
        console.error('App ID required in config.json')
        process.exit(1)
    }

    const appId = config[region].app_json.id

    Promise.resolve()
        .then(() => submitApp(api, appId))
        .then(() => console.info('Widget submitted successfully'))
        .catch(err => {
            console.error('Unable to submit widget', err)
            process.exit(1)
        })
}

function submitApp(api, id) {
    return new Promise((resolve, reject) => {
        api(`/api/apps/${id}/submit`)
            .then(() => resolve())
            .catch(err => reject(err))
    })
}
