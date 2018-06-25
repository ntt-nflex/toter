# toter

Toter is a command line tool for publishing apps/widgets to Marketplace.

## Prerequisites

Node
npm

## Installing globally

Installation via `npm`:

     npm install toter -g

This will install `toter` globally so that it may be run from the command line.

## Configuration

Before first use, you will need to store your auth credentials, running:

     toter config

This should create a file called .toter.yaml in your home directory.

## Usage

toter will be accessible on the command line globally, to configure your project to use toter navigate to your project and run:

     toter setup

This will create a config.json file for you with the details of your App and Widget.

## Upload your contents

You will need to make sure the contents you want to be uploaded to be in the dist/ folder. When you're happy, run the following to upload to your default region with your stored credentials in toter:

     toter upload

## Update your widget/app settings

If you need to update your widget or app settings at any point, modify your config.json and run the following to update:

     toter update

## Remove your widget and app

If you need tp remove your widget and app you can do that in two ways.:
From the project's folder by running:
     toter remove
From the cli by writing again "toter remove" and adding the flags "-a" or "--idApp" with the id of the app and "-w" or "--idWidget" with the id of the widget:
     toter remove -a appId123 -w widgetId123

## Submit your widget for review

Once you have tested your widget in your region, you are able to submit it for review to be released as a live Marketplace widget, run the following to request approval:

     toter submit
