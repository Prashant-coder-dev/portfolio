// Google Sheets Configuration
const CONFIG = {
  SHEET_ID: '1pA3QeetNdg3TQGUfksvKjeEIFpa8u7V8U1UsNVpI3iI',
  GIDS: {
    ltp: '37314444',
    portfolio: '',
    transactions: '',
    dashboard: ''
  },
  // CORS Proxy options - try different proxies if one fails
  CORS_PROXIES: [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://corsproxy.io/?',
    ''
  ],
  PROXY_INDEX: 0,
  USE_PROXY: true
};

// Helper function to get CSV URL
function getSheetCSVUrl(gid) {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;
  
  if (CONFIG.USE_PROXY && CONFIG.CORS_PROXIES[CONFIG.PROXY_INDEX]) {
    const proxy = CONFIG.CORS_PROXIES[CONFIG.PROXY_INDEX];
    if (proxy.includes('?')) {
      return `${proxy}${encodeURIComponent(csvUrl)}`;
    } else {
      return `${proxy}${csvUrl}`;
    }
  }
  
  return csvUrl;
}

// Try next proxy if current one fails
function tryNextProxy() {
  if (CONFIG.PROXY_INDEX < CONFIG.CORS_PROXIES.length - 1) {
    CONFIG.PROXY_INDEX++;
    console.log(`Trying proxy ${CONFIG.PROXY_INDEX + 1}/${CONFIG.CORS_PROXIES.length}`);
    return true;
  }
  return false;
}

