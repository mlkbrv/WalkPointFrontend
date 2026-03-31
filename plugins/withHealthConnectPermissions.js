const { withAndroidManifest } = require('@expo/config-plugins');

const HEALTH_CONNECT_PERMISSIONS = [
  'android.permission.health.READ_STEPS',
  'android.permission.health.READ_DISTANCE',
  'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
  'android.permission.health.READ_HEIGHT',
  'android.permission.health.READ_WEIGHT',
  'android.permission.health.WRITE_STEPS',
  'android.permission.health.WRITE_DISTANCE',
];

function addPermissionIfMissing(manifest, permissionName) {
  const usesPermission = manifest.manifest['uses-permission'] || [];
  const exists = usesPermission.some(
    (p) => p.$ && p.$['android:name'] === permissionName
  );
  if (!exists) {
    usesPermission.push({ $: { 'android:name': permissionName } });
    manifest.manifest['uses-permission'] = usesPermission;
  }
}

const withHealthConnectPermissions = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    HEALTH_CONNECT_PERMISSIONS.forEach((name) => addPermissionIfMissing(manifest, name));
    return config;
  });
};

module.exports = withHealthConnectPermissions;
