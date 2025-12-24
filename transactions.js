// Transactions Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Initialize transactions page
    initTransactions();
});

function initTransactions() {
    console.log('Transactions page initialized');
    
    // TODO: Load transactions data from Google Sheets
    // TODO: Display transactions table
    // TODO: Add filtering and sorting
    
    // For now, show placeholder
    setTimeout(() => {
        showTransactionsPlaceholder();
    }, 1000);
}

function showTransactionsPlaceholder() {
    const container = document.querySelector('.transactions-container');
    if (container) {
        container.innerHTML = `
            <div class="transactions-controls">
                <div class="control-group">
                    <label>Filter:</label>
                    <select>
                        <option>All</option>
                        <option>Buy</option>
                        <option>Sell</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Sort:</label>
                    <select>
                        <option>Date (Newest)</option>
                        <option>Date (Oldest)</option>
                        <option>Symbol</option>
                        <option>Amount</option>
                    </select>
                </div>
            </div>
            <div class="transactions-table-container">
                <table class="transactions-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Symbol</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                                Transaction data will be loaded here from Google Sheets
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
}

