import React, { useEffect, useState, useMemo } from 'react';
import './RealisedPnL.css'; // Assuming you might want a CSS file for this component
import PropTypes from 'prop-types';

function RealisedPnL({ transactions }) {
  // Component logic for calculating and displaying realised P&L goes here
  // This will involve processing transactions

   useEffect(() => {
    console.log('RealisedPnL component received transactions prop:', transactions);
  }, [transactions]); // Log whenever the transactions prop changes

  // Define table headers with keys
  const tableHeaders = [
    { key: 'company', label: 'Company' },
    { key: 'unitsTraded', label: 'Units Traded' }, // This will be sum of bought/sold units considered in P&L
    { key: 'totalInvestment', label: 'Total Investment' }, // Cost basis of units sold
    { key: 'soldValue', label: 'Sold Value (Total Receivables)' }, // Total amount received from selling those units
    { key: 'realisedPnL', label: 'Realised P&L' },
    { key: 'realisedPnLPercentage', label: 'Realised P&L%' },
  ];

  // Calculate realised P&L whenever transactions change
  const realisedPnLData = useMemo(() => {
    console.log('Calculating realised P&L...');
    const pnlMap = new Map(); // Map to store P&L data per company
    const buyLots = new Map(); // Map to store buy lots (FIFO) per company

    // Sort transactions by date (ascending) to ensure FIFO
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedTransactions.forEach(transaction => {
        const company = transaction.company;
        const quantity = parseFloat(transaction.quantity);
        const price = parseFloat(transaction.price);
        const amountPayable = parseFloat(transaction.amountPayable) || 0; // Use amountPayable for buy cost
        const amountReceivable = parseFloat(transaction.amountReceivable) || 0; // Use amountReceivable for sell value

        // Initialize company entry in maps if it doesn't exist
        if (!pnlMap.has(company)) {
            pnlMap.set(company, { company: company, unitsTraded: 0, totalInvestment: 0, soldValue: 0, realisedPnL: 0, realisedPnLPercentage: 0 });
            buyLots.set(company, []);
        }

        const currentPnL = pnlMap.get(company);
        const currentBuyLots = buyLots.get(company);

        if (transaction.type === 'Buy') {
            // Add the new buy lot (quantity and total cost)
             currentBuyLots.push({ quantity: quantity, remainingQuantity: quantity, totalCost: amountPayable });
             // Sort buy lots by date/arrival (already sorted by transaction date, but ensure if multiple buys on same day)
             currentBuyLots.sort((a, b) => new Date(a.date) - new Date(b.date)); // Assuming transaction object has a date field

        } else if (transaction.type === 'Sell') {
            let sellQuantityRemaining = quantity;
            let costBasisForSell = 0;

            // Process buy lots using FIFO
            while (sellQuantityRemaining > 0 && currentBuyLots.length > 0) {
                const oldestBuyLot = currentBuyLots[0];
                const quantityToSellFromLot = Math.min(sellQuantityRemaining, oldestBuyLot.remainingQuantity);
                const costPerUnit = oldestBuyLot.totalCost / oldestBuyLot.quantity; // Calculate cost per unit for this buy lot

                costBasisForSell += quantityToSellFromLot * costPerUnit;
                oldestBuyLot.remainingQuantity -= quantityToSellFromLot;
                sellQuantityRemaining -= quantityToSellFromLot;

                // Remove the buy lot if fully used
                if (oldestBuyLot.remainingQuantity <= 0) {
                    currentBuyLots.shift(); // Remove the oldest lot
                }
            }

            // Calculate realised P&L for this sell transaction
            const realisedPnLForSell = amountReceivable - costBasisForSell;

            // Update the P&L data for the company
            currentPnL.unitsTraded += quantity; // Add sold quantity to units traded
            currentPnL.totalInvestment += costBasisForSell; // Add cost basis of sold units
            currentPnL.soldValue += amountReceivable; // Add total amount received from sell
            currentPnL.realisedPnL += realisedPnLForSell;

             // Recalculate percentage after updating realised P&L and total investment
            currentPnL.realisedPnLPercentage = currentPnL.totalInvestment > 0 ? (currentPnL.realisedPnL / currentPnL.totalInvestment) * 100 : 0;
        }
    });

    // Convert the map values to an array for rendering
    const calculatedPnLData = Array.from(pnlMap.values()).filter(item => item.unitsTraded > 0); // Filter out companies with no realised P&L
    console.log('Calculated realised P&L data:', calculatedPnLData);
    return calculatedPnLData;

  }, [transactions]); // Recalculate when transactions change

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

    const formatPercentage = (value) => {
       if (value === undefined || value === null || value === '' || (typeof parseFloat(value) !== 'number' || isNaN(parseFloat(value))) ) {
          return 'N/A';
      }
      const numValue = parseFloat(value);
       return numValue.toLocaleString(undefined, { // Use undefined for locale
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
       }) + '%';
  };


  return (
    <div className="realised-pnl-container"> {/* Add a container div */}
      <h2>Realised Profit & Loss</h2>

       {/* Table to display Realised P&L data */}
       {realisedPnLData && realisedPnLData.length > 0 ? (
         <div className="table-responsive"> {/* Add div for responsive table */}
           <table className="realised-pnl-table"> {/* Add class for styling */}
             <thead>
               <tr>
                 {/* Render table headers dynamically */}
                 {tableHeaders.map((header, index) => (
                    <th key={index}>{header.label}</th>
                 ))}
               </tr>
             </thead>
             <tbody>
                {/* Map over realisedPnLData to render table rows */}
                {realisedPnLData.map((item, index) => (
                    <tr key={index}> {/* Use index as key, or a unique identifier if available in calculated data */}
                        <td>{item.company}</td>
                        <td>{formatValue(item.unitsTraded, { isCurrency: false, minimumFractionDigits: 0, maximumFractionDigits: 4 })}</td>{/* Units Traded - not currency, allow more decimal places */}
                        <td>{formatValue(item.totalInvestment)}</td>{/* Total Investment */}
                        <td>{formatValue(item.soldValue)}</td>{/* Sold Value */}
                        <td>{formatValue(item.realisedPnL)}</td>{/* Realised P&L */}
                        <td>{formatPercentage(item.realisedPnLPercentage)}</td>{/* Realised P&L % */}
                    </tr>
                ))}
             </tbody>
           </table>
         </div>
       ) : (
         <p>No realised profit or loss yet. Add some buy and sell transactions!</p>
       )}

      {/* Optional: Display raw data for debugging */}
      {/*
      <h3>Transactions Data (for reference):</h3>
      <pre>{JSON.stringify(transactions, null, 2)}</pre>
      */}
    </div>
  );
}

// Add prop types for transactions
RealisedPnL.propTypes = {
    transactions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        company: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
        price: PropTypes.number,
        date: PropTypes.string.isRequired,
        amountPayable: PropTypes.number, // from backend
        amountReceivable: PropTypes.number, // from backend
        // Add other relevant fields as needed (e.g., totalCommission, sebonFee, dpCharge if included in cost basis calculation)
    })).isRequired,
};

export default RealisedPnL; 