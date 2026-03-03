const { withGradleProperties, withProjectBuildGradle } = require('@expo/config-plugins');

const withMinSdk26 = (config) => {
  // Modify android/build.gradle to set minSdkVersion = 26
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;
      
      // Check if ext block exists
      if (contents.includes('buildscript {')) {
        // Add or modify ext block inside buildscript
        if (contents.includes('ext {')) {
          // Modify existing minSdkVersion
          contents = contents.replace(
            /minSdkVersion\s*=\s*\d+/,
            'minSdkVersion = 26'
          );
        } else {
          // Add ext block after buildscript {
          contents = contents.replace(
            /buildscript\s*\{/,
            `buildscript {
    ext {
        minSdkVersion = 26
        targetSdkVersion = 35
        compileSdkVersion = 35
        buildToolsVersion = "35.0.0"
        ndkVersion = "26.1.10909125"
    }`
          );
        }
      }
      
      config.modResults.contents = contents;
    }
    return config;
  });

  // Also set via gradle.properties for extra safety
  config = withGradleProperties(config, (config) => {
    // Remove existing minSdkVersion if present
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'android.minSdkVersion')
    );
    
    // Add minSdkVersion = 26
    config.modResults.push({
      type: 'property',
      key: 'android.minSdkVersion',
      value: '26',
    });
    
    return config;
  });

  return config;
};

module.exports = withMinSdk26;
