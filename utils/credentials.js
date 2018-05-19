module.exports = (settings, region) => {
    if (settings && !settings.regions) {
        console.error('Please run config')
        process.exit(1)
    }

    const key = settings.regions[region].key
    const secret = settings.regions[region].secret

    if (!key || !secret) {
        console.error('Please add a key and secret to your setting file')
        process.exit(1)
    }

    return {
        key: key,
        secret: secret,
        region: settings.regions[region].region
    }
}
