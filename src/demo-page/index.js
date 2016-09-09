import apng2webp from '../library/index';

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/png';

document.getElementById('choose-btn').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        processFile(fileInput.files[0]);
    }
    fileInput.value = '';
});

function processFile(file) {
    const resultBlock = document.getElementById('result');
    const errorBlock = document.getElementById('error');
    const resultCont = document.getElementById('result-img');

    resultBlock.classList.add('hidden');
    errorBlock.classList.add('hidden');
    emptyEl(resultCont);
    emptyEl(errorBlock);

    const reader = new FileReader();
    reader.onload = () => {
        apng2webp(reader.result)
            .then(blob => {
                resultBlock.classList.remove('hidden');

                const url = URL.createObjectURL(blob);
                const img = new Image();
                const a = document.createElement('a');
                a.href = url;
                a.download = 'webp.webp';
                a.appendChild(img);
                resultCont.appendChild(a);
                // img.onload = function () { URL.revokeObjectURL(url); };
                img.src = url;
            })
            .catch(err => {
                errorBlock.classList.remove('hidden');
                errorBlock.appendChild(document.createTextNode(err.message));
            });
    };
    reader.readAsArrayBuffer(file);
}

function emptyEl(el) {
    let c;
    while ((c = el.firstChild) !== null) {
        el.removeChild(c);
    }
}

function playAPNG(apng, context) {
    const rnd = new Renderer(apng, context);
    let numPlays = 0;
    let nextRenderTime = performance.now() + rnd.currFrame().delay;
    let stop = false;
    const tick = now => {
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
    return () => stop = true;
}