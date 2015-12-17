// node module
var fs = require('fs');
var path = require('path');

// gulp module
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');

// css process
var autoprefixer = require('autoprefixer');
var mqpacker = require('css-mqpacker');
var csswring = require('csswring');

// html process
var jade = require('jade');

// article data
var articles = require('./src/data/articles.js');

var blogDir = __dirname;


// jade tasks

gulp.task('jade:index', function(callback) {
    fs.readFile(path.join(blogDir, 'src/templates/index.jade'), 'utf8', function(err, data) {
        if (err) callback(err);
        else onReadIndexJadeSuccess(data);
    });

    function onReadIndexJadeSuccess(data) {
        var fn = jade.compile(data, {
            basedir: blogDir,
            pretty: '    '
        });
        var html = fn({articles: articles});
        fs.writeFile(path.join(blogDir, 'www/index.html'), html, {
            encoding: 'utf8',
            mode: 0o644
        }, callback);
    }
});

gulp.task('jade', ['jade:index']);


// less tasks

var lessSrc = './src/less/**/*.less';
var cssDest = './www/css/';

gulp.task('less', function() {
    var processors = [
        autoprefixer({browsers: ['last 2 version']}),
        mqpacker,
        csswring
    ];
    return gulp.src([
        lessSrc,
        '!./src/less/common/*.less'
    ])
    .pipe(plugins.less())
    .pipe(plugins.postcss(processors))
    .pipe(gulp.dest(cssDest));
});

gulp.task('watch:less', function() {
    gulp.watch(lessSrc, ['less']);
});


// main tasks
gulp.task('build', function(callback) {
    runSequence('less', 'jade', callback);
});
gulp.task('default', ['build']);
