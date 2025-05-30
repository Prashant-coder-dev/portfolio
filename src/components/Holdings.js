import React, { useEffect, useState } from 'react';

function Holdings({ transactions, todayPrices, holdings }) {
  // Component logic for calculating and displaying holdings goes here

  // holdingsData is now calculated in App.js and passed as a prop
  // const [holdingsData, setHoldingsData] = useState([]);

  // useEffect(() => {
  //   console.log('Holdings component received transactions prop:', transactions);
  //   console.log('Holdings component received todayPrices prop:', todayPrices);
  //   // Calculation logic moved to App.js
  // }, [transactions]);

   useEffect(() => {
    console.log('Holdings component received holdings prop:', holdings);
     console.log('Holdings component received todayPrices prop:', todayPrices);
  }, [holdings, todayPrices]); // Log when holdings or prices change

  const tableHeaders = [
    'Company Symbol',
    'Total Quantity',
    'Average Buy Price (WACC)',
    'Total Investment', // Added Total Investment header
    'Ltp', // Renamed from Current Price
    'Value', // Renamed from Total Value
    'Profit/Loss', // Added new column
    'Profit/Loss%', // Added new column
    'Point Change', // Added new column
    'Change Value', // Added new column
    'Previous Close', // Added new column
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


  return (
    <div>
      <h2>Current Holdings</h2>
      {holdings && holdings.length > 0 ? (
        <div className="table-responsive"> {/* Added div for responsive table */}
          <table className="holdings-table"> {/* Added class for styling */}
            <thead>
              <tr>
                {tableHeaders.map(header => (
                  <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
                 // Find the price data for the current holding's symbol
                 const priceData = todayPrices.find(price => price.symbol === holding.company);
                 const ltp = priceData ? parseFloat(priceData.ltp) : 0;
                 const previousClose = priceData ? parseFloat(priceData.previousClose) : 0;

                 // Calculate new column values
                 const totalValue = holding.totalQuantity * ltp;
                 const profitLoss = totalValue - holding.totalCost;
                 const profitLossPercentage = holding.totalCost > 0 ? (profitLoss / holding.totalCost) * 100 : 0;
                 const pointChange = ltp - previousClose;
                 const changeValue = pointChange * holding.totalQuantity;


              return (
              <tr key={holding.company}>
                <td>{formatValue(holding.company, false)}</td>
                <td>{formatValue(holding.totalQuantity, false)}</td>
                <td>{formatValue(holding.wacc)}</td>
                 <td>{formatValue(holding.totalCost)}</td>{/* Display Total Investment */}
                {/* Display Current Price and Total Value here using todayPrices */}
                 <td>{formatValue(ltp)}</td>{/* Current Price (Ltp) */}
                 <td>{formatValue(totalValue)}</td>{/* Total Value */}
                 <td>{formatValue(profitLoss)}</td>{/* Profit/Loss */}
                 <td>{`${formatValue(profitLossPercentage)}%`}</td>{/* Profit/Loss% */}
                 <td>{formatValue(pointChange)}</td>{/* Point Change */}
                 <td>{formatValue(changeValue)}</td>{/* Change Value */}
                 <td>{formatValue(previousClose)}</td>{/* Previous Close */}
              </tr>
            );
          })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No holdings yet. Add some buy transactions!</p>
      )}
      {/* Display the transactions and todayPrices props for inspection */}
      {/*
      <h3>Transactions Data (for reference):</h3>
      <pre>{JSON.stringify(transactions, null, 2)}</pre>
      <h3>Today's Prices Data (for reference):</h3>
      <pre>{JSON.stringify(todayPrices, null, 2)}</pre>
      <h3>Holdings Data (for reference):</h3>
      <pre>{JSON.stringify(holdings, null, 2)}</pre>
      */}
    </div>
  );
}

export default Holdings; 