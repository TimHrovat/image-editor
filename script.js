import { updateChart } from "./chart.js";

const fileInput = document.getElementById("file-input");
const img = document.getElementById("pic");
const finalImg = document.getElementById("final-img");
const applyBtn = document.getElementById("btn");
const btnUndo = document.getElementById("btn-undo");
const brightnessInput = document.getElementById("brightness-input");
const btnRemoveAll = document.getElementById("btn-remove-all");
const filterButtons = document.querySelectorAll(".apply-filter-button");
const btnRemoveRect = document.getElementById("btn-remove-rect");
const stackContainer = document.getElementById("stack-container");
const matrixInput = document.getElementById("matrix-input");
let stack = [];
let x, y, oldx, oldy;
let showDrag = false;
let useRect = true;

matrixInput.addEventListener("change", (e) => {
    const matrixContainer = document.getElementById("matrix-container");

    if (e.currentTarget.value % 2 !== 1) {
        return;
    }

    while (matrixContainer.firstChild) {
        matrixContainer.removeChild(matrixContainer.lastChild);
    }

    const table = document.createElement("table");
    table.classList.add("mb-3");

    for (let i = 0; i < Number(e.currentTarget.value); i++) {
        const tr = document.createElement("tr");
        for (let j = 0; j < Number(e.currentTarget.value); j++) {
            const td = document.createElement("td");
            const input = document.createElement("input");

            input.classList.add("matrix-field");
            input.type = "number";

            td.appendChild(input);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    matrixContainer.appendChild(table);

    const btn = document.createElement("btn");

    btn.classList.add("btn-default", "mb-3");
    btn.innerHTML = "apply matrix";

    btn.addEventListener("click", () => {
        let table = matrixContainer.firstChild;

        const matrixArray = [];

        for (let i = 0, row; (row = table.rows[i]); i++) {
            matrixArray.push([]);
            for (let j = 0, col; (col = row.cells[j]); j++) {
                if (col.firstChild.value === "") {
                    return;
                }
                matrixArray[i].push(Number(col.firstChild.value));
            }
        }

        const stackItem = {
            name: "custom-matrix",
            customMatrix: matrixArray,
        };

        stack.push(stackItem);
        const stackElement = document.createElement("div");
        stackElement.innerHTML = stack.length + " - custom matrix";
        stackContainer.appendChild(stackElement);
        updateFilterCount();
    });

    matrixContainer.appendChild(btn);
});

window.addEventListener("load", () => {
    let bbox = document.getElementById("bbox");
    bbox.style.display = "none";
    btnRemoveRect.style.display = "none";
});

btnRemoveRect.addEventListener("click", () => {
    resetRectSelect();
});

fileInput.addEventListener("change", (e) => {
    img.src = URL.createObjectURL(e.target.files[0]);
    finalImg.src = "";
    const fileContainer =
        document.getElementsByClassName("filter-container")[0];
    fileContainer.classList.remove("hidden");
    fileContainer.classList.add("source_provided");
    resetRectSelect();
});

brightnessInput.addEventListener("change", (e) => {
    const span = document.getElementById("brightness-val");
    span.innerHTML = e.target.value;
});

filterButtons.forEach((filterButton) => {
    filterButton.addEventListener("click", (e) => {
        const stackItem = {
            name: e.target.getAttribute("data-fname"),
            customMatrix: null,
        };

        stack.push(stackItem);
        const stackElement = document.createElement("div");
        stackElement.innerHTML =
            stack.length + " - " + e.target.getAttribute("data-fname");
        stackContainer.appendChild(stackElement);
        updateFilterCount();
    });
});

btnRemoveAll.addEventListener("click", () => {
    stack = [];
    updateFilterCount();
    while (stackContainer.firstChild) {
        stackContainer.removeChild(stackContainer.lastChild);
    }
});

btnUndo.addEventListener("click", () => {
    stack.pop();
    stackContainer.removeChild(stackContainer.lastChild);
    updateFilterCount();
});

applyBtn.addEventListener("click", async () => {
    if (img.src === "") return;

    if (finalImg.lastChild) finalImg.removeChild(finalImg.lastChild);

    finalImg.classList.add("hidden");

    finalImg.src = "";

    showLoader();
    applyBtn.disabled = true;

    await useWorker();
});

async function useWorker() {
    new Promise((resolve, reject) => {
        const tmpCanvas = document.createElement("canvas");
        const tmpCtx = tmpCanvas.getContext("2d");

        let tmpOldx = oldx;
        let tmpOldy = oldy;
        let tmpx = x;
        let tmpy = y;

        if (tmpOldx > tmpx) {
            let tmp = tmpOldx;
            tmpOldx = tmpx;
            tmpx = tmp;
        }

        if (tmpOldy > tmpy) {
            let tmp = tmpOldy;
            tmpOldy = tmpy;
            tmpy = tmp;
        }

        tmpOldx -= 29;
        tmpOldy -= 100;
        tmpx -= 29;
        tmpy -= 100;

        const ratioH = img.naturalHeight / img.height;
        const ratioW = img.naturalWidth / img.width;

        tmpCanvas.height = useRect
            ? Math.floor((tmpy - tmpOldy) * ratioH)
            : img.naturalHeight;
        tmpCanvas.width = useRect
            ? Math.floor((tmpx - tmpOldx) * ratioW)
            : img.naturalWidth;

        tmpCtx.drawImage(
            img,
            useRect ? Math.floor(tmpOldx * ratioW) : 0,
            useRect ? Math.floor(tmpOldy * ratioH) : 0,
            tmpCanvas.width,
            tmpCanvas.height,
            0,
            0,
            tmpCanvas.width,
            tmpCanvas.height
        );

        const imgData = tmpCtx.getImageData(
            0,
            0,
            tmpCanvas.width,
            tmpCanvas.height
        ); //podatki o sliki

        const worker = new Worker("worker.js", { type: "module" });

        worker.postMessage([
            imgData.data,
            useRect ? Math.floor((tmpx - tmpOldx) * ratioW) : img.naturalWidth,
            brightnessInput.value,
            stack,
        ]);

        worker.onmessage = (e) => {
            imgData.data.set(e.data);

            tmpCtx.putImageData(imgData, 0, 0);

            const image = new Image();
            image.src = tmpCanvas.toDataURL();
            finalImg.appendChild(image);

            updateChart(imgData.data, tmpCanvas.width);

            document.getElementById("loader").setAttribute("attr", "hidden");

            applyBtn.disabled = false;
            hideLoader();
            finalImg.classList.remove("hidden");
        };
    });
}

function showLoader() {
    const loader = document.getElementById("loader");
    loader.style.width = `${img.width}px`;
    loader.style.height = `${img.height}px`;
    loader.classList.remove("hidden");
    loader.classList.add("block");
}

function hideLoader() {
    const loader = document.getElementById("loader");
    loader.classList.add("hidden");
    loader.classList.remove("block");
}

function updateFilterCount() {
    const span = document.getElementById("filter-cnt");
    span.innerHTML = stack.length;
}

function resetRectSelect() {
    let bbox = document.getElementById("bbox");
    showDrag = false;
    oldx = oldy = x = y = undefined;
    bbox.style.display = "none";
    useRect = false;
    btnRemoveRect.style.display = "none";
}

document.getElementById("cont").addEventListener("mousedown", function (e) {
    oldx = e.clientX;
    oldy = e.clientY;
    showDrag = true;
    e.preventDefault();
});

document.getElementById("cont").addEventListener("mousemove", function (e) {
    if (showDrag == true) {
        useRect = true;
        btnRemoveRect.style.display = "inline-block";

        x = e.clientX;
        y = e.clientY;
        let bbox = document.getElementById("bbox");
        let contbox = document.getElementById("cont");

        let w = x > oldx ? x - oldx : oldx - x;
        let h = y > oldy ? y - oldy : oldy - y;
        let addx = 0,
            addy = 0;

        if (x < oldx) {
            addx = w;
        }
        if (y < oldy) {
            addy = h;
        }
        bbox.style.left = oldx - parseInt(contbox.offsetLeft + addx) + "px";
        bbox.style.top = oldy - parseInt(contbox.offsetTop + addy) + "px";
        bbox.style.width = w + "px";
        bbox.style.height = h + "px";
        bbox.style.display = "block";
    }
    e.preventDefault();
});

document.getElementById("cont").addEventListener("mouseup", function (e) {
    showDrag = false;
    e.preventDefault();
});
