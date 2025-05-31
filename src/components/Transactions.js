import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './Transactions.css'; // Import CSS file for styling

function Transactions({ transactions, onDeleteTransaction }) {
  // Function to handle delete button click
  // Component logic for displaying transactions goes here

   useEffect(() => {
    console.log('Transactions component received transactions prop:', transactions);
  }, [transactions]); // Log whenever the transactions prop changes

  // Simplified table headers with keys for sorting
  const tableHeaders = [
    { key: 'company', label: 'Company' },
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'price', label: 'Price' },
    { key: 'amountPayable', label: 'Amount Payable' },
    { key: 'totalCommission', label: 'Total Commission' },
    { key: 'amountReceivable', label: 'Amount Receivable' },
    { key: 'profitBeforeTax', label: 'Profit Before Tax' },
    { key: 'capitalGainTax', label: 'Capital Gain Tax' },
    { key: 'netProfitLoss', label: 'Net Profit/Loss' },
    { key: 'netProfitLossPercentage', label: 'Net Profit/Loss %' },
    { key: 'actions', label: 'Actions' }, // Actions column is not sortable
  ];

  const [sortColumn, setSortColumn] = useState('date'); // Default sort by date
  const [sortDirection, setSortDirection] = useState('desc'); // Default sort descending

  // Function to handle sorting when a header is clicked
  const handleSort = (columnKey) => {
    // Prevent sorting on the Actions column
    if (columnKey === 'actions') {
        return;
    }

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc'); // Default to ascending when changing column
    }
  };

  // Memoize sorted data for performance
  const sortedTransactions = useMemo(() => {
    let sortableTransactions = [...transactions]; // Create a copy to avoid mutating state

    // Apply sorting
    if (sortColumn) {
      sortableTransactions.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        // Handle potential null or undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
        if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

        // Special handling for date sorting (assuming YYYY-MM-DD format)
        if (sortColumn === 'date') {
            const dateA = new Date(aValue);
            const dateB = new Date(bValue);
             if (dateA < dateB) return sortDirection === 'desc' ? 1 : -1;
            if (dateA > dateB) return sortDirection === 'desc' ? -1 : 1;
             return 0; // Dates are equal
        }

        // Case-insensitive comparison for strings, numerical comparison for numbers
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
             return sortDirection === 'asc' ? comparison : -comparison;
        } else {
            // Attempt to parse as numbers for numerical comparison
             const numA = parseFloat(aValue);
            const numB = parseFloat(bValue);

            if (!isNaN(numA) && !isNaN(numB)) {
                return sortDirection === 'asc' ? numA - numB : numB - numA;
            } else if (!isNaN(numA)) {
                 return sortDirection === 'asc' ? -1 : 1; // numbers come before non-numbers
            } else if (!isNaN(numB)) {
                 return sortDirection === 'asc' ? 1 : -1; // non-numbers come after numbers
            }
             return 0; // If both are not numbers, maintain original order
        }
      });
    }

    return sortableTransactions;
  }, [transactions, sortColumn, sortDirection]); // Recalculate when these dependencies change

   // Function to safely access and format data, returning '0.00' or '-' for missing/zero values
  const formatValue = (value, options = {}) => {
      const { isCurrency = true, minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;

      if (value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value)) ) {
          return isCurrency ? '0.00' : '-';
      }

      const numValue = parseFloat(value);

      if (isNaN(numValue)) {
          return isCurrency ? '0.00' : '-';
      }

      // Use toLocaleString for number formatting with separators
      return numValue.toLocaleString(undefined, { // Use undefined to use user's locale
        minimumFractionDigits: minimumFractionDigits,
        maximumFractionDigits: maximumFractionDigits,
      });
  };

    // Function to handle delete button click
    const handleDeleteClick = (transactionId) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            onDeleteTransaction(transactionId);
        }
    };

  const formatPercentage = (value) => {
       if (value === undefined || value === null || value === '' || (typeof parseFloat(value) !== 'number' || isNaN(parseFloat(value))) ) {
          return 'N/A';
      }
      return parseFloat(value).toFixed(2) + '%';
  };

  return (
    <div className="transactions-container">
      <h2>All Transactions</h2>
      {transactions && transactions.length > 0 ? (
        <div className="table-responsive">
          <table className="transactions-table">
            <thead>
              <tr>
                {/* Render table headers dynamically based on tableHeaders array */}
                {tableHeaders.map((header, index) => (
                  <th key={index} onClick={() => handleSort(header.key)}>
                    {header.label}
                    {sortColumn === header.key && (
                      <span>{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {console.log('Rendering transactions in table body:', transactions)}
              {sortedTransactions.map((transaction) => (
                <tr key={transaction.id} className={transaction.type === 'Buy' ? 'buy-row' : 'sell-row'}>
                  <td>{transaction.company}</td>
                  <td>{transaction.date}</td>
                  <td>{transaction.type}</td>
                  <td>{formatValue(transaction.quantity, { isCurrency: false, minimumFractionDigits: 0, maximumFractionDigits: 4 })}</td>{/* Quantity is not currency, allow more decimal places */}
                  <td>{formatValue(transaction.price)}</td>
                  <td>{transaction.type === 'Buy' ? formatValue(transaction.amountPayable) : '-'}</td>
                  <td>{formatValue(transaction.totalCommission)}</td>
                  <td>{transaction.type === 'Sell' ? formatValue(transaction.amountReceivable) : '-'}</td>
                  <td>{transaction.type === 'Sell' ? formatValue(transaction.profitBeforeTax) : '-'}</td>
                  <td>{transaction.type === 'Sell' ? formatValue(transaction.capitalGainTax) : '-'}</td>
                  <td>{transaction.type === 'Sell' ? formatValue(transaction.netProfitLoss) : '-'}</td>
                  <td>{transaction.type === 'Sell' ? `${formatPercentage(transaction.netProfitLossPercentage)}` : '-'}</td>
                  <td>
                    <button onClick={() => alert('Edit functionality coming soon!')}>Edit</button>
                    <button onClick={() => handleDeleteClick(transaction.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No transactions added yet.</p>
      )}
    </div>
  );
}

Transactions.propTypes = {
    transactions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        company: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
        price: PropTypes.number,
        amountPayable: PropTypes.number, // Use camelCase
        totalCommission: PropTypes.number, // Use camelCase
        amountReceivable: PropTypes.number, // Use camelCase
        profitBeforeTax: PropTypes.number, // Use camelCase
        capitalGainTax: PropTypes.number, // Use camelCase
        netProfitLoss: PropTypes.number, // Use camelCase
        netProfitLossPercentage: PropTypes.number, // Use camelCase
        initialInvestment: PropTypes.number, 
        transactionSource: PropTypes.string, 
        initialSellingAmount: PropTypes.number, 
        holdingType: PropTypes.string, 
        investment: PropTypes.number, 
        brokerCommission: PropTypes.number, 
        sebonFee: PropTypes.number, 
        dpCharge: PropTypes.number, 
        wacc: PropTypes.number, 



        // Add prop types for other fields if you display them
    })).isRequired,
    onDeleteTransaction: PropTypes.func.isRequired, // Prop type for delete function
};

export default Transactions; 