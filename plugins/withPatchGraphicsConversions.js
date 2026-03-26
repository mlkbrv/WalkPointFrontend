const { withAppBuildGradle } = require('@expo/config-plugins');

const SNIPPET = `
// Patch React Native graphicsConversions.h (std::format -> std::to_string) for NDK 26 (Windows + Unix)
def patchGraphicsScript = new File(project.rootProject.projectDir, "../scripts/fixGraphicsConversions.js")
if (patchGraphicsScript.exists()) {
  tasks.matching { it.name.contains("buildCMake") || it.name.contains("externalNativeBuild") }.configureEach { task ->
    task.doFirst {
      exec {
        commandLine "node", patchGraphicsScript.absolutePath
        ignoreExitValue true
      }
    }
  }
}
`;

const withPatchGraphicsConversions = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') return config;
    let contents = config.modResults.contents;
    if (contents.includes('patchGraphicsScript') && contents.includes('fixGraphicsConversions')) {
      return config;
    }
    config.modResults.contents = contents.trimEnd() + '\n' + SNIPPET + '\n';
    return config;
  });
};

module.exports = withPatchGraphicsConversions;
