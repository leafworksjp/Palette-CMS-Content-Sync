//@ts-check

'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
module.exports = [{
	target: 'node',
	entry: './extension/extension.ts',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'extension.bundle.js',
		libraryTarget: 'commonjs2',
		devtoolModuleFilenameTemplate: '../[resource-path]',
	},
	externals: {
		vscode: 'commonjs vscode',
		bufferutil: 'bufferutil',
		'utf-8-validate': 'utf-8-validate'
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	module: {
		rules: [{
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				loader: 'ts-loader',
				options: {
					compilerOptions: {
						module: 'es6'
					}
				}
			}]
		}]
	},
},
{
	target: 'web',
	entry: './webview/index.tsx',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'webview.bundle.js',
	},
	externals: {
		vscode: 'commonjs vscode'
	},
	resolve: {
		modules: [path.resolve(__dirname, 'node_modules')],
		extensions: ['.js', '.jsx', '.ts', '.tsx']
	},
	module: {
		rules: [{
			test: [/\.ts$/, /\.tsx$/],
			exclude: /node_modules/,
			use: [{
				loader: 'ts-loader',
				options: {
					compilerOptions: {
						module: 'es6'
					},
				}
			}]
		},
		{
			test: [/\.js$/, /\.jsx$/],
			exclude: /node_modules/,
			use: [{
				loader: 'babel-loader',
				options: {
					presets: [
						'@babel/preset-env',
						'@babel/preset-react',
					],
				},
			}],
		}]
	},
}];

if (process.env.NODE_ENV === 'development')
{
	module.exports[0].mode = 'development';
	module.exports[1].mode = 'development';

	module.exports[0].devtool = 'source-map';
	module.exports[1].devtool = 'inline-source-map';
}
else
{
	module.exports[0].mode = 'production';
	module.exports[1].mode = 'production';
}
