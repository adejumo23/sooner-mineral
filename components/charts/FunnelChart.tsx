import React from 'react';

interface FunnelChartProps {
  data: {
    stage: string;
    value: number;
    percentage: number;
    color?: string;
  }[];
  title: string;
  height?: number;
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data, title, height = 300 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-2" style={{ height }}>
        {data.map((stage, index) => {
          const width = (stage.value / maxValue) * 100;
          const color = stage.color || `hsl(${200 + index * 40}, 70%, 60%)`;
          
          return (
            <div key={stage.stage} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900 font-semibold">
                    {stage.value.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({stage.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div 
                className="h-8 rounded-md transition-all duration-300 ease-in-out"
                style={{ 
                  width: `${width}%`,
                  backgroundColor: color,
                  minWidth: '60px'
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FunnelChart;
