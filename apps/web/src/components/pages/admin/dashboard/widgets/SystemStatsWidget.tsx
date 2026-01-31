"use client";

import { Card } from "@/components/ui/card";
import { SystemStats } from "@/features/admin/types";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

interface SystemStatsWidgetProps {
  data?: SystemStats;
}

export function SystemStatsWidget({ data }: SystemStatsWidgetProps) {
  const cpuData = [
    {
      name: "CPU",
      value: Math.min(data?.cpuUsage ?? 0, 100),
      fill: "#ef4444",
    },
  ];

  const ramData = [
    {
      name: "RAM",
      value: Math.min(data?.ramUsage ?? 0, 100),
      fill: "#f59e0b",
    },
  ];

  // For disk, we'll calculate percentage
  const diskPercentage = data?.totalRamGb
    ? ((data.usedRamGb || 0) / data.totalRamGb) * 100
    : 0;

  const diskData = [
    {
      name: "Disk",
      value: Math.min(diskPercentage, 100),
      fill: "#ec4899",
    },
  ];

  const RadialChart = ({
    data,
    label,
    value,
    unit,
  }: {
    data: any[];
    label: string;
    value: number;
    unit: string;
  }) => (
    <div className="flex flex-col items-center gap-4">
      <div style={{ width: "100%", height: "150px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="70%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              dataKey="value"
              angleAxisId={0}
              background={{ fill: "#374151" }}
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">
          {value.toFixed(1)}
          <span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );

  return (
    <Card className="p-6 md:col-span-2">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">System Resources</h3>
        <p className="text-sm text-muted-foreground">
          Real-time resource usage
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <RadialChart
          data={cpuData}
          label="CPU Usage"
          value={data?.cpuUsage ?? 0}
          unit="%"
        />
        <RadialChart
          data={ramData}
          label="Memory Usage"
          value={data?.ramUsage ?? 0}
          unit="%"
        />
        <div className="flex flex-col items-center gap-4">
          <div style={{ width: "100%", height: "150px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={diskData}
                innerRadius="70%"
                outerRadius="100%"
                startAngle={180}
                endAngle={0}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  dataKey="value"
                  angleAxisId={0}
                  background={{ fill: "#374151" }}
                  cornerRadius={10}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Memory</p>
            <p className="text-lg font-bold">
              {data?.usedRamGb ?? 0}
              <span className="text-sm text-muted-foreground ml-1">
                / {data?.totalRamGb ?? 0} GiB
              </span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
