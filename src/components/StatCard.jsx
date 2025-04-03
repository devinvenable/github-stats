// src/components/StatCard.jsx
import { Card, CardContent, Typography, Box } from '@mui/material';

const StatCard = ({ title, value, icon, description, subtitle, color = 'primary.main' }) => {
  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      // Make cards more square-shaped with consistent height
      minHeight: 180,
      borderRadius: 2,
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 4
      }
    }}>
      <CardContent sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        p: 3 // Increase padding for better proportions
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          mb: 2 
        }}>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color, display: 'flex', alignItems: 'center' }}>
              {icon}
            </Box>
          )}
        </Box>
        
        <Box sx={{ alignSelf: 'center', textAlign: 'center', py: 2 }}>
          <Typography variant="h3" component="div" sx={{ 
            fontWeight: 'medium'
          }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
          
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
