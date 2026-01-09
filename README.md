# 🚀 Polymarket Bitcoin Charts

> 📊 **Live Demo**: <https://letni1.github.io/polymarket_charts/>

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Polymarket](https://img.shields.io/badge/Polymarket-API-1E90FF?logo=ethereum&logoColor=white)](https://polymarket.com/)

✨ **Interactive Bitcoin prediction market visualization** - Track real-time probabilities and price movements for Bitcoin prediction events on Polymarket!

## 🎯 Features

- 🔗 **Easy Event Loading** - Simply paste any Polymarket event URL
- 📈 **Interactive Charts** - Beautiful probability charts with real-time data
- ✅ **Multi-Outcome Selection** - Compare different outcomes side-by-side
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- ⚡ **Fast Performance** - Built with Vite for lightning-fast loading
- 🎨 **Modern UI** - Clean, intuitive interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/letni1/polymarket_charts.git
cd polymarket_charts

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser to the URL shown in the terminal (usually `http://localhost:5173`)

## 📖 How to Use

1. **Copy a Polymarket Event URL**  
   Example: `https://polymarket.com/event/bitcoin-above-on-january-7`

2. **Paste it into the app**  
   The event data will load automatically

3. **Select outcomes to compare**  
   Use checkboxes to choose which outcomes to visualize

4. **Analyze the charts**  
   Watch how probabilities change over time!

## 🛠️ Tech Stack

- **Frontend**: React 18 with Hooks
- **Build Tool**: Vite for blazing-fast development
- **Charts**: Custom charting components
- **Styling**: Modern CSS with responsive design
- **Deployment**: GitHub Pages with automatic CI/CD

## 📦 Build & Deploy

### Build for Production
```bash
npm run build
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

Or use the deployment script:
```bash
./deploy.sh
```

## 🤖 Automatic Deployment

This project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `main` branch.

### To enable automatic deployment:

1. Push your code to a GitHub repository
2. Go to **Settings > Pages** in your repository
3. Under "Build and deployment", select **GitHub Actions**
4. Your site will deploy automatically on every push to `main`

## 🎨 Customization

### Repository Configuration
The `homepage` field in `package.json` is configured for `polymarket_charts`. If your repository has a different name, update:

- `package.json` → `homepage` field
- Build script base path

## 📊 Example Events to Try

- Bitcoin price predictions

---

**Made with ❤️ for the Polymarket community**