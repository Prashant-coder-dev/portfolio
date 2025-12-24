// Portfolio Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Initialize portfolio page
    initPortfolio();
});

function initPortfolio() {
    console.log('Portfolio page initialized');
    
    // TODO: Load portfolio data from Google Sheets
    // TODO: Display holdings
    // TODO: Calculate summary statistics
    
    // For now, show placeholder
    setTimeout(() => {
        showPortfolioPlaceholder();
    }, 1000);
}

function showPortfolioPlaceholder() {
    const container = document.querySelector('.portfolio-container');
    if (container) {
        container.innerHTML = `
            <div class="portfolio-summary">
                <div class="summary-card">
                    <h3>Total Investment</h3>
                    <div class="value">₹0.00</div>
                    <div class="change">No data available</div>
                </div>
                <div class="summary-card">
                    <h3>Current Value</h3>
                    <div class="value">₹0.00</div>
                    <div class="change">No data available</div>
                </div>
                <div class="summary-card">
                    <h3>Profit/Loss</h3>
                    <div class="value">₹0.00</div>
                    <div class="change">No data available</div>
                </div>
                <div class="summary-card">
                    <h3>Total Holdings</h3>
                    <div class="value">0</div>
                    <div class="change">No data available</div>
                </div>
            </div>
            <div class="holdings-list">
                <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    Portfolio data will be loaded here from Google Sheets
                </p>
            </div>
        `;
    }
}

