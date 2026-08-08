module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: { "@": "./src" },
        },
      ],
      // Reanimated v4 moved its babel transform into react-native-worklets.
      "react-native-worklets/plugin",
    ],
  };
};
