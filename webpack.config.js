const path = require('path')
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
	entry: './js/bootstrap.js',
	// entry: "./test/oj.ts",
	output: {
		path: path.resolve(__dirname, 'out'),
		filename: 'bundle.js'
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json", ".wasm"]
	},
	devtool: "source-map",
	module: {
		rules: [
			{ test: /\.tsx?$/, loader: "ts-loader" },
			{ enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
			{ test: /\.(frag|vert)$/, loader: "raw-loader" }
		]
	},
	mode: "development",
	plugins: [
		new HtmlWebpackPlugin({
			template: 'index.html'
		})
	]
}