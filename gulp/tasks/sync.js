var gulp = require("gulp");
var shell = require('gulp-shell');
var sequence = require('gulp-run-sequence');
var paths = require('../paths.js');

gulp.task('sync',  function () {
    gulp.src([
        './**/*.d.ts', 
        
        //exclude
        '!./typings/**/*.d.ts', 
        '!./node_modules/**/*.d.ts'
        ], {base: '.'})
        .pipe(gulp.dest(paths.typings));

    gulp.src([
        './**/*.ts', 
        './**/*.js', 
        
        //exclude
        '!./node_modules/**/*.js', 
        '!./node_modules/**/*.ts',
        '!./typings/**/*.ts',
        '!./gulp/**/*.js'
        ], {base: '.'})
        .pipe(gulp.dest(paths.nodeModule));
});

gulp.task('transpile', shell.task(['tsc']));

gulp.task('watch', function () {
    gulp.watch(["*.ts", "!*.d.ts"], () => sequence('transpile', 'sync')).on("change", console.log);
});