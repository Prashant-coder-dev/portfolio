// LTP Page JavaScript

let allStocks = [];
let filteredStocks = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Initialize LTP page
    initLTP();
});

function initLTP() {
    console.log('LTP page initialized');
    
    // Show loading state
    showLoadingState();
    
    // Load LTP data from Google Sheets
    loadLTPData();
    
    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector('.ltp-container .search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterStocks(e.target.value);
        });
    }
    
    // Filter buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('filter-btn')) {
            // Remove active from all buttons
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            // Add active to clicked button
            e.target.classList.add('active');
            currentFilter = e.target.textContent.toLowerCase();
            filterStocks();
        }
    });
}

function showLoadingState() {
    const container = document.querySelector('.ltp-container');
    if (container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">⏳</div>
                <p>Loading LTP data from Google Sheets...</p>
            </div>
        `;
    }
}

function showErrorState(message) {
    const container = document.querySelector('.ltp-container');
    if (container) {
        container.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 3rem; color: var(--danger-color);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h3>Error Loading Data</h3>
                <p>${message}</p>
                <button onclick="loadLTPData()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

async function loadLTPData() {
    let lastError = null;
    const maxRetries = CONFIG.CORS_PROXIES.length;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`Loading LTP data (attempt ${attempt + 1}/${maxRetries})...`);
            
            const csvUrl = getSheetCSVUrl(CONFIG.GIDS.ltp);
            console.log('Fetching from:', csvUrl);
            
            // Add timeout to fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(csvUrl, {
                signal: controller.signal,
                mode: 'cors',
                cache: 'no-cache'
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const csvText = await response.text();
            console.log('CSV data received, length:', csvText.length);
            
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('Empty response received');
            }
            
            // Parse CSV data
            const stocks = parseCSVData(csvText);
            console.log('Parsed stocks:', stocks.length);
            
            if (stocks.length === 0) {
                throw new Error('No stock data found in CSV');
            }
            
            allStocks = stocks;
            filteredStocks = [...stocks];
            
            // Render the data
            renderLTPData();
            return; // Success!
            
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            lastError = error;
            
            // Try next proxy if available
            if (error.name === 'AbortError') {
                lastError = new Error('Request timeout - check your internet connection');
            }
            
            if (attempt < maxRetries - 1 && tryNextProxy()) {
                console.log('Retrying with different proxy...');
                continue;
            }
        }
    }
    
    // All attempts failed
    console.error('All attempts failed. Last error:', lastError);
    showErrorState(`Failed to load LTP data: ${lastError?.message || 'Unknown error'}. Make sure you're using a local web server (not opening file directly).`);
}

function parseCSVData(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
        throw new Error('No data found in CSV');
    }
    
    // Find header row
    let headerRow = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('symbol')) {
            headerRow = i;
            break;
        }
    }
    
    const headers = parseCSVLine(lines[headerRow]);
    console.log('Headers:', headers);
    
    // Find column indices
    const symbolIndex = headers.findIndex(h => h.toLowerCase().includes('symbol'));
    const openIndex = headers.findIndex(h => h.toLowerCase().includes('open'));
    const highIndex = headers.findIndex(h => h.toLowerCase().includes('high'));
    const lowIndex = headers.findIndex(h => h.toLowerCase().includes('low'));
    const ltpIndex = headers.findIndex(h => h.toLowerCase().includes('ltp') || h.toLowerCase().includes('last'));
    const pointChangeIndex = headers.findIndex(h => h.toLowerCase().includes('point') || h.toLowerCase().includes('change'));
    const percentChangeIndex = headers.findIndex(h => h.toLowerCase().includes('%') || h.toLowerCase().includes('percent'));
    const volumeIndex = headers.findIndex(h => h.toLowerCase().includes('volume'));
    
    const stocks = [];
    
    // Process data rows
    for (let i = headerRow + 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        const symbol = values[symbolIndex]?.trim();
        if (!symbol || symbol === '' || symbol.toLowerCase() === 'symbol') continue;
        
        const open = parseFloat(values[openIndex]?.replace(/,/g, '')) || 0;
        const high = parseFloat(values[highIndex]?.replace(/,/g, '')) || 0;
        const low = parseFloat(values[lowIndex]?.replace(/,/g, '')) || 0;
        const ltp = parseFloat(values[ltpIndex]?.replace(/,/g, '')) || 0;
        const pointChange = parseFloat(values[pointChangeIndex]?.replace(/,/g, '')) || 0;
        const percentChange = parseFloat(values[percentChangeIndex]?.replace(/,/g, '')) || 0;
        const volume = parseFloat(values[volumeIndex]?.replace(/,/g, '')) || 0;
        
        if (ltp <= 0) continue; // Skip invalid data
        
        stocks.push({
            symbol: symbol,
            open: open,
            high: high,
            low: low,
            ltp: ltp,
            pointChange: pointChange,
            percentChange: percentChange,
            volume: volume
        });
    }
    
    return stocks;
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    values.push(current.trim());
    return values;
}

