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
var articles = require('./src/data/articles');

var markdown = require('./utils/markdown');

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

gulp.task('watch:jade', function() {
    gulp.watch('./src/templates/**/*.jade', ['jade']);
});


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


// markdown tasks
gulp.task('markdown', function() {
    return gulp.src(['./src/articles/**/*.md'])
        .pipe(markdown())
        .pipe(plugins.rename({
            extname: '.html'
        }))
        .pipe(gulp.dest('./html-articles/'));
});

gulp.task('watch', ['watch:less', 'watch:jade']);

gulp.task('dev', function(callback) {
    runSequence('build', 'watch');
});

// main tasks
gulp.task('build', function(callback) {
    runSequence('less', 'jade', callback);
});
gulp.task('default', ['build']);
