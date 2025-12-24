# Wealth Engine - NEPSE Portfolio Tracker

A web application for tracking NEPSE stock portfolio with data from Google Sheets.

## 🚀 Deployment on Render

This project is ready to deploy on Render as a static site.

### Quick Deploy:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Render will auto-detect settings from `render.yaml`
   - Click "Create Static Site"

3. **Done!** Your site will be live at `https://your-app.onrender.com`

## 📋 Configuration

Before deploying, make sure to:

1. **Edit `config.js`:**
   - Set your Google Sheets ID
   - Set GIDs for each page (LTP, Portfolio, Transactions, etc.)

2. **Make Google Sheets Public:**
   - Open your Google Sheet
   - Click "Share" → "Anyone with the link can view"

## 📁 Project Structure

```
├── index.html          # Home page
├── portfolio.html      # Portfolio page
├── dashboard.html      # Dashboard page
├── transactions.html   # Transactions page
├── ltp.html           # LTP page (Last Traded Price)
├── config.js          # Google Sheets configuration
├── script.js          # Common JavaScript
├── index.js           # Home page JS
├── portfolio.js       # Portfolio page JS
├── dashboard.js       # Dashboard page JS
├── transactions.js    # Transactions page JS
├── ltp.js            # LTP page JS
├── styles.css        # Common styles
├── portfolio.css     # Portfolio styles
├── dashboard.css     # Dashboard styles
├── transactions.css  # Transactions styles
├── ltp.css          # LTP styles
└── render.yaml       # Render deployment config
```

## 🔧 Local Development

To test locally:

```bash
# Python
python -m http.server 8080

# Node.js
npx serve -l 8080
```

Then open: `http://localhost:8080`

## 📝 Notes

- All pages use Google Sheets as data source
- Configure `config.js` with your Sheet IDs and GIDs
- CORS proxy is included for cross-origin requests
- Works best when deployed (no CORS issues)
