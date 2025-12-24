// Dashboard Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Initialize dashboard page
    initDashboard();
});

function initDashboard() {
    console.log('Dashboard page initialized');
    
    // TODO: Load dashboard data from Google Sheets
    // TODO: Display charts and analytics
    // TODO: Calculate performance metrics
    
    // For now, show placeholder
    setTimeout(() => {
        showDashboardPlaceholder();
    }, 1000);
}

function showDashboardPlaceholder() {
    const container = document.querySelector('.dashboard-container');
    if (container) {
        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <h3>Portfolio Performance</h3>
                    <div class="chart-container">
                        Chart will be displayed here
                    </div>
                </div>
                <div class="dashboard-card">
                    <h3>Sector Allocation</h3>
                    <div class="chart-container">
                        Chart will be displayed here
                    </div>
                </div>
                <div class="dashboard-card">
                    <h3>Top Gainers</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="label">Symbol</div>
                            <div class="value">-</div>
                        </div>
                        <div class="stat-item">
                            <div class="label">Gain %</div>
                            <div class="value">-</div>
                        </div>
                    </div>
                </div>
            </div>
            <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                Dashboard analytics will be loaded here from Google Sheets
            </p>
        `;
    }
}

