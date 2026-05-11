import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function LineChart({ data, dataKey, xAxisKey = 'timestamp', color = '#facc15', height = 300 }) {
  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="text-xs text-zinc-400 mb-1">
            {new Date(payload[0].payload[xAxisKey]).toLocaleString()}
          </p>
          <p className="text-sm font-medium text-zinc-100">
            {payload[0].value !== null && payload[0].value !== undefined
              ? `${payload[0].value.toFixed(2)} ${payload[0].unit || ''}`
              : 'N/A'}
          </p>
        </div>
      );
    }
    return null;
  };

  // Add unique keys to data if not present
  const dataWithKeys = data?.map((item, index) => ({
    ...item,
    _key: `${item[xAxisKey]}-${index}`,
  })) || [];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={dataWithKeys}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey={xAxisKey}
          tickFormatter={formatXAxis}
          stroke="#71717a"
          style={{ fontSize: '12px' }}
        />
        <YAxis stroke="#71717a" style={{ fontSize: '12px' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          iconType="line"
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
          connectNulls
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}