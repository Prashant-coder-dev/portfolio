import React, { useState, useEffect } from 'react';
import TabNavigation from './components/TabNavigation';
import AddTransaction from './components/AddTransaction';
import Transactions from './components/Transactions';
import Holdings from './components/Holdings';
import RealisedPnL from './components/RealisedPnL';
import TodayPrices from './components/TodayPrices';
import NEPSE from './components/NEPSE'; // Import the new NEPSE component
import './App.css'; // Import the CSS file

// Google Sheet Details
const SHEET_ID = '1Q_En7VGGfifDmn5xuiF-t_02doPpwl4PLzxb4TBCW0Q';
const TODAY_PRICES_GID = '973375528';
const TEXT_VALUE_GID = '1931558468'; // Added new GID for text value

// Add new GIDs for NEPSE data
const INDEX_GID = '2142211097';
const TOP_TURNOVER_GID = '766316527';
const TOP_VOLUME_GID = '1392573911';

// Add new GID for Summary data
const SUMMARY_GID = '1282363353';

// Function to construct the Google Sheet URL for CSV export
const getGoogleSheetCsvUrl = (sheetId, gid) => {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
};

// Backend API URL (assuming it runs locally on port 5000)
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api/transactions';

function App() {
  const [activeTab, setActiveTab] = useState('Holdings');
  const [transactions, setTransactions] = useState([]);
  const [todayPrices, setTodayPrices] = useState([]);
  const [holdingsData, setHoldingsData] = useState([]); // State for holdings data
  const [textValue, setTextValue] = useState(''); // State for the text value from G2

  // Add state for new NEPSE data (removing gainer and loser state)
  const [indexData, setIndexData] = useState([]);
  const [topTurnoverData, setTopTurnoverData] = useState([]);
  const [topVolumeData, setTopVolumeData] = useState([]);
  const [summaryData, setSummaryData] = useState([]); // State for summary data

  // Function to fetch transactions from the backend
  const fetchTransactions = async () => {
    console.log('Fetching transactions from backend...');
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Add a check to ensure fetched data is an array
      if (Array.isArray(data)) {
          console.log('Successfully loaded transactions from backend:', data);
          setTransactions(data);
      } else {
          console.error('Loaded data from backend is not an array.', data);
          setTransactions([]); // Initialize with empty array
      }
    } catch (error) {
      console.error('Error fetching transactions from backend:', error);
      setTransactions([]); // Initialize with empty array on error
    }
  };

  // Fetch transactions from backend on initial load
  useEffect(() => {
    fetchTransactions();
  }, []); // Empty dependency array means this runs once on mount

  // Calculate holdings whenever transactions change
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
        holdingsMap.set(companySymbol, { company: companySymbol, totalQuantity: newQuantity, totalCost: newTotalCost, wacc: newWacc }); // Store the latest newWacc and include companySymbol
    });

     // Convert the map values back to an array for the holdingsData state
    const calculatedHoldings = Array.from(holdingsMap.values()).filter(holding => holding.totalQuantity > 0); // Filter out companies with zero or negative quantity

    setHoldingsData(calculatedHoldings);
    console.log('Holdings data calculated based on last transaction WACC:', calculatedHoldings);

  }, [transactions]); // Recalculate holdings when transactions change

  // Modified addTransaction to send data to the backend and refetch
  const addTransaction = async (transaction) => {
    console.log('Attempting to add new transaction to backend:', transaction);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Transaction added successfully:', result);

        // After adding, refetch transactions to update the frontend state
        fetchTransactions();

    } catch (error) {
        console.error('Error adding transaction to backend:', error);
        // Optionally, handle displaying an error to the user
    }
  };

  // Function to delete a transaction
  const deleteTransaction = async (transactionId) => {
      console.log(`Attempting to delete transaction with ID: ${transactionId} from backend...`);
      try {
          const response = await fetch(`${API_URL}/${transactionId}`, {
              method: 'DELETE',
          });

          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          console.log('Transaction deleted successfully:', result);

          // After deleting, refetch transactions to update the frontend state
          fetchTransactions();

      } catch (error) {
          console.error(`Error deleting transaction with ID: ${transactionId}`, error);
          // Optionally, handle displaying an error to the user
      }
  };

  // Function to fetch and parse CSV data from Google Sheets
  const fetchCsvData = async (url, setData, isTextValue = false) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();

      console.log('Raw CSV data from Google Sheet:', text); // Log raw text

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
        // Check if this is the summary data GID
        if (url.includes(SUMMARY_GID)) {
            const rows = text.split('\n').map(row => row.split(','));
            const summaryObject = {};

            // Extract data based on screenshot (assuming consistent cell positions)
            // Example: 'No. of Units' is in A1, value in A2
            if (rows.length > 1) summaryObject[rows[0][0].trim()] = rows[1][0] ? rows[1][0].trim() : '';
            // Example: 'Investment' is in B1, value in B2
            if (rows.length > 1 && rows[0].length > 1) summaryObject[rows[0][1].trim()] = rows[1][1] ? rows[1][1].trim() : '';
            // Example: 'Value' is in C1, value in C2
            if (rows.length > 1 && rows[0].length > 2) summaryObject[rows[0][2].trim()] = rows[1][2] ? rows[1][2].trim() : '';
            // Example: 'Stock Holding' is in A4, value in A5
            if (rows.length > 4) summaryObject[rows[3][0].trim()] = rows[4][0] ? rows[4][0].trim() : '';
            // Example: 'Net Loss' is in B4, value in B5
            if (rows.length > 4 && rows[3].length > 1) summaryObject[rows[3][1].trim()] = rows[4][1] ? rows[4][1].trim() : '';
            // Example: 'Net Loss%' is in C4, value in C5
            if (rows.length > 4 && rows[3].length > 2) summaryObject[rows[3][2].trim()] = rows[4][2] ? rows[4][2].trim() : '';
            // Example: 'Sector Holding' is in A7, value in A8
            if (rows.length > 7) summaryObject[rows[6][0].trim()] = rows[7][0] ? rows[7][0].trim() : '';
            // Example: 'Today's Profit' is in B7, value in B8
            if (rows.length > 7 && rows[6].length > 1) summaryObject[rows[6][1].trim()] = rows[7][1] ? rows[7][1].trim() : '';
            // Example: 'Receivable Amount' is in B9, value in C9
            if (rows.length > 8 && rows[8].length > 1) summaryObject[rows[8][1].trim()] = rows[8][2] ? rows[8][2].trim() : ''; // Note: Key in B9, Value in C9
            // Example: 'Advanced' is in A10, value in A11
            if (rows.length > 10) summaryObject[rows[9][0].trim()] = rows[10][0] ? rows[10][0].trim() : '';
            // Example: 'Declined' is in B10, value in B11
            if (rows.length > 10 && rows[9].length > 1) summaryObject[rows[9][1].trim()] = rows[10][1] ? rows[10][1].trim() : '';
            // Example: 'Unchanged' is in C10, value in C11
            if (rows.length > 10 && rows[9].length > 2) summaryObject[rows[9][2].trim()] = rows[10][2] ? rows[10][2].trim() : '';

            console.log('Parsed Summary Data:', summaryObject);
            setData([summaryObject]); // Set the state with an array containing the single summary object
        } else {
            // Original parsing logic for tables (TodayPrices, NEPSE data)
            const rows = text.split('\n').map(row => row.split(','));
            if (rows.length > 1) {
                const headers = rows[0];
                const data = rows.slice(1).map(row => {
                    let obj = {};
                    headers.forEach((header, index) => {
                        obj[header.trim()] = row[index] ? row[index].trim() : '';
                    });
                    return obj;
                }).filter(obj => Object.values(obj).some(value => value !== ''));
                console.log('Parsed CSV data for tables:', data);
                setData(data);
            } else {
                setData([]);
            }
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

  // Function to fetch prices and text value from Google Sheets on component mount (still using sheets for this data)
  useEffect(() => {
    console.log('Fetching prices and other data from Google Sheets...'); // Updated log message
    const todayPricesUrl = getGoogleSheetCsvUrl(SHEET_ID, TODAY_PRICES_GID);
    const textValueUrl = getGoogleSheetCsvUrl(SHEET_ID, TEXT_VALUE_GID);

    // URLs for new NEPSE data
    const indexUrl = getGoogleSheetCsvUrl(SHEET_ID, INDEX_GID);
    const topTurnoverUrl = getGoogleSheetCsvUrl(SHEET_ID, TOP_TURNOVER_GID);
    const topVolumeUrl = getGoogleSheetCsvUrl(SHEET_ID, TOP_VOLUME_GID);

    // URL for Summary data
    const summaryUrl = getGoogleSheetCsvUrl(SHEET_ID, SUMMARY_GID);

    // Fetch data for all GIDs
    fetchCsvData(todayPricesUrl, setTodayPrices);
    fetchCsvData(textValueUrl, setTextValue, true); // Fetch text value and mark as such
    fetchCsvData(indexUrl, setIndexData);
    fetchCsvData(topTurnoverUrl, setTopTurnoverData);
    fetchCsvData(topVolumeUrl, setTopVolumeData);
    fetchCsvData(summaryUrl, setSummaryData); // Fetch summary data

  }, []); // Empty dependency array means this runs once on mount

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Add Transaction':
        return <AddTransaction onAddTransaction={addTransaction} transactions={transactions} holdings={holdingsData} />; // Pass transactions and holdings down
      case 'Transaction':
        return <Transactions transactions={transactions} onDeleteTransaction={deleteTransaction} />;
      case 'Holdings':
        return <Holdings transactions={transactions} todayPrices={todayPrices} holdings={holdingsData} summaryData={summaryData} />; // Pass holdings and summaryData down
      case 'Realised P&L by Company':
        return <RealisedPnL transactions={transactions} />; // May need prices and holdings here too
      case 'Last Traded Price (LTP)':
        return <TodayPrices prices={todayPrices} textValue={textValue} />; // Pass todayPrices and textValue down
      case 'NEPSE':
        return <NEPSE 
          indexData={indexData}
          topTurnoverData={topTurnoverData}
          topVolumeData={topVolumeData}
          todayPrices={todayPrices}
          textValue={textValue}
        />; // Pass fetched data to NEPSE component
      default:
        return <Holdings transactions={transactions} todayPrices={todayPrices} holdings={holdingsData} summaryData={summaryData} />; // Default to Holdings tab, pass holdings and summaryData down
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