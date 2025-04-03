// src/api/github.js
import axios from 'axios';

const BASE_URL = 'https://api.github.com';

// Configure axios instance with token from environment variables or localStorage
const getAxiosInstance = () => {
  // First check for token in environment variables (for development)
  const envToken = import.meta.env.VITE_GITHUB_ACCESS_TOKEN || '';
  // Then check localStorage (for user-provided tokens)
  const localToken = localStorage.getItem('github_token');
  // Use env token as fallback if available
  const token = localToken || envToken;
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  
  return axios.create({
    baseURL: BASE_URL,
    headers
  });
};

// Handle API rate limit errors
const handleApiError = (error) => {
  if (error.response) {
    // Rate limit exceeded
    if (error.response.status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
      const resetTime = new Date(parseInt(error.response.headers['x-ratelimit-reset']) * 1000);
      const formattedTime = resetTime.toLocaleTimeString();
      throw new Error(`GitHub API rate limit exceeded. Limit resets at ${formattedTime}. Consider adding a personal access token.`);
    }
    // User not found
    if (error.response.status === 404) {
      throw new Error(`GitHub user not found. Please check the username.`);
    }
  }
  console.error('GitHub API error:', error);
  throw error;
};

// Fetch user data from GitHub API
export const fetchUserData = async (username) => {
  try {
    const api = getAxiosInstance();
    const response = await api.get(`/users/${username}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw after handling
  }
};

// Fetch user repositories (public repos only)
export const fetchRepositories = async (username) => {
  try {
    const api = getAxiosInstance();
    const response = await api.get(`/users/${username}/repos?sort=updated&per_page=100`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw after handling
  }
};

// Fetch user events (last 90 days of activity)
export const fetchUserEvents = async (username) => {
  try {
    const api = getAxiosInstance();
    const response = await api.get(`/users/${username}/events?per_page=100`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw after handling
  }
};

// Calculate repository statistics
export const calculateRepoStats = (repositories) => {
  const totalStars = repositories.reduce((total, repo) => total + repo.stargazers_count, 0);
  const totalForks = repositories.reduce((total, repo) => total + repo.forks_count, 0);
  const totalWatchers = repositories.reduce((total, repo) => total + repo.watchers_count, 0);
  
  // Count languages
  const languages = {};
  repositories.forEach(repo => {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
  });
  
  return {
    totalStars,
    totalForks,
    totalWatchers,
    languages
  };
};

// Save GitHub token to localStorage
export const saveGitHubToken = (token) => {
  localStorage.setItem('github_token', token);
};

// Remove GitHub token from localStorage
export const removeGitHubToken = () => {
  localStorage.removeItem('github_token');
};

// Check if a token exists (either in localStorage or env vars)
export const hasGitHubToken = () => {
  return !!(localStorage.getItem('github_token') || import.meta.env.VITE_GITHUB_ACCESS_TOKEN);
};

// Get the token from localStorage or environment variables
export const getGitHubToken = () => {
  return localStorage.getItem('github_token') || import.meta.env.VITE_GITHUB_ACCESS_TOKEN || null;
};

// Cache for the authenticated username
let cachedAuthUsername = null;

// Get the authenticated username from cache
export const getAuthenticatedUsername = () => {
  return cachedAuthUsername;
};

// Initialize authenticated user info and cache the username
export const initializeAuthenticatedUser = async () => {
  try {
    if (hasGitHubToken()) {
      const api = getAxiosInstance();
      const response = await api.get('/user');
      cachedAuthUsername = response.data.login;
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error initializing authenticated user:', error);
    return null;
  }
};

// Get current rate limit status
export const getRateLimitStatus = async () => {
  try {
    const api = getAxiosInstance();
    const response = await api.get('/rate_limit');
    return response.data.resources.core;
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw after handling
  }
};

// Helper function to process events data for commit history
export const processCommitHistory = (events) => {
  // Filter push events only
  const pushEvents = events.filter(event => event.type === 'PushEvent');
  
  // Group by date
  const commitsByDate = {};
  
  pushEvents.forEach(event => {
    const date = new Date(event.created_at).toISOString().split('T')[0];
    if (!commitsByDate[date]) {
      commitsByDate[date] = 0;
    }
    commitsByDate[date] += event.payload.size || 0;
  });
  
  // Convert to array format for charts
  const dates = Object.keys(commitsByDate).sort();
  const commitCounts = dates.map(date => commitsByDate[date]);
  
  return {
    labels: dates,
    data: commitCounts
  };
};

// Fetch contribution stats (including private contributions if authenticated)
export const fetchContributionStats = async (username) => {
  try {
    // GitHub's API doesn't directly expose contribution counts including private
    // contributions through the REST API. We need to use GraphQL for this.
    const api = getAxiosInstance();
    
    // GraphQL query to get contribution data
    const query = `
      query {
        user(login: "${username}") {
          name
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;
    
    // Only try GraphQL if we have a token (GraphQL API requires authentication)
    if (hasGitHubToken()) {
      const response = await api.post('/graphql', { query });
      
      // Extract the relevant data
      const userData = response.data.data.user;
      if (!userData) {
        return { totalContributions: 0, contributionsByDay: [] };
      }
      
      const calendar = userData.contributionsCollection.contributionCalendar;
      const totalContributions = calendar.totalContributions;
      
      // Process contribution days for charting
      const contributionsByDay = [];
      calendar.weeks.forEach(week => {
        week.contributionDays.forEach(day => {
          contributionsByDay.push({
            date: day.date,
            count: day.contributionCount
          });
        });
      });
      
      return {
        totalContributions,
        contributionsByDay
      };
    } else {
      console.log('No GitHub token available for fetching contribution data');
      return { totalContributions: 0, contributionsByDay: [] };
    }
  } catch (error) {
    console.error('Error fetching contribution stats:', error);
    return { totalContributions: 0, contributionsByDay: [] };
  }
};

// Calculate repository stats
export const calculateRepositoryStats = (repositories) => {
  if (!repositories || repositories.length === 0) {
    return {
      totalRepos: 0,
      totalStars: 0,
      totalForks: 0,
      languageDistribution: {},
      topLanguages: [],
      recentlyUpdated: []
    };
  }

  const stats = {
    totalRepos: repositories.length,
    totalStars: 0,
    totalForks: 0,
    languageDistribution: {},
    recentlyUpdated: []
  };

  repositories.forEach(repo => {
    stats.totalStars += repo.stargazers_count;
    stats.totalForks += repo.forks_count;
    
    if (repo.language) {
      if (stats.languageDistribution[repo.language]) {
        stats.languageDistribution[repo.language]++;
      } else {
        stats.languageDistribution[repo.language] = 1;
      }
    }
  });

  // Get top languages
  stats.topLanguages = Object.entries(stats.languageDistribution)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get recently updated repositories
  stats.recentlyUpdated = [...repositories]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5)
    .map(repo => ({
      name: repo.name,
      updated_at: repo.updated_at,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language
    }));

  return stats;
};
