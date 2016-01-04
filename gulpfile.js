// gulp module
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');

// css process
var autoprefixer = require('autoprefixer');
var mqpacker = require('css-mqpacker');
var csswring = require('csswring');

var markdown = require('./utils/markdown');

// jade tasks
var renderer = require('./utils/renderer');
gulp.task('jade:index', renderer.renderIndex);
gulp.task('jade:article', function() {
    return gulp.src('./html-articles/**/*.html')
        .pipe(renderer.renderArticles())
        .pipe(plugins.rename({
            basename: 'index',
            extname: '.html'
        }))
        .pipe(gulp.dest('./www/articles'));
});
gulp.task('jade', ['jade:index', 'jade:article']);


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


// markdown tasks
gulp.task('markdown', function() {
    return gulp.src(['./src/articles/**/*.md'])
        .pipe(markdown())
        .pipe(plugins.rename({
            extname: '.html'
        }))
        .pipe(gulp.dest('./html-articles/'));
});

// copy tasks
gulp.task('copy', function() {
    return gulp.src(['./src/articles/**/*.{jpg,png,gif}'])
        .pipe(gulp.dest('./www/articles/'));
});

// watch tasks
gulp.task('watch:less', function() {
    gulp.watch(lessSrc, ['less']);
});
gulp.task('watch:jade', function() {
    gulp.watch('./src/templates/**/*.jade', ['jade']);
});
gulp.task('watch', ['watch:less', 'watch:jade']);


// main tasks
gulp.task('build', function(callback) {
    runSequence('less', 'markdown', 'jade', 'copy', callback);
});
gulp.task('dev', function(callback) {
    runSequence('build', 'watch');
});
gulp.task('default', ['build']);
