const helpMessage = `
usage: toter [command] [options]
commands:
    config          Configure toter with your auth credentials
    -k --key        Set the key
    -n --new        Set the region name - used to specify different regions
    -s --secret     Set the secret
    -u --url        Set the region url
    -w --idWidget   Set the id of the widget when used with remove
    -a --idApp      Set the id of the app when used with remove
    help            Print this list and exit
    setup           Setup your repository as a Marketplace widget
    submit          Submit your widget for review
    upload          Upload the contents of your dist/ folder to StormDrive
    remove          Remove your widget and app from marketplace
    -v --verbose    Displays detailed information about requests made

options:
    -r --region      Region to use other than default
`

module.exports = help

/**
 * Displays available commands
 */
function help() {
    this.logger.info(helpMessage)
    process.exit()
}
