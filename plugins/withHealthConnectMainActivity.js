const { withMainActivity } = require('@expo/config-plugins');

const HEALTH_CONNECT_IMPORT = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
const HEALTH_CONNECT_DELEGATE_LINE = '    HealthConnectPermissionDelegate.setPermissionDelegate(this)';

/**
 * Injects HealthConnectPermissionDelegate.setPermissionDelegate(this) into MainActivity.onCreate()
 * so that the permission dialog has a delegate and doesn't crash with UninitializedPropertyAccessException.
 */
function withHealthConnectMainActivity(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes('HealthConnectPermissionDelegate')) {
      return config;
    }

    // Add import after the last import (before first non-import line)
    const importRegex = /\nimport [^\n]+/g;
    let lastImportEnd = -1;
    let m;
    while ((m = importRegex.exec(contents)) !== null) {
      lastImportEnd = m.index + m[0].length;
    }
    if (lastImportEnd >= 0) {
      contents =
        contents.slice(0, lastImportEnd) +
        '\n' +
        HEALTH_CONNECT_IMPORT +
        contents.slice(lastImportEnd);
    } else {
      // Fallback: add after package declaration
      const afterPackage = contents.indexOf('\n') + 1;
      contents = contents.slice(0, afterPackage) + HEALTH_CONNECT_IMPORT + '\n' + contents.slice(afterPackage);
    }

    // Add setPermissionDelegate(this) in onCreate, after super.onCreate(...)
    const onCreateSuperMatch = contents.match(/super\.onCreate\([^)]*\)\s*\n/);
    if (onCreateSuperMatch) {
      const insertIndex = onCreateSuperMatch.index + onCreateSuperMatch[0].length;
      contents =
        contents.slice(0, insertIndex) +
        HEALTH_CONNECT_DELEGATE_LINE +
        '\n' +
        contents.slice(insertIndex);
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withHealthConnectMainActivity;
