/*
 * @Descripttion: 
 * @version: 0.x
 * @Author: zhai
 * @Date: 2021-07-14 14:33:04
 * @LastEditors: zhai
 * @LastEditTime: 2021-07-14 17:06:17
 */


import Field from './Field.js';
import ScalarField from './ScalarField.js';
import * as chroma from './chroma.js';

// @function isArray(obj): Boolean
// Compatibility polyfill for [Array.isArray](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)
var isArray = Array.isArray || function (obj) {
    return (Object.prototype.toString.call(obj) === '[object Array]');
};


addEventListener('message', e => {
    postMessage('Worker: Posting message back to main script');
});


// onmessage = function (e) {

//     debugger

//     if (e.data.type === 'canvas') {
//         const canvas = e.data.canvas;
//     }

//     console.log('Worker: Message received from main script');
//     const result = e.data[0] * e.data[1];

//     if (isNaN(result)) {
//         postMessage('Please write two numbers');
//     } else {
//         const workerResult = 'Result: ' + result;
//         console.log('Worker: Posting message back to main script');
//         postMessage(workerResult);
//     }
// }