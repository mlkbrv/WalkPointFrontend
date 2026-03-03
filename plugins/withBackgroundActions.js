const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

const withBackgroundActions = (config) => {
  // Android configuration
  config = withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    
    // Add service for background actions
    const application = manifest.application?.[0];
    if (application) {
      if (!application.service) {
        application.service = [];
      }
      
      // Check if service already exists
      const serviceExists = application.service.some(
        (service) => service.$?.['android:name'] === 'com.asterinet.react.bgactions.RNBackgroundActionsTask'
      );
      
      if (!serviceExists) {
        application.service.push({
          $: {
            'android:name': 'com.asterinet.react.bgactions.RNBackgroundActionsTask',
            'android:foregroundServiceType': 'health',
          },
        });
      }
    }
    
    return config;
  });

  // iOS configuration - add background modes
  config = withInfoPlist(config, (config) => {
    if (!config.modResults.UIBackgroundModes) {
      config.modResults.UIBackgroundModes = [];
    }
    
    const modes = ['fetch', 'processing', 'location'];
    modes.forEach((mode) => {
      if (!config.modResults.UIBackgroundModes.includes(mode)) {
        config.modResults.UIBackgroundModes.push(mode);
      }
    });
    
    return config;
  });

  return config;
};

module.exports = withBackgroundActions;
