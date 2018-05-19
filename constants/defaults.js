module.exports = {
    folder: 'dist',
    entry: 'index.html',
    settingsPath: `${process.env.HOME || process.env.USERPROFILE}/.toter.json`,
    widget: {
        minx: 4,
        miny: 4,
        sizex: 7,
        sizey: 7,
        icon: 'html'
    }
}
