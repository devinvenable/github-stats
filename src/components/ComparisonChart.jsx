// src/components/ComparisonChart.jsx
import { useRef, useEffect } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { generateColors } from '../api/aggregatedStats';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ComparisonChart = ({ 
  title, 
  data,
  metricName = 'Value',
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

  // If no data provided, return a message
  if (!data || data.length === 0) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No data available for comparison
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Generate colors for each bar
  const colors = generateColors(data.length);

  // Prepare chart data
  const chartData = {
    labels: data.map(item => item.username),
    datasets: [
      {
        label: metricName,
        data: data.map(item => item.value),
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  // Default chart options
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${metricName}: ${context.parsed.y}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  // Merge default options with provided options
  const chartOptions = { ...defaultOptions, ...options };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height: `${height}px`, width: '100%' }}>
          <Bar ref={chartRef} options={chartOptions} data={chartData} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ComparisonChart;
