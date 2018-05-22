const { execSync } = require('child_process')

module.exports = api

function api(api, data = false, method = 'post', contentType = 'json') {
    return new Promise((resolve, reject) => {
        const { key, secret, region } = this.credentials
        const tar1 =
            contentType === 'x-tgz'
                ? 'COPYFILE_DISABLE=1 tar -zvC ' + this.folder + ' -c . | '
                : ''
        const tar2 = contentType === 'x-tgz' ? '-T -' : ''
        const dataString = data ? "-d '" + JSON.stringify(data) + "'" : ''
        const secureString = isIP(region) ? '-k ' : ''

        const curlCommand = `${tar1} curl -u ${key}:${secret} https://${region}/cmp/basic${api} ${secureString} -X ${method.toUpperCase()} -H "Content-Type:application/${contentType}" ${dataString} ${tar2}`
        const response = JSON.parse(execSync(curlCommand).toString('utf8'))

        // some payload retrieve status_code, others retrieve error_code
        const code = response.status_code || response.error_code
        const isErrorResponse = code >= 300 && code <= 500

        if (isErrorResponse) {
            reject(response)
        } else {
            resolve(response)
        }
    })
}

function isIP(url) {
    const urlArray = url.split('.')
    if (urlArray.length !== 4) {
        return false
    }

    return !!urlArray.filter(piece => Number.isInteger(Number(piece))).length
}
