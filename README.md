# Polymarket Bitcoin Charts

A React application for visualizing Polymarket Bitcoin event probabilities over time.

## Features

- Input Polymarket event URLs
- Display event outcomes with current probabilities
- Interactive checkboxes to select outcomes for charting
- Real-time probability charts with timestamps
- Responsive design

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown in the terminal (usually http://localhost:5173)

## Usage

1. Paste a Polymarket event URL (e.g., `https://polymarket.com/event/bitcoin-above-on-january-7?tid=1767822569297`)
2. Click "Load Event" to fetch the event data
3. Select outcomes using the checkboxes
4. View the probability chart showing how prices changed over time

## API Integration

The app uses Polymarket's API through a proxy to avoid CORS issues. The Vite development server proxies requests to `https://gamma-api.polymarket.com`.

## Build

To build for production:
```bash
npm run build
```

## Deployment to GitHub Pages

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to GitHub Pages:
```bash
npm run deploy
```

Alternatively, you can use the deployment script:
```bash
./deploy.sh
```

### Automatic Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys to GitHub Pages when you push to the `main` branch.

To enable automatic deployment:

1. Push your code to a GitHub repository
2. Go to your repository settings on GitHub
3. Navigate to Settings > Pages
4. Under "Build and deployment", select "GitHub Actions"
5. The workflow will run automatically on the next push to `main`

Your site will be available at `https://[your-username].github.io/[repository-name]/`

**Note**: The `homepage` field in `package.json` is configured for repository name `polymarket_charts`. If your repository has a different name, update both the `homepage` field and the base path in the build script.