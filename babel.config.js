module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // We move the plugins into an 'overrides' block or use a more standard Expo setup
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-transform-class-properties', { loose: true }],
    ],
  };
};