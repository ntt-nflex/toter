// strips the a defined set of fields from a payload

const strippedFields = [
    'customer_id',
    'user_id',
    'subscribers',
    'updated_at',
    'created_at',
    'type',
    'module_id',
    'source_module_id',
    'status',
    'distribution'
]

module.exports = payload => {
    Object.keys(payload).forEach(key => {
        if (strippedFields.includes(key)) {
            delete payload[key]
        }
    })
}
