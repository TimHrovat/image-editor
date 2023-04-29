import {
    setGrayscale,
    setTreshold,
    removeColorChannels,
    enhanceColorChannel,
    convertToOriginal,
    applyBlur,
    applyMatrix,
    sharpening,
    unsharpMasking,
    setBrightness,
    sumImages,
} from "./functions.js";

onmessage = (e) => {
    let data = e.data[0];
    let width = e.data[1];
    let brightness = e.data[2];

    e.data[3].forEach((el) => {
        switch (el["name"]) {
            case "grayscale":
                setGrayscale(data);
                break;
            case "threshold":
                setTreshold(data, 128);
                break;
            case "box-blur":
                const blur = applyBlur(
                    data,
                    width,
                    [
                        [1, 2, 1],
                        [2, 4, 2],
                        [1, 2, 1],
                    ],
                    16
                );
                convertToOriginal(blur, data);
                break;
            case "sharpening":
                const sharpenedImg = sharpening(data, width);
                convertToOriginal(sharpenedImg, data);
                break;
            case "unsharp-masking":
                const unsharpedImg = unsharpMasking(data, width);
                convertToOriginal(unsharpedImg, data);
                break;
            case "rc-red":
            case "rc-green":
            case "rc-blue":
                removeColorChannels(data, {
                    red: el["name"].split("-")[1] === "red" ? true : false,
                    green: el["name"].split("-")[1] === "green" ? true : false,
                    blue: el["name"].split("-")[1] === "blue" ? true : false,
                });
                break;
            case "ec-red":
            case "ec-green":
            case "ec-blue":
                enhanceColorChannel(data, {
                    red: el["name"].split("-")[1] === "red" ? true : false,
                    green: el["name"].split("-")[1] === "green" ? true : false,
                    blue: el["name"].split("-")[1] === "blue" ? true : false,
                });
                break;
            case "laplacian":
                const appliedMatrix = applyMatrix(data, width, [
                    [0, 1, 0],
                    [1, -4, 1],
                    [0, 1, 0],
                ]);
                convertToOriginal(appliedMatrix, data);
                break;
            case "sobel":
                const sobelLeft = applyMatrix(data, width, [
                    [-1, 0, 1],
                    [-2, 0, 2],
                    [-1, 0, 1],
                ]);
                const sobelUp = applyMatrix(data, width, [
                    [-1, -2, -1],
                    [0, 0, 0],
                    [1, 2, 1],
                ]);
                convertToOriginal(sumImages(sobelLeft, sobelUp), data);
                break;
            case "custom-matrix":
                const matrix = applyMatrix(data, width, el["customMatrix"]);
                convertToOriginal(matrix, data);
                break;
        }
    });

    setBrightness(data, Number(brightness));

    postMessage(data);
};

export {};
