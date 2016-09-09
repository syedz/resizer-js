#! /usr/bin/env node
"use strict";

const helpers = require('./helpers')

var vorpal = require('vorpal')();
var fs     = require('fs');
var mmm    = require('mmmagic');

var Magic       = mmm.Magic,
    magic       = new Magic(mmm.MAGIC_MIME_TYPE),
    commandSelf = null;

vorpal
    .command('resize <path> [width] [height]', 'Resize an image or all images in a folder')
    .action(function(args, cb){
        commandSelf = this;
        var path    = args.path
        helpers.setPath(path);

        if (args.width)
            helpers.setWidth(args.width);
        if (args.height)
            helpers.setHeight(args.height);

        if (fs.lstatSync(path).isDirectory()) {
            this.prompt({
                type:    'confirm',
                name:    'continue',
                default: false,
                message: 'Resize all images in the folder? ',
            }, function(result){
                if (result.continue) {
                    var files = fs.readdirSync(path);
                    helpers.setFiles(files);

                    // Skip the prompts if a width was supplied
                    if (helpers.hasWidth())
                        helpers.doResize(commandSelf);
                    else
                        helpers.getWidth(commandSelf);
                }
                else {
                    cb();
                }
            });
        }
        // Resize a single image
        else if (fs.lstatSync(path).isFile()) {
            // Get the file name without the path
            var files = [path.split("/").pop()];
            helpers.setFiles(files);

            // Get the path without the file name
            path = path.substr(0, path.lastIndexOf('/'));
            helpers.setPath(path);

            // Skip the questions if a width was supplied
            if (helpers.hasWidth())
                helpers.doResize(commandSelf);
            else
                helpers.getWidth(commandSelf);
        }
    });

vorpal
    .delimiter('resizer-js$')
    .show();
