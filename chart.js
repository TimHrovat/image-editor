import { generateBucketsByColor } from "./functions.js";

export function updateChart(data, width) {
    const buckets = generateBucketsByColor(data, width, 5);

    var chart = new CanvasJS.Chart("chart-container", {
        backgroundColor: "#282828",
        animationEnabled: true,
        title: {
            text: "Histogram",
            fontColor: "#fff",
        },
        axisX: {
            title: "Buckets",
            fontColor: "#fff",
            titleFontColor: "#fff",
            labelFontColor: "#fff",
            tickColor: "#fff",
        },
        axisY: {
            title: "Histogram",
            titleFontColor: "#fff",
            lineColor: "#fff",
            labelFontColor: "#fff",
            tickColor: "#fff",
            fontColor: "#fff",
        },
        data: [
            {
                type: "column",
                name: "red",
                legendText: "red",
                color: "red",
                // showInLegend: true,
                dataPoints: buckets["R"],
            },
            {
                type: "column",
                name: "green",
                legendText: "green",
                color: "green",
                // showInLegend: true,
                dataPoints: buckets["G"],
            },
            {
                type: "column",
                name: "blue",
                legendText: "blue",
                color: "blue",
                // showInLegend: true,
                dataPoints: buckets["B"],
            },
        ],
    });

    chart.render();
}
