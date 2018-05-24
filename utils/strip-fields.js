const strippedFields = [
    'created_at',
    'customer_id',
    'distribution',
    'module_id',
    'source_module_id',
    'source',
    'status',
    'subscribers',
    'tag',
    'translations',
    'type',
    'updated_at',
    'user_id'
]

module.exports = stripFields

/**
 * strips the a defined set of fields from a payload
 *
 * @param  {[object]} payload the payload whose fields are to be stripped off
 * @return {[object]} payload with stripped fields
 */
function stripFields(payload) {
    Object.keys(payload).forEach(key => {
        if (strippedFields.includes(key)) {
            delete payload[key]
        }
    })

    return payload
}
