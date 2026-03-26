#!/bin/bash
# Fix std::format in React Native graphicsConversions.h for NDK 26 (no C++20 std::format).
# Run during Android build after Gradle populates cache, before C++ compile.
set -e
SEARCH_DIR="${GRADLE_USER_HOME:-$HOME/.gradle}/caches"
if [ ! -d "$SEARCH_DIR" ]; then
  exit 0
fi
FILE=$(find "$SEARCH_DIR" -type f -path "*react-android*reactnative*include*react*renderer*core*graphicsConversions.h" 2>/dev/null | head -1)
if [ -n "$FILE" ] && [ -f "$FILE" ]; then
  if grep -q 'std::format("{}%", dimension.value)' "$FILE" 2>/dev/null; then
    sed -i.bak 's/std::format("{}%", dimension.value)/std::to_string(dimension.value) + "%"/g' "$FILE"
    rm -f "$FILE.bak"
  fi
fi
exit 0
