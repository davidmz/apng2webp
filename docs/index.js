/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _index = __webpack_require__(1);

	var _index2 = _interopRequireDefault(_index);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var fileInput = document.createElement('input');
	fileInput.type = 'file';
	fileInput.accept = 'image/png';

	document.getElementById('choose-btn').addEventListener('click', function () {
	    return fileInput.click();
	});

	fileInput.addEventListener('change', function () {
	    if (fileInput.files.length > 0) {
	        processFile(fileInput.files[0]);
	    }
	    fileInput.value = '';
	});

	function processFile(file) {
	    var resultBlock = document.getElementById('result');
	    var errorBlock = document.getElementById('error');
	    var resultCont = document.getElementById('result-img');

	    resultBlock.classList.add('hidden');
	    errorBlock.classList.add('hidden');
	    emptyEl(resultCont);
	    emptyEl(errorBlock);

	    var reader = new FileReader();
	    reader.onload = function () {
	        (0, _index2.default)(reader.result).then(function (blob) {
	            resultBlock.classList.remove('hidden');

	            var url = URL.createObjectURL(blob);
	            var img = new Image();
	            var a = document.createElement('a');
	            a.href = url;
	            a.download = 'webp.webp';
	            a.appendChild(img);
	            resultCont.appendChild(a);
	            // img.onload = function () { URL.revokeObjectURL(url); };
	            img.src = url;
	        }).catch(function (err) {
	            errorBlock.classList.remove('hidden');
	            errorBlock.appendChild(document.createTextNode(err.message));
	        });
	    };
	    reader.readAsArrayBuffer(file);
	}

	function emptyEl(el) {
	    var c = void 0;
	    while ((c = el.firstChild) !== null) {
	        el.removeChild(c);
	    }
	}

	function playAPNG(apng, context) {
	    var rnd = new Renderer(apng, context);
	    var numPlays = 0;
	    var nextRenderTime = performance.now() + rnd.currFrame().delay;
	    var stop = false;
	    var tick = function tick(now) {
	        if (stop) {
	            return;
	        }
	        if (now >= nextRenderTime) {
	            while (now - nextRenderTime > apng.playTime) {
	                nextRenderTime += apng.playTime;
	            }
	            do {
	                rnd.renderNext();
	                if (rnd.frameNumber === apng.frames.length - 1) {
	                    numPlays++;
	                    if (apng.numPlays !== 0 && numPlays >= apng.numPlays) {
	                        return;
	                    }
	                }
	                nextRenderTime += rnd.currFrame().delay;
	            } while (now > nextRenderTime);
	        }
	        requestAnimationFrame(tick);
	    };
	    requestAnimationFrame(tick);
	    return function () {
	        return stop = true;
	    };
	}

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	exports.default = function (apngData) {
	    var apng = (0, _apngJs2.default)(apngData);
	    if (apng instanceof Error) {
	        return Promise.reject(apng);
	    }

	    var apngCanvas = document.createElement('canvas');
	    apngCanvas.width = apng.width;
	    apngCanvas.height = apng.height;

	    return apng.getPlayer(apngCanvas.getContext('2d')).then(function (player) {
	        var canvas = document.createElement('canvas');
	        var ctx = canvas.getContext('2d');
	        var tlChunks = [];

	        tlChunks.push(createChunk('VP8X', new Blob([int32ToArray(ANIMATION_FLAG | ALPHA_FLAG), int24ToArray(apng.width - 1), int24ToArray(apng.height - 1)])));
	        tlChunks.push(createChunk('ANIM', new Blob([int32ToArray(0), int16ToArray(apng.numPlays)])));

	        var frameChunks = new Array(apng.frames.length);

	        function makeFrame() {
	            var frame = player.currentFrame;
	            var prevFrame = apng.frames[Math.max(0, player.currentFrameNumber - 1)];

	            var top = Math.min(frame.top, prevFrame.top),
	                left = Math.min(frame.left, prevFrame.left),
	                bottom = Math.max(frame.top + frame.height, prevFrame.top + prevFrame.height),
	                right = Math.max(frame.left + frame.width, prevFrame.left + prevFrame.width);

	            if ((top & 1) === 1) {
	                top--;
	            }
	            if ((left & 1) === 1) {
	                left--;
	            }
	            var width = right - left,
	                height = bottom - top;

	            var aChunk = [int24ToArray(left >> 1), int24ToArray(top >> 1), int24ToArray(width - 1), int24ToArray(height - 1), int24ToArray(frame.delay), new Uint8Array([MUX_NO_BLEND])];

	            canvas.width = width;
	            canvas.height = height;
	            ctx.clearRect(0, 0, width, height);
	            ctx.drawImage(apngCanvas, left, top, width, height, 0, 0, width, height);

	            return toBlobPromise(canvas, 'image/webp', 1.0).then(function (blob) {
	                aChunk.push(blob.slice(12)); // skip RIFF header
	                frameChunks[player.currentFrameNumber] = createChunk('ANMF', new Blob(aChunk));
	                if (player.currentFrameNumber === apng.frames.length - 1) {
	                    return false;
	                } else {
	                    player.renderNextFrame();
	                    return true;
	                }
	            });
	        }

	        return seq(makeFrame).then(function () {
	            Array.prototype.push.apply(tlChunks, frameChunks);
	            return withWebPHeader(new Blob(tlChunks));
	        });
	    });
	};

	var _apngJs = __webpack_require__(2);

	var _apngJs2 = _interopRequireDefault(_apngJs);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	var ANIMATION_FLAG = 0x2,
	    XMP_FLAG = 0x4,
	    EXIF_FLAG = 0x8,
	    ALPHA_FLAG = 0x10,
	    ICC_FLAG = 0x20,
	    DISPOSE_BG = 0x1,
	    MUX_NO_BLEND = 0x2;

	/**
	 * Convert APNG to WebP
	 *
	 * @param {ArrayBuffer} apngData
	 * @return {Promise.<Blob>}
	 */


	/**
	 * @param {string} fourCC
	 * @param {Blob} data
	 * @return {Blob}
	 */
	function createChunk(fourCC, data) {
	    return new Blob([stringToArray(fourCC), int32ToArray(data.size), data]);
	}

	function int32ToArray(x) {
	    return new Uint8Array([x >>> 0 & 0xff, x >>> 8 & 0xff, x >>> 16 & 0xff, x >>> 24 & 0xff]);
	}

	function int24ToArray(x) {
	    return new Uint8Array([x >>> 0 & 0xff, x >>> 8 & 0xff, x >>> 16 & 0xff]);
	}

	function int16ToArray(x) {
	    return new Uint8Array([x >>> 0 & 0xff, x >>> 8 & 0xff]);
	}

	function stringToArray(x) {
	    return new Uint8Array([].concat(_toConsumableArray(x)).map(function (c) {
	        return c.charCodeAt(0) & 0xff;
	    }));
	}

	/**
	 * @param {Blob} data
	 * @return {Blob}
	 */
	function withWebPHeader(data) {
	    return new Blob([stringToArray('RIFF'), int32ToArray(data.size + 4), stringToArray('WEBP'), data], { type: 'image/webp' });
	}

	/**
	 * @param {function(): Promise.<boolean>} foo
	 * @return {Promise.<boolean>}
	 */
	function seq(foo) {
	    return foo().then(function (x) {
	        return x ? seq(foo) : false;
	    });
	}

	function toBlobPromise(canvas) {
	    var mimeType = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];
	    var quality = arguments.length <= 2 || arguments[2] === undefined ? undefined : arguments[2];

	    return new Promise(function (yes) {
	        return canvas.toBlob(yes, mimeType, quality);
	    });
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	(function webpackUniversalModuleDefinition(root, factory) {
		if(true)
			module.exports = factory();
		else if(typeof define === 'function' && define.amd)
			define([], factory);
		else if(typeof exports === 'object')
			exports["apng-js"] = factory();
		else
			root["apng-js"] = factory();
	})(this, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};

	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {

	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;

	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};

	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;

	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}


	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;

	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;

	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";

	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ function(module, exports, __webpack_require__) {

		'use strict';

		Object.defineProperty(exports, "__esModule", {
		    value: true
		});
		exports.isNotPNG = isNotPNG;
		exports.isNotAPNG = isNotAPNG;
		exports.default = parseAPNG;

		var _crc = __webpack_require__(1);

		var _crc2 = _interopRequireDefault(_crc);

		var _structs = __webpack_require__(2);

		function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

		var errNotPNG = new Error('Not a PNG');
		var errNotAPNG = new Error('Not an animated PNG');

		function isNotPNG(err) {
		    return err === errNotPNG;
		}
		function isNotAPNG(err) {
		    return err === errNotAPNG;
		}

		// '\x89PNG\x0d\x0a\x1a\x0a'
		var PNGSignature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

		/**
		 * Parse APNG data
		 * @param {ArrayBuffer} buffer
		 * @return {APNG|Error}
		 */
		function parseAPNG(buffer) {
		    var bytes = new Uint8Array(buffer);

		    if (PNGSignature.some(function (b, i) {
		        return b !== bytes[i];
		    })) {
		        return errNotPNG;
		    }

		    // fast animation test
		    var isAnimated = false;
		    eachChunk(bytes, function (type) {
		        return !(isAnimated = type === 'acTL');
		    });
		    if (!isAnimated) {
		        return errNotAPNG;
		    }

		    var preDataParts = [],
		        postDataParts = [];
		    var headerDataBytes = null,
		        frame = null,
		        frameNumber = 0,
		        apng = new _structs.APNG();

		    eachChunk(bytes, function (type, bytes, off, length) {
		        var dv = new DataView(bytes.buffer);
		        switch (type) {
		            case 'IHDR':
		                headerDataBytes = bytes.subarray(off + 8, off + 8 + length);
		                apng.width = dv.getUint32(off + 8);
		                apng.height = dv.getUint32(off + 12);
		                break;
		            case 'acTL':
		                apng.numPlays = dv.getUint32(off + 8 + 4);
		                break;
		            case 'fcTL':
		                if (frame) {
		                    apng.frames.push(frame);
		                    frameNumber++;
		                }
		                frame = new _structs.Frame();
		                frame.width = dv.getUint32(off + 8 + 4);
		                frame.height = dv.getUint32(off + 8 + 8);
		                frame.left = dv.getUint32(off + 8 + 12);
		                frame.top = dv.getUint32(off + 8 + 16);
		                var delayN = dv.getUint16(off + 8 + 20);
		                var delayD = dv.getUint16(off + 8 + 22);
		                if (delayD === 0) {
		                    delayD = 100;
		                }
		                frame.delay = 1000 * delayN / delayD;
		                // https://bugzilla.mozilla.org/show_bug.cgi?id=125137
		                // https://bugzilla.mozilla.org/show_bug.cgi?id=139677
		                // https://bugzilla.mozilla.org/show_bug.cgi?id=207059
		                if (frame.delay <= 10) {
		                    frame.delay = 100;
		                }
		                apng.playTime += frame.delay;
		                frame.disposeOp = dv.getUint8(off + 8 + 24);
		                frame.blendOp = dv.getUint8(off + 8 + 25);
		                frame.dataParts = [];
		                if (frameNumber === 0 && frame.disposeOp === 2) {
		                    frame.disposeOp = 1;
		                }
		                break;
		            case 'fdAT':
		                if (frame) {
		                    frame.dataParts.push(bytes.subarray(off + 8 + 4, off + 8 + length));
		                }
		                break;
		            case 'IDAT':
		                if (frame) {
		                    frame.dataParts.push(bytes.subarray(off + 8, off + 8 + length));
		                }
		                break;
		            case 'IEND':
		                postDataParts.push(subBuffer(bytes, off, 12 + length));
		                break;
		            default:
		                preDataParts.push(subBuffer(bytes, off, 12 + length));
		        }
		    });

		    if (frame) {
		        apng.frames.push(frame);
		    }

		    if (apng.frames.length == 0) {
		        return errNotAPNG;
		    }

		    var preBlob = new Blob(preDataParts),
		        postBlob = new Blob(postDataParts);

		    apng.frames.forEach(function (frame) {
		        var bb = [];
		        bb.push(PNGSignature);
		        headerDataBytes.set(makeDWordArray(frame.width), 0);
		        headerDataBytes.set(makeDWordArray(frame.height), 4);
		        bb.push(makeChunkBytes('IHDR', headerDataBytes));
		        bb.push(preBlob);
		        frame.dataParts.forEach(function (p) {
		            return bb.push(makeChunkBytes('IDAT', p));
		        });
		        bb.push(postBlob);
		        frame.imageData = new Blob(bb, { 'type': 'image/png' });
		        delete frame.dataParts;
		        bb = null;
		    });

		    return apng;
		}

		/**
		 * @param {Uint8Array} bytes
		 * @param {function(string, Uint8Array, int, int): boolean} callback
		 */
		function eachChunk(bytes, callback) {
		    var dv = new DataView(bytes.buffer);
		    var off = 8,
		        type = void 0,
		        length = void 0,
		        res = void 0;
		    do {
		        length = dv.getUint32(off);
		        type = readString(bytes, off + 4, 4);
		        res = callback(type, bytes, off, length);
		        off += 12 + length;
		    } while (res !== false && type != 'IEND' && off < bytes.length);
		}

		/**
		 *
		 * @param {Uint8Array} bytes
		 * @param {number} off
		 * @param {number} length
		 * @return {string}
		 */
		function readString(bytes, off, length) {
		    var chars = Array.prototype.slice.call(bytes.subarray(off, off + length));
		    return String.fromCharCode.apply(String, chars);
		}

		/**
		 *
		 * @param {string} x
		 * @return {Uint8Array}
		 */
		function makeStringArray(x) {
		    var res = new Uint8Array(x.length);
		    for (var i = 0; i < x.length; i++) {
		        res[i] = x.charCodeAt(i);
		    }
		    return res;
		}

		/**
		 * @param {Uint8Array} bytes
		 * @param {int} start
		 * @param {int} length
		 * @return {Uint8Array}
		 */
		function subBuffer(bytes, start, length) {
		    var a = new Uint8Array(length);
		    a.set(bytes.subarray(start, start + length));
		    return a;
		}

		/**
		 * @param {string} type
		 * @param {Uint8Array} dataBytes
		 * @return {Uint8Array}
		 */
		var makeChunkBytes = function makeChunkBytes(type, dataBytes) {
		    var crcLen = type.length + dataBytes.length;
		    var bytes = new Uint8Array(crcLen + 8);
		    var dv = new DataView(bytes.buffer);

		    dv.setUint32(0, dataBytes.length);
		    bytes.set(makeStringArray(type), 4);
		    bytes.set(dataBytes, 8);
		    var crc = (0, _crc2.default)(bytes, 4, crcLen);
		    dv.setUint32(crcLen + 4, crc);
		    return bytes;
		};

		var makeDWordArray = function makeDWordArray(x) {
		    return new Uint8Array([x >>> 24 & 0xff, x >>> 16 & 0xff, x >>> 8 & 0xff, x & 0xff]);
		};

	/***/ },
	/* 1 */
	/***/ function(module, exports) {

		"use strict";

		Object.defineProperty(exports, "__esModule", {
		    value: true
		});

		exports.default = function (bytes) {
		    var start = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
		    var length = arguments.length <= 2 || arguments[2] === undefined ? bytes.length - start : arguments[2];

		    var crc = -1;
		    for (var _i = start, l = start + length; _i < l; _i++) {
		        crc = crc >>> 8 ^ table[(crc ^ bytes[_i]) & 0xFF];
		    }
		    return crc ^ -1;
		};

		var table = new Uint32Array(256);

		for (var i = 0; i < 256; i++) {
		    var c = i;
		    for (var k = 0; k < 8; k++) {
		        c = (c & 1) !== 0 ? 0xEDB88320 ^ c >>> 1 : c >>> 1;
		    }
		    table[i] = c;
		}

		/**
		 *
		 * @param {Uint8Array} bytes
		 * @param {number} start
		 * @param {number} length
		 * @return {number}
		 */
		;

	/***/ },
	/* 2 */
	/***/ function(module, exports, __webpack_require__) {

		'use strict';

		Object.defineProperty(exports, "__esModule", {
		    value: true
		});
		exports.Frame = exports.APNG = undefined;

		var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

		var _player = __webpack_require__(3);

		var _player2 = _interopRequireDefault(_player);

		function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

		function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

		/**
		 * @property {number} currFrameNumber
		 * @property {Frame} currFrame
		 * @property {boolean} paused
		 * @property {boolean} ended
		 */
		var APNG = exports.APNG = function () {
		    function APNG() {
		        _classCallCheck(this, APNG);

		        this.width = 0;
		        this.height = 0;
		        this.numPlays = 0;
		        this.playTime = 0;
		        this.frames = [];
		    }
		    /** @type {number} */

		    /** @type {number} */

		    /** @type {number} */

		    /** @type {number} */

		    /** @type {Frame[]} */


		    _createClass(APNG, [{
		        key: 'createImages',


		        /**
		         *
		         * @return {Promise.<*>}
		         */
		        value: function createImages() {
		            return Promise.all(this.frames.map(function (f) {
		                return f.createImage();
		            }));
		        }

		        /**
		         *
		         * @param {CanvasRenderingContext2D} context
		         * @param {boolean} autoPlay
		         * @return {Promise.<Player>}
		         */

		    }, {
		        key: 'getPlayer',
		        value: function getPlayer(context) {
		            var _this = this;

		            var autoPlay = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

		            return this.createImages().then(function () {
		                return new _player2.default(_this, context, autoPlay);
		            });
		        }
		    }]);

		    return APNG;
		}();

		var Frame = exports.Frame = function () {
		    function Frame() {
		        _classCallCheck(this, Frame);

		        this.left = 0;
		        this.top = 0;
		        this.width = 0;
		        this.height = 0;
		        this.delay = 0;
		        this.disposeOp = 0;
		        this.blendOp = 0;
		        this.imageData = null;
		        this.imageElement = null;
		    }
		    /** @type {number} */

		    /** @type {number} */

		    /** @type {number} */

		    /** @type {number} */

		    /** @type {number} */

		    /** @type {number} */

		    /** @type {number} */

		    /** @type {Blob} */

		    /** @type {HTMLImageElement} */


		    _createClass(Frame, [{
		        key: 'createImage',
		        value: function createImage() {
		            var _this2 = this;

		            if (this.imageElement) {
		                return Promise.resolve();
		            }
		            return new Promise(function (resolve, reject) {
		                var url = URL.createObjectURL(_this2.imageData);
		                _this2.imageElement = document.createElement('img');
		                _this2.imageElement.onload = function () {
		                    URL.revokeObjectURL(url);
		                    resolve();
		                };
		                _this2.imageElement.onerror = function () {
		                    URL.revokeObjectURL(url);
		                    _this2.imageElement = null;
		                    reject(new Error("Image creation error"));
		                };
		                _this2.imageElement.src = url;
		            });
		        }
		    }]);

		    return Frame;
		}();

	/***/ },
	/* 3 */
	/***/ function(module, exports, __webpack_require__) {

		'use strict';

		Object.defineProperty(exports, "__esModule", {
		    value: true
		});

		var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

		var _events = __webpack_require__(4);

		var _events2 = _interopRequireDefault(_events);

		function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

		function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

		function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

		function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

		var _class = function (_EventEmitter) {
		    _inherits(_class, _EventEmitter);

		    /**
		     * @param {APNG} apng
		     * @param {CanvasRenderingContext2D} context
		     * @param {boolean} autoPlay
		     */

		    /** @type {boolean} */

		    /** @type {number} */

		    /** @type {Frame} */

		    /** @type {number} */
		    function _class(apng, context, autoPlay) {
		        _classCallCheck(this, _class);

		        var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this));

		        _this.playbackRate = 1.0;
		        _this._currentFrameNumber = 0;
		        _this._ended = false;
		        _this._paused = true;
		        _this._numPlays = 0;

		        _this._apng = apng;
		        _this.context = context;
		        _this.stop();
		        if (autoPlay) {
		            _this.play();
		        }
		        return _this;
		    }

		    /**
		     *
		     * @return {number}
		     */

		    /** @type {number} */


		    /** @type {boolean} */

		    /** @type {ImageData} */


		    /** @type {APNG} */

		    /** @type {CanvasRenderingContext2D} */


		    _createClass(_class, [{
		        key: 'renderNextFrame',
		        value: function renderNextFrame() {
		            this._currentFrameNumber = (this._currentFrameNumber + 1) % this._apng.frames.length;
		            if (this._currentFrameNumber === this._apng.frames.length - 1) {
		                this._numPlays++;
		                if (this._apng.numPlays !== 0 && this._numPlays >= this._apng.numPlays) {
		                    this.emit('end');
		                    this._ended = true;
		                    this._paused = true;
		                }
		            }

		            if (this._prevFrame && this._prevFrame.disposeOp == 1) {
		                this.context.clearRect(this._prevFrame.left, this._prevFrame.top, this._prevFrame.width, this._prevFrame.height);
		            } else if (this._prevFrame && this._prevFrame.disposeOp == 2) {
		                this.context.putImageData(this._prevFrameData, this._prevFrame.left, this._prevFrame.top);
		            }

		            var frame = this.currentFrame;
		            this._prevFrame = frame;
		            this._prevFrameData = null;
		            if (frame.disposeOp == 2) {
		                this._prevFrameData = this.context.getImageData(frame.left, frame.top, frame.width, frame.height);
		            }
		            if (frame.blendOp == 0) {
		                this.context.clearRect(frame.left, frame.top, frame.width, frame.height);
		            }

		            this.context.drawImage(frame.imageElement, frame.left, frame.top);
		        }

		        // playback

		    }, {
		        key: 'play',
		        value: function play() {
		            var _this2 = this;

		            this.emit('play');

		            if (this._ended) {
		                this.stop();
		            }
		            this._paused = false;

		            var nextRenderTime = performance.now() + this.currentFrame.delay / this.playbackRate;
		            var tick = function tick(now) {
		                if (_this2._ended || _this2._paused) {
		                    return;
		                }
		                if (now >= nextRenderTime) {
		                    while (now - nextRenderTime >= _this2._apng.playTime / _this2.playbackRate) {
		                        nextRenderTime += _this2._apng.playTime / _this2.playbackRate;
		                        _this2._numPlays++;
		                    }
		                    do {
		                        _this2.renderNextFrame();
		                        nextRenderTime += _this2.currentFrame.delay / _this2.playbackRate;
		                    } while (!_this2._ended && now > nextRenderTime);
		                }
		                requestAnimationFrame(tick);
		            };
		            requestAnimationFrame(tick);
		        }
		    }, {
		        key: 'pause',
		        value: function pause() {
		            if (!this._paused) {
		                this.emit('pause');
		                this._paused = true;
		            }
		        }
		    }, {
		        key: 'stop',
		        value: function stop() {
		            this.emit('stop');
		            this._numPlays = 0;
		            this._ended = false;
		            this._paused = true;
		            // render first frame
		            this._currentFrameNumber = -1;
		            this.context.clearRect(0, 0, this._apng.width, this._apng.height);
		            this.renderNextFrame();
		        }
		    }, {
		        key: 'currentFrameNumber',
		        get: function get() {
		            return this._currentFrameNumber;
		        }

		        /**
		         *
		         * @return {Frame}
		         */

		    }, {
		        key: 'currentFrame',
		        get: function get() {
		            return this._apng.frames[this._currentFrameNumber];
		        }
		    }, {
		        key: 'paused',
		        get: function get() {
		            return this._paused;
		        }
		    }, {
		        key: 'ended',
		        get: function get() {
		            return this._ended;
		        }
		    }]);

		    return _class;
		}(_events2.default);

		exports.default = _class;

	/***/ },
	/* 4 */
	/***/ function(module, exports) {

		// Copyright Joyent, Inc. and other Node contributors.
		//
		// Permission is hereby granted, free of charge, to any person obtaining a
		// copy of this software and associated documentation files (the
		// "Software"), to deal in the Software without restriction, including
		// without limitation the rights to use, copy, modify, merge, publish,
		// distribute, sublicense, and/or sell copies of the Software, and to permit
		// persons to whom the Software is furnished to do so, subject to the
		// following conditions:
		//
		// The above copyright notice and this permission notice shall be included
		// in all copies or substantial portions of the Software.
		//
		// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
		// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
		// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
		// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
		// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
		// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
		// USE OR OTHER DEALINGS IN THE SOFTWARE.

		function EventEmitter() {
		  this._events = this._events || {};
		  this._maxListeners = this._maxListeners || undefined;
		}
		module.exports = EventEmitter;

		// Backwards-compat with node 0.10.x
		EventEmitter.EventEmitter = EventEmitter;

		EventEmitter.prototype._events = undefined;
		EventEmitter.prototype._maxListeners = undefined;

		// By default EventEmitters will print a warning if more than 10 listeners are
		// added to it. This is a useful default which helps finding memory leaks.
		EventEmitter.defaultMaxListeners = 10;

		// Obviously not all Emitters should be limited to 10. This function allows
		// that to be increased. Set to zero for unlimited.
		EventEmitter.prototype.setMaxListeners = function(n) {
		  if (!isNumber(n) || n < 0 || isNaN(n))
		    throw TypeError('n must be a positive number');
		  this._maxListeners = n;
		  return this;
		};

		EventEmitter.prototype.emit = function(type) {
		  var er, handler, len, args, i, listeners;

		  if (!this._events)
		    this._events = {};

		  // If there is no 'error' event listener then throw.
		  if (type === 'error') {
		    if (!this._events.error ||
		        (isObject(this._events.error) && !this._events.error.length)) {
		      er = arguments[1];
		      if (er instanceof Error) {
		        throw er; // Unhandled 'error' event
		      } else {
		        // At least give some kind of context to the user
		        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
		        err.context = er;
		        throw err;
		      }
		    }
		  }

		  handler = this._events[type];

		  if (isUndefined(handler))
		    return false;

		  if (isFunction(handler)) {
		    switch (arguments.length) {
		      // fast cases
		      case 1:
		        handler.call(this);
		        break;
		      case 2:
		        handler.call(this, arguments[1]);
		        break;
		      case 3:
		        handler.call(this, arguments[1], arguments[2]);
		        break;
		      // slower
		      default:
		        args = Array.prototype.slice.call(arguments, 1);
		        handler.apply(this, args);
		    }
		  } else if (isObject(handler)) {
		    args = Array.prototype.slice.call(arguments, 1);
		    listeners = handler.slice();
		    len = listeners.length;
		    for (i = 0; i < len; i++)
		      listeners[i].apply(this, args);
		  }

		  return true;
		};

		EventEmitter.prototype.addListener = function(type, listener) {
		  var m;

		  if (!isFunction(listener))
		    throw TypeError('listener must be a function');

		  if (!this._events)
		    this._events = {};

		  // To avoid recursion in the case that type === "newListener"! Before
		  // adding it to the listeners, first emit "newListener".
		  if (this._events.newListener)
		    this.emit('newListener', type,
		              isFunction(listener.listener) ?
		              listener.listener : listener);

		  if (!this._events[type])
		    // Optimize the case of one listener. Don't need the extra array object.
		    this._events[type] = listener;
		  else if (isObject(this._events[type]))
		    // If we've already got an array, just append.
		    this._events[type].push(listener);
		  else
		    // Adding the second element, need to change to array.
		    this._events[type] = [this._events[type], listener];

		  // Check for listener leak
		  if (isObject(this._events[type]) && !this._events[type].warned) {
		    if (!isUndefined(this._maxListeners)) {
		      m = this._maxListeners;
		    } else {
		      m = EventEmitter.defaultMaxListeners;
		    }

		    if (m && m > 0 && this._events[type].length > m) {
		      this._events[type].warned = true;
		      console.error('(node) warning: possible EventEmitter memory ' +
		                    'leak detected. %d listeners added. ' +
		                    'Use emitter.setMaxListeners() to increase limit.',
		                    this._events[type].length);
		      if (typeof console.trace === 'function') {
		        // not supported in IE 10
		        console.trace();
		      }
		    }
		  }

		  return this;
		};

		EventEmitter.prototype.on = EventEmitter.prototype.addListener;

		EventEmitter.prototype.once = function(type, listener) {
		  if (!isFunction(listener))
		    throw TypeError('listener must be a function');

		  var fired = false;

		  function g() {
		    this.removeListener(type, g);

		    if (!fired) {
		      fired = true;
		      listener.apply(this, arguments);
		    }
		  }

		  g.listener = listener;
		  this.on(type, g);

		  return this;
		};

		// emits a 'removeListener' event iff the listener was removed
		EventEmitter.prototype.removeListener = function(type, listener) {
		  var list, position, length, i;

		  if (!isFunction(listener))
		    throw TypeError('listener must be a function');

		  if (!this._events || !this._events[type])
		    return this;

		  list = this._events[type];
		  length = list.length;
		  position = -1;

		  if (list === listener ||
		      (isFunction(list.listener) && list.listener === listener)) {
		    delete this._events[type];
		    if (this._events.removeListener)
		      this.emit('removeListener', type, listener);

		  } else if (isObject(list)) {
		    for (i = length; i-- > 0;) {
		      if (list[i] === listener ||
		          (list[i].listener && list[i].listener === listener)) {
		        position = i;
		        break;
		      }
		    }

		    if (position < 0)
		      return this;

		    if (list.length === 1) {
		      list.length = 0;
		      delete this._events[type];
		    } else {
		      list.splice(position, 1);
		    }

		    if (this._events.removeListener)
		      this.emit('removeListener', type, listener);
		  }

		  return this;
		};

		EventEmitter.prototype.removeAllListeners = function(type) {
		  var key, listeners;

		  if (!this._events)
		    return this;

		  // not listening for removeListener, no need to emit
		  if (!this._events.removeListener) {
		    if (arguments.length === 0)
		      this._events = {};
		    else if (this._events[type])
		      delete this._events[type];
		    return this;
		  }

		  // emit removeListener for all listeners on all events
		  if (arguments.length === 0) {
		    for (key in this._events) {
		      if (key === 'removeListener') continue;
		      this.removeAllListeners(key);
		    }
		    this.removeAllListeners('removeListener');
		    this._events = {};
		    return this;
		  }

		  listeners = this._events[type];

		  if (isFunction(listeners)) {
		    this.removeListener(type, listeners);
		  } else if (listeners) {
		    // LIFO order
		    while (listeners.length)
		      this.removeListener(type, listeners[listeners.length - 1]);
		  }
		  delete this._events[type];

		  return this;
		};

		EventEmitter.prototype.listeners = function(type) {
		  var ret;
		  if (!this._events || !this._events[type])
		    ret = [];
		  else if (isFunction(this._events[type]))
		    ret = [this._events[type]];
		  else
		    ret = this._events[type].slice();
		  return ret;
		};

		EventEmitter.prototype.listenerCount = function(type) {
		  if (this._events) {
		    var evlistener = this._events[type];

		    if (isFunction(evlistener))
		      return 1;
		    else if (evlistener)
		      return evlistener.length;
		  }
		  return 0;
		};

		EventEmitter.listenerCount = function(emitter, type) {
		  return emitter.listenerCount(type);
		};

		function isFunction(arg) {
		  return typeof arg === 'function';
		}

		function isNumber(arg) {
		  return typeof arg === 'number';
		}

		function isObject(arg) {
		  return typeof arg === 'object' && arg !== null;
		}

		function isUndefined(arg) {
		  return arg === void 0;
		}


	/***/ }
	/******/ ])
	});
	;

/***/ }
/******/ ]);