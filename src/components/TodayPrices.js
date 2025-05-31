import React, { useEffect, useState, useMemo } from 'react';
import './TodayPrices.css'; // Import CSS file

function TodayPrices({ prices, textValue }) {
  // Component logic for displaying today's prices goes here
  // This will involve formatting and displaying the fetched prices

  const [searchTerm, setSearchTerm] = useState(''); // State for search input

   useEffect(() => {
    console.log('TodayPrices component received prices prop:', prices);
     console.log('TodayPrices component received textValue prop:', textValue);
  }, [prices, textValue]); // Log whenever the prices or textValue prop changes

  // Function to handle search input changes
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

   // Memoize filtered prices data for performance
  const filteredPrices = useMemo(() => {
    if (!searchTerm) {
      return prices; // Return all prices if search term is empty
    }
    // Filter prices based on company symbol (case-insensitive)
    return prices.filter(priceItem => 
        priceItem.Symbol && priceItem.Symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [prices, searchTerm]); // Recalculate when prices or search term change

   // Function to safely access and format data with separators and decimals
  const formatValue = (value, options = {}) => {
      const { isCurrency = true, minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;

      if (value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value)) ) {
          return isCurrency ? '0.00' : '-';
      }
       if (isCurrency || typeof value === 'number') { // Apply formatting to numbers and currency
           // Use toLocaleString for thousands separators and toFixed for decimal places
            const num = parseFloat(value);
            if (isNaN(num)) return value; // Return original if not a valid number

            // Check if the number has decimals, if not, display as integer
            if (Number.isInteger(num) && !isCurrency) {
                 return num.toString();
            } else {
                return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
       }
      return value;
  };

    // Get headers dynamically from the first price object (if available)
    const tableHeaders = prices && prices.length > 0 ? Object.keys(prices[0]) : [];


  return (
    <div className="today-prices-container"> {/* Added a container div for layout */}
      <div className="today-prices-header"> {/* Container for the header and text value */}
        <h2>Last Traded Price (LTP)</h2>{/* Updated title */}
         <div className="search-container"> {/* Add a container for search input */}
            <input
                type="text"
                placeholder="Enter Company Symbol"
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
            />
            {/* You can add a search icon here if desired, similar to your screenshot */}
            {/* <span className="search-icon">🔍</span> */}
             <span className="search-icon">🔍</span> {/* Add the search icon element */}
         </div>
        {textValue && <div className="text-value-display">{textValue}</div>} {/* Display the text value */}
      </div>
      {/* Use filteredPrices for conditional rendering and mapping */}
      {filteredPrices && filteredPrices.length > 0 ? (
        <div className="table-responsive"> {/* Add div for responsive table */}
          <table className="prices-table"> {/* Add class for styling */}
            <thead>
              <tr>
                {/* Assuming your CSV headers are the keys in the price objects */}
                {tableHeaders.map(header => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Map over filteredPrices instead of prices */}
              {filteredPrices.map((priceItem, index) => {

                // Determine row class based on 'Point Change' value
                const pointChangeValue = parseFloat(priceItem['Point Change']);
                let rowClass = '';
                if (!isNaN(pointChangeValue)) {
                    if (pointChangeValue > 0) {
                        rowClass = 'positive-change';
                    } else if (pointChangeValue < 0) {
                        rowClass = 'negative-change';
                    } else {
                        rowClass = 'no-change';
                    }
                }

                return (
                <tr key={index} className={rowClass}> {/* Add dynamic class here */}
                  {tableHeaders.map((header, idx) => {
                      let cellContent = formatValue(priceItem[header], header !== 'Symbol');
                      let cellClass = '';

                      // Apply specific formatting and styling based on header
                      if (header === 'S.No') {
                          cellContent = parseInt(priceItem[header]); // Remove decimal for S.No
                          cellClass = 'text-center'; // Center S.No
                      } else if (header === 'LTP' || header === 'Point Change' || header === '% Change' || header === 'Prev. Close') {
                          if (header === '% Change') {
                               // Add % symbol and format as percentage
                                const percentValue = parseFloat(priceItem[header]);
                                if (!isNaN(percentValue)) {
                                     cellContent = `${formatValue(percentValue, false)}%`; // Format as number with 2 decimals and add %
                                } else {
                                    cellContent = '-';
                                }
                          } else if (header === 'LTP' || header === 'Prev. Close') {
                              // Format with separators and 2 decimal places (already handled by formatValue with isCurrency=true or if type is number)
                               cellContent = formatValue(priceItem[header], true);
                          }
                      } else if (header === 'Prev. Close') {
                           cellContent = formatValue(priceItem[header], true); // Format with separators
                      }

                      return (
                          <td key={idx} className={cellClass}>{cellContent}</td>
                      );
                  })}
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Loading today's prices or no data available.</p>
      )}
    </div>
  );
}

export default TodayPrices; 