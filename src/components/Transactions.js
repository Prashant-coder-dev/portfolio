import React, { useEffect } from 'react';
import './Transactions.css'; // Import CSS file for styling

function Transactions({ transactions }) {
  // Component logic for displaying transactions goes here

   useEffect(() => {
    console.log('Transactions component received transactions prop:', transactions);
  }, [transactions]); // Log whenever the transactions prop changes

  const tableHeaders = [
    'Date',
    'Symbol',
    'Quantity',
    'Buy WACC', // Calculated/Fetched WACC
    'Selling Price', // Only for Sell
    'Type',
    'Source', // Transaction Source
    'Payable', // Amount Payable (Buy)
    'Receivable', // Amount Receivable (Sell)
    'Total Commission',
    'Capital Gain Tax', // Only for Sell
    'Net Profit/Loss', // Only for Sell
    'Net Profit/Loss%', // Only for Sell
    'Existing Quantity', // Added new column
    'New Quantity', // Added new column
    'Total Quantity', // Added new column
    'Existing Investment', // Added new column
    'New Investment', // Added new column
    'Total Investment', // Added new column
    'Existing WACC', // Added new column
    'New WACC', // Added new column
  ];

  // Function to safely access and format data, returning '0.00' or '-' for missing/zero values
  const formatValue = (value, isCurrency = true) => {
      if (value === undefined || value === null || value === 0 || value === '' || (typeof value === 'number' && isNaN(value)) ) {
          return isCurrency ? '0.00' : '-';
      }
       if (isCurrency) {
           return parseFloat(value).toFixed(2);
       }
      return value;
  };

    // Function to calculate holdings state up to a specific transaction index
    const calculateHoldingsAtIndex = (transactionsList, companySymbol, untilIndex) => {
        let totalQuantity = 0;
        let totalCost = 0; // Represents total investment for Buy transactions

        for (let i = 0; i < untilIndex; i++) {
            const transaction = transactionsList[i];
            if (transaction.company === companySymbol) {
                if (transaction.type === 'Buy') {
                    totalQuantity += transaction.quantity;
                    totalCost += transaction.amountPayable; // Use amountPayable for Buy cost
                } else if (transaction.type === 'Sell') {
                    totalQuantity -= transaction.quantity;
                     // For simplicity in calculating existing investment based on Buy transactions,
                     // we only consider the cost added during buys. A more complex FIFO/LIFO
                     // would be needed for accurate cost basis tracking after sales.
                }
            }
        }

        const wacc = totalQuantity > 0 ? totalCost / totalQuantity : 0;

        return {
            existingQuantity: totalQuantity,
            existingInvestment: totalCost,
            existingWacc: wacc,
        };
    };


  return (
    <div className="transactions-container">
      <h2>All Transactions</h2>
      {transactions && transactions.length > 0 ? (
        <div className="table-responsive">
          <table className="transactions-table">
            <thead>
              <tr>
                {tableHeaders.map(header => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => {

                // Calculate existing holdings before this transaction
                const { existingQuantity, existingInvestment, existingWacc } = calculateHoldingsAtIndex(transactions, transaction.company, index);

                // Calculate new and total values based on the current transaction and existing holdings
                const newQuantity = transaction.type === 'Buy' ? transaction.quantity : -transaction.quantity;
                const newInvestment = transaction.type === 'Buy' ? transaction.amountPayable : -(transaction.quantity * existingWacc); // Formula for New Investment on Sell using Existing WACC

                const totalQuantity = existingQuantity + newQuantity;
                const totalInvestment = existingInvestment + newInvestment;

                const newWacc = totalQuantity > 0 ? totalInvestment / totalQuantity : 0; // Formula for New WACC

                return (
                  <tr key={index} className={transaction.type === 'Buy' ? 'buy-row' : 'sell-row'}>
                    <td>{formatValue(transaction.date, false)}</td>
                    <td>{formatValue(transaction.company, false)}</td>
                    <td>{formatValue(transaction.quantity, false)}</td>
                    <td>{formatValue(transaction.wacc)}</td>{/* This is the WACC saved with the transaction */}
                    <td>{transaction.type === 'Sell' ? formatValue(transaction.price) : '-'}</td>
                    <td>{formatValue(transaction.type, false)}</td>
                    <td>{formatValue(transaction.transactionSource || (transaction.type === 'Sell' ? 'Secondary' : ''), false)}</td>
                    <td>{transaction.type === 'Buy' ? formatValue(transaction.amountPayable) : '-'}</td>
                    <td>{transaction.type === 'Sell' ? formatValue(transaction.amountReceivable) : '-'}</td>
                    <td>{formatValue(transaction.totalCommission)}</td>
                    <td>{transaction.type === 'Sell' ? formatValue(transaction.capitalGainTax) : '-'}</td>
                    <td>{transaction.type === 'Sell' ? formatValue(transaction.netProfitLoss) : '-'}</td>
                    <td>{transaction.type === 'Sell' ? `${formatValue(transaction.netProfitLossPercentage)}%` : '-'}</td>
                    {/* Display new columns */}
                    <td>{formatValue(existingQuantity, false)}</td>
                    <td>{formatValue(newQuantity, false)}</td>
                    <td>{formatValue(totalQuantity, false)}</td>
                    <td>{formatValue(existingInvestment)}</td>
                    <td>{formatValue(newInvestment)}</td>
                    <td>{formatValue(totalInvestment)}</td>
                    <td>{formatValue(existingWacc)}</td>
                    <td>{formatValue(newWacc)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No transactions added yet.</p>
      )}
    </div>
  );
}

export default Transactions; 