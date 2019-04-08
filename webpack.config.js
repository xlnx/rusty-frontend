const webpack = require("webpack");
const path = require("path");
const DashboardPlugin = require("webpack-dashboard/plugin");
const nodeEnv = process.env.NODE_ENV || "development";
const isProd = nodeEnv === "production";
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const plugins = [
  new webpack.DefinePlugin({
    "process.env": {
      // eslint-disable-line quote-props
      NODE_ENV: JSON.stringify(nodeEnv)
    }
  }),
  new webpack.LoaderOptionsPlugin({
    options: {
      tslint: {
        emitErrors: true,
        failOnHint: true
      }
    }
  }),
  new HtmlWebpackPlugin({
    template: 'src/index.html'
  }),
  new CopyPlugin([
    { from: 'lib', to: 'lib' }
  ])
];

if (!isProd) {
  plugins.push(new DashboardPlugin());
}

var config = {
  devtool: isProd ? "hidden-source-map" : "source-map",
  context: path.resolve("./"),
  entry: {
    app: "./src/index.ts"
  },
  output: {
    path: path.resolve("./dist"),
    filename: "index.js",
    sourceMapFilename: "index.map",
    devtoolModuleFilenameTemplate: function (info) {
      return "file:///" + info.absoluteResourcePath;
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'AframeToolkitExample',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.ts?$/,
        use: ["awesome-typescript-loader", "source-map-loader"]
      },
      {
        test: /\.(js|ts)$/,
        loader: "babel-loader",
        exclude: /\/node_modules\//
      },
      {
        test: /\.html$/,
        loader: "raw-loader" // loaders: ['raw-loader'] is also perfectly acceptable.
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  plugins: plugins,
  devServer: {
    contentBase: path.join(__dirname, '/src'),
    compress: true,
    port: 3000,
    host: "localhost",
    hot: true,
    disableHostCheck: true,
    watchContentBase: true,
  }
};

module.exports = config;
