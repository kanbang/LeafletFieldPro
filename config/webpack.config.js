/*
 * @Descripttion: 
 * @version: 0.x
 * @Author: zhai
 * @Date: 2021-07-06 10:18:14
 * @LastEditors: zhai
 * @LastEditTime: 2021-07-06 11:09:47
 */
const path = require('path'); //调用node.js中的路径
const WebpackShellPluginNext = require('webpack-shell-plugin-next');


module.exports = {
    entry: {
        index: './src/_main.js' //需要打包的文件
    },
    output: {
        filename: 'leaflet.canvaslayer.field.js',
        // filename: '[name].js', //输入的文件名是什么，生成的文件名也是什么
        path: path.resolve(__dirname, '../out') //指定生成的文件目录
    },
    mode: "development", //开发模式，没有对js等文件压缩，默认生成的是压缩文件
    plugins: [
        new WebpackShellPluginNext({
            onBuildStart: {
                scripts: ['echo "Webpack Start"'],
                blocking: true,
                parallel: false
            },
            onBuildEnd: {
                scripts: ['node copy-to-examples.js'],
                blocking: false,
                parallel: true
            }
        })
    ]
}