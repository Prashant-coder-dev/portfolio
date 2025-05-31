import React, { useEffect, useState, useMemo } from 'react';
import './Holdings.css';

function Holdings({ transactions, todayPrices, holdings, summaryData }) {
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
     console.log('Holdings component received todayPrices data structure example:', todayPrices.length > 0 ? todayPrices[0] : 'No price data'); // Log structure of price data
     console.log('Holdings component received a sample of todayPrices data:', todayPrices.length > 0 ? todayPrices.slice(0, 5) : 'No price data received'); // Add this log
     console.log('Holdings component received summaryData prop:', summaryData); // Log summaryData
  }, [holdings, todayPrices]); // Log when holdings or prices change

  const tableHeaders = [
    { key: 'company', label: 'Company Symbol' },
    { key: 'totalQuantity', label: 'Total Quantity' },
    { key: 'wacc', label: 'Average Buy Price (WACC)' },
    { key: 'totalCost', label: 'Total Investment' },
    { key: 'ltp', label: 'Ltp' },
    { key: 'totalValue', label: 'Value' },
    { key: 'profitLoss', label: 'Profit/Loss' },
    { key: 'profitLossPercentage', label: 'Profit/Loss%' },
    { key: 'pointChange', label: 'Point Change' },
    { key: 'changeValue', label: 'Change Value' },
    { key: 'previousClose', label: 'Previous Close' },
  ];

  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Function to handle sorting when a header is clicked
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc'); // Default to ascending when changing column
    }
  };

  // Memoize sorted data for performance
  const sortedHoldings = useMemo(() => {
    let sortableHoldings = [...holdings]; // Create a copy to avoid mutating state

    // Apply sorting
    if (sortColumn) {
      sortableHoldings.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        // Handle potential null or undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
        if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

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
     // Default alphabetical order by company symbol if no sorting is applied
     else {
         sortableHoldings.sort((a, b) => String(a.company).toLowerCase().localeCompare(String(b.company).toLowerCase()));
     }

    return sortableHoldings;
  }, [holdings, sortColumn, sortDirection]); // Recalculate when these dependencies change

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


  return (
    <div>
      <h2>Current Holdings</h2>

      {/* Display Summary Data */}
      {summaryData && summaryData.length > 0 && (
        <div className="holdings-summary">
          <h3>Summary</h3>
          {/* Render summary data in a table-like structure matching the screenshot */}
          {/* Assuming summaryData[0] contains all the key-value pairs */}
          {summaryData.length > 0 && (
            <table className="summary-table">
              <tbody>
                <tr>
                  <th>{summaryData[0]['No. of Units:'] ? 'No. of Units:' : 'No. of Units'}</th>
                  <th>{summaryData[0]['Investment:'] ? 'Investment:' : 'Investment'}</th>
                  <th>{summaryData[0]['Value:'] ? 'Value:' : 'Value'}</th>
                </tr>
                <tr>
                  <td>{summaryData[0]['393'] || summaryData[0]['No. of Units']}</td> {/* Assuming the key might be the value from the cell above */}
                  <td>{summaryData[0]['102228.75'] || summaryData[0]['Investment']}</td>
                  <td>{summaryData[0]['92657.51'] || summaryData[0]['Value']}</td>
                </tr>
                <tr>
                  <th>{summaryData[0]['Stock Holding']}</th>
                  <th>{summaryData[0]['Net Loss']}</th>
                  <th>{summaryData[0]['Net Loss%']}</th>
                </tr>
                <tr>
                  <td>{summaryData[0]['5'] || summaryData[0]['Stock Holding']}</td>
                  <td>{summaryData[0]['-10054.35 ▼'] || summaryData[0]['Net Loss']}</td>
                  <td>{summaryData[0]['-9.84% ▼'] || summaryData[0]['Net Loss%']}</td>
                </tr>
                <tr>
                  <th>{summaryData[0]['Sector Holding']}</th>
                  <th colSpan="2">{summaryData[0]['Today\'s Profit']}</th> {/* Spans 2 columns */}
                </tr>
                <tr>
                  <td>{summaryData[0]['4'] || summaryData[0]['Sector Holding']}</td>
                  <td colSpan="2">{summaryData[0]['0.00 ▲'] || summaryData[0]['Today\'s Profit']}</td> {/* Spans 2 columns */}
                </tr>
                <tr>
                  <th colSpan="2">{summaryData[0]['Receivable Amount :']}</th> {/* Spans 2 columns */}
                  <th>{summaryData[0]['92174.40'] || summaryData[0]['Receivable Amount :']}</th> {/* Assuming value is under a key that might be the value itself */} {/* This row/cell arrangement for Receivable Amount seems a bit off in the screenshot, adjusting based on likely data */} 
                </tr>
                 <tr>
                  <th>{summaryData[0]['Advanced']}</th>
                  <th>{summaryData[0]['Declined']}</th>
                  <th>{summaryData[0]['Unchanged']}</th>
                </tr>
                 <tr>
                  <td>{summaryData[0]['0 ▲'] || summaryData[0]['Advanced']}</td>
                  <td>{summaryData[0]['0 ▼'] || summaryData[0]['Declined']}</td>
                  <td>{summaryData[0]['0 ⇆'] || summaryData[0]['Unchanged']}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Check if holdings data is available before rendering the table */}
      {holdings && holdings.length > 0 ? (
        <div className="table-responsive"> {/* Added div for responsive table */}
          <table className="holdings-table"> {/* Added class for styling */}
            <thead>
              <tr>
                {/* Render table headers dynamically with sorting indicators */}
                {tableHeaders.map((header) => (
                  <th key={header.key} onClick={() => handleSort(header.key)}>
                     {header.label} {/* Display header label */}
                     {sortColumn === header.key && (
                       <span>{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span> // Display text indicator next to label
                     )}
                   </th>
               ))}
            </tr>
          </thead>
          <tbody>
            {/* Map over sorted holdings data to render table rows */}
            {sortedHoldings.map((holding) => {
                 // Find the corresponding price data for the holding's company symbol
                 // console.log('Searching for symbol:', holding.company, 'in price data:', todayPrices); // Add this log
                 // Trim and lowercase both symbols for comparison
                 const holdingSymbolLowerTrimmed = holding.company.trim().toLowerCase();
                //  console.log('Comparing holding symbol:', holdingSymbolLowerTrimmed);
                 const priceData = todayPrices.find(price => {
                     if (!price || !price.Symbol) { // Use price.Symbol with capital S
                        //  console.log('Skipping invalid price entry:', price); // Log invalid entries
                         return false; // Skip if price or symbol is invalid
                     }
                    //  console.log('Processing price object:', price);
                    //  console.log('price.Symbol value:', price.Symbol, 'type:', typeof price.Symbol); // Log value and type
                     const priceSymbolLowerTrimmed = price.Symbol.trim().toLowerCase();
                    //  console.log('...with price symbol (trimmed, lowercase):', priceSymbolLowerTrimmed);
                     return priceSymbolLowerTrimmed === holdingSymbolLowerTrimmed;
                 });

                //  if (priceData) {
                    //  console.log('Price data found for', holding.company + ':', priceData);
                //  }

                //  console.log(`Holding company: ${holding.company}, Price data found: ${priceData ? 'Yes' : 'No'}`, priceData);

                 // Get LTP and Previous Close, default to 0 if not found
                 const ltp = priceData ? parseFloat(priceData.LTP) : 0; // Use priceData.LTP
                 const previousClose = priceData ? parseFloat(priceData['Prev. Close']) : 0; // Use priceData['Prev. Close']

                //  console.log('Parsed LTP:', ltp, 'Parsed Previous Close:', previousClose); // Add this log

                 // Perform calculations for derived fields
                 const totalValue = holding.totalQuantity * ltp;
                 const profitLoss = totalValue - holding.totalCost;
                 // Avoid division by zero for percentage calculation
                 const profitLossPercentage = holding.totalCost > 0 ? (profitLoss / holding.totalCost) * 100 : 0;
                 const pointChange = ltp - previousClose;
                 const changeValue = pointChange * holding.totalQuantity;

                //  console.log('Total Value:', totalValue, 'Profit/Loss:', profitLoss, 'Profit/Loss%', profitLossPercentage, 'Point Change:', pointChange, 'Change Value:', changeValue); // Add this log

                 // Determine row class based on profit/loss for basic styling feedback
                 const rowClass = profitLoss > 0 ? 'profit-row' : profitLoss < 0 ? 'loss-row' : '';

              return (
              <tr key={holding.company} className={rowClass}> {/* Use company symbol as key and apply row class */}
                <td>{holding.company}</td>{/* Company Symbol - display directly */}
                <td>{formatValue(holding.totalQuantity, { isCurrency: false, minimumFractionDigits: 0, maximumFractionDigits: 4 })}</td>{/* Total Quantity - not currency, allow more decimal places */}
                <td>{formatValue(holding.wacc)}</td>{/* Average Buy Price (WACC) */}
                 <td>{formatValue(holding.totalCost)}</td>{/* Total Investment */}
                 <td>{formatValue(ltp)}</td>{/* Ltp */}
                 <td>{formatValue(totalValue)}</td>{/* Value */}
                 <td>{formatValue(profitLoss)}</td>{/* Profit/Loss */}
                 <td>{`${formatValue(profitLossPercentage, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}</td>{/* Profit/Loss% - format percentage */}
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
      {/* Optional: Display raw data for debugging */}
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