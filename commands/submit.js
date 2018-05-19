const api = require('../api/api')

module.exports = (config, region) => {
    console.log(region)
    const hasAppId = config[region].app_json && config[region].app_json.id
    if (!hasAppId) {
        console.error('App ID required in config.json')
        process.exit(1)
    }

    const appId = config[region].app_json.id
    const url = `/api/apps/${appId}`

    api(url, false, region)
        .then(res => console.info(`Widget submitted successfully: ${res}`))
        .catch(err => {
            console.error(`Unable to submit widget: ${err.error}`)
            process.exit(1)
        })
}
