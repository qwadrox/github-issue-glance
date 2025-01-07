import gulp from 'gulp'
import zip from 'gulp-zip'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const manifest = require('../build/manifest.json')

gulp.src('build/**').pipe(zip('github-issue-glance.zip')).pipe(gulp.dest('package'))
