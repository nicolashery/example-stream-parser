module.exports = function(grunt) {

  var globalConfig = {
    scripts: ['*.js', 'lib/**/*.js', 'bin/**/*.js']
  };

  // Project configuration
  grunt.initConfig({

    globalConfig: globalConfig,

    // Lint js files
    jshint: {
      all: {
        options: {
          'node': true,
          'laxcomma': true,
          'sub': true,
          'debug': true
        },
        src: ['<%= globalConfig.scripts %>']
      }
    },

    // Watch files: lint js and compile templates
    watch: {
      scripts: {
        files: ['<%= globalConfig.scripts %>'],
        tasks: ['jshint']
      }
    }
  });

  // Load tasks from plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task
  grunt.registerTask('default', 'jshint');

};