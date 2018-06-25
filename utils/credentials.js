module.exports = getCredentials

/**
 * extracts credentials given a configuration object
 *
 * @param  {[object]} settings object
 * @param  {[string]} region the region Name
 * @return {[object]} an object with the key, secret and region properties
 */
function getCredentials(settings, region) {

    if (settings && !settings.regions) {
        console.error('Please run config')
        process.exit(1)
    }

    if (!settings.regions.hasOwnProperty(region)) {
        console.error(region, 'region does not exist!')
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
