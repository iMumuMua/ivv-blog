var fs = require('fs');
var path = require('path');

var jade = require('jade');

// article data
var articles = require('../src/data/articles');

var markdown = require('./markdown');

var projectDir = path.join(__dirname, '..');

module.exports = function(callback) {
    fs.readFile(path.join(projectDir, 'src/templates/index.jade'), 'utf8', function(err, data) {
        if (err) callback(err);
        else onReadIndexJadeSuccess(data);
    });

    function onReadIndexJadeSuccess(data) {
        var fn = jade.compile(data, {
            basedir: projectDir,
            pretty: '    '
        });
        var html = fn({articles: articles});
        fs.writeFile(path.join(projectDir, 'www/index.html'), html, {
            encoding: 'utf8',
            mode: 0o644
        }, callback);
    }
};