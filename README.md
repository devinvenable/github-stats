# GitHub Developer Dashboard

A modern, interactive dashboard for tracking GitHub user statistics and activity. Compare metrics across multiple developers and gain insights into public and private contribution activity.

![GitHub Dashboard Preview](https://via.placeholder.com/800x450?text=GitHub+Dashboard+Preview)

## Features

- 📊 **User Statistics**: View comprehensive GitHub statistics including repositories, stars, followers, and contributions
- 🔍 **Developer Comparison**: Compare metrics across multiple GitHub developers
- 📈 **Interactive Charts**: Visualize language distribution and commit activity
- 🔐 **Private Activity Support**: See total contribution stats including private activity (when authenticated)
- ⚡ **Rate Limit Management**: Smart caching and token authentication to handle GitHub API rate limits
- 🌓 **Modern UI**: Clean, responsive design built with Material UI

## Technologies Used

- React
- Vite
- Material UI
- GitHub REST & GraphQL APIs
- Axios
- Chart.js

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd github-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory with your GitHub token (optional, but recommended to avoid rate limits):
   ```
   VITE_GITHUB_ACCESS_TOKEN=your_github_personal_access_token
   ```
   
   You can generate a personal access token at [GitHub Settings > Developer Settings > Personal access tokens](https://github.com/settings/tokens). The token only needs public access permissions.

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The dashboard will be available at `http://localhost:5173`

### Building for Production

Build the project for production:

```bash
npm run build
# or
yarn build
```

The build artifacts will be in the `dist` directory.

### Deployment

Preview the production build locally:

```bash
npm run preview
# or
yarn preview
```

Deploy to your favorite hosting platform:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting provider

## Usage

1. **Single User View**: Enter a GitHub username to view their statistics
2. **Compare Mode**: Toggle "Compare Mode" to add multiple users and compare their metrics
3. **Authentication**: Add your GitHub token using the button in the top-right corner to increase API rate limits and see private contribution activity

## API Rate Limits

GitHub API has rate limits:
- **Unauthenticated**: 60 requests per hour
- **Authenticated**: 5,000 requests per hour

The dashboard implements several strategies to handle these limits:
- Smart caching of API responses
- Token-based authentication 
- Warning messages when approaching limits
- Graceful degradation when limits are reached

## Privacy & Security

- Your GitHub token is stored only in your browser's local storage
- No data is sent to any server other than GitHub's APIs
- Environment variables containing tokens are excluded from version control

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- GitHub API for providing the data
- Material UI for the component library
- The React and Vite communities for the excellent development tools
