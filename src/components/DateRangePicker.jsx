// src/components/DateRangePicker.jsx
import { useState } from 'react';
import { Box, Button, Typography, Stack, Tooltip, Alert } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import InfoIcon from '@mui/icons-material/Info';

/**
 * A component for selecting a date range to filter data.
 * 
 * @param {Object} props The component props
 * @param {Function} props.onDateRangeChange Callback when date range changes
 * @param {Date} props.initialStartDate Initial start date
 * @param {Date} props.initialEndDate Initial end date
 * @returns {JSX.Element} The DateRangePicker component
 */
const DateRangePicker = ({ onDateRangeChange, initialStartDate = null, initialEndDate = null }) => {
  // Default to last 3 months if no initialStartDate provided, but not more than 90 days
  // GitHub only provides event data for the last 90 days
  const ninetyDaysAgo = dayjs().subtract(90, 'day');
  let defaultStartDate;
  
  if (initialStartDate) {
    // If provided start date is older than 90 days, use 90 days ago
    defaultStartDate = dayjs(initialStartDate).isBefore(ninetyDaysAgo) ? 
      ninetyDaysAgo : dayjs(initialStartDate);
  } else {
    defaultStartDate = dayjs().subtract(2, 'month');
  }
  
  // Default to current date if no initialEndDate provided
  const defaultEndDate = initialEndDate ? dayjs(initialEndDate) : dayjs();
  
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [appliedRange, setAppliedRange] = useState({
    start: defaultStartDate.toDate(),
    end: defaultEndDate.toDate()
  });
  
  const handleStartDateChange = (newValue) => {
    setStartDate(newValue);
  };
  
  const handleEndDateChange = (newValue) => {
    setEndDate(newValue);
  };
  
  const handleApplyFilter = () => {
    // Ensure end date is not before start date
    const validEndDate = endDate.isBefore(startDate) ? startDate : endDate;
    
    const newRange = {
      start: startDate.toDate(),
      end: validEndDate.toDate()
    };
    
    setAppliedRange(newRange);
    onDateRangeChange(newRange);
  };
  
  const handleResetFilter = () => {
    // Reset to last 90 days as that's all GitHub provides
    const newStartDate = dayjs().subtract(90, 'day');
    const newEndDate = dayjs();
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    const newRange = {
      start: newStartDate.toDate(),
      end: newEndDate.toDate()
    };
    
    setAppliedRange(newRange);
    onDateRangeChange(newRange);
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ 
        p: 2, 
        mb: 2, 
        border: '1px solid', 
        borderColor: 'divider', 
        borderRadius: 1,
        backgroundColor: 'background.paper'
      }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            <FilterAltIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
            Filter Activity by Date Range
          </Typography>
          <Tooltip title="GitHub only provides commit history for the most recent 90 days">
            <InfoIcon fontSize="small" color="info" />
          </Tooltip>
        </Stack>
        
        <Alert severity="info" sx={{ mb: 2 }} variant="outlined">
          Note: GitHub's API only returns commit activity for the last 90 days, regardless of the selected date range.
        </Alert>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ mb: 2 }}
        >
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            maxDate={dayjs()}
            format="MM/DD/YYYY"
            slotProps={{ textField: { size: 'small' } }}
          />
          
          <Typography variant="body2" sx={{ 
            display: { xs: 'none', sm: 'block' },
            color: 'text.secondary'
          }}>to</Typography>
          
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            maxDate={dayjs()}
            format="MM/DD/YYYY"
            slotProps={{ textField: { size: 'small' } }}
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={handleApplyFilter}
              sx={{ minWidth: '80px' }}
            >
              Apply
            </Button>
            
            <Button 
              variant="text" 
              onClick={handleResetFilter}
              startIcon={<RestartAltIcon />}
            >
              Reset
            </Button>
          </Box>
        </Stack>
        
        <Typography variant="caption" color="text.secondary">
          Currently viewing: {appliedRange.start.toLocaleDateString()} - {appliedRange.end.toLocaleDateString()}
        </Typography>
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangePicker;
