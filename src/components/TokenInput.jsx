// src/components/TokenInput.jsx
import { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DeleteIcon from '@mui/icons-material/Delete';
import { saveGitHubToken, removeGitHubToken, hasGitHubToken } from '../api/github';

const TokenInput = () => {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [error, setError] = useState(null);

  // Check if token exists on mount
  useEffect(() => {
    setHasToken(hasGitHubToken());
  }, []);

  // Open dialog
  const handleOpen = () => {
    setOpen(true);
    setError(null);
  };

  // Close dialog
  const handleClose = () => {
    setOpen(false);
    setToken('');
    setError(null);
  };

  // Handle token input change
  const handleChange = (e) => {
    setToken(e.target.value);
    setError(null);
  };

  // Handle save token
  const handleSave = () => {
    if (!token.trim()) {
      setError('Please enter a valid GitHub token');
      return;
    }

    // Simple validation for token format
    if (!/^ghp_[a-zA-Z0-9]{36}$/.test(token) && 
        !/^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$/.test(token)) {
      setError('Token format is invalid. It should start with "ghp_" or "github_pat_"');
      return;
    }

    saveGitHubToken(token);
    setHasToken(true);
    handleClose();
    
    // Reload the page to apply the token to existing API calls
    window.location.reload();
  };

  // Handle remove token
  const handleRemoveToken = () => {
    removeGitHubToken();
    setHasToken(false);
    
    // Reload the page to apply the removal to existing API calls
    window.location.reload();
  };

  return (
    <>
      {hasToken ? (
        <Tooltip title="GitHub token is configured. Click to remove">
          <Chip
            icon={<VpnKeyIcon fontSize="small" />}
            label="GitHub Token Active"
            color="default"
            onDelete={handleRemoveToken}
            deleteIcon={<DeleteIcon />}
            size="small"
            sx={{ 
              mr: 2, 
              bgcolor: 'white',
              color: 'primary.dark',
              '& .MuiChip-deleteIcon': {
                color: 'error.main'
              }
            }}
          />
        </Tooltip>
      ) : (
        <Tooltip title="Add GitHub token to increase API rate limit">
          <Button
            startIcon={<VpnKeyIcon />}
            variant="contained"
            color="secondary"
            size="small"
            onClick={handleOpen}
            sx={{ 
              mr: 2,
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            Add Token
          </Button>
        </Tooltip>
      )}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>GitHub Personal Access Token</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Adding a GitHub personal access token will increase your API rate limit from 60 to 5,000 requests per hour.
            <br /><br />
            Create a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">github.com/settings/tokens</a> with public access permissions.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="GitHub Token"
            type="text"
            fullWidth
            variant="outlined"
            value={token}
            onChange={handleChange}
            placeholder="ghp_..."
            sx={{ mt: 2 }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save Token
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TokenInput;
