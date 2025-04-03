// src/api/aggregatedStats.js
import { fetchUserData, fetchRepositories, fetchUserEvents, getRateLimitStatus } from './github';

/**
 * Check if we have enough rate limit remaining
 * @param {number} userCount - Number of users to fetch
 * @returns {Promise<Object>} - Rate limit status
 */
const checkRateLimit = async (userCount) => {
  try {
    const rateLimit = await getRateLimitStatus();
    const { remaining, limit, reset } = rateLimit;
    const resetTime = new Date(reset * 1000);
    
    // Each user fetch requires approximately 3 API calls (user, repos, events)
    const estimatedCalls = userCount * 3;
    
    if (remaining < estimatedCalls) {
      const formattedTime = resetTime.toLocaleTimeString();
      console.warn(`Rate limit may be exceeded. Remaining: ${remaining}, Needed: ~${estimatedCalls}. Reset at ${formattedTime}`);
      return {
        sufficient: false,
        remaining,
        resetTime: formattedTime
      };
    }
    
    return { sufficient: true, remaining, limit };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { sufficient: true }; // Assume sufficient if we can't check
  }
};

/**
 * Fetch data for multiple GitHub users
 * @param {string[]} usernames - List of GitHub usernames
 * @returns {Promise<Object>} - Object containing user data and aggregated stats
 */
export const fetchMultipleUsersData = async (usernames) => {
  try {
    // Check if we have enough rate limit
    const rateLimitStatus = await checkRateLimit(usernames.length);
    
    const userData = {};
    let hasAnyValidUser = false;
    
    // If rate limit is insufficient, add a warning message
    if (!rateLimitStatus.sufficient) {
      userData.rateLimitWarning = {
        message: `GitHub API rate limit may be exceeded. Consider adding a token or reducing the number of users. Limit resets at ${rateLimitStatus.resetTime}.`
      };
    }
    
    // Fetch user profile data in parallel
    const userPromises = usernames.map(async (username) => {
      try {
        const user = await fetchUserData(username);
        userData[username] = { user };
        hasAnyValidUser = true;
        return user;
      } catch (error) {
        console.error(`Error fetching data for ${username}:`, error);
        userData[username] = { error: error.message };
        return null;
      }
    });
    
    await Promise.all(userPromises);
    
    // Fetch repositories for each user
    const repoPromises = usernames.map(async (username) => {
      if (userData[username] && !userData[username].error) {
        try {
          const repos = await fetchRepositories(username);
          userData[username].repositories = repos;
        } catch (error) {
          console.error(`Error fetching repositories for ${username}:`, error);
          userData[username].repositoriesError = error.message;
        }
      }
    });
    
    await Promise.all(repoPromises);
    
    // Fetch user events for activity data
    const eventsPromises = usernames.map(async (username) => {
      if (userData[username] && !userData[username].error) {
        try {
          const events = await fetchUserEvents(username);
          userData[username].events = events;
        } catch (error) {
          console.error(`Error fetching events for ${username}:`, error);
          userData[username].eventsError = error.message;
        }
      }
    });
    
    await Promise.all(eventsPromises);
    
    // If all users failed due to rate limit, return the error information
    if (!hasAnyValidUser && userData.rateLimitWarning) {
      return { 
        userData, 
        rateLimitExceeded: true, 
        rateLimitMessage: userData.rateLimitWarning.message 
      };
    }
    
    // Calculate aggregated stats
    const aggregatedData = calculateAggregatedStats(userData);
    
    return { userData, aggregatedData };
  } catch (error) {
    console.error('Error in fetchMultipleUsersData:', error);
    // Return a more graceful error object instead of throwing
    return { 
      error: true, 
      message: error.message || 'An unknown error occurred while fetching data' 
    };
  }
};

/**
 * Process commit history for visualization
 * @param {Object} userData - User data object
 * @param {string[]} usernames - List of GitHub usernames
 * @returns {Object} - Processed commit data for charts
 */
const processCommitData = (userData, usernames) => {
  // Combined date sets for all users' commit events
  const allDates = new Set();
  const datasets = [];
  
  // First pass - collect all unique dates
  usernames.forEach(username => {
    // Skip users with errors or missing data
    if (!userData[username] || userData[username].error || !userData[username].events) {
      return; // Skip to next user
    }
    
    const events = userData[username].events || [];
    const pushEvents = events.filter(event => event.type === 'PushEvent');
    
    pushEvents.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      allDates.add(date);
    });
  });
  
  // Make sure we have at least one date
  if (allDates.size === 0) {
    // Add today's date if no dates were found
    allDates.add(new Date().toISOString().split('T')[0]);
  }
  
  // Convert to sorted array
  const labels = Array.from(allDates).sort();
  
  // Second pass - create datasets for each user
  usernames.forEach(username => {
    // Skip users with errors or missing data
    if (!userData[username] || userData[username].error || !userData[username].events) {
      // Add empty dataset to maintain consistency
      datasets.push({
        label: username,
        data: labels.map(() => 0) // Zero commits for all dates
      });
      return; // Skip to next user
    }
    
    const events = userData[username].events || [];
    const commitsByDate = {};
    
    // Initialize all dates with 0
    labels.forEach(date => commitsByDate[date] = 0);
    
    // Count commits by date
    events
      .filter(event => event.type === 'PushEvent')
      .forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        commitsByDate[date] += event.payload.size || 0;
      });
    
    // Create dataset
    datasets.push({
      label: username,
      data: labels.map(date => commitsByDate[date])
    });
  });
  
  return { labels, datasets };
};

