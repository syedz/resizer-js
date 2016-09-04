#! /usr/bin/env node

var vorpal = require('vorpal')();
var fs     = require('fs');
var sharp  = require('sharp');
var mmm    = require('mmmagic');

var Magic  = mmm.Magic,
    path   = null,
    width  = null,
    height = null;

vorpal
    .command('resize <path> [width] [height]', 'Resize an image or all images in a folder')
    .action(function(args, cb){
        const self = this;
        path       = args.path

        if (args.width)
            width = args.width;
        if (args.height)
            height = args.height;

        if (fs.statSync(path).isDirectory()) {
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
                        doResize(self);
                    else
                        getWidth(self);
                }
                else {
                    cb();
                }
            });
        }
        // Resize a single image
        else if (fs.statSync(path).isFile()) {
            // Get the file name without the path
            files = [path.split("/").pop()];
            // Get the path without the file name
            path = path.substr(0, path.lastIndexOf('/'));
            // Skip the questions if a width was supplised
            if (width)
                doResize(self);
            else
                getWidth(self);
        }
    });

vorpal
    .delimiter('resizer-js$')
    .show();

var getWidth = function(v){
    self = v;
    self.prompt({
        type:    'input',
        name:    'width',
        default: false,
        message: 'Max width? '
    }, function(result){
        if (result.width)
            width = result.width;
        getHeight(self);
    });
};

var getHeight = function(v){
    self = v;
    self.prompt({
        type:    'input',
        name:    'height',
        default: false,
        message: 'Max height? ',
    }, function(result){
        if (result.height)
            height = result.height
        doResize(self);
    });
};

var doResize = function(v){
    self = v;
    // Create a folder to dump the resized images
    if (!fs.existsSync('optimized'))
        fs.mkdirSync('optimized');

    for (var i in files)
        detectFileType(files[i]);
};

var detectFileType = function(filename){
    var fullPath      = path + "/" + filename,
        filenameNoExt = filename.substr(0, filename.lastIndexOf('.')),
        magic         = new Magic(mmm.MAGIC_MIME_TYPE);

        // Make sure this is an appropriate image file type
        magic.detectFile(fullPath, function(err, result) {
            if (!err) {
                if (result.split('/')[0] == 'image')
                    // Resize to a jpeg without enlarging it beyond the specified width/height
                    sharp(fullPath)
                        .resize(parseInt(width),parseInt(height))
                        .max()
                        .withoutEnlargement()
                        .toFile('optimized/' + filenameNoExt + '.jpg', function(err) {
                            if (err)
                                self.log(err);
                            else
                                self.log('Resize of ' + filename + ' complete');
                        });
                }
            else
                self.log(err);
        });
};
