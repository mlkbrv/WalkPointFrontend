const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Ensures minSdk 26 for Health Connect. compileSdk / targetSdk are set only via
 * expo-build-properties (Walker-style) — patching root build.gradle ext caused compileSdk 35 and AAR failures.
 */
const withMinSdk26 = (config) => {
  return withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'android.minSdkVersion')
    );
    config.modResults.push({
      type: 'property',
      key: 'android.minSdkVersion',
      value: '26',
    });
    return config;
  });
};

module.exports = withMinSdk26;
