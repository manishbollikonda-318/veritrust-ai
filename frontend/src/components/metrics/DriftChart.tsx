import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import NeuCard from '../ui/NeuCard';
import { DriftDataPoint } from '../../types';

interface DriftChartProps {
  driftData?: DriftDataPoint[];
}

const DEFAULT_DRIFT = [
  { time: '10:00', passRate: 88.0, correctionRate: 8.0, blockRate: 4.0 },
  { time: '10:30', passRate: 84.5, correctionRate: 10.5, blockRate: 5.0 },
  { time: '11:00', passRate: 80.2, correctionRate: 13.1, blockRate: 6.7 },
  { time: '11:30', passRate: 77.0, correctionRate: 15.0, blockRate: 8.0 },
  { time: '12:00', passRate: 76.5, correctionRate: 15.3, blockRate: 8.2 }
];

export default function DriftChart({ driftData }: DriftChartProps) {
  const chartData = (driftData && driftData.length > 0) ? driftData : DEFAULT_DRIFT;

  return (
    <NeuCard className="p-6 h-96 w-full flex flex-col bg-[#E8ECF1]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            Accuracy & Compliance Drift Trend
          </h3>
          <p className="text-xs text-gray-500">
            Real-time monitoring of pass rate vs. hallucination correction & block rates
          </p>
        </div>
        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
          Live Session Window
        </span>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" vertical={false} />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#E8ECF1',
                borderRadius: '16px',
                border: 'none',
                boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
                padding: '12px'
              }}
              formatter={(val: any) => [`${Number(val).toFixed(1)}%`]}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Line
              name="Pass Rate (Approved)"
              type="monotone"
              dataKey="passRate"
              stroke="#22C55E"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#22C55E' }}
              activeDot={{ r: 6 }}
            />
            <Line
              name="Correction Rate"
              type="monotone"
              dataKey="correctionRate"
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#F59E0B' }}
            />
            <Line
              name="Block Rate (Escalated)"
              type="monotone"
              dataKey="blockRate"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ r: 3, fill: '#EF4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </NeuCard>
  );
}
