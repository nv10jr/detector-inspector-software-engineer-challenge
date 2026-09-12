import { ChartJSNodeCanvas } from "chartjs-node-canvas";

const WIDTH = 800;
const HEIGHT = 600;

/**
 * x-axis is row order (1..N), not a correlated date/label column — the
 * challenge only asks to plot "the values in the numeric column", and
 * pairing them with a second, separately-detected column is out of scope
 * for this pass (see SOLUTION.md "next steps").
 */
export async function generateChartPng(values: number[], label: string): Promise<Buffer> {
  if (values.length === 0) {
    throw new Error("No numeric values to chart.");
  }

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: WIDTH,
    height: HEIGHT,
    backgroundColour: "white",
  });

  const buffer = await chartJSNodeCanvas.renderToBuffer({
    type: "line",
    data: {
      labels: values.map((_, i) => String(i + 1)),
      datasets: [
        {
          label,
          data: values,
          borderColor: "#2563eb",
          backgroundColor: "#2563eb",
          pointRadius: 3,
          fill: false,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: label },
        legend: { display: false },
      },
      scales: {
        x: { title: { display: true, text: "Row order" } },
        y: { title: { display: true, text: label } },
      },
    },
  });

  return buffer;
}
