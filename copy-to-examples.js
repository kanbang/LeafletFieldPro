/*
 * @Descripttion: 
 * @version: 0.x
 * @Author: zhai
 * @Date: 2021-07-06 10:24:51
 * @LastEditors: zhai
 * @LastEditTime: 2021-07-06 10:26:28
 */
var fs = require('fs-extra');

var source = './out/leaflet.canvaslayer.field.js';
var dest = './demo/dist/leaflet.canvaslayer.field.js';
fs.copy(source, dest, function (err) {
    if (err) {
        return console.error(err);
    }
    console.log('Copied to ' + dest);
});
