#! /usr/bin/env node

"use strict";

var vorpal = require('vorpal')();
var fs     = require('fs');
var sharp  = require('sharp');
var mmm    = require('mmmagic');

var Magic       = mmm.Magic,
    magic       = new Magic(mmm.MAGIC_MIME_TYPE),
    path        = null,
    width       = null,
    height      = null,
    commandSelf = null,
    files       = null;

vorpal
    .command('resize <path> [width] [height]', 'Resize an image or all images in a folder')
    .action(function(args, cb){
        commandSelf = this;
        path        = args.path

        if (args.width)
            width = args.width;
        if (args.height)
            height = args.height;

        if (fs.lstatSync(path).isDirectory()) {
            this.prompt({
                type:    'confirm',
                name:    'continue',
                default: false,
                message: 'Resize all images in the folder? ',
            }, function(result){
                if (result.continue) {
                    files = fs.readdirSync(path);
                    // Skip the prompts if a width was supplied
                    if (width)
                        doResize(commandSelf);
                    else
                        getWidth(commandSelf);
                }
                else {
                    cb();
                }
            });
        }
        // Resize a single image
        else if (fs.lstatSync(path).isFile()) {
            // Get the file name without the path
            files = [path.split("/").pop()];
            // Get the path without the file name
            path = path.substr(0, path.lastIndexOf('/'));
            // Skip the questions if a width was supplised
            if (width)
                doResize(commandSelf);
            else
                getWidth(commandSelf);
        }
    });

vorpal
    .delimiter('resizer-js$')
    .show();

var getWidth = function(v){
    commandSelf = v;
    commandSelf.prompt({
        type:    'input',
        name:    'width',
        default: false,
        message: 'Max width? '
    }, function(result){
        if (result.width)
            width = result.width;
        getHeight(commandSelf);
    });
};

var getHeight = function(v){
    commandSelf = v;
    commandSelf.prompt({
        type:    'input',
        name:    'height',
        default: false,
        message: 'Max height? ',
    }, function(result){
        if (result.height)
            height = result.height
        doResize(commandSelf);
    });
};

var doResize = function(v){
    commandSelf = v;
    // Create a folder to dump the resized images
    if (!fs.existsSync('optimized'))
        fs.mkdirSync('optimized');

    for (var i in files){
        detectFileType(files[i]);
    }
};

 var detectFileType = function(filename){
    var fullPath = path + "/" + filename;

    // Make sure this is an appropriate image file type
    magic.detectFile(fullPath, function(err, result){
        if (!err) {
            if (result.split('/')[0] == 'image') {
                // Resize to a JPEG without enlarging it beyond the specified width/height
                var imageObj = new Image(filename, fullPath);
                imageObj.performResize();
            }
            commandSelf.log("Regarding " + fullPath + ": " + result.split('/')[0]);
            this.fileType = result.split('/')[0];
        }
        else {
            commandSelf.log(err);
        }
    });
}

var Image = function(filename, fullPath){
    this.filename = filename;
    this.fullPath = fullPath;
    var self = this;

    this.performResize = function() {
        var filenameNoExt = this.filename.substr(0, this.filename.lastIndexOf('.'));

        sharp(this.fullPath)
            .resize(parseInt(width),parseInt(height))
            .max()
            .withoutEnlargement()
            .toFile('optimized/' + filenameNoExt + '.jpg', function(err) {
                if (err)
                    commandSelf.log(err);
                else
                    commandSelf.log('Resize of ' + self.filename + ' complete');
            });
    }
};
