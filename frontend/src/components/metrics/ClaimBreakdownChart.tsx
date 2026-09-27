import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import NeuCard from '../ui/NeuCard';

interface ClaimBreakdownChartProps {
  verified?: number;
  unsupported?: number;
  contradicted?: number;
}

const COLORS = ['#22C55E', '#F59E0B', '#EF4444'];

export default function ClaimBreakdownChart({
  verified = 388,
  unsupported = 64,
  contradicted = 34
}: ClaimBreakdownChartProps) {
  const data = [
    { name: 'Verified', value: verified },
    { name: 'Unsupported', value: unsupported },
    { name: 'Contradicted', value: contradicted }
  ];

  const total = verified + unsupported + contradicted || 1;

  return (
    <NeuCard className="p-6 h-96 w-full flex flex-col bg-[#E8ECF1]">
      <div className="mb-2">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Claim Verdict Breakdown
        </h3>
        <p className="text-xs text-gray-500">
          Distribution across {total} audited factual claims
        </p>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="48%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#E8ECF1',
                borderRadius: '14px',
                border: 'none',
                boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
                padding: '10px'
              }}
              formatter={(val: any, name: any) => [
                `${val} claims (${((Number(val) / total) * 100).toFixed(1)}%)`,
                name
              ]}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </NeuCard>
  );
}
