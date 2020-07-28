const gulp = require('gulp')
const ts = require('gulp-typescript')
const babel = require('gulp-babel')
const merge = require('merge2')
var rimraf = require('rimraf')

const tsProject = ts.createProject('tsconfig.json')

gulp.task('compile', function() {
  rimraf.sync('dist')
  const tsReslut = gulp
    .src('lib/**/*.ts') // or tsProject.src()
    .pipe(tsProject())

  return merge([
    tsReslut.js.pipe(babel()).pipe(gulp.dest('dist')),
    tsReslut.dts.pipe(gulp.dest('dist')),
  ])
})
