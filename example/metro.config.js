const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const defaultConfig = getDefaultConfig(__dirname);
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
    resolver: {
        assetExts: [...defaultConfig.resolver.assetExts, 'pem', 'p12', 'crt', 'key'],
        extraNodeModules: {
            //'react-native-androidtv-remote': path.resolve(__dirname, '../src'),
            //'tls': path.resolve(__dirname, 'node_modules/react-native-tcp-socket'),
            //'react-native-tls': path.resolve(__dirname, 'packages/react-native-tls'),
        },
      },
      //watchFolders: [path.resolve(__dirname, '..')],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
