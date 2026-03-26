const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Runs AFTER react-native-health-connect. That library adds to MainActivity
 * only ACTION_SHOW_PERMISSIONS_RATIONALE without HEALTH_PERMISSIONS category,
 * so the system doesn't list the app. We add full intent-filters WITH categories
 * so the app is visible in Health Connect when installed via APK (EAS/release).
 */
function addHealthConnectIntentFiltersToMainActivity(androidManifest) {
  const manifest = androidManifest.manifest || androidManifest;
  const application = manifest.application?.[0];
  if (!application) return androidManifest;

  let activities = application.activity;
  if (!activities) return androidManifest;
  if (!Array.isArray(activities)) activities = [activities];

  // First activity is MainActivity in Expo
  const mainActivity = activities.find(
    (a) => (a.$ && (a.$['android:name'] === '.MainActivity' || a.$['android:name'] === 'com.walkpoint.app.MainActivity'))
  ) || activities[0];

  if (!mainActivity) return androidManifest;

  if (!mainActivity['intent-filter']) {
    mainActivity['intent-filter'] = [];
  }
  const intentFilters = mainActivity['intent-filter'];

  // Ensure we have intent-filters WITH category HEALTH_PERMISSIONS (library adds only action)
  const hasFullRationale = intentFilters.some((f) => {
    const hasAction = f.action?.some((a) => a.$ && a.$['android:name'] === 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE');
    const hasCategory = f.category?.some((c) => c.$ && c.$['android:name'] === 'android.intent.category.HEALTH_PERMISSIONS');
    return hasAction && hasCategory;
  });
  if (!hasFullRationale) {
    intentFilters.push({
      action: [{ $: { 'android:name': 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } },
      ],
    });
  }

  const hasViewUsage = intentFilters.some((f) =>
    f.action?.some((a) => a.$ && a.$['android:name'] === 'android.intent.action.VIEW_PERMISSION_USAGE')
  );
  if (!hasViewUsage) {
    intentFilters.push({
      action: [{ $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } },
      ],
    });
  }

  return androidManifest;
}

function withHealthConnectMainActivityManifest(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addHealthConnectIntentFiltersToMainActivity(config.modResults);
    return config;
  });
}

module.exports = withHealthConnectMainActivityManifest;
