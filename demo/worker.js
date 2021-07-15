/*
 * @Descripttion: 
 * @version: 0.x
 * @Author: zhai
 * @Date: 2021-07-14 14:33:04
 * @LastEditors: zhai
 * @LastEditTime: 2021-07-15 18:08:47
 */


import Field from './Field.js';
import ScalarField from './ScalarField.js';
import chroma from './chroma.js';
import Map from './Map.js';



// addEventListener('message', e => {
//     var d = chroma.scale(['white', 'black']).domain([0, 100]);
//     postMessage('Worker: Posting message back to main script');
// });


var map;
var options;
var field;
var canvas

function _getColorFor(v) {
    let rgba = this.options.color(v).rgba();
    return rgba;
}


/**
 * Prepares the image in data, as array with RGBAs
 * [R1, G1, B1, A1, R2, G2, B2, A2...]
 * @private
 * @param {[[Type]]} data   [[Description]]
 * @param {Numver} width
 * @param {Number} height
 */
function _prepareImageIn(data, width, height) {
    let f = options.interpolate ? 'interpolatedValueAt' : 'valueAt';

    let pos = 0;
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            let pointCoords = map.containerPointToLatLng([i, j]);
            let lon = pointCoords.lng;
            let lat = pointCoords.lat;

            let v = field[f](lon, lat); // 'valueAt' | 'interpolatedValueAt' || TODO check some 'artifacts'
            if (v !== null) {
                let [R, G, B, A] = _getColorFor(v);
                data[pos] = R;
                data[pos + 1] = G;
                data[pos + 2] = B;
                data[pos + 3] = parseInt(A * 255); // not percent in alpha but hex 0-255
            }
            pos = pos + 4;
        }
    }

    return data;
}


function _drawImage() {
    // this._ensureColor();

    let ctx = canvas.getContext("2d")

    let width = canvas.width;
    let height = canvas.height;

    let img = ctx.createImageData(width, height);
    let data = img.data;

    _prepareImageIn(data, width, height);
    ctx.putImageData(img, 0, 0);
}

onmessage = function (e) {

    debugger
    map = new Map("worker");

    canvas = e.data.canvas;
    var sf = new ScalarField(e.data.param);
    var options = e.data.options;
    options.color = chroma.scale(e.data.colors).domain(sf.range);
    _drawImage();

    // layer1.setOpacity(0.4);


    if (e.data.type === 'canvas') {
        const canvas = e.data.canvas;
    }

    console.log('Worker: Message received from main script');
    const result = e.data[0] * e.data[1];

    if (isNaN(result)) {
        postMessage('Please write two numbers');
    } else {
        const workerResult = 'Result: ' + result;
        console.log('Worker: Posting message back to main script');
        postMessage(workerResult);
    }
}