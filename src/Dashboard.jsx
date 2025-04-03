// src/Dashboard.jsx
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Grid,
  Container,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  Tooltip,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CodeIcon from "@mui/icons-material/Code";
import StarIcon from "@mui/icons-material/Star";
import ForkRightIcon from "@mui/icons-material/ForkRight";

// Import components
import UsernameInput from "./components/UsernameInput";
import StatCard from "./components/StatCard";
import GitHubChart from "./components/GitHubChart";
import RepoDataGrid from "./components/RepoDataGrid";
import AggregatedDashboard from "./components/AggregatedDashboard";
import TokenInput from "./components/TokenInput";
import DateRangePicker from "./components/DateRangePicker";

// Import API services
import {
  fetchUserData,
  fetchRepositories,
  fetchUserEvents,
  calculateRepositoryStats,
  processCommitHistory,
  fetchContributionStats,
  initializeAuthenticatedUser,
  hasGitHubToken,
} from "./api/github";
import {
  fetchMultipleUsersData,
  calculateAggregatedStats,
} from "./api/aggregatedStats";
import {
  filterCommitHistoryByDateRange,
  filterLanguageDataByDateRange
} from "./api/dateFilterHelpers";

const Dashboard = () => {
  const theme = useTheme();

  // State management
  const [username, setUsername] = useState("");
  const [userData, setUserData] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [repoStats, setRepoStats] = useState(null);
  const [commitHistory, setCommitHistory] = useState({ labels: [], data: [] });
  const [isAggregated, setIsAggregated] = useState(false);
  const [multiUserData, setMultiUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache for storing developer data to prevent unnecessary API calls
  const [developerCache, setDeveloperCache] = useState({});

  // Rate limit warning indicator
  const [rateLimitWarning, setRateLimitWarning] = useState(false);

  // Contribution stats with private activity (if authenticated)
  const [contributionStats, setContributionStats] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Date range filter state
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
    end: new Date()
  });

  // Initialize authentication when the component mounts
  useEffect(() => {
    const initAuth = async () => {
      // Check if we have a token and initialize authentication
      if (hasGitHubToken()) {
        const authUser = await initializeAuthenticatedUser();
        setIsAuthenticated(!!authUser);
      }
    };

    initAuth();
  }, []);

  // Fetch GitHub data when username changes
  useEffect(() => {
    const fetchGitHubData = async () => {
      if (!username) return;

      // Check if we already have cached data for this user
      if (developerCache[username]) {
        const cachedData = developerCache[username];
        console.log(`Using cached data for ${username}`);

        setUserData(cachedData.user);
        setRepositories(cachedData.repositories);
        setRepoStats(cachedData.repoStats);
        setCommitHistory(cachedData.commitHistory);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch user data
        const user = await fetchUserData(username);

        // Fetch repositories
        const repos = await fetchRepositories(username);

        // Calculate repository statistics
        const stats = calculateRepositoryStats(repos);

        // Fetch user events for commit history
        const events = await fetchUserEvents(username);
        const history = processCommitHistory(events);

        // Fetch contribution stats if authenticated (includes private contribution activity)
        if (isAuthenticated) {
          const contributions = await fetchContributionStats(username);
          setContributionStats(contributions);
        } else {
          setContributionStats(null);
        }

        // Update state
        setUserData(user);
        setRepositories(repos);
        setRepoStats(stats);
        setCommitHistory(history);
        // Reset rate limit warning
        setRateLimitWarning(false);

        // Cache the data
        setDeveloperCache((prevCache) => ({
          ...prevCache,
          [username]: {
            user,
            repositories: repos,
            repoStats: stats,
            commitHistory: history,
            timestamp: Date.now(), // Add timestamp for potential cache invalidation
          },
        }));
      } catch (err) {
        console.error("Error fetching GitHub data:", err);

        // Check if it's a rate limit error
        if (err.message && err.message.includes("rate limit exceeded")) {
          setRateLimitWarning(true);
        }

        setError(err.message || "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, [username, developerCache, isAuthenticated]);

  // Handle search submission
  const handleSearch = (searchUsername) => {
    setUsername(searchUsername);
  };

  // Handle multi-user search for aggregated stats
  const handleMultiSearch = async (usernameList) => {
    if (!usernameList || usernameList.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    // Check which users we already have cached data for
    const cachedUsers = {};
    const usersToFetch = [];

    usernameList.forEach((username) => {
      if (developerCache[username]) {
        cachedUsers[username] = developerCache[username];
      } else {
        usersToFetch.push(username);
      }
    });

    // Log how many users we need to fetch vs. using from cache
    if (Object.keys(cachedUsers).length > 0) {
      console.log(
        `Using cached data for ${Object.keys(cachedUsers).length} users`
      );
    }
    if (usersToFetch.length > 0) {
      console.log(`Fetching data for ${usersToFetch.length} new users`);
    }

    // If we have some users cached but still need to fetch others
    let combinedData;

    // If we need to fetch new users
    if (usersToFetch.length > 0) {
      // Fetch data for users not in cache
      const fetchedData = await fetchMultipleUsersData(usersToFetch);

      // Check if there was an error
      if (fetchedData.error) {
        console.error(
          "Error fetching multiple users data:",
          fetchedData.message
        );
        setError(
          fetchedData.message ||
            "An error occurred while fetching aggregated data"
        );

        // Still try to use cached data if available
        if (Object.keys(cachedUsers).length > 0) {
          combinedData = buildCombinedUserData(cachedUsers, {});
          setMultiUserData(combinedData);
        } else {
          setMultiUserData(null);
        }
      }
      // Check if rate limit was exceeded
      else if (fetchedData.rateLimitExceeded) {
        console.warn(
          "GitHub API rate limit exceeded:",
          fetchedData.rateLimitMessage
        );
        setError(fetchedData.rateLimitMessage);
        setRateLimitWarning(true);

        // Still try to use cached data + any partial data
        combinedData = buildCombinedUserData(
          cachedUsers,
          fetchedData.userData || {}
        );
        setMultiUserData(combinedData);
      }
      // Success case
      else {
        // Cache the newly fetched data
        const newCache = { ...developerCache };

        // Extract individual user data from the fetched data
        if (fetchedData.userData) {
          Object.keys(fetchedData.userData)
            .filter((key) => key !== "rateLimitWarning")
            .forEach((username) => {
              if (
                fetchedData.userData[username] &&
                fetchedData.userData[username].user
              ) {
                const userData = fetchedData.userData[username];
                newCache[username] = {
                  user: userData.user,
                  repositories: userData.repositories || [],
                  repoStats: calculateRepositoryStats(
                    userData.repositories || []
                  ),
                  commitHistory: processCommitHistory(userData.events || []),
                  timestamp: Date.now(),
                };
              }
            });
        }

        setDeveloperCache(newCache);

        // Combine cached and fetched data
        combinedData = fetchedData;
        if (Object.keys(cachedUsers).length > 0) {
          combinedData = buildCombinedUserData(
            cachedUsers,
            fetchedData.userData || {}
          );
        }

        setMultiUserData(combinedData);
      }
    } else {
      // If all users are already cached, build the combined dataset
      combinedData = buildCombinedUserData(cachedUsers, {});
      setMultiUserData(combinedData);
    }

    setLoading(false);
  };

  // Helper function to build combined user data from cache and fetched data
  const buildCombinedUserData = (cachedUsers, fetchedUserData) => {
    // Prepare combined userData object
    const userData = { ...fetchedUserData };

    // Add cached users to the userData object
    Object.keys(cachedUsers).forEach((username) => {
      userData[username] = {
        user: cachedUsers[username].user,
        repositories: cachedUsers[username].repositories,
        events: cachedUsers[username].commitHistory ? [] : undefined, // We don't store raw events in cache
      };
    });

    // Calculate aggregated stats from the combined data
    const aggregatedData = calculateAggregatedStats(userData);

    return { userData, aggregatedData };
  };

  // Handle aggregated stats toggle
  const handleAggregatedToggle = (aggregatedState) => {
    setIsAggregated(aggregatedState);
    // Clear individual user data when switching to aggregated mode
    if (aggregatedState) {
      setUsername("");
      setUserData(null);
      setRepositories([]);
      setRepoStats(null);
      setCommitHistory({ labels: [], data: [] });
    } else {
      // Clear aggregated data when switching to individual mode
      setMultiUserData(null);
    }
  };

  // Filter data based on selected date range
  const filteredCommitHistory = useMemo(() => {
    return filterCommitHistoryByDateRange(
      commitHistory,
      dateRange.start,
      dateRange.end
    );
  }, [commitHistory, dateRange]);
  
  const filteredLanguageData = useMemo(() => {
    return filterLanguageDataByDateRange(
      repositories,
      dateRange.start,
      dateRange.end
    );
  }, [repositories, dateRange]);
  
  // Prepare chart data for commit history
  const commitChartData = {
    labels: filteredCommitHistory.labels || [],
    datasets: [
      {
        label: "Commits",
        data: filteredCommitHistory.data || [],
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}33`,
        borderWidth: 2,
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const languageChartData = {
    labels: filteredLanguageData.labels || [],
    datasets: [
      {
        label: "Repository Count",
        data: filteredLanguageData.data || [],
        backgroundColor: [
          "#4e79a7",
          "#f28e2c",
          "#e15759",
          "#76b7b2",
          "#59a14f",
        ],
      },
    ],
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      width: '100%'
    }}>
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            GitHub Developer Dashboard
          </Typography>
          <TokenInput />
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ 
        p: 3, 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Container maxWidth="xl" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <Box sx={{ mb: 3 }}>
            <UsernameInput
              onSearch={handleSearch}
              onMultiSearch={handleMultiSearch}
              showAggregated={isAggregated}
              onAggregatedToggle={handleAggregatedToggle}
              loading={loading}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
                {rateLimitWarning && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    💡 Tip: Add a GitHub token using the button in the top-right
                    corner to increase your rate limit.
                  </Typography>
                )}
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <Box
                sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 4 }}
              >
                <CircularProgress />
              </Box>
            )}

            {/* Aggregated Dashboard */}
            {isAggregated && !loading && (
              <AggregatedDashboard multiUserData={multiUserData} />
            )}

            {/* Individual User Profile and Stats */}
            {userData && !loading && !isAggregated && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                width: '100%', 
                maxWidth: '1200px'
              }}>
                {/* Profile Summary */}
                <Box sx={{ textAlign: 'center', mb: 4, maxWidth: '800px' }}>
                  <img 
                    src={userData.avatar_url} 
                    alt={userData.login}
                    style={{ 
                      width: '150px', 
                      height: '150px', 
                      borderRadius: '50%',
                      border: `3px solid ${theme.palette.primary.main}`
                    }}/>
                  <Typography variant="h5" sx={{ mt: 2 }}>
                    {userData.name || userData.login}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    @{userData.login}
                  </Typography>
                  {userData.bio && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {userData.bio}
                    </Typography>
                  )}
                </Box>
                
                {/* Stat Cards */}
                <Box sx={{ width: '100%', maxWidth: '1000px', mb: 4 }}>
                  <Grid container spacing={2} justifyContent="center">
                      <Grid item xs={12} sm={6} lg={4}>
                        <StatCard
                          title="Repositories"
                          value={userData.public_repos}
                          icon={<CodeIcon fontSize="large" />}
                          color={theme.palette.primary.main}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={4}>
                        <StatCard
                          title="Followers"
                          value={userData.followers}
                          icon={<PersonIcon fontSize="large" />}
                          color={theme.palette.secondary.main}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={4}>
                        <StatCard
                          title="Total Stars"
                          value={repoStats?.totalStars || 0}
                          icon={<StarIcon fontSize="large" />}
                          color="#f9a825"
                        />
                      </Grid>
                      {contributionStats && (
                        <Grid item xs={12} sm={6} lg={4}>
                          <StatCard
                            title="Total Contributions"
                            value={contributionStats.totalContributions}
                            icon={<CodeIcon fontSize="large" />}
                            color="#8e24aa"
                            subtitle={isAuthenticated ? "Includes private activity" : "Public only"}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6} lg={4}>
                        <StatCard
                          title="Following"
                          value={userData.following}
                          icon={<PersonIcon fontSize="large" />}
                          color={theme.palette.info.main}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={4}>
                        <StatCard
                          title="Public Gists"
                          value={userData.public_gists}
                          icon={<CodeIcon fontSize="large" />}
                          color={theme.palette.warning.main}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={4}>
                        <StatCard
                          title="Total Forks"
                          value={repoStats?.totalForks || 0}
                          icon={<ForkRightIcon fontSize="large" />}
                          color={theme.palette.error.main}
                        />
                      </Grid>
                  </Grid>
                </Box>

                {/* Date Range Picker */}
                <Box sx={{ width: '100%', maxWidth: '1200px', mb: 2 }}>
                  <DateRangePicker 
                    onDateRangeChange={setDateRange}
                    initialStartDate={dateRange.start}
                    initialEndDate={dateRange.end}
                  />
                </Box>
                
                {/* Charts Section */}
                <Box sx={{ width: '100%', maxWidth: '1200px', mb: 4 }}>
                  <Grid container spacing={3} justifyContent="center">
                    <Grid item xs={12} md={10} lg={6}>
                      <GitHubChart 
                        title="Commit History" 
                        type="line"
                        labels={commitChartData.labels}
                        datasets={commitChartData.datasets}
                        subtitle={`${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()} (Limited to last 90 days)`}
                        options={{
                          plugins: {
                            tooltip: {
                              callbacks: {
                                footer: () => {
                                  return 'GitHub only provides last 90 days of history';
                                }
                              }
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={10} lg={6}>
                      <GitHubChart 
                        title="Language Distribution" 
                        type="bar"
                        labels={languageChartData.labels}
                        datasets={languageChartData.datasets}
                        subtitle={`Updated repositories in selected date range`}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Repository Data Grid */}
                <Box sx={{ width: '100%', maxWidth: '1200px' }}>
                  <RepoDataGrid 
                    repositories={repositories} 
                    title="Repositories"
                  />
                </Box>
              </Box>
            )}

            {/* Show empty state if no data and not loading */}
            {!userData && !loading && !isAggregated && (
              <Box sx={{ 
                textAlign: 'center', 
                mt: 4, 
                mb: 4,
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Typography variant="h5" gutterBottom>
                  Enter a GitHub username to get started
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  View comprehensive GitHub statistics, repositories, and activity trends
                </Typography>
              </Box>
            )}
            
            {/* Show empty state for aggregated mode */}
            {isAggregated && !loading && !multiUserData && (
              <Box sx={{ 
                textAlign: 'center', 
                mt: 4, 
                mb: 4,
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Typography variant="h5" gutterBottom>
                  Add GitHub usernames to compare
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Add multiple usernames to compare statistics and see aggregated trends
                </Typography>
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;
