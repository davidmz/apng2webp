import parseAPNG from 'apng-js';

const ANIMATION_FLAG = 0x2,
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
export default function (apngData) {
    const apng = parseAPNG(apngData);
    if (apng instanceof Error) {
        return Promise.reject(apng);
    }

    const apngCanvas = document.createElement('canvas');
    apngCanvas.width = apng.width;
    apngCanvas.height = apng.height;

    return apng
        .getPlayer(apngCanvas.getContext('2d'))
        .then(player => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const tlChunks = [];

            tlChunks.push(createChunk('VP8X', new Blob([
                int32ToArray(ANIMATION_FLAG | ALPHA_FLAG),
                int24ToArray(apng.width - 1),
                int24ToArray(apng.height - 1)
            ])));
            tlChunks.push(createChunk('ANIM', new Blob([
                int32ToArray(0),
                int16ToArray(apng.numPlays)
            ])));

            const frameChunks = new Array(apng.frames.length);

            function makeFrame() {
                const frame = player.currentFrame;
                const prevFrame = apng.frames[Math.max(0, player.currentFrameNumber - 1)];

                let top = Math.min(frame.top, prevFrame.top),
                    left = Math.min(frame.left, prevFrame.left),
                    bottom = Math.max(frame.top + frame.height, prevFrame.top + prevFrame.height),
                    right = Math.max(frame.left + frame.width, prevFrame.left + prevFrame.width);

                if ((top & 1) === 1) {
                    top--;
                }
                if ((left & 1) === 1) {
                    left--;
                }
                const width = right - left,
                    height = bottom - top;

                const aChunk = [
                    int24ToArray(left >> 1),
                    int24ToArray(top >> 1),
                    int24ToArray(width - 1),
                    int24ToArray(height - 1),
                    int24ToArray(frame.delay),
                    new Uint8Array([MUX_NO_BLEND])
                ];

                canvas.width = width;
                canvas.height = height;
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(apngCanvas, left, top, width, height, 0, 0, width, height);

                return toBlobPromise(canvas, 'image/webp', 1.0)
                    .then(blob => {
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

            return seq(makeFrame).then(() => {
                Array.prototype.push.apply(tlChunks, frameChunks);
                return withWebPHeader(new Blob(tlChunks));
            });
        });
}

/**
 * @param {string} fourCC
 * @param {Blob} data
 * @return {Blob}
 */
function createChunk(fourCC, data) {
    return new Blob([stringToArray(fourCC), int32ToArray(data.size), data]);
}

function int32ToArray(x) {
    return new Uint8Array([
        (x >>> 0) & 0xff,
        (x >>> 8) & 0xff,
        (x >>> 16) & 0xff,
        (x >>> 24) & 0xff
    ]);
}

function int24ToArray(x) {
    return new Uint8Array([
        (x >>> 0) & 0xff,
        (x >>> 8) & 0xff,
        (x >>> 16) & 0xff
    ]);
}

function int16ToArray(x) {
    return new Uint8Array([
        (x >>> 0) & 0xff,
        (x >>> 8) & 0xff
    ]);
}

function stringToArray(x) {
    return new Uint8Array([...x].map(c => c.charCodeAt(0) & 0xff));
}

/**
 * @param {Blob} data
 * @return {Blob}
 */
function withWebPHeader(data) {
    return new Blob([
        stringToArray('RIFF'),
        int32ToArray(data.size + 4),
        stringToArray('WEBP'),
        data
    ], {type: 'image/webp'});
}

/**
 * @param {function(): Promise.<boolean>} foo
 * @return {Promise.<boolean>}
 */
function seq(foo) {
    return foo().then(x => x ? seq(foo) : false);
}

function toBlobPromise(canvas, mimeType = undefined, quality = undefined) {
    return new Promise(yes => canvas.toBlob(yes, mimeType, quality));
}
