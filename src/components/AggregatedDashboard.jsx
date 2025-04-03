// src/components/AggregatedDashboard.jsx
import { Box, Grid, Typography, Divider } from '@mui/material';
import StatCard from './StatCard';
import ComparisonChart from './ComparisonChart';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import StarIcon from '@mui/icons-material/Star';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import GroupIcon from '@mui/icons-material/Group';

const AggregatedDashboard = ({ multiUserData }) => {
  // If no data, show a message
  if (!multiUserData || !multiUserData.aggregatedData) {
    return (
      <Box>
        <Typography variant="h5" sx={{ textAlign: 'center', mt: 4, mb: 4 }}>
          No aggregated data available. Add GitHub usernames to compare.
        </Typography>
      </Box>
    );
  }

  const { aggregatedData } = multiUserData;

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Aggregated GitHub Statistics
      </Typography>
      
      {/* Total Stats */}
      <Grid container spacing={3}>
        <Grid sm={6} lg={3} sx={{ width: { xs: '100%' } }}>
          <StatCard 
            title="Total Repositories" 
            value={aggregatedData.totalRepositories} 
            icon={<CodeIcon fontSize="large" />}
            color="#4e79a7"
          />
        </Grid>
        <Grid sm={6} lg={3} sx={{ width: { xs: '100%' } }}>
          <StatCard 
            title="Total Followers" 
            value={aggregatedData.totalFollowers} 
            icon={<GroupIcon fontSize="large" />}
            color="#f28e2c"
          />
        </Grid>
        <Grid sm={6} lg={3} sx={{ width: { xs: '100%' } }}>
          <StatCard 
            title="Total Stars" 
            value={aggregatedData.totalStars} 
            icon={<StarIcon fontSize="large" />}
            color="#e15759"
          />
        </Grid>
        <Grid sm={6} lg={3} sx={{ width: { xs: '100%' } }}>
          <StatCard 
            title="Total Forks" 
            value={aggregatedData.totalForks} 
            icon={<ForkRightIcon fontSize="large" />}
            color="#76b7b2"
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 4 }} />

      {/* Comparison Section */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        User Comparisons
      </Typography>
      
      <Grid container spacing={3}>
        <Grid md={6} sx={{ width: { xs: '100%' } }}>
          <ComparisonChart 
            title="Repositories by User" 
            data={aggregatedData.userComparisons.repositories}
            metricName="Repositories"
          />
        </Grid>
        <Grid md={6} sx={{ width: { xs: '100%' } }}>
          <ComparisonChart 
            title="Followers by User" 
            data={aggregatedData.userComparisons.followers}
            metricName="Followers"
          />
        </Grid>
        <Grid md={6} sx={{ width: { xs: '100%' } }}>
          <ComparisonChart 
            title="Stars by User" 
            data={aggregatedData.userComparisons.stars}
            metricName="Stars"
          />
        </Grid>
        <Grid md={6} sx={{ width: { xs: '100%' } }}>
          <ComparisonChart 
            title="Forks by User" 
            data={aggregatedData.userComparisons.forks}
            metricName="Forks"
          />
        </Grid>
      </Grid>

      {/* No combined stats section as it doesn't display meaningful data */}
    </Box>
  );
};

export default AggregatedDashboard;
