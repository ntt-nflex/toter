const { execSync } = require('child_process')
const { folder, settingsPath } = require('../constants/defaults')
const getCredentials = require('./utils/credentials')
const getFile = require('../utils/get-file')
const settings = getFile(settingsPath)

module.exports = (api, data, region, method = 'post', contentType = 'json') => {
    const { key, secret, region } = getCredentials(settings, region)

    const tar1 =
        contentType === 'x-tgz'
            ? 'COPYFILE_DISABLE=1 tar -zvC ' + folder + ' -c . | '
            : ''
    const tar2 = contentType === 'x-tgz' ? '-T -' : ''
    const dataString = data ? "-d '" + JSON.stringify(data) + "'" : ''
    const secureString = isIP(region) ? '-k ' : ''

    const curlCommand = `${tar1} curl -u ${key}:${secret} https://${region}/cmp/basic${api} 
        ${secureString} -X ${method.toUpperCase()} -H "Content-Type:application/'${contentType}" ${dataString} ${tar2}`
    return execSync(curlCommand).toString('utf8')
    // return execSync(
    //     tar1 +
    //         'curl -u ' +
    //         key +
    //         ':' +
    //         secret +
    //         ' ' +
    //         'https://' +
    //         region +
    //         '/cmp/basic' +
    //         api +
    //         ' ' +
    //         secureString +
    //         '-X ' +
    //         method.toUpperCase() +
    //         ' ' +
    //         '-H "Content-Type:application/' +
    //         contentType +
    //         '" ' +
    //         dataString +
    //         tar2
    // ).toString('utf8')
}

function isIP(url) {
    const urlArray = url.split('.')
    if (urlArray.length !== 4) {
        return false
    }

    return !!urlArray.filter(piece => Number.isInteger(Number(piece))).length
}
