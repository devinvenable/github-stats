// src/components/UsernameInput.jsx
import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Paper,
  Typography,
  Chip,
  Stack,
  IconButton,
  Divider,
  Alert,
  Collapse,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

const UsernameInput = ({ onSearch, onMultiSearch, showAggregated, onAggregatedToggle, loading }) => {
  const [username, setUsername] = useState("");
  const [usernameList, setUsernameList] = useState([]);
  const [error, setError] = useState("");
  
  // Use the showAggregated prop to control aggregated state

  // We removed the auto-triggering effect that was causing infinite API calls
  // Now we'll only trigger API calls on explicit user actions

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a GitHub username");
      return;
    }

    setError("");

    if (showAggregated) {
      // In aggregated mode, add to the list
      if (usernameList.includes(username.trim())) {
        setError(`Username ${username.trim()} is already in the list`);
        return;
      }

      const newList = [...usernameList, username.trim()];
      setUsernameList(newList);
      setUsername("");

      // Trigger the multi-search with the updated list
      onMultiSearch(newList);
    } else {
      // In individual mode, just search for one username
      onSearch(username.trim());
    }
  };

  const handleToggleChange = (e) => {
    const newAggregatedState = e.target.checked;
    onAggregatedToggle(newAggregatedState);

    // Reset error when toggling
    setError("");

    // If switching to individual mode and we have usernames in the list
    if (!newAggregatedState && usernameList.length > 0) {
      // Use the first username in the list for individual view
      onSearch(usernameList[0]);
    }
    // If switching to aggregated mode and we already have usernames
    else if (newAggregatedState && usernameList.length > 0) {
      onMultiSearch(usernameList);
    }
  };

  const handleRemoveUsername = (usernameToRemove) => {
    const newList = usernameList.filter((u) => u !== usernameToRemove);
    setUsernameList(newList);

    if (newList.length > 0 && showAggregated) {
      // Update the multi search with the new list
      onMultiSearch(newList);
    } else if (newList.length === 0 && showAggregated) {
      // No usernames left in aggregated mode
      setError("Please add at least one username for aggregated stats");
    }
  };

  const handleCompareClick = () => {
    if (usernameList.length < 2) {
      setError("Please add at least two usernames to compare");
      return;
    }

    onMultiSearch(usernameList);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          GitHub Stats
        </Typography>
        <FormControlLabel
          control={
            <Switch 
              checked={showAggregated} 
              onChange={handleToggleChange}
              disabled={loading} 
            />
          }
          label="Compare Mode"
        />
      </Box>

      <Collapse in={!!error}>
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      </Collapse>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          gap: 2,
        }}
      >
        <TextField
          fullWidth
          label={showAggregated ? "Add GitHub Username" : "GitHub Username"}
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={!!error && !showAggregated}
          size="small"
          autoComplete="off"
          disabled={loading}
        />
        <Button
          variant="contained"
          type="submit"
          sx={{ minWidth: "120px" }}
          startIcon={showAggregated ? <AddIcon /> : null}
          disabled={loading}
        >
          {showAggregated ? "Add" : "Search"}
        </Button>
      </Box>

      {/* Username list for aggregated mode */}
      {showAggregated && (
        <Box sx={{ mt: 2 }}>
          {usernameList.length > 0 ? (
            <>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                Usernames to compare:
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                {usernameList.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    onDelete={() => handleRemoveUsername(name)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {usernameList.length > 1 && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CompareArrowsIcon />}
                    onClick={handleCompareClick}
                  >
                    Compare
                  </Button>
                )}
              </Stack>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add GitHub usernames to compare their statistics
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default UsernameInput;
