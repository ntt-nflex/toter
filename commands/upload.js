module.exports = upload

function upload(api, config, region) {
    const hasWidgetId =
        config[region].widget_json && config[region].widget_json.id
    if (!hasWidgetId) {
        console.error('Please run setup first - widget has no ID')
        process.exit(1)
    }

    const widgetId = config[region].widget_json.id

    Promise.resolve()
        .then(() => createBucket(api, widgetId))
        .then(() => createArchive(api, widgetId))
        .then(() => console.info('Widget uploaded successfully'))
        .catch(err => {
            console.error('Unable to upload widget:', err)
            process.exit(1)
        })
}

function createBucket(api, id) {
    const bucket = { type: 'public' }
    return new Promise((resolve, reject) => {
        api(`/api/storage/buckets/${id}`, bucket, 'put')
            .then(res => resolve())
            .catch(err => reject(err))
    })
}

function createArchive(api, id) {
    return new Promise((resolve, reject) => {
        api(`/api/storage/archive/${id}`, false, 'put', 'x-tgz')
            .then(() => resolve())
            .catch(err => reject(err))
    })
}