/**
 * Process language data for charts
 * @param {Object} languageDistribution - Language distribution object
 * @returns {Object} - Processed language data for charts
 */
const processLanguageData = (languageDistribution) => {
  // Convert to array for sorting
  const languages = Object.keys(languageDistribution).map(language => ({
    name: language,
    count: languageDistribution[language]
  }));
  
  // Sort by count (descending)
  languages.sort((a, b) => b.count - a.count);
  
  // Prepare for pie chart
  const labels = languages.map(lang => lang.name);
  const data = languages.map(lang => lang.count);
  
  return { labels, data };
};

/**
 * Calculate aggregated stats from multiple users
 * @param {Object} userData - Object containing data for each user
 * @returns {Object} - Aggregated statistics
 */
export const calculateAggregatedStats = (userData) => {
  const usernames = Object.keys(userData).filter(key => key !== 'rateLimitWarning');
  const hasRateLimitWarning = !!userData.rateLimitWarning;
  
  // Basic stats
  let totalRepositories = 0;
  let totalStars = 0;
  let totalForks = 0;
  let totalFollowers = 0;
  const languageDistribution = {};
  const userComparisons = {
    repositories: [],
    followers: [],
    stars: [],
    forks: []
  };
  
  usernames.forEach(username => {
    // Skip users with errors or missing data
    if (!userData[username] || userData[username].error || !userData[username].user) {
      // Add zero values for this user to maintain consistency in comparisons
      userComparisons.repositories.push({
        username,
        value: 0
      });
      
      userComparisons.followers.push({
        username,
        value: 0
      });
      
      userComparisons.stars.push({
        username,
        value: 0
      });
      
      userComparisons.forks.push({
        username,
        value: 0
      });
      
      return; // Skip to next user
    }
    
    const user = userData[username].user;
    const repositories = userData[username].repositories || [];
    
    // Update totals
    totalRepositories += user.public_repos || 0;
    totalFollowers += user.followers || 0;
    
    // Add user to comparisons
    userComparisons.repositories.push({
      username,
      value: user.public_repos || 0
    });
    
    userComparisons.followers.push({
      username,
      value: user.followers || 0
    });
    
    // Calculate repository stats
    let userStars = 0;
    let userForks = 0;
    
    repositories.forEach(repo => {
      userStars += repo.stargazers_count || 0;
      userForks += repo.forks_count || 0;
      
      // Update language distribution
      if (repo.language) {
        languageDistribution[repo.language] = (languageDistribution[repo.language] || 0) + 1;
      }
    });
    
    // Update totals
    totalStars += userStars;
    totalForks += userForks;
    
    // Add to comparisons
    userComparisons.stars.push({
      username,
      value: userStars
    });
    
    userComparisons.forks.push({
      username,
      value: userForks
    });
  });
  
  // Process commit history for visualization
  const commitData = processCommitData(userData, usernames);
  const languageData = processLanguageData(languageDistribution);
  
  return {
    totalUsers: usernames.length,
    totalRepositories,
    totalStars,
    totalForks,
    totalFollowers,
    languageDistribution,
    userComparisons,
    commitData,
    languageData,
    hasRateLimitWarning,
    rateLimitWarning: hasRateLimitWarning ? userData.rateLimitWarning.message : null
  };
};

/**
 * Generate colors for data visualization
 * @param {number} count - Number of colors needed
 * @returns {string[]} - Array of color hex values
 */
export const generateColors = (count) => {
  const baseColors = [
    '#4e79a7', // blue
    '#f28e2c', // orange
    '#e15759', // red
    '#76b7b2', // teal
    '#59a14f', // green
    '#edc949', // yellow
    '#af7aa1', // purple
    '#ff9da7', // pink
    '#9c755f', // brown
    '#bab0ab'  // grey
  ];
  
  // If we need fewer colors than the base set, return a subset
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // If we need more colors, generate additional ones
  const colors = [...baseColors];
  
  // Simple algorithm to generate more colors
  while (colors.length < count) {
    const index = colors.length % baseColors.length;
    // Make a slightly different shade of the base color
    const baseColor = baseColors[index];
    // Adjust the color slightly based on the position
    const factor = 0.8 + ((colors.length / baseColors.length) * 0.4);
    
    // A simple way to modify the color (this would be better with a proper color library)
    const newColor = modifyColorBrightness(baseColor, factor);
    colors.push(newColor);
  }
  
  return colors;
};

/**
 * Simple utility to modify a hex color's brightness
 * @param {string} hex - Hex color code
 * @param {number} factor - Brightness factor (>1 for lighter, <1 for darker)
 * @returns {string} - Modified hex color
 */
const modifyColorBrightness = (hex, factor) => {
  // Simple implementation - this could be improved with a proper color library
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  
  r = Math.min(255, Math.round(r * factor));
  g = Math.min(255, Math.round(g * factor));
  b = Math.min(255, Math.round(b * factor));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export default {
  fetchMultipleUsersData,
  generateColors,
  calculateAggregatedStats
};
