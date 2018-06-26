module.exports = {
    entry: 'index.html',
    folder: 'dist',
    region: 'default',
    configPath: `${process.env.PWD}/config.json`,
    settingsPath: `${process.env.HOME || process.env.USERPROFILE}/.toter.json`,
    schemaPath: `${process.env.PWD}/schema.json`,
    widget: {
        minx: 4,
        miny: 4,
        sizex: 7,
        sizey: 7,
        icon: 'html'
    }
}
