// src/components/GitHubChart.jsx
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const GitHubChart = ({ 
  title, 
  type = 'line', 
  labels, 
  datasets, 
  height = 300,
  options = {},
  subtitle = null
}) => {
  // Use a key to force full re-render of chart when data changes
  const [chartKey, setChartKey] = useState(0);
  const chartRef = useRef(null);

  // Update the key whenever the chart data or date range changes
  // This forces a complete re-render of the chart component
  useEffect(() => {
    setChartKey(prevKey => prevKey + 1);
  }, [labels, datasets, subtitle]);

  useEffect(() => {
    // Store the current ref value that will be used in cleanup
    const chart = chartRef.current;
    
    return () => {
      // Clean up chart instance on unmount using the captured value
      if (chart) {
        chart.destroy();
      }
    };
  }, []);

  // Default chart options
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
  };

  // Merge default options with provided options
  const chartOptions = { ...defaultOptions, ...options };

  // Prepare chart data
  const data = {
    labels,
    datasets,
  };

  // Check if there's data to display
  const hasData = labels && labels.length > 0 && datasets && datasets.length > 0;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: subtitle ? 0.5 : 1.5 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
        <div style={{ height: `${height}px`, width: '100%' }}>
          {hasData ? (
            type === 'line' ? (
              <Line key={chartKey} ref={chartRef} options={chartOptions} data={data} redraw={true} />
            ) : (
              <Bar key={chartKey} ref={chartRef} options={chartOptions} data={data} redraw={true} />
            )
          ) : (
            <Box 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              No data available for selected date range
            </Box>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GitHubChart;
