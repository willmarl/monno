"use client";

import { Card } from "@/components/ui/card";
import { SystemStats } from "@/features/admin/types";

const SIZE = 150;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;

// Half-circle gauge: starts at 180° (left), sweeps to 0° (right)
function arcPath(percent: number) {
  const clamp = Math.min(Math.max(percent, 0), 100);
  // Map 0–100% to 0°–180° sweep, left to right
  const angle = (clamp / 100) * 180;
  const rad = ((180 - angle) * Math.PI) / 180;
  const x = CX + RADIUS * Math.cos(rad);
  const y = CY - RADIUS * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;
  // Always start from the left point (180°)
  return `M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x} ${y}`;
}

const BG_PATH = `M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`;

interface GaugeProps {
  percent: number;
  color: string;
  label: string;
  value: number;
  unit: string;
}

function Gauge({ percent, color, label, value, unit }: GaugeProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={SIZE} height={SIZE / 2 + STROKE} overflow="visible">
        {/* Background track */}
        <path
          d={BG_PATH}
          fill="none"
          stroke="#374151"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* Foreground value arc */}
        <path
          d={arcPath(percent)}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">
          {value.toFixed(1)}
          <span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

interface SystemStatsWidgetProps {
  data?: SystemStats;
}

export function SystemStatsWidget({ data }: SystemStatsWidgetProps) {
  const diskPercentage = data?.totalRamGb
    ? ((data.usedRamGb || 0) / data.totalRamGb) * 100
    : 0;

  return (
    <Card className="p-6 md:col-span-2">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">System Resources</h3>
        <p className="text-sm text-muted-foreground">
          Real-time resource usage
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 place-items-center">
        <Gauge
          percent={data?.cpuUsage ?? 0}
          color="#ef4444"
          label="CPU Usage"
          value={data?.cpuUsage ?? 0}
          unit="%"
        />
        <Gauge
          percent={data?.ramUsage ?? 0}
          color="#f59e0b"
          label="Memory Usage"
          value={data?.ramUsage ?? 0}
          unit="%"
        />
        <div className="flex flex-col items-center gap-2">
          <svg width={SIZE} height={SIZE / 2 + STROKE} overflow="visible">
            <path
              d={BG_PATH}
              fill="none"
              stroke="#374151"
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
            <path
              d={arcPath(diskPercentage)}
              fill="none"
              stroke="#ec4899"
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
          </svg>
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
