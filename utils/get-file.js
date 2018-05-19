const { existsSync } = require('fs')

module.exports = getFile

/**
 * retrieves a file from a path if exists
 * otherwise throws a console error and exits application
 *
 * @param  {[string]} path
 * @return {[object]} an object with the properties found in the file
 */
function getFile(path) {
    if (!fs.existsSync(path)) {
        console.error(`${path} required`)
        process.exit(1)
    }
    return require(path)
}
