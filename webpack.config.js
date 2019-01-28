const path = require('path')
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
	entry: './js/bootstrap.js',
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
			{ test: /\.tsx?$/, loader: "awesome-typescript-loader" },
			{ enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
		]
	},
	mode: "development",
	plugins: [
		new HtmlWebpackPlugin({
			template: 'index.html'
		})
	]
}