#!/usr/bin/env node
/**
 * Patch React Native graphicsConversions.h (std::format -> std::to_string) for NDK 26.
 * Works on Windows and Unix. Gradle uses files from its cache, so we patch the cache copy.
 */
const fs = require('fs');
const path = require('path');

const gradleHome = process.env.GRADLE_USER_HOME || path.join(process.env.USERPROFILE || process.env.HOME || '', '.gradle');
const cachesDir = path.join(gradleHome, 'caches');
if (!fs.existsSync(cachesDir)) process.exit(0);

const TARGET_FILE = 'graphicsConversions.h';

function findGraphicsConversions(dir, acc = [], depth = 0) {
  if (depth > 15) return acc;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isFile() && e.name === TARGET_FILE) {
        const norm = full.replace(/\\/g, '/');
        if (norm.includes('react-android') && norm.includes('renderer') && norm.includes('core')) {
          acc.push(full);
        }
      } else if (e.isDirectory()) {
        findGraphicsConversions(full, acc, depth + 1);
      }
    }
  } catch (_) {}
  return acc;
}

// Search in transforms (Gradle stores transformed deps here)
const transformsDir = path.join(cachesDir, 'transforms');
let files = [];
if (fs.existsSync(transformsDir)) {
  const dirs = fs.readdirSync(transformsDir, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const d of dirs) {
    const sub = path.join(transformsDir, d.name);
    const transformed = path.join(sub, 'transformed');
    if (fs.existsSync(transformed)) {
      files = findGraphicsConversions(transformed);
      if (files.length > 0) break;
    }
  }
}

if (files.length === 0) {
  files = findGraphicsConversions(cachesDir);
}

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('std::format("{}%", dimension.value)')) {
      content = content.replace(/std::format\("{}%", dimension\.value\)/g, 'std::to_string(dimension.value) + "%"');
      fs.writeFileSync(file, content);
      console.warn('[fixGraphicsConversions] Patched:', file);
    }
  } catch (e) {
    console.warn('[fixGraphicsConversions] Skip', file, e.message);
  }
}

process.exit(0);
