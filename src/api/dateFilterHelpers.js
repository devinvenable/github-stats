// src/api/dateFilterHelpers.js

/**
 * Filter data points by date range
 * 
 * @param {Array} dataPoints Array of objects that have a date field
 * @param {string} dateField The property name that contains the date string
 * @param {Date} startDate The start date for filtering
 * @param {Date} endDate The end date for filtering
 * @returns {Array} Filtered array of data points
 */
export const filterDataByDateRange = (dataPoints, dateField, startDate, endDate) => {
  if (!dataPoints || !Array.isArray(dataPoints) || dataPoints.length === 0) {
    return [];
  }
  
  return dataPoints.filter(point => {
    // Convert the date string to a Date object
    const pointDate = new Date(point[dateField]);
    
    // Check if the date is within the range
    return pointDate >= startDate && pointDate <= endDate;
  });
};

/**
 * Filter commit history data by date range
 * 
 * @param {Object} commitHistory Object with labels (dates) and data (commit counts)
 * @param {Date} startDate The start date for filtering
 * @param {Date} endDate The end date for filtering
 * @returns {Object} Filtered commit history data
 */
export const filterCommitHistoryByDateRange = (commitHistory, startDate, endDate) => {
  if (!commitHistory || !commitHistory.labels || !commitHistory.data) {
    return { labels: [], data: [] };
  }
  
  // Ensure startDate and endDate are Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set time to beginning and end of day to include the full days
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  console.log('Filtering commit history:', { 
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    labels: commitHistory.labels?.length || 0
  });
  
  const filteredIndices = commitHistory.labels.reduce((indices, dateStr, index) => {
    // Parse date and normalize to start of day for consistent comparison
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    
    if (date >= start && date <= end) {
      indices.push(index);
    }
    return indices;
  }, []);
  
  const filteredLabels = filteredIndices.map(index => commitHistory.labels[index]);
  const filteredData = filteredIndices.map(index => commitHistory.data[index]);
  
  return {
    labels: filteredLabels,
    data: filteredData
  };
};

/**
 * Filter language distribution data by repository update dates
 * 
 * @param {Array} repositories Array of repository objects
 * @param {Date} startDate The start date for filtering
 * @param {Date} endDate The end date for filtering
 * @returns {Object} Object with language distribution data filtered by date range
 */
export const filterLanguageDataByDateRange = (repositories, startDate, endDate) => {
  if (!repositories || !Array.isArray(repositories) || repositories.length === 0) {
    return { labels: [], data: [] };
  }
  
  // Ensure startDate and endDate are Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set time to beginning and end of day to include the full days
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  // Filter repositories that were updated within the date range
  const filteredRepos = repositories.filter(repo => {
    const updateDate = new Date(repo.updated_at);
    return updateDate >= start && updateDate <= end;
  });
  
  // Count languages in the filtered repositories
  const languageCount = {};
  filteredRepos.forEach(repo => {
    if (repo.language) {
      languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
    }
  });
  
  // Convert to chart data format
  const labels = Object.keys(languageCount);
  const data = labels.map(language => languageCount[language]);
  
  return {
    labels,
    data
  };
};
