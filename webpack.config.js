const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
console.log(process.env.NODE_ENV)
// const CompressionWebpackPlugin = require('compression-webpack-plugin')
module.exports = {
  // mode: 'production',
  devtool: 'cheap-module-eval-source-map',
  entry: path.resolve(__dirname, './example/main.js'),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'output.js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader',
        include: [
          path.resolve(__dirname, "./example")
        ]
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
        include: [
          path.resolve(__dirname, "./src")
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(ttf|woff)$/,
        use: 'file-loader'
      }
    ]
  },
  resolve: {
    alias: {
      UploadHelper: path.resolve(__dirname, './src/index.ts'),
      obs$: path.resolve(__dirname, './src/esdk-obs-browserjs-3.19.9.min.js')
    },
    extensions: [".ts", ".js", ".json"]
  },
  plugins: [
    // new CompressionWebpackPlugin({
    //   filename: '[path].gz[query]',
    //   algorithm: 'gzip',
    //   test: /\.js$|\.html$|\.json$|\.css/,
    //   threshold: 0, // 只有大小大于该值的资源会被处理
    //   minRatio:0.8, // 只有压缩率小于这个值的资源才会被处理
    //   deleteOriginalAssets: true // 删除原文件
    // }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './example/index.html')
    }),
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'VUE_APP_version': JSON.stringify(process.env.VUE_APP_version),
        'VUE_APP_html_url': JSON.stringify('https://ceshi.joinf.com/rapi')
      }
    })
  ],
  devServer: {
    // hot: true,
    // host: '0.0.0.0',
    // port: 8806,
    // open: true,
    // disableHostCheck: true
    // serve static
    // 开启 gzip
    // compress: true,
    contentBase: './',
    // 不检查Host是否正确
    disableHostCheck: true,
    // 文件改变后，默认不刷新页面
    liveReload: false,
    // host: 'futong.joinf.com',
    port: 8088,
    hot: true,
    // https://github.com/chimurai/http-proxy-middleware#proxycontext-config
    // 代理到后端服务器、线上、开发机
    proxy: {
      '^/erp/': {
        target: 'http://www.mangoerp.com',
        changeOrigin: true
      }
    },
    // 页面上显示错误和警告
    overlay: {
      warnings: true,
      errors: true
    },
    // 热更新
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    }
  }
}