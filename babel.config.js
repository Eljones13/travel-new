module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // MUST be first: WatermelonDB model decorators require legacy mode
      ['@babel/plugin-proposal-decorators', { legacy: true }],
    ],
  };
};
