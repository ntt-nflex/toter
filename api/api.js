const { execSync } = require('child_process')

module.exports = api

/**
 * Calls CMP API endpoints via CURL commands
 *
 * @param  {[string]} endpoint part of url that specifies the endpoint
 * @param  {[object]} data payload to send. Defaults to false
 * @param  {[string]} method http method to use. Defaults to HTTP POST
 * @param  {[string]} contentType payload's content type. Defaults to application/json
 * @return {[object]} response payload
 */
function api(endpoint, data = false, method = 'post', contentType = 'json') {
    this.logger.debug(`HTTP ${method} ${endpoint}`)

    return new Promise((resolve, reject) => {
        const { key, secret, region } = this.credentials
        const tar1 =
            contentType === 'x-tgz'
                ? 'COPYFILE_DISABLE=1 tar -zvC ' + this.folder + ' -c . | '
                : ''
        const tar2 = contentType === 'x-tgz' ? '-T -' : ''
        const dataString = data ? "-d '" + JSON.stringify(data) + "'" : ''
        const secureString = isIP(region) ? '-k ' : ''

        // TODO: refactor curl logic into http client
        const curlCommand = `${tar1} curl -u ${key}:${secret} https://${region}/cmp/basic${endpoint} ${secureString} -X ${method.toUpperCase()} -H "Content-Type:application/${contentType}" ${dataString} ${tar2}`

        let response = execSync(curlCommand, {
            // using pipe here so that the curl command
            // does not output to terminal
            stdio: 'pipe'
        }).toString('utf8')

        // response can be empty in case of HTTP 204 No Content
        if (response) {
            response = JSON.parse(response)
        }

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
