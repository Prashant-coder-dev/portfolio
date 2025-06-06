import React, { useState, useEffect } from 'react';
import Papa from 'papaparse'; // Add Papa Parse for CSV parsing

function AddTransaction({ onAddTransaction, transactions, holdings }) {
  const [company, setCompany] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('Buy'); // Default to 'Buy'
  const [transactionSource, setTransactionSource] = useState('Secondary'); // Default to 'Secondary' for Buy
  const [holdingType, setHoldingType] = useState('Short Term'); // Default for Sell
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState(''); // This will be Buy Price for 'Buy' or Sell Price for 'Sell'
  const [fees, setFees] = useState('0'); // This will be used for Sell transactions, or if there are additional fees

  // Calculated states (for both Buy and Sell, some only apply to one)
  const [initialInvestment, setInitialInvestment] = useState(0); // For Buy
  const [initialSellingAmount, setInitialSellingAmount] = useState(0); // For Sell
  const [brokerCommission, setBrokerCommission] = useState(0);
  const [sebonFee, setSebonFee] = useState(0);
  const [dpCharge, setDpCharge] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [amountPayable, setAmountPayable] = useState(0); // For Buy
  // const [wacc, setWacc] = useState(0); // WACC will be derived from transactions for Sell
  const [investment, setInvestment] = useState(0); // For Sell (Quantity * WACC)
  const [profitBeforeTax, setProfitBeforeTax] = useState(0); // For Sell
  const [capitalGainTax, setCapitalGainTax] = useState(0); // For Sell
  const [netProfitLoss, setNetProfitLoss] = useState(0); // For Sell
  const [netProfitLossPercentage, setNetProfitLossPercentage] = useState(0); // For Sell
  const [amountReceivable, setAmountReceivable] = useState(0); // For Sell

    // State to hold the calculated WACC for the selected company when type is Sell
    const [calculatedWacc, setCalculatedWacc] = useState(0); // Changed from fetchedWacc to calculatedWacc

  // Add new state for CSV file
  const [csvFile, setCsvFile] = useState(null);
  const [csvError, setCsvError] = useState('');

  // Transaction Sources (Used for Buy and Sell Secondary)
  const transactionSources = [
    'IPO',
    'FPO',
    'Right',
    'Bonus Share',
    'Secondary',
  ];

  // Holding Types for Sell
  const holdingTypes = [
    { label: 'Short Term (Less than one year 7.5%)', value: 'Short Term' },
    { label: 'Long Term (More than one year 5%)', value: 'Long Term' },
  ];


  // Effect to calculate WACC from transactions when company or transactions change for Sell transactions
  useEffect(() => {
      // console.log('AddTransaction useEffect - company, transactions, type changed:', { company, transactions, type }); // Removed log
      // Use the WACC from the holdings prop provided by App.js
      if (type === 'Sell' && company && holdings && holdings.length > 0) {
          const currentHolding = holdings.find(h => h.company === company);
          if (currentHolding) {
              // console.log('Found holding for', company, 'with WACC:', currentHolding.wacc); // Add this log for debugging
              setCalculatedWacc(currentHolding.wacc);
          } else {
              // console.log('No holding found for', company, 'setting WACC to 0'); // Add this log for debugging
              setCalculatedWacc(0); // Set to 0 if no holding found
          }
      } else {
          // console.log('Not a Sell transaction or no company selected, resetting WACC to 0'); // Add this log for debugging
          setCalculatedWacc(0); // Reset WACC if type is Buy or no company is selected
      }
  }, [company, type, holdings]); // Rerun when company, type, or holdings change


  // Effect to calculate details when relevant inputs change
  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const currentPrice = parseFloat(price) || 0; // Use 'price' state for both Buy/Sell price

    let calculatedInitialInvestment = 0; // For Buy
    let calculatedInitialSellingAmount = 0; // For Sell
    let calculatedBrokerCommission = 0;
    let calculatedSebonFee = 0;
    let calculatedDpCharge = 0;
    let calculatedTotalCommission = 0;
    let calculatedAmountPayable = 0; // For Buy
    let calculatedInvestment = 0; // For Sell
    let calculatedProfitBeforeTax = 0; // For Sell
    let calculatedCapitalGainTax = 0; // For Sell
    let calculatedNetProfitLoss = 0; // For Sell
    let calculatedNetProfitLossPercentage = 0; // For Sell
    let calculatedAmountReceivable = 0; // For Sell


    if (type === 'Buy') {
      calculatedInitialInvestment = qty * currentPrice;

      // Broker Commission Calculation (Buy - Secondary)
      if (transactionSource === 'Secondary') {
        if (calculatedInitialInvestment < 2500) {
          calculatedBrokerCommission = 10;
        } else if (calculatedInitialInvestment <= 50000) {
          calculatedBrokerCommission = calculatedInitialInvestment * 0.0036;
        } else if (calculatedInitialInvestment <= 500000) {
          calculatedBrokerCommission = calculatedInitialInvestment * 0.0033;
        } else if (calculatedInitialInvestment <= 2000000) {
          calculatedBrokerCommission = calculatedInitialInvestment * 0.0031;
        } else if (calculatedInitialInvestment <= 10000000) {
          calculatedBrokerCommission = calculatedInitialInvestment * 0.0027;
        } else {
          calculatedBrokerCommission = calculatedInitialInvestment * 0.0024;
        }
      }

      // SEBON Fee Calculation (Buy - Secondary)
      if (transactionSource === 'Secondary') {
        calculatedSebonFee = calculatedInitialInvestment * 0.00015;
      }

      // DP Charge Calculation (Buy - Secondary)
      if (transactionSource === 'Secondary' && qty > 0) {
         calculatedDpCharge = 25;
      }

      calculatedTotalCommission = calculatedBrokerCommission + calculatedSebonFee + calculatedDpCharge;
      calculatedAmountPayable = calculatedInitialInvestment + calculatedTotalCommission;

    } else if (type === 'Sell') { // Calculations for Sell Transaction
        calculatedInitialSellingAmount = qty * currentPrice;

        // Use the calculatedWacc for Investment calculation
        calculatedInvestment = qty * calculatedWacc; // Use calculatedWacc

        // Broker Commission Calculation (Sell - Secondary) - based on Initial Selling Amount
         if (qty > 0) {
             if (calculatedInitialSellingAmount < 2500) {
               calculatedBrokerCommission = 10;
             } else if (calculatedInitialSellingAmount <= 50000) {
               calculatedBrokerCommission = calculatedInitialSellingAmount * 0.0036;
             } else if (calculatedInitialSellingAmount <= 500000) {
               calculatedBrokerCommission = calculatedInitialSellingAmount * 0.0033;
             } else if (calculatedInitialSellingAmount <= 2000000) {
               calculatedBrokerCommission = calculatedInitialSellingAmount * 0.0031;
             } else if (calculatedInitialSellingAmount <= 10000000) {
               calculatedBrokerCommission = calculatedInitialSellingAmount * 0.0027;
             } else {
               calculatedBrokerCommission = calculatedInitialSellingAmount * 0.0024;
             }
         } else {
             calculatedBrokerCommission = 0;
         }

        // SEBON Fee Calculation (Sell - Secondary) - based on Initial Selling Amount
        if (qty > 0) {
            calculatedSebonFee = calculatedInitialSellingAmount * 0.00015;
        } else {
            calculatedSebonFee = 0;
        }

        // DP Charge Calculation (Sell) - based on Quantity
        if (qty > 0) {
            calculatedDpCharge = 25;
        } else {
            calculatedDpCharge = 0;
        }

        calculatedTotalCommission = calculatedBrokerCommission + calculatedSebonFee + calculatedDpCharge;

        calculatedProfitBeforeTax = calculatedInitialSellingAmount - calculatedInvestment - calculatedTotalCommission;

        // Capital Gain Tax Calculation
        if (calculatedProfitBeforeTax > 0) {
            if (holdingType === 'Short Term') {
                calculatedCapitalGainTax = calculatedProfitBeforeTax * 0.075; // 7.5%
            } else { // Long Term
                calculatedCapitalGainTax = calculatedProfitBeforeTax * 0.05; // 5%
            }
        } else {
            calculatedCapitalGainTax = 0;
        }

        calculatedNetProfitLoss = calculatedProfitBeforeTax - calculatedCapitalGainTax;

        if (calculatedInvestment > 0) {
             calculatedNetProfitLossPercentage = (calculatedNetProfitLoss / calculatedInvestment) * 100;
        } else {
            calculatedNetProfitLossPercentage = 0; // Avoid division by zero
        }


         calculatedAmountReceivable = calculatedInitialSellingAmount - calculatedTotalCommission - calculatedCapitalGainTax;

    }

    // Update states with calculated values
    setInitialInvestment(calculatedInitialInvestment);
    setInitialSellingAmount(calculatedInitialSellingAmount);
    setBrokerCommission(calculatedBrokerCommission);
    setSebonFee(calculatedSebonFee);
    setDpCharge(calculatedDpCharge);
    setTotalCommission(calculatedTotalCommission);
    setAmountPayable(calculatedAmountPayable);
    // setWacc is no longer needed here as WACC for Sell is fetched
    setInvestment(calculatedInvestment);
    setProfitBeforeTax(calculatedProfitBeforeTax);
    setCapitalGainTax(calculatedCapitalGainTax);
    setNetProfitLoss(calculatedNetProfitLoss);
    setNetProfitLossPercentage(calculatedNetProfitLossPercentage);
    setAmountReceivable(calculatedAmountReceivable);

  }, [quantity, price, type, transactionSource, holdingType, company, calculatedWacc]); // Rerun when these or calculatedWacc changes

  // Add CSV parsing function
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCsvFile(file);
      setCsvError('');

      Papa.parse(file, {
        complete: (results) => {
          const transactions = results.data.slice(1); // Skip header row
          let hasError = false;
          let errorMessage = '';

          transactions.forEach((row, index) => {
            if (row.length < 5) {
              hasError = true;
              errorMessage = `Row ${index + 2} has insufficient data`;
              return;
            }

            const [company, date, type, quantity, price] = row;
            
            // Validate data
            if (!company || !date || !type || !quantity || !price) {
              hasError = true;
              errorMessage = `Row ${index + 2} has missing required fields`;
              return;
            }

            // Validate type
            if (type !== 'Buy' && type !== 'Sell') {
              hasError = true;
              errorMessage = `Row ${index + 2} has invalid transaction type`;
              return;
            }

            // Create transaction object
            const transaction = {
              company: company.trim(),
              date: date.trim(),
              type: type.trim(),
              quantity: parseFloat(quantity),
              price: parseFloat(price),
              transactionSource: type === 'Buy' ? 'Secondary' : 'Secondary',
              holdingType: type === 'Sell' ? 'Short Term' : null
            };

            // Add transaction
            onAddTransaction(transaction);
          });

          if (hasError) {
            setCsvError(errorMessage);
          } else {
            setCsvFile(null);
            event.target.value = ''; // Reset file input
          }
        },
        header: true,
        skipEmptyLines: true,
        error: (error) => {
          setCsvError(`Error parsing CSV: ${error.message}`);
        }
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation (you can add more comprehensive validation)
    if (!company || !date || !quantity || !price) {
      alert('Please fill in all required fields (Company Symbol, Transaction Date, Share Quantity, Price).');
      return;
    }

    // Validation for Sell specific fields
    if (type === 'Sell') {
        if (!holdingType) {
             alert('Please select Holding Type for Sell transactions.');
             return;
        }
        // Check if there are any buy transactions for the company before allowing a sell
        const buyTransactionsForCompany = transactions.filter(t => t.company === company && t.type === 'Buy');
        if (buyTransactionsForCompany.length === 0) {
             alert('Cannot sell. No Buy transactions found for this company.');
             return;
         }

         // Add validation to ensure selling quantity does not exceed current holding quantity
         // This calculation needs to consider all buy and sell transactions for the company
         let currentHoldingQuantity = 0;
         transactions.filter(t => t.company === company).forEach(t => {
             if (t.type === 'Buy') {
                 currentHoldingQuantity += t.quantity;
             } else if (t.type === 'Sell') {
                 currentHoldingQuantity -= t.quantity;
             }
         });

          if (currentHoldingQuantity < parseFloat(quantity)) {
              alert(`Selling quantity (${quantity}) exceeds available holdings (${currentHoldingQuantity}) for this company.`);
              return;
          }
    }

    const new_transaction = {
        company: company,
        date: date,
        type: type,
        quantity: parseFloat(quantity) || 0, // Ensure quantity is a number
        price: parseFloat(price) || 0, // Ensure price is a number
        amountPayable: type === 'Buy' ? parseFloat(amountPayable) || 0 : null, // Ensure amountPayable is number for Buy, null for Sell

        // Include calculated fields from state, ensuring they are numbers or null
        initialInvestment: type === 'Buy' ? parseFloat(initialInvestment) || 0 : null,
        transactionSource: transactionSource || null,
        initialSellingAmount: type === 'Sell' ? parseFloat(initialSellingAmount) || 0 : null,
        holdingType: holdingType || null,
        investment: type === 'Sell' ? parseFloat(investment) || 0 : null,
        brokerCommission: parseFloat(brokerCommission) || 0,
        sebonFee: parseFloat(sebonFee) || 0,
        dpCharge: parseFloat(dpCharge) || 0,
        totalCommission: parseFloat(totalCommission) || 0,
        profitBeforeTax: type === 'Sell' ? parseFloat(profitBeforeTax) || 0 : null,
        capitalGainTax: type === 'Sell' ? parseFloat(capitalGainTax) || 0 : null,
        netProfitLoss: type === 'Sell' ? parseFloat(netProfitLoss) || 0 : null,
        netProfitLossPercentage: type === 'Sell' ? parseFloat(netProfitLossPercentage) || 0 : null,
        amountReceivable: type === 'Sell' ? parseFloat(amountReceivable) || 0 : null,
        wacc: type === 'Buy' ? parseFloat(calculatedWacc) || 0 : null // Include calculatedWacc, ensuring it's number for Buy, null for Sell
    };

    // Log the transaction object being sent
    console.log('Sending transaction to backend:', new_transaction); // Add this log

    onAddTransaction(new_transaction);

    // Clear the form and reset states
    setCompany('');
    setDate('');
    setType('Buy');
    setTransactionSource('Secondary');
    setHoldingType('Short Term');
    setQuantity('');
    setPrice('');
    setInitialInvestment(0);
    setInitialSellingAmount(0);
    setBrokerCommission(0);
    setSebonFee(0);
    setDpCharge(0);
    setTotalCommission(0);
    setAmountPayable(0);
    setCalculatedWacc(0); // Reset calculatedWacc
    setInvestment(0);
    setProfitBeforeTax(0);
    setCapitalGainTax(0);
    setNetProfitLoss(0);
    setNetProfitLossPercentage(0);
    setAmountReceivable(0);
  };

  return (
    <div>
      <h2>Add New Transaction</h2>
      
      {/* Add CSV Upload Section */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Import from CSV</h3>
        <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
          Upload a CSV file with the following columns: Company Symbol, Transaction Date, Type (Buy/Sell), Quantity, Price
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleCsvUpload}
          style={{ marginBottom: '10px' }}
        />
        {csvError && (
          <p style={{ color: 'red', fontSize: '0.9em' }}>{csvError}</p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Input Fields Section */}
          <div style={{ flex: 1 }}>
            <div>
              <label htmlFor="company">Company Symbol:</label>
              <input
                type="text"
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="date">Transaction Date:</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="type">Transaction Type:</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
            </div>
            {type === 'Buy' && (
              <div>
                <label htmlFor="transactionSource">Transaction Source:</label>
                <select
                  id="transactionSource"
                  value={transactionSource}
                  onChange={(e) => setTransactionSource(e.target.value)}
                >
                  {transactionSources.map((source) => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
            )}
             {type === 'Sell' && (
              <div>
                <label htmlFor="transactionSource">Transaction Source:</label>
                 {/* Transaction Source is always Secondary for Sell */}
                <input type="text" id="transactionSource" value="Secondary" disabled />
              </div>
            )}
            <div>
              <label htmlFor="quantity">Share Quantity:</label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="1"
              />
            </div>
            {type === 'Buy' && (
              <div>
                <label htmlFor="price">Purchase Price (Rs):</label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  step="0.01"
                />
              </div>
            )}
            {type === 'Sell' && (
              <div>
                <label htmlFor="price">Sell Price (Rs):</label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  step="0.01"
                />
              </div>
            )}
             {type === 'Sell' && (
                 <div>
                    <label htmlFor="holdingType">Holding Type:</label>
                    <select id="holdingType" value={holdingType} onChange={(e) => setHoldingType(e.target.value)}>
                        {holdingTypes.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                 </div>
             )}
             {/* Display WACC for Sell for user information, derived from holdings */}
             {type === 'Sell' && (
                <div>
                   <label htmlFor="wacc">WACC (from Holdings):</label>
                   {/* Temporarily display fetchedWacc directly for debugging */}
                   {calculatedWacc.toFixed(2)}
                   <input type="text" id="wacc" value={calculatedWacc.toFixed(2)} disabled />
                </div>
             )}
          </div>

          {/* Calculated Details Section */}
          <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '20px' }}>
              <h3>Details:</h3>
              {type === 'Buy' && (
                <>
                  <p>Total Amount: {initialInvestment.toFixed(2)}</p>
                  <p>* Commission: {brokerCommission.toFixed(2)}</p>
                  <p>SEBON FEE: {sebonFee.toFixed(2)}</p>
                  <p>DP Charge: {dpCharge.toFixed(2)}</p>
                  <p>Total Commission: {totalCommission.toFixed(2)}</p>
                  <p>Total Amount Payable (Rs): {amountPayable.toFixed(2)}</p>
                  {/* WACC for Buy is calculated and saved with the transaction */}
                </>
              )}
               {type === 'Sell' && (
                <>
                    <p>Investment: {investment.toFixed(2)}</p>
                    <p>Initial Selling Amount: {initialSellingAmount.toFixed(2)}</p>
                    <p>* Commission: {brokerCommission.toFixed(2)}</p>
                    <p>SEBON Fee: {sebonFee.toFixed(2)}</p>
                    <p>DP Charge: {dpCharge.toFixed(2)}</p>
                    <p>Total Commission: {totalCommission.toFixed(2)}</p>
                    <p>Profit before Tax: {profitBeforeTax.toFixed(2)}</p>
                    <p>Capital Gain Tax: {capitalGainTax.toFixed(2)}</p>
                    <p>Net Profit/Loss: {netProfitLoss.toFixed(2)}</p>
                    <p>Net Profit/Loss%: {netProfitLossPercentage.toFixed(2)}%</p>
                    <p>Amount Receivable: {amountReceivable.toFixed(2)}</p>
                </>
               )}
              <p style={{ fontSize: '0.8em', color: '#555', marginTop: '10px' }}>
                * Commission Amount includes NEPSE Commission Rs - & SEBON Regularity Fee Rs - (Additional fees not included in this calculation)
              </p>
            </div>

        </div>

        <button type="submit" style={{ marginTop: '20px' }}>Add Transaction</button>
      </form>
    </div>
  );
}

export default AddTransaction; 