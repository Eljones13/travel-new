const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure .web.tsx / .web.ts are resolved before .tsx / .ts on web.
// This guarantees native-only modules (e.g. react-native-vision-camera)
// are replaced by their web stubs without relying on cache state.
config.resolver.platforms = ['web', 'ios', 'android', 'native'];

module.exports = config;
