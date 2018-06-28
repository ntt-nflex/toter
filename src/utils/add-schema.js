const getFile = require('../utils/get-file')
const { writeFileSync } = require('fs')

module.exports = addSchema;

function addSchema(config, region, defaults) {

    return new Promise((resolve, reject) => {

        const schema = getFile(defaults.schemaPath)
    
        if(schema) {
            config[region].widget_json.schema = schema.schema
        }

        writeFileSync(
            'config.json',
            JSON.stringify(config, null, 4)
        )

        resolve()
    })
}