function filterStocks(searchTerm = '') {
    const searchLower = searchTerm.toLowerCase();
    
    filteredStocks = allStocks.filter(stock => {
        const matchesSearch = !searchTerm || stock.symbol.toLowerCase().includes(searchLower);
        
        let matchesFilter = true;
        if (currentFilter === 'gainers') {
            matchesFilter = stock.percentChange > 0;
        } else if (currentFilter === 'losers') {
            matchesFilter = stock.percentChange < 0;
        }
        
        return matchesSearch && matchesFilter;
    });
    
    renderLTPData();
}

function renderLTPData() {
    const container = document.querySelector('.ltp-container');
    if (!container) return;
    
    if (filteredStocks.length === 0) {
        container.innerHTML = `
            <div class="ltp-controls">
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" placeholder="Search stocks by symbol..." id="stockSearch">
                </div>
                <div class="filter-buttons">
                    <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}">All</button>
                    <button class="filter-btn ${currentFilter === 'gainers' ? 'active' : ''}">Gainers</button>
                    <button class="filter-btn ${currentFilter === 'losers' ? 'active' : ''}">Losers</button>
                </div>
            </div>
            <p style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                No stocks found matching your criteria
            </p>
        `;
        
        // Re-attach event listeners
        const searchInput = document.getElementById('stockSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                filterStocks(e.target.value);
            });
        }
        return;
    }
    
    const controlsHTML = `
        <div class="ltp-controls">
            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input type="text" placeholder="Search stocks by symbol..." id="stockSearch">
            </div>
            <div class="filter-buttons">
                <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}">All</button>
                <button class="filter-btn ${currentFilter === 'gainers' ? 'active' : ''}">Gainers</button>
                <button class="filter-btn ${currentFilter === 'losers' ? 'active' : ''}">Losers</button>
            </div>
        </div>
    `;
    
    const stocksHTML = filteredStocks.map(stock => {
        const changeClass = stock.percentChange > 0 ? 'positive' : stock.percentChange < 0 ? 'negative' : 'neutral';
        const changeSign = stock.percentChange > 0 ? '+' : '';
        
        return `
            <div class="stock-card">
                <div class="stock-header">
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-price">
                        <div class="current-price">₹${stock.ltp.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <div class="price-change ${changeClass}">
                            ${changeSign}${stock.pointChange.toFixed(2)} (${changeSign}${stock.percentChange.toFixed(2)}%)
                        </div>
                    </div>
                </div>
                <div class="stock-details">
                    <div class="stock-detail-item">
                        <div class="stock-detail-label">Open</div>
                        <div class="stock-detail-value">₹${stock.open.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div class="stock-detail-item">
                        <div class="stock-detail-label">High</div>
                        <div class="stock-detail-value">₹${stock.high.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div class="stock-detail-item">
                        <div class="stock-detail-label">Low</div>
                        <div class="stock-detail-value">₹${stock.low.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div class="stock-detail-item">
                        <div class="stock-detail-label">Volume</div>
                        <div class="stock-detail-value">${stock.volume.toLocaleString('en-IN')}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = controlsHTML + `<div class="stocks-grid">${stocksHTML}</div>`;
    
    // Re-attach event listeners
    const searchInput = document.getElementById('stockSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterStocks(e.target.value);
        });
    }
    
    // Update stats
    updateStats();
}

function updateStats() {
    const total = filteredStocks.length;
    const gainers = filteredStocks.filter(s => s.percentChange > 0).length;
    const losers = filteredStocks.filter(s => s.percentChange < 0).length;
    
    console.log(`Displaying ${total} stocks (${gainers} gainers, ${losers} losers)`);
}

