const { existsSync, writeFileSync } = require('fs')

module.exports = getFile

/**
 * retrieves a file from a path if exists
 * otherwise throws a console error and exits application
 *
 * @param  {[string]} path
 * @return {[object]} an object with the properties found in the file
 */
function getFile(path) {
    if (!existsSync(path)) {
        writeFileSync(path, JSON.stringify({}, null, 4))
        return null
    }
    return require(path)
}
