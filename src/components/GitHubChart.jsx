// src/components/GitHubChart.jsx
import { useEffect, useRef } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
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
  options = {} 
}) => {
  const chartRef = useRef(null);

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

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <div style={{ height: `${height}px`, width: '100%' }}>
          {type === 'line' ? (
            <Line ref={chartRef} options={chartOptions} data={data} />
          ) : (
            <Bar ref={chartRef} options={chartOptions} data={data} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GitHubChart;
