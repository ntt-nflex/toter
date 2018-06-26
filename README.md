# toter

## Toter is a command line tool for publishing apps/widgets to Marketplace.

## Prerequisites

- Node v8.11.1
- npm v5.6.0

## Installing globally

Installation via `npm`:

```sh
npm install toter -g
```

This will install `toter` globally so that it may be run from the command line.

## Configuration

Before first use, you will need to store your auth credentials, running:
```sh
toter config
```

This should create a file called .toter.yaml in your home directory.

## Usage

toter will be accessible on the command line globally, to configure your project to use toter navigate to your project and run:

```sh
toter setup
```

This will create a config.json file for you with the details of your App and Widget.

## Update your widget/app settings and contents

You will need to make sure the widget contents you want to be uploaded to be in the dist/ folder.

If you need to update your widget or app settings at any point, modify your config.json and run the following to update:

```sh
toter update
```

## Remove your widget and app

If you need tp remove your widget and app you can do that in two ways.:
From the project's folder by running:

```sh
toter remove
```

From the cli by writing again "toter remove" and adding the flags "-a" or "--idApp" with the id of the app and "-w" or "--idWidget" with the id of the widget:

```sh
toter remove -a appId123 -w widgetId123
```
or
```sh
toter remove --idApp appId123 -idWidget widgetId123
```

## Submit your widget for review

Once you have tested your widget in your region, you are able to submit it for review to be released as a live Marketplace widget, run the following to request approval:

```sh
toter submit
```

## Approve a widget

If allowed to, it is possible to approve a widget triggering a multi region sync, dependending on how to distribution property is set up.

```sh
toter approve
```
## Verbose mode
All the commands can be run in verbose mode. This mode displays specific information such as the URL being used and the payload sent / received.

```sh
toter setup -v

App/Widget name: my-widget
App/Widget description: my-widget-description
Widget deployment location (pick one or many separated by comma) [all,ap,au,core,eu,in,jp,sandbox,us]: all
[ 'all' ]
```

Will display more detailed information:

```sh
HTTP post /api/apps
Created app
{ user_id: '00000000-0000-0000-0000-000000000001',
  customer_id: '00000000-0000-0000-0000-000000000001',
  origin: 'focus',
  name: 'my-widget',
  created_at: '2018-06-26T11:19:17.690225Z',
  id: '1340b0ca-4cf9-4bf9-9c29-40042b0f411e',
  updated_at: '2018-06-26T11:19:17.690642Z',
  description: 'my-widget-description',
  subscribers: [ '00000000-0000-0000-0000-000000000001' ],
  status: 'created',
  distribution: [ 'all' ] }
```
