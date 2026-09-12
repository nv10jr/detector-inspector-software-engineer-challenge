import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { registerFont } from "canvas";
import * as path from "node:path";

const WIDTH = 800;
const HEIGHT = 600;
const FONT_FAMILY = "ChartFont";

// A serverless deploy (Vercel) has no system fonts installed at all, unlike
// a local machine - without a bundled font, Cairo has no glyphs to draw and
// every label renders as tofu boxes. Roboto (OFL-1.1, see assets/fonts/OFL.txt)
// bundled here so text renders identically everywhere. Path is built from
// process.cwd() (not __dirname) because that's what next.config.ts's
// outputFileTracingIncludes uses to decide what ships in the deployed
// function - see the matching entry there for canvas's own native binary.
export const FONT_PATH = path.join(process.cwd(), "src/lib/assets/fonts/Roboto-Regular.ttf");

let fontRegistered = false;
function ensureFontRegistered() {
  if (fontRegistered) return;
  registerFont(FONT_PATH, { family: FONT_FAMILY });
  fontRegistered = true;
}

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

  ensureFontRegistered();

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: WIDTH,
    height: HEIGHT,
    backgroundColour: "white",
    chartCallback: (ChartJS) => {
      ChartJS.defaults.font.family = FONT_FAMILY;
    },
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
