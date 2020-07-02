import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from "rollup-plugin-babel";
import { terser } from 'rollup-plugin-terser';
import rollupTypescript from 'rollup-plugin-typescript2'
import alias from 'rollup-plugin-alias';
import builtins from 'rollup-plugin-node-builtins'
const path = require('path');
export default {
  input: './src/index.ts',
  output: [{
    file: './dist/uploadhelper.min.js',
    format: 'umd',
    name: 'UploadHelper',
    globals: {
      axios: 'axios',
      'ali-oss': 'Oss'
    }
  }, {
    file: './dist/uploadhelper.min.common.js',
    format: 'cjs',
    globals: {
      axios: 'axios',
      'ali-oss': 'Oss'
    }
  }, {
    file: './dist/uploadhelper.min.moudle.js',
    format: 'es',
    globals: {
      axios: 'axios',
      'ali-oss': 'Oss'
    }
  }],
  external: ['axios', 'ali-oss'],

  plugins: [
    resolve({
      preferBuiltins: false
    }),  
    commonjs(), 
    builtins(), // 引入 node 模块
    babel({
      exclude: 'node_modules/**', // 防止打包node_modules下的文件
      runtimeHelpers: true,       // 使plugin-transform-runtime生效
    }),
    alias({
      entries:[
        {find:'obs', replacement: path.resolve(__dirname, './src/esdk-obs-browserjs-3.19.9.min.js')}, //the initial example
      ]
    }),
    rollupTypescript(),
    terser({
      compress: {
        drop_console: true
      }
    })
  ]
}