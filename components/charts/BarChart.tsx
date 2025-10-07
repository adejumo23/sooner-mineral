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
  // Ensure data is valid and has values
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center text-gray-500 py-8">No data available</div>
      </div>
    );
  }
  
  const maxValue = Math.max(...data.map(d => d.value || 0));
  
  if (horizontal) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3" style={{ height }}>
          {data.map((item, index) => {
            const value = item.value || 0;
            const width = maxValue > 0 ? (value / maxValue) * 100 : 0;
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
                  {value.toLocaleString()}
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
          const value = item.value || 0;
          const barHeight = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const color = item.color || `hsl(${200 + index * 40}, 70%, 60%)`;
          
          return (
            <div key={item.label} className="flex flex-col items-center space-y-2">
              <div 
                className="w-12 rounded-t transition-all duration-300 ease-in-out"
                style={{ 
                  height: `${barHeight}%`,
                  backgroundColor: color,
                  minHeight: '20px'
                }}
              />
              <div className="text-xs text-gray-600 text-center w-16">
                {item.label}
              </div>
              <div className="text-xs text-gray-900 font-semibold">
                {value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
