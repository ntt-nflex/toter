module.exports = () => {
    console.log([
        'usage: toter [command] [options]',
        '',
        'commands:',
        '  config            Configure toter with your auth credentials',
        '    -u --url        Set the region url',
        '    -k --key        Set the key',
        '    -s --secret     Set the secret',
        '    -n --new        Set the region name - used to specify different regions',
        '  setup             Setup your repository as a Marketplace widget',
        '  upload            Upload the contents of your dist/ folder to StormDrive',
        '  submit            Submit your widget for review',
        '  help              Print this list and exit',
        '',
        'options:',
        '  -r --region      Region to use other than default',
        ''
    ].join('\n'))
    process.exit()
}
