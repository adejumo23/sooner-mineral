import React from 'react';

interface BarChartProps {
  data: {
    label: string;
    value: number;
    color?: string;
  }[];
  title: string;
  height?: number;
  horizontal?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, height = 300, horizontal = false }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  if (horizontal) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3" style={{ height }}>
          {data.map((item, index) => {
            const width = (item.value / maxValue) * 100;
            const color = item.color || `hsl(${200 + index * 40}, 70%, 60%)`;
            
            return (
              <div key={item.label} className="flex items-center space-x-3">
                <div className="w-24 text-sm text-gray-700 truncate">{item.label}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6">
                  <div 
                    className="h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{ 
                      width: `${width}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
                <div className="w-16 text-sm text-gray-900 font-semibold text-right">
                  {item.value.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex items-end justify-between space-x-2" style={{ height }}>
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100;
          const color = item.color || `hsl(${200 + index * 40}, 70%, 60%)`;
          
          return (
            <div key={item.label} className="flex flex-col items-center space-y-2">
              <div 
                className="w-12 rounded-t transition-all duration-300 ease-in-out"
                style={{ 
                  height: `${height}%`,
                  backgroundColor: color,
                  minHeight: '20px'
                }}
              />
              <div className="text-xs text-gray-600 text-center w-16">
                {item.label}
              </div>
              <div className="text-xs text-gray-900 font-semibold">
                {item.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
