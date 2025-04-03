// src/components/RepoDataGrid.jsx
import { useState } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  TableSortLabel,
  Box,
  Typography,
  Link
} from '@mui/material';

// Helper function to sort data
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Stable sort function
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const RepoDataGrid = ({ repositories, title = "Repositories" }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('stargazers_count');

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle sort request
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // If no repositories, display a message
  if (!repositories || repositories.length === 0) {
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>No repositories found.</Typography>
      </Paper>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mt: 3 }}>
      <Typography variant="h6" sx={{ p: 2 }}>{title}</Typography>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="repository table">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleRequestSort('name')}
                >
                  Repository
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'language'}
                  direction={orderBy === 'language' ? order : 'asc'}
                  onClick={() => handleRequestSort('language')}
                >
                  Language
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'stargazers_count'}
                  direction={orderBy === 'stargazers_count' ? order : 'asc'}
                  onClick={() => handleRequestSort('stargazers_count')}
                >
                  Stars
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'forks_count'}
                  direction={orderBy === 'forks_count' ? order : 'asc'}
                  onClick={() => handleRequestSort('forks_count')}
                >
                  Forks
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'updated_at'}
                  direction={orderBy === 'updated_at' ? order : 'asc'}
                  onClick={() => handleRequestSort('updated_at')}
                >
                  Last Updated
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stableSort(repositories, getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((repo) => (
                <TableRow hover key={repo.id}>
                  <TableCell>
                    <Link href={repo.html_url} target="_blank" rel="noopener noreferrer">
                      {repo.name}
                    </Link>
                    {repo.description && (
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                        {repo.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{repo.language || 'N/A'}</TableCell>
                  <TableCell>{repo.stargazers_count}</TableCell>
                  <TableCell>{repo.forks_count}</TableCell>
                  <TableCell>{formatDate(repo.updated_at)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={repositories.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default RepoDataGrid;
