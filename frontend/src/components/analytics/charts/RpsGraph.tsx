import { enUS } from "date-fns/locale";
import { createEffect, createSignal } from "solid-js";
import { Chart } from "chart.js/auto";
import { parseCustomDateString } from "./LatencyGraph";

interface RpsGraphProps {
  params: {
    filter: AnalyticsFilter;
    granularity: AnalyticsParams["granularity"];
  };
}

import "chartjs-adapter-date-fns";
import { AnalyticsFilter, AnalyticsParams, RpsDatapoint } from "../../../types";
import { getRps } from "../api/analytics";

export const RpsGraph = (props: RpsGraphProps) => {
  const [canvasElement, setCanvasElement] = createSignal<HTMLCanvasElement>();
  const [rpsGraphPoints, setRpsGraphPoints] = createSignal<RpsDatapoint[]>([]);
  let chartInstance: Chart | null = null;

  createEffect(async () => {
    let results = await getRps(props.params.filter, props.params.granularity);
    setRpsGraphPoints(results);
  });

  createEffect(() => {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    const canvas = canvasElement();
    const data = rpsGraphPoints();
    if (!canvas || !data) return;

    if (!chartInstance) {
      // Create the chart only if it doesn't exist
      chartInstance = new Chart(canvas, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Requests",
              data: [],
              borderColor: "purple",
              pointBackgroundColor: "purple",
              backgroundColor: "rgba(128, 0, 128, 0.1)", // Light purple background
              borderWidth: 1,
            },
          ],
        },
        options: {
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              grid: { color: "rgba(128, 0, 128, 0.1)" }, // Light purple grid
              title: {
                text: "Rps",
                display: true,
              },
              beginAtZero: true,
            },
            x: {
              adapters: {
                date: {
                  locale: enUS,
                },
              },
              type: "time",
              title: {
                text: "Timestamp",
                display: true,
              },
              offset: true,
            },
          },
          animation: {
            duration: 0,
          },
        },
      });
    }

    if (props.params.granularity === "day") {
      // @ts-expect-error library types not updated
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      chartInstance.options.scales["x"].time.unit = "day";
    } else if (props.params.granularity === "minute") {
      // @ts-expect-error library types not updated
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      chartInstance.options.scales["x"].time.unit = "minute";
    } else {
      // @ts-expect-error library types not updated
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      chartInstance.options.scales["x"].time.unit = undefined;
    }

    // Update the chart data;
    chartInstance.data.labels = data.map(
      (point) => new Date(parseCustomDateString(point.time_stamp))
    );
    chartInstance.data.datasets[0].data = data.map(
      (point) => point.average_rps
    );
    chartInstance.update();
  });

  return <canvas ref={setCanvasElement} class="h-full w-full" />;
};
