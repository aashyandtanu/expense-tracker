import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, CreditCard, Settings, DollarSign, Database, Cloud, Trash2 } from 'lucide-react';
import { Transaction, SalaryEntry } from './types';
import { Dashboard } from './components/Dashboard';
import { FileUpload } from './components/FileUpload';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { Charts } from './components/Charts';
import { MappingManager } from './components/MappingManager';
import { FieldMappingManager } from './components/FieldMappingManager';
import { SalaryManager } from './components/SalaryManager';
import { GoogleSheetsManager } from './components/GoogleSheetsManager';
import { MonthSelector } from './components/MonthSelector';
import { initializeUserMappings } from './utils/categoryMappings';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showMappingManager, setShowMappingManager] = useState(false);
  const [showFieldMappingManager, setShowFieldMappingManager] = useState(false);
  const [showSalaryManager, setShowSalaryManager] = useState(false);
  const [showGoogleSheetsManager, setShowGoogleSheetsManager] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'analytics' | 'sheets'>('dashboard');
  const [mappingsVersion, setMappingsVersion] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [analyticsKey, setAnalyticsKey] = useState(0);
  const [dashboardKey, setDashboardKey] = useState(0);

  // Initialize category mappings on app start
  useEffect(() => {
    initializeUserMappings();
  }, []);

  // Load transactions from sessionStorage first, then localStorage
  useEffect(() => {
    // Try session storage first (current session)
    const sessionTransactions = sessionStorage.getItem('expense-tracker-session-transactions');
    if (sessionTransactions) {
      try {
        const parsed = JSON.parse(sessionTransactions);
        setTransactions(parsed);
        console.log('Loaded transactions from session storage:', parsed.length);
        return;
      } catch (error) {
        console.error('Failed to load session transactions:', error);
        sessionStorage.removeItem('expense-tracker-session-transactions');
      }
    }

    // Fallback to localStorage (persistent)
    const savedTransactions = localStorage.getItem('expense-tracker-transactions');
    if (savedTransactions) {
      try {
        const parsed = JSON.parse(savedTransactions);
        setTransactions(parsed);
        // Also save to session storage for this session
        sessionStorage.setItem('expense-tracker-session-transactions', savedTransactions);
        console.log('Loaded transactions from localStorage and saved to session:', parsed.length);
      } catch (error) {
        console.error('Failed to load saved transactions:', error);
        localStorage.removeItem('expense-tracker-transactions');
      }
    }
  }, []);

  // Save transactions to both sessionStorage and localStorage
  useEffect(() => {
    if (transactions.length === 0) return; // Don't save empty array on initial load
    
    const transactionsJson = JSON.stringify(transactions);
    
    // Save to session storage (for current session)
    sessionStorage.setItem('expense-tracker-session-transactions', transactionsJson);
    
    // Save to localStorage (persistent)
    localStorage.setItem('expense-tracker-transactions', transactionsJson);
    
    console.log('Saved transactions to storage:', transactions.length);
  }, [transactions]);

  // Listen for category mapping updates
  useEffect(() => {
    const handleMappingsUpdate = () => {
      setMappingsVersion(prev => prev + 1);
      setAnalyticsKey(prev => prev + 1);
      setDashboardKey(prev => prev + 1);
    };

    window.addEventListener('categoryMappingsUpdated', handleMappingsUpdate);
    
    return () => {
      window.removeEventListener('categoryMappingsUpdated', handleMappingsUpdate);
    };
  }, []);

  const refreshAllViews = () => {
    setAnalyticsKey(prev => prev + 1);
    setDashboardKey(prev => prev + 1);
    setMappingsVersion(prev => prev + 1);
  };

  const handleTransactionsLoaded = (newTransactions: Transaction[]) => {
    // Remove duplicates based on description, amount, and date
    const existingTransactionKeys = new Set(
      transactions.map(t => `${t.description}-${t.amount}-${t.date}`)
    );
    
    const uniqueNewTransactions = newTransactions.filter(t => {
      const key = `${t.description}-${t.amount}-${t.date}`;
      return !existingTransactionKeys.has(key);
    });
    
    if (uniqueNewTransactions.length > 0) {
      setTransactions(prev => [...prev, ...uniqueNewTransactions]);
      refreshAllViews();
    }
  };

  const handleTransactionsReplaced = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    refreshAllViews();
  };

  const handleSalaryEntriesFound = (entries: Array<{ amount: number; date: string; description: string }>) => {
    // Convert salary entries to transactions
    const salaryTransactions: Transaction[] = entries.map((entry, index) => ({
      id: `salary-detected-${Date.now()}-${index}`,
      date: entry.date,
      description: entry.description,
      amount: entry.amount,
      type: 'credit' as const,
      category: 'Salary',
      originalDescription: entry.description,
      isManual: false,
      source: 'excel' as const,
    }));

    if (salaryTransactions.length > 0) {
      handleTransactionsLoaded(salaryTransactions);
    }
  };

  const handleAddTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: `manual-${Date.now()}-${Math.random()}`,
      source: 'manual',
    };
    setTransactions(prev => [newTransaction, ...prev]);
    refreshAllViews();
  };

  const handleAddSalary = (salaryData: Omit<SalaryEntry, 'id'>) => {
    const salaryTransaction: Transaction = {
      id: `salary-manual-${Date.now()}`,
      date: salaryData.date,
      description: salaryData.description,
      amount: salaryData.amount,
      type: 'credit',
      category: 'Salary',
      isManual: true,
      source: 'manual',
    };
    setTransactions(prev => [salaryTransaction, ...prev]);
    refreshAllViews();
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    refreshAllViews();
  };

  const handleUpdateTransaction = (id: string, updatedData: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, ...updatedData } : t
    ));
    refreshAllViews();
  };

  const handleDeleteAllTransactions = () => {
    setTransactions([]);
    refreshAllViews();
    setShowDeleteConfirmation(false);
    
    // Clear from storage as well
    sessionStorage.removeItem('expense-tracker-session-transactions');
    localStorage.removeItem('expense-tracker-transactions');
    
    console.log('All transactions deleted');
  };

  const handleMappingsUpdated = () => {
    refreshAllViews();
  };

  const handleMonthYearSelect = (month: string, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'sheets', label: 'Google Sheets', icon: Cloud },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            ExpenseTracker Pro
          </h1>
          <p className="text-gray-600 text-base lg:text-lg">
            Smart financial management with Google Sheets integration and custom field mappings
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-6 lg:mb-8">
          <div className="bg-white rounded-lg shadow-md p-1 flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 rounded-md transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 lg:space-y-8">
          {activeTab === 'dashboard' && (
            <>
              <Dashboard key={dashboardKey} transactions={transactions} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <FileUpload 
                  onTransactionsLoaded={handleTransactionsLoaded}
                  onSalaryEntriesFound={handleSalaryEntriesFound}
                  onOpenMappingManager={() => setShowMappingManager(true)}
                />
                
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowTransactionForm(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                      Add Manual Transaction
                    </button>
                    
                    <button
                      onClick={() => setShowSalaryManager(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <DollarSign className="h-5 w-5" />
                      Manage Salary & Income
                    </button>
                    
                    <button
                      onClick={() => setShowGoogleSheetsManager(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Cloud className="h-5 w-5" />
                      Google Sheets Sync
                    </button>
                    
                    <button
                      onClick={() => setShowMappingManager(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                      Category Mappings
                    </button>
                    
                    <button
                      onClick={() => setShowFieldMappingManager(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Database className="h-5 w-5" />
                      Field Mappings
                    </button>

                    {/* Delete All Transactions Button */}
                    {transactions.length > 0 && (
                      <button
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                        Delete All Transactions
                      </button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {transactions.filter(t => t.type === 'credit').length}
                        </div>
                        <div className="text-sm text-gray-600">Income Entries</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {transactions.filter(t => t.type === 'debit').length}
                        </div>
                        <div className="text-sm text-gray-600">Expense Entries</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">All Transactions</h2>
                <div className="flex flex-wrap gap-2">
                  <MonthSelector
                    onMonthYearSelect={handleMonthYearSelect}
                    currentMonth={selectedMonth}
                    currentYear={selectedYear}
                  />
                  <button
                    onClick={() => setShowFieldMappingManager(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Database className="h-4 w-4" />
                    <span className="hidden sm:inline">Field Mappings</span>
                  </button>
                  <button
                    onClick={() => setShowSalaryManager(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Income</span>
                  </button>
                  <button
                    onClick={() => setShowTransactionForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Transaction</span>
                  </button>
                  {transactions.length > 0 && (
                    <button
                      onClick={() => setShowDeleteConfirmation(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete All</span>
                    </button>
                  )}
                </div>
              </div>
              <TransactionList 
                transactions={transactions} 
                onDeleteTransaction={handleDeleteTransaction}
                onUpdateTransaction={handleUpdateTransaction}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center">Financial Analytics</h2>
              {transactions.length > 0 ? (
                <Charts key={analyticsKey} transactions={transactions} />
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <BarChart3 className="h-16 w-16 mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-600">No transactions available for analysis.</p>
                  <p className="text-sm text-gray-500 mt-2">Upload a bank statement or add manual transactions to see analytics.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sheets' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center">Google Sheets Integration</h2>
              <GoogleSheetsManager
                transactions={transactions}
                onTransactionsLoaded={handleTransactionsReplaced}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete All Transactions</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-3">
                  Are you sure you want to delete all {transactions.length} transactions? This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm font-medium">⚠️ Warning:</p>
                  <ul className="text-red-700 text-sm mt-1 space-y-1">
                    <li>• All transaction data will be permanently removed</li>
                    <li>• This will clear both session and persistent storage</li>
                    <li>• Analytics and reports will be reset</li>
                    <li>• Consider exporting your data first</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllTransactions}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <TransactionForm
          isOpen={showTransactionForm}
          onClose={() => setShowTransactionForm(false)}
          onAddTransaction={handleAddTransaction}
        />

        <MappingManager
          isOpen={showMappingManager}
          onClose={() => setShowMappingManager(false)}
          onMappingsUpdated={handleMappingsUpdated}
        />

        <FieldMappingManager
          isOpen={showFieldMappingManager}
          onClose={() => setShowFieldMappingManager(false)}
          onMappingsUpdated={handleMappingsUpdated}
        />

        <SalaryManager
          isOpen={showSalaryManager}
          onClose={() => setShowSalaryManager(false)}
          onSalaryAdded={handleAddSalary}
        />

        {showGoogleSheetsManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Google Sheets Integration</h2>
                <button
                  onClick={() => setShowGoogleSheetsManager(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <GoogleSheetsManager
                  transactions={transactions}
                  onTransactionsLoaded={handleTransactionsReplaced}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;