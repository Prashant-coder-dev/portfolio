import React from 'react';

function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    'Add Transaction',
    'Transaction',
    'Holdings',
    'Realised P&L by Company',
    'Last Traded Price (LTP)',
  ];

  return (
    <nav className="tab-navigation">
      <ul className="tab-list">
        {tabs.map((tab) => (
          <li key={tab} className="tab-item">
            <button
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => onTabChange(tab)}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default TabNavigation; 