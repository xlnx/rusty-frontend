const webpack = require("webpack");
const path = require("path");
const nodeEnv = process.env.NODE_ENV || "development";
const isProd = nodeEnv === "production";
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin')

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
    template: 'src/index.html',
    inject: false
  }),
  new WriteFilePlugin(),
  new CopyPlugin([
    { from: 'lib', to: 'lib' },
    { from: 'assets', to: 'assets' }
  ])
];

var config = {
  devtool: isProd ? "hidden-source-map" : "source-map",
  context: path.resolve("./"),
  entry: {
    app: "./src/index.ts"
  },
  node: {
  fs: 'empty'
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
        test: /\.(glsl|vs|fs|vert|frag)$/, exclude: /node_modules/,
        use: [
          "raw-loader",
          "glslify-loader"
        ]
      },
      {
        test: /\.html$/,
        include: path.join(__dirname, 'src/views'),
        // loader: "raw-loader" // loaders: ['raw-loader'] is also perfectly acceptable.
        use: {
          loader: 'html-loader',
          options: {
            interpolate: true
          }
        }
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  plugins: plugins,
  devServer: {
    contentBase: path.join(__dirname, '/dist'),
    compress: true,
    port: 3000,
    host: "0.0.0.0",
    hot: true,
    disableHostCheck: true,
    watchContentBase: true,
  }
};

module.exports = config;
