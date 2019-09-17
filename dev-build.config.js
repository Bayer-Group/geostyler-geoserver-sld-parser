require("@babel/polyfill");

module.exports = {
  entry: ["@babel/polyfill", "./src/GeoserverSldStyleParser.ts"],
  mode: 'development',
  output: {
    filename: "GeoserverSldStyleParser.js",
    path: __dirname + "/browser",
    library: "GeoStylerGeoserverSLDParser"
  },
  resolve: {
    // Add '.ts' as resolvable extensions.
    extensions: [".ts", ".js", ".json"]
  },
  module: {
    rules: [
      // All files with a '.ts'
      {
        test: /\.ts$/,
        include: __dirname + '/src',
        use: [
          {
            loader: require.resolve('ts-loader'),
          }
        ]
      }
    ]
  }
};