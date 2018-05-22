module.exports = upload

function upload(api, config, region) {
    const hasWidgetId =
        config[region].widget_json && config[region].widget_json.id
    if (!hasWidgetId) {
        console.error('Please run setup first - widget has no ID')
        process.exit(1)
    }

    const widgetId = config[region].widget_json.id
    const url = `/api/storage/archive/${widgetId}`

    api(url, false, region, 'put', 'x-tgz')
        .then(res =>
            console.info(`Widget uploaded successfully: ${JSON.stringify(res)}`)
        )
        .catch(err => {
            console.error(`Unable to upload widget: ${JSON.stringify(err)}`)
            process.exit(1)
        })
}
