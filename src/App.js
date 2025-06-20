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
const TRANSACTIONS_GID = '1996493815'; // Add GID for transactions sheet

// Add new GIDs for NEPSE data
const INDEX_GID = '2142211097';
const TOP_TURNOVER_GID = '766316527';
const TOP_VOLUME_GID = '1392573911';

// Function to construct the Google Sheet URL for CSV export
const getGoogleSheetCsvUrl = (sheetId, gid) => {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
};

// Backend API URL
const API_URL = 'http://127.0.0.1:5000/api/transactions';

function App() {
  const [activeTab, setActiveTab] = useState('NEPSE');
  const [transactions, setTransactions] = useState([]);
  const [todayPrices, setTodayPrices] = useState([]);
  const [holdingsData, setHoldingsData] = useState([]); // State for holdings data
  const [textValue, setTextValue] = useState(''); // State for the text value from G2

  // Add state for new NEPSE data
  const [indexData, setIndexData] = useState([]);
  const [topTurnoverData, setTopTurnoverData] = useState([]);
  const [topVolumeData, setTopVolumeData] = useState([]);

  // Function to fetch transactions from the backend
  const fetchTransactions = async () => {
    console.log('Fetching transactions from backend...');
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Successfully loaded transactions from backend:', data);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions from backend:', error);
      setTransactions([]);
    }
  };

  // Fetch transactions from backend on initial load
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Function to add a transaction
  const addTransaction = async (transaction) => {
    console.log('Adding new transaction to backend:', transaction);
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
      fetchTransactions(); // Refresh transactions after adding
    } catch (error) {
      console.error('Error adding transaction to backend:', error);
    }
  };

  // Function to delete a transaction
  const deleteTransaction = async (transactionId) => {
    console.log(`Deleting transaction with ID: ${transactionId}`);
    try {
      const response = await fetch(`${API_URL}/${transactionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Transaction deleted successfully:', result);
      fetchTransactions(); // Refresh transactions after deleting
    } catch (error) {
      console.error('Error deleting transaction:', error);
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

      console.log('Raw CSV data from Google Sheet:', text);

      if (isTextValue) {
        const rows = text.split('\n').map(row => row.split(','));
        if (rows.length > 1 && rows[1].length > 6) {
          setData(rows[1][6].trim());
        } else {
          console.warn('G2 cell not found or sheet structure unexpected for text value GID.');
          setData('');
        }
      } else {
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
    } catch (error) {
      console.error('Error fetching or parsing CSV data:', error);
      if (isTextValue) {
        setData('');
      } else {
        setData([]);
      }
    }
  };

  // Function to fetch all data from Google Sheets on component mount
  useEffect(() => {
    console.log('Fetching all data from Google Sheets...');
    const todayPricesUrl = getGoogleSheetCsvUrl(SHEET_ID, TODAY_PRICES_GID);
    const textValueUrl = getGoogleSheetCsvUrl(SHEET_ID, TEXT_VALUE_GID);
    const indexUrl = getGoogleSheetCsvUrl(SHEET_ID, INDEX_GID);
    const topTurnoverUrl = getGoogleSheetCsvUrl(SHEET_ID, TOP_TURNOVER_GID);
    const topVolumeUrl = getGoogleSheetCsvUrl(SHEET_ID, TOP_VOLUME_GID);

    // Fetch all data
    fetchCsvData(todayPricesUrl, setTodayPrices);
    fetchCsvData(textValueUrl, setTextValue, true);
    fetchCsvData(indexUrl, setIndexData);
    fetchCsvData(topTurnoverUrl, setTopTurnoverData);
    fetchCsvData(topVolumeUrl, setTopVolumeData);
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Add Transaction':
        return <AddTransaction onAddTransaction={addTransaction} transactions={transactions} holdings={holdingsData} />; // Pass transactions and holdings down
      case 'Transaction':
        return <Transactions transactions={transactions} onDeleteTransaction={deleteTransaction} />;
      case 'Holdings':
        return <Holdings transactions={transactions} todayPrices={todayPrices} holdings={holdingsData} />; // Pass holdings down
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