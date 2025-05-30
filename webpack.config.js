const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Determine if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: './src/client/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/client'),
    filename: isProduction ? 'bundle.[contenthash].js' : 'bundle.js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src/client')
    }
  },
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.client.json'
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/client/index.html',
      ...(isProduction ? {
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        }
      } : {})
    })
  ],
  // Only include devServer config in development mode
  ...(isProduction ? {} : {
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist/client'),
      },
      historyApiFallback: true,
      port: 8080,
      proxy: [{
        context: ['/api', '/uploads'],
        target: process.env.BACKEND_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }],
      open: true,
      hot: true,
      onListening: function(devServer) {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }

        const port = devServer.server.address().port;
        console.log('Listening on port:', port);
      },
      allowedHosts: 'all',
    }
  })
}; 