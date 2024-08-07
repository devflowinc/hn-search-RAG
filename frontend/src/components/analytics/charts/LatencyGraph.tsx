/* eslint-disable prefer-const */
import { enUS } from "date-fns/locale";
import { createEffect, createSignal } from "solid-js";
import { Chart } from "chart.js";

import "chartjs-adapter-date-fns";
import {
  AnalyticsFilter,
  AnalyticsParams,
  LatencyDatapoint,
} from "../../../types";
import { getLatency } from "../api/analytics";

export const parseCustomDateString = (
  dateString: string,
  keepUTC?: boolean
) => {
  const [datePart, timePart] = dateString.split(" ");
  let [year, month, day] = datePart.split("-");
  let [hour, minute, second] = timePart.split(":");
  let [wholeSec] = second.split(".");

  month = month.padStart(2, "0");
  day = day.padStart(2, "0");
  hour = hour.padStart(2, "0");
  minute = minute.padStart(2, "0");
  wholeSec = wholeSec.padStart(2, "0");

  let isoString = `${year}-${month}-${day}T${hour}:${minute}:${wholeSec}`;
  if (!keepUTC) {
    isoString += "Z";
  }

  return new Date(isoString);
};

interface LatencyGraphProps {
  params: {
    filter: AnalyticsFilter;
    granularity: AnalyticsParams["granularity"];
  };
}

export const LatencyGraph = (props: LatencyGraphProps) => {
  const [canvasElement, setCanvasElement] = createSignal<HTMLCanvasElement>();
  const [latencyPoints, setLatencyPoints] = createSignal<LatencyDatapoint[]>(
    []
  );
  let chartInstance: Chart | null = null;
  createEffect(async () => {
    let results = await getLatency(
      props.params.filter,
      props.params.granularity
    );
    setLatencyPoints(results);
  });

  createEffect(() => {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    const canvas = canvasElement();
    const data = latencyPoints();

    if (!canvas || !data) return;

    if (!chartInstance) {
      // Create the chart only if it doesn't exist
      chartInstance = new Chart(canvas, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              borderColor: "rgba(255, 102, 0, 0.9)",
              pointBackgroundColor: "rgba(255, 102, 0, 0.9)",
              backgroundColor: "rgba(128, 0, 128, 0.1)", // Light purple background
              borderWidth: 1,
              label: "Time",
              data: [],
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
                text: "Latency (ms)",
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
              offset: data.length <= 3,
              ticks: {
                source: "auto",
              },
              min: props.params.filter.date_range.gt?.toISOString(),
              max: props.params.filter.date_range.lt?.toISOString(),
            },
          },
          animation: {
            duration: 0,
          },
        },
      });
    }

    // @ts-expect-error library types not updated
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    chartInstance.options.scales["x"].time.minUnit = props.params.granularity;
    // Update the chart data
    chartInstance.data.labels = data.map(
      (point) => new Date(parseCustomDateString(point.time_stamp, true))
    );
    chartInstance.data.datasets[0].data = data.map(
      (point) => point.average_latency
    );
    chartInstance.update();
  });

  return <canvas ref={setCanvasElement} class="h-full w-full" />;
};
