import type { Artifact } from '@/types';
import { aggregateData } from '@/lib/stats';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const COLORS = ['#f59e0b', '#22d3ee', '#a78bfa', '#4ade80', '#f87171', '#fb923c', '#f472b6', '#818cf8', '#34d399', '#fbbf24', '#f97316', '#ec4899'];

const tooltipStyle = {
  backgroundColor: '#0d0d20',
  border: '1px solid #17173a',
  borderRadius: 6,
  fontSize: 11,
  color: '#eef2ff',
};

export function ChartArtifact({ artifact }: { artifact: Artifact }) {
  const { ctype = 'bar', xCol, yCol, aggFn = 'sum', data = [] } = artifact;
  if (!xCol || !yCol || !data.length) return <p className="text-xs text-muted-foreground p-4">No data available for chart</p>;

  const chartData = aggregateData(data, xCol, yCol, aggFn as any);
  const gridProps = { strokeDasharray: '3 3', stroke: '#17173a' };
  const xProps = { dataKey: 'x', tick: { fill: '#8892b0', fontSize: 10 }, angle: -35, textAnchor: 'end' as const, height: 50 };
  const yProps = { tick: { fill: '#8892b0', fontSize: 10 } };

  return (
    <div className="p-3">
      <ResponsiveContainer width="100%" height={210}>
        {ctype === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xProps} /><YAxis {...yProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="y" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
          </LineChart>
        ) : ctype === 'area' ? (
          <AreaChart data={chartData}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xProps} /><YAxis {...yProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="y" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.14} />
          </AreaChart>
        ) : ctype === 'pie' ? (
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie data={chartData} dataKey="y" nameKey="x" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
          </PieChart>
        ) : ctype === 'scatter' ? (
          <ScatterChart>
            <CartesianGrid {...gridProps} />
            <XAxis {...xProps} type="number" /><YAxis {...yProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Scatter data={chartData} fill="#22d3ee" fillOpacity={0.6} />
          </ScatterChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xProps} /><YAxis {...yProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="y" radius={[3, 3, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
