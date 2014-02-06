module.exports = (grunt)->

  grunt.loadNpmTasks 'grunt-contrib-jshint'
  grunt.loadNpmTasks 'grunt-contrib-uglify'

  grunt.initConfig

    jshint:
      options:
        jshintrc: true

      ngFormsEnhanced:
        files: { src: 'angular-forms-enhanced.js' }

    uglify:
      dist:
        files: 
          'angular-forms-enhanced.min.js': 'angular-forms-enhanced.js'


  grunt.registerTask 'default', [ 'jshint', 'uglify' ]  