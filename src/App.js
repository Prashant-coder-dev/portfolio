import React, { useState, useEffect } from 'react';
import TabNavigation from './components/TabNavigation';
import AddTransaction from './components/AddTransaction';
import Transactions from './components/Transactions';
import Holdings from './components/Holdings';
import RealisedPnL from './components/RealisedPnL';
import TodayPrices from './components/TodayPrices';
import './App.css'; // Import the CSS file

// Google Sheet Details
const SHEET_ID = '1Q_En7VGGfifDmn5xuiF-t_02doPpwl4PLzxb4TBCW0Q';
const TODAY_PRICES_GID = '973375528';
const TEXT_VALUE_GID = '1931558468'; // Added new GID for text value

// Function to construct the Google Sheet URL for CSV export
const getGoogleSheetCsvUrl = (sheetId, gid) => {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
};

function App() {
  const [activeTab, setActiveTab] = useState('Holdings');
  const [transactions, setTransactions] = useState([]);
  const [todayPrices, setTodayPrices] = useState([]);
  const [holdingsData, setHoldingsData] = useState([]); // State for holdings data
  const [textValue, setTextValue] = useState(''); // State for the text value from G2

  // Load transactions from localStorage on initial load
  useEffect(() => {
    console.log('Attempting to load transactions from localStorage...');
    const savedTransactions = localStorage.getItem('portfolioTransactions');
    if (savedTransactions) {
      try {
        const parsedTransactions = JSON.parse(savedTransactions);
        // Add a check to ensure parsed data is an array
        if (Array.isArray(parsedTransactions)) {
            console.log('Successfully loaded transactions:', parsedTransactions);
            setTransactions(parsedTransactions);
        } else {
            console.error('Loaded data from localStorage is not an array.', parsedTransactions);
            localStorage.removeItem('portfolioTransactions'); // Clear invalid data
            setTransactions([]); // Initialize with empty array
        }
      } catch (error) {
        console.error('Error parsing transactions from localStorage:', error);
        // Clear invalid data if parsing fails
        localStorage.removeItem('portfolioTransactions');
        setTransactions([]); // Initialize with empty array on error
      }
    } else {
       console.log('No transactions found in localStorage.');
       setTransactions([]); // Initialize with empty array if nothing in localStorage
    }
  }, []); // Empty dependency array means this runs once on mount

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    console.log('Transactions state changed. Attempting to save to localStorage...', transactions);
    // Only save if transactions is an array and not empty
    if (Array.isArray(transactions) && transactions.length > 0) {
        try {
            localStorage.setItem('portfolioTransactions', JSON.stringify(transactions));
            console.log('Successfully saved transactions to localStorage.');
        } catch (error) {
            console.error('Error saving transactions to localStorage:', error);
        }
    } else {
        // Optionally clear localStorage if transactions become empty (be cautious with this)
        // localStorage.removeItem('portfolioTransactions');
        console.log('Transactions array is empty or not an array, not saving to localStorage.');
    }
  }, [transactions]); // Dependency array includes transactions so it runs when transactions change

  // Calculate holdings whenever transactions change (updated logic)
  useEffect(() => {
    console.log('Transactions changed, recalculating holdings...');
    const holdingsMap = new Map();

    transactions.forEach(transaction => {
        const companySymbol = transaction.company;

        // Get current holding state for the company
        const currentHolding = holdingsMap.get(companySymbol) || { totalQuantity: 0, totalCost: 0, wacc: 0 };

        let newQuantity = currentHolding.totalQuantity;
        let newTotalCost = currentHolding.totalCost;
        let newWacc = currentHolding.wacc; // Keep track of the latest WACC

        if (transaction.type === 'Buy') {
            newQuantity += transaction.quantity;
            newTotalCost += transaction.amountPayable;
             // Recalculate WACC after a buy transaction
            newWacc = newTotalCost / newQuantity;

        } else if (transaction.type === 'Sell') {
             // For sell transactions, we need to know the WACC *before* this transaction
             // to calculate the remaining totalCost correctly for potential future buys.
             // However, since we only need the *last* newWacc for the holdings summary,
             // we can update the quantity and total cost here and calculate the *newWacc*
             // for this specific transaction point.

             // Use the existing WACC before this sell for calculating cost basis reduction
             const costBasisReduction = transaction.quantity * currentHolding.wacc;
             newQuantity -= transaction.quantity;
             newTotalCost -= costBasisReduction; // Reduce total cost basis

             // If quantity goes to zero or below, reset total cost and WACC for this company
             if (newQuantity <= 0) {
                 newQuantity = 0;
                 newTotalCost = 0;
                 newWacc = 0;
             } else {
                 // Recalculate WACC for remaining shares based on adjusted total cost
                 newWacc = newTotalCost / newQuantity;
             }
        }

        // Update the holdings map with the state *after* the current transaction
        holdingsMap.set(companySymbol, { totalQuantity: newQuantity, totalCost: newTotalCost, wacc: newWacc }); // Store the latest newWacc
    });

     // Convert the map values back to an array for the holdingsData state
    const calculatedHoldings = Array.from(holdingsMap.values()).filter(holding => holding.totalQuantity > 0); // Filter out companies with zero or negative quantity

    setHoldingsData(calculatedHoldings);
    console.log('Holdings data calculated based on last transaction WACC:', calculatedHoldings);

  }, [transactions]); // Recalculate holdings when transactions change

  const addTransaction = (transaction) => {
    console.log('Adding new transaction:', transaction);
    setTransactions([...transactions, transaction]);
  };

  // Function to fetch and parse CSV data from Google Sheets
  const fetchCsvData = async (url, setData, isTextValue = false) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();

      if (isTextValue) {
           // For text value, split into rows and columns and get the G2 value (row 2, column 7)
           const rows = text.split('\n').map(row => row.split(','));
           if (rows.length > 1 && rows[1].length > 6) { // Check if row 2 and column G (index 6) exist
               setData(rows[1][6].trim()); // Set the state with the G2 value
           } else {
               console.warn('G2 cell not found or sheet structure unexpected for text value GID.');
               setData(''); // Set to empty string if G2 is not found
           }
      } else {
        // Basic CSV parsing logic for tables (will need refinement based on actual sheet format)
        const rows = text.split('\n').map(row => row.split(','));
        // Assuming the first row is headers, slice it off and create objects
        if (rows.length > 1) {
            const headers = rows[0];
            const data = rows.slice(1).map(row => {
                let obj = {};
                headers.forEach((header, index) => {
                    obj[header.trim()] = row[index] ? row[index].trim() : '';
                });
                return obj;
            }).filter(obj => Object.values(obj).some(value => value !== '')); // Filter out potentially empty rows
            // console.log('Fetched and parsed CSV data:', data); // Avoid excessive logging
            setData(data);
        } else {
            setData([]); // Handle empty sheet
        }
      }
    } catch (error) {
      console.error('Error fetching or parsing CSV data:', error);
      if (isTextValue) {
          setData(''); // Set to empty string on error for text value
      } else {
          setData([]); // Set to empty array on error for table data
      }
    }
  };

  // Fetch prices and text value on component mount
  useEffect(() => {
    console.log('Fetching prices and text value from Google Sheets...');
    const todayPricesUrl = getGoogleSheetCsvUrl(SHEET_ID, TODAY_PRICES_GID);
    const textValueUrl = getGoogleSheetCsvUrl(SHEET_ID, TEXT_VALUE_GID);

    fetchCsvData(todayPricesUrl, setTodayPrices);
    fetchCsvData(textValueUrl, setTextValue, true); // Fetch text value and mark as such

  }, []); // Empty dependency array means this runs once on mount

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Add Transaction':
        return <AddTransaction onAddTransaction={addTransaction} transactions={transactions} holdings={holdingsData} />; // Pass transactions and holdings down
      case 'Transaction':
        return <Transactions transactions={transactions} />;
      case 'Holdings':
        return <Holdings transactions={transactions} todayPrices={todayPrices} holdings={holdingsData} />; // Pass holdings down
      case 'Realised P&L by Company':
        return <RealisedPnL transactions={transactions} />; // May need prices and holdings here too
      case 'Last Traded Price (LTP)':
        return <TodayPrices prices={todayPrices} textValue={textValue} />; // Pass todayPrices and textValue down
      default:
        return <Holdings transactions={transactions} todayPrices={todayPrices} holdings={holdingsData} />; // Default to Holdings tab, pass holdings down
    }
  };

  return (
    <div className="app-container">
      <h1>Portfolio Tracker</h1>
      <div className="main-layout">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default App; 