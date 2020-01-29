const path = require('path');
const childProcess = require('child_process');
const webpack = require('webpack');
const electron = require('electron');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const merge = require('webpack-merge');

const DEV_SERVER_PORT = 3000;
const TCP_SERVER_PORT = 8888;

/**
 * BASE CONFIG
 * @param {string} env
 */
const baseConfig = (env) => {
  return {
    mode: env,
		output: {
			// publicPath: path.resolve(__dirname, 'app'),
			filename: '[name].js',
			path: path.resolve(__dirname, 'app'),
		},
		resolve: {
			alias: {
			  'react-dom': '@hot-loader/react-dom',
			  '@': path.join(__dirname, 'src'),
			  '~': path.join(__dirname, 'src', 'styles'),
			  '@components': path.join(__dirname, 'src', 'components'),
			},
		},
		module: {
			rules: [
				{
					test: /\.(js|jsx)$/,
					exclude: /(node_modules|bower_components)/,
					use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
					}
				}
			]
		},
		plugins: [
      new webpack.EnvironmentPlugin({
        'ENV': env,
        'DEV_SERVER_PORT': DEV_SERVER_PORT,
        'TCP_SERVER_PORT': TCP_SERVER_PORT,
      })
		],
		devServer: {
			port: DEV_SERVER_PORT,
      disableHostCheck: true,
      writeToDisk: true
    },
    node: {
      __dirname: false,
      __filename: false
    },
    devtool: false, // 'source-map'
	};
}

/**
 * Webpack config for main / background
 * @param {string} env
 */
const mainConfig = (env) => {
  let electronStarted = false;
  return {
		target: 'electron-main',
		entry: {
			main: './src/main.js',
		},
		plugins: 'development' === env ? [{
      /**
       * Run electron after electron-main compiled
       */
      apply(compiler) {
        compiler.hooks.done.tap('Run Electron', (
          stats /* stats is passed as argument when done hook is tapped.  */
        ) => {
          console.log('electronStarted: ', electronStarted)
          if (!electronStarted) {
            electronStarted = true;
            childProcess
              .spawn(electron, ['.'], { stdio: 'inherit' })
              .on('close', () => {
                process.exit(0);
              });
          }
        });
      }
    }] : [],
	};
}

/**
 * Webpack config for preload target
 * @param {string} env
 */
const preloadConfig = (env) => {
  return {
		target: 'electron-preload',
		entry: {
			preload: './src/preload.js'
		},
	};
}

/**
 * Webpack config for renderer target
 * @param {string} env
 */
const rendererConfig = (env) => {
  return {
		target: 'electron-renderer',
		entry: {
			renderer: './src/renderer.js'
		},
		output: {
			hotUpdateChunkFilename: 'hot/hot-update.js',
			hotUpdateMainFilename: 'hot/hot-update.json',
		},
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /(node_modules|bower_components)/,
          use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              }
          }
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            'style-loader',
            // Translates CSS into CommonJS
            'css-loader',
            // Compiles Sass to CSS
            'sass-loader',
          ],
        },
        {
          test: /.*\.(gif|png|jpe?g|svg)$/i,
          use: ['file-loader']
        }
      ]
    },
		plugins: [
		  new HtmlWebpackPlugin({
		    filename: 'index.html',
		    template: './src/index.html'
		  })
		],
	};
}

/**
 * WEBPACK CONFIGS
 */
module.exports = env => {
	const mergedConfig = [
    mainConfig(env),
    // preloadConfig(env),
    rendererConfig(env)
  ].map((config) => {
		return merge(baseConfig(env), config);
	});

	console.log('mergedConfig', env, mergedConfig);

	return mergedConfig;
};
