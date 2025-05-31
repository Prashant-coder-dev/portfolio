import React, { useEffect, useMemo, useState } from 'react';
import './NEPSE.css'; // Assuming you might want a CSS file for this component
import PropTypes from 'prop-types';

const TOP_VOLUME_GID = '1392573911';

function NEPSE({ indexData, topTurnoverData, topVolumeData, todayPrices, textValue }) {
  // Component logic for the NEPSE tab goes here

  // State for Top Gainers/Losers sub-tabs
  const [activeSubTab, setActiveSubTab] = useState('Gainers');

  // Function to handle sub-tab change
  const handleSubTabChange = (tab) => {
    setActiveSubTab(tab);
  };

  useEffect(() => {
    console.log('NEPSE component received indexData:', indexData);
    console.log('NEPSE component received topTurnoverData:', topTurnoverData);
    console.log('NEPSE component received topVolumeData:', topVolumeData);
    console.log('NEPSE component received todayPrices:', todayPrices);
    console.log('NEPSE component received textValue:', textValue); // Log textValue
  }, [indexData, topTurnoverData, topVolumeData, todayPrices, textValue]); // Add textValue to dependency array

  // Calculate Top Gainers and Losers from todayPrices using useMemo
  const { topGainers, topLosers } = useMemo(() => {
    if (!todayPrices || todayPrices.length === 0) {
      return { topGainers: [], topLosers: [] };
    }

    const pricedStocks = todayPrices.map(stock => {
      const ltp = parseFloat(stock.LTP);
      const prevClose = parseFloat(stock['Prev. Close']);

      // Ensure LTP and Prev. Close are valid numbers greater than 0
      if (!isNaN(ltp) && ltp > 0 && !isNaN(prevClose) && prevClose > 0) {
        const change = ltp - prevClose;
        const percentChange = (change / prevClose) * 100;
        return { ...stock, change, percentChange };
      } else {
        return null; // Filter out stocks with invalid data
      }
    }).filter(stock => stock !== null); // Remove null entries

    // Sort by percent change
    const sortedByPercentChange = [...pricedStocks].sort((a, b) => b.percentChange - a.percentChange);

    // Get top 10 gainers and top 10 losers
    const topGainers = sortedByPercentChange.slice(0, 10);
    const topLosers = sortedByPercentChange.slice(-10).reverse(); // Get last 10 and reverse for ascending order

    return { topGainers, topLosers };
  }, [todayPrices]); // Recalculate when todayPrices changes

  // Function to safely access and format data with separators and decimals
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
      let formatOptions = {
          minimumFractionDigits: minimumFractionDigits,
          maximumFractionDigits: maximumFractionDigits,
      };

      // For quantities/volumes/shares traded, might not need decimals
       // Also handle potential integer values from the sheet that shouldn't have decimals
      if (!isCurrency && Number.isInteger(numValue)) {
           formatOptions = { maximumFractionDigits: 0 };
      } else if (!isCurrency && maximumFractionDigits === 0) { // Explicitly want no decimals even if not an integer
          formatOptions = { maximumFractionDigits: 0 };
      }

      return numValue.toLocaleString(undefined, formatOptions); // Use undefined to use user's locale
  };

  // Define table headers and data keys for different sections
  const indexTableHeaders = indexData && indexData.length > 0 ? Object.keys(indexData[0]) : [];
  const topGainerTableHeaders = ['Symbol', 'LTP', 'Change', '% Change'];
  const topLoserTableHeaders = ['Symbol', 'LTP', 'Change', '% Change'];
  const topTurnoverTableHeaders = topTurnoverData && topTurnoverData.length > 0 ? Object.keys(topTurnoverData[0]) : [];
  const topVolumeTableHeaders = topVolumeData && topVolumeData.length > 0 ? Object.keys(topVolumeData[0]) : [];

  const renderTable = (data, headers, sectionTitle) => {
    if (!data || data.length === 0) {
      return <p>Loading {sectionTitle} data or no data available.</p>;
    }

    return (
      <div className="nepse-section">
        <h3>{sectionTitle}</h3>
        <table className="nepse-table">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((header, colIndex) => {
                   // Use bracket notation for keys with special characters like 'Prev. Close'
                   // Adjust access for calculated fields (Change, % Change) and original keys (Symbol, LTP)
                   let cellContent;
                   const trimmedHeader = header.trim();

                   switch (trimmedHeader) {
                       case 'Symbol':
                           cellContent = row.Symbol;
                           break;
                       case 'LTP':
                           // Format LTP to two decimal places
                           cellContent = formatValue(row.LTP, { isCurrency: true });
                           break;
                       case 'Change':
                           // Format calculated change to two decimal places
                           cellContent = formatValue(row.change, { isCurrency: true });
                           break;
                       case '% Change':
                           // Format calculated percent change to two decimal places
                           cellContent = `${formatValue(row.percentChange, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
                           break;
                       case 'Turnover':
                           // Format Turnover without decimal places, not as currency
                           cellContent = formatValue(row.Turnover, { isCurrency: false, maximumFractionDigits: 0 });
                           break;
                       default:
                           // For other headers (like in Index, Turnover, Volume data)
                           // Apply formatting to other numeric columns, default to currency format
                           // Check if the value is likely a number before formatting
                           const cellValue = row[trimmedHeader];
                           if (!isNaN(parseFloat(cellValue))) {
                               // For Volume, specifically format without decimals
                               if (trimmedHeader === 'Volume') {
                                   cellContent = formatValue(cellValue, { isCurrency: false, maximumFractionDigits: 0 });
                               } else {
                                   // Default formatting for other numeric columns
                                    cellContent = formatValue(cellValue);
                               }
                           } else {
                               cellContent = cellValue; // Display non-numeric values as is
                           }
                           break;
                   }

                  return <td key={colIndex}>{cellContent}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="nepse-container">
      <h2>NEPSE Market Data</h2>

      {/* Display textValue like "LTP As of:" */}
      {textValue && (
        <div className="nepse-text-value">
          <p>As of: {textValue}</p>
        </div>
      )}

      {/* Section for Index Data */}
      {renderTable(indexData, indexTableHeaders, 'NEPSE Index')}

      {/* Container for three columns below Index */}
      <div className="nepse-columns-container">

        {/* Section for Top Gainers/Losers (Column 1) */}
        <div className="nepse-gainers-losers-column">
          {/* Sub-tab navigation */}
          <div className="nepse-sub-tabs">
            <button
              className={`nepse-sub-tab-button ${activeSubTab === 'Gainers' ? 'active' : ''}`}
              onClick={() => handleSubTabChange('Gainers')}
            >
              Top Gainers
            </button>
            <button
              className={`nepse-sub-tab-button ${activeSubTab === 'Losers' ? 'active' : ''}`}
              onClick={() => handleSubTabChange('Losers')}
            >
              Top Losers
            </button>
            {/* Add refresh icon and View all link */}
            <div className="nepse-sub-tab-actions">
              <span className="refresh-icon">🔄</span> {/* Replace with actual icon */}
            </div>
          </div>

          {/* Render Gainer or Loser table based on activeSubTab */}
          {activeSubTab === 'Gainers' ? (
            renderTable(topGainers, topGainerTableHeaders, '') // Pass empty title as heading is above
          ) : (
            renderTable(topLosers, topLoserTableHeaders, '') // Pass empty title as heading is above
          )}
        </div>

        {/* Section for Top Turnover (Column 2) */}
        <div className="nepse-turnover-column">
          {renderTable(topTurnoverData, topTurnoverTableHeaders, 'Top Turnover')}
        </div>

        {/* Section for Top Volume (Column 3) */}
        <div className="nepse-volume-column">
          {renderTable(topVolumeData, topVolumeTableHeaders, 'Top Volume')}
        </div>

      </div> {/* End nepse-columns-container */}

    </div>
  );
}

NEPSE.propTypes = {
    indexData: PropTypes.array,
    topTurnoverData: PropTypes.array,
    topVolumeData: PropTypes.array,
    todayPrices: PropTypes.array, // Add prop type for todayPrices
    textValue: PropTypes.string, // Add prop type for textValue
};

export default NEPSE; 