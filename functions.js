export function setGrayscale(data) {
    for (let i = 0; i < data.length; i = i + 4) {
        const val = 0.299 * data[i] + 0.587 * data[i] + 0.114 * data[i];
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        continue;
    }
}

export function setTreshold(data, threshold) {
    for (let i = 0; i < data.length; i = i + 4) {
        let val = 0.299 * data[i] + 0.587 * data[i] + 0.114 * data[i];
        val = val > threshold ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        continue;
    }
}

export function removeColorChannels(data, colorObject) {
    const arr = ["red", "green", "blue"];
    for (let i = 0; i < data.length; i++) {
        if ((i + 1) % 4 === 0) continue;

        data[i] = colorObject[arr[i % 4]] ? 0 : data[i];
    }
}

export function enhanceColorChannel(data, colorObject) {
    const arr = ["red", "green", "blue"];
    for (let i = 0; i < data.length; i++) {
        if ((i + 1) % 4 === 0) continue;

        data[i] = colorObject[arr[i % 4]] ? 255 : data[i];
    }
}

export function setBrightness(data, brightness) {
    for (let i = 0; i < data.length; i++) {
        if ((i + 1) % 4 === 0) continue;

        data[i] = brightness * data[i];
    }
}

export function convertTo2D(data, imgWidth) {
    const objectArr = [[]];

    let row = 0;
    for (let i = 0; i < data.length; i = i + 4) {
        objectArr[row].push({
            R: data[i],
            G: data[i + 1],
            B: data[i + 2],
            A: data[i + 3],
        });

        if (i / 4 === imgWidth * (row + 1)) {
            objectArr.push([]);
            row++;
        }
    }

    return objectArr;
}

export function convertToOriginal(objectArr, data) {
    // const data = [];
    let i = 0;
    objectArr.forEach((el) => {
        el.forEach((value) => {
            data[i] = value.R;
            data[i + 1] = value.G;
            data[i + 2] = value.B;
            data[i + 3] = value.A;
            i += 4;
        });
    });
}

export function applyBlur(data, imgWidth, matrix, div) {
    let objectArr = convertTo2D(data, imgWidth);

    const arr = objectArr.map((el, y) => {
        return el.map((value, x) => {
            const edgeOffset = (matrix.length - 1) / 2;
            if (
                y + edgeOffset >= objectArr.length - 1 ||
                x + edgeOffset >= el.length - 1 ||
                x < edgeOffset ||
                y < edgeOffset
            )
                return value;

            const color = { R: 0, G: 0, B: 0, A: 255 };

            matrix.forEach((m, my) => {
                m.forEach((mult, mx) => {
                    const pixel =
                        objectArr[y + my - edgeOffset][x + mx - edgeOffset];
                    color.R += pixel.R * mult;
                    color.G += pixel.G * mult;
                    color.B += pixel.B * mult;
                });
            });

            for (const [key, value] of Object.entries(color)) {
                if (key === "A") continue;

                color[key] = Math.floor(value / div);
            }

            return color;
        });
    });

    return arr;
}

export function applyMatrix(data, imgWidth, matrix) {
    let objectArr = convertTo2D(data, imgWidth);

    const arr = objectArr.map((el, y) => {
        return el.map((value, x) => {
            const edgeOffset = (matrix.length - 1) / 2;
            if (
                y + edgeOffset >= objectArr.length - 1 ||
                x + edgeOffset >= el.length - 1 ||
                x < edgeOffset ||
                y < edgeOffset
            )
                return value;

            const color = { R: 0, G: 0, B: 0, A: 255 };

            matrix.forEach((m, my) => {
                m.forEach((mult, mx) => {
                    const pixel =
                        objectArr[y + my - edgeOffset][x + mx - edgeOffset];

                    const brightness =
                        0.299 * pixel.R + 0.587 * pixel.G + 0.114 * pixel.B;
                    const val = brightness * mult;

                    color.R += val;
                    color.G += val;
                    color.B += val;
                });
            });

            for (const [key, value] of Object.entries(color)) {
                if (key === "A") continue;

                color[key] = Math.floor(value);

                if (value > 255) color[key] = 255;
                else if (value < 0) color[key] = 0;
            }

            return color;
        });
    });

    return arr;
}

export function sharpening(data, imgWidth) {
    const laplaceOperator = [
        [0, 1, 0],
        [1, -4, 1],
        [0, 1, 0],
    ];

    const originalImg = convertTo2D(data, imgWidth);
    const appliedLaplace = applyMatrix(data, imgWidth, laplaceOperator);

    const output = subtractImages(originalImg, appliedLaplace);

    return output;
}

export function unsharpMasking(data, imgWidth) {
    const gaussian = [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1],
    ];

    const originalImg = convertTo2D(data, imgWidth);
    const appliedBlur = applyBlur(data, imgWidth, gaussian, 16);

    const substitution = subtractImages(originalImg, appliedBlur);

    const output = sumImages(originalImg, substitution);

    return output;
}

export function subtractImages(img1, img2) {
    const output = [];

    for (let i = 0; i < img1.length; i++) {
        output.push([]);

        for (let j = 0; j < img1[i].length; j++) {
            const color = { R: 0, G: 0, B: 0, A: 255 };

            for (const [key, value] of Object.entries(color)) {
                if (key === "A") continue;

                color[key] = img1[i][j][key] - img2[i][j][key];

                if (color[key] > 255) color[key] = 255;
                else if (color[key] < 0) color[key] = 0;
            }

            output[i].push(color);
        }
    }

    return output;
}

export function sumImages(img1, img2) {
    const output = [];

    for (let i = 0; i < img1.length; i++) {
        output.push([]);

        for (let j = 0; j < img1[i].length; j++) {
            const color = { R: 0, G: 0, B: 0, A: 255 };

            for (const [key, value] of Object.entries(color)) {
                if (key === "A") continue;

                color[key] = img1[i][j][key] + img2[i][j][key];

                if (color[key] > 255) color[key] = 255;
                else if (color[key] < 0) color[key] = 0;
            }

            output[i].push(color);
        }
    }

    return output;
}

export function generateBucketsByColor(data, imgWidth, numOfBuckets, colorKey) {
    const originalImg = convertTo2D(data, imgWidth);

    const bucketSize = 255 / numOfBuckets;

    if (Math.floor(bucketSize) !== bucketSize) {
        alert("Invalid num of buckets");
        return;
    }

    const buckets = { R: [], G: [], B: [] };

    for (let k = 0; k < numOfBuckets; k++) {
        const startVal = k === 0 ? bucketSize * k : bucketSize * k + 1;
        const endVal = startVal + bucketSize - 1;

        const valCount = { R: 0, G: 0, B: 0 };

        for (let i = 0; i < originalImg.length; i++) {
            for (let j = 0; j < originalImg[i].length; j++) {
                if (
                    originalImg[i][j]["R"] >= startVal &&
                    originalImg[i][j]["R"] <= endVal
                )
                    valCount.R++;

                if (
                    originalImg[i][j]["G"] >= startVal &&
                    originalImg[i][j]["G"] <= endVal
                )
                    valCount.G++;

                if (
                    originalImg[i][j]["B"] >= startVal &&
                    originalImg[i][j]["B"] <= endVal
                )
                    valCount.B++;
            }
        }

        for (const [key, value] of Object.entries(buckets)) {
            buckets[key].push({
                label: `${startVal}-${endVal}`,
                y: valCount[key],
                x: k,
            });
        }
    }

    return buckets;
}