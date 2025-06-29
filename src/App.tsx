import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, CreditCard, Settings, DollarSign, Database, Cloud } from 'lucide-react';
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

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showMappingManager, setShowMappingManager] = useState(false);
  const [showFieldMappingManager, setShowFieldMappingManager] = useState(false);
  const [showSalaryManager, setShowSalaryManager] = useState(false);
  const [showGoogleSheetsManager, setShowGoogleSheetsManager] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'analytics' | 'sheets'>('dashboard');
  const [mappingsVersion, setMappingsVersion] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Load transactions from localStorage on app start
  useEffect(() => {
    const savedTransactions = localStorage.getItem('expense-tracker-transactions');
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch (error) {
        console.error('Failed to load saved transactions:', error);
      }
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('expense-tracker-transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleTransactionsLoaded = (newTransactions: Transaction[]) => {
    setTransactions(prev => [...prev, ...newTransactions]);
  };

  const handleTransactionsReplaced = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
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
      setTransactions(prev => [...prev, ...salaryTransactions]);
    }
  };

  const handleAddTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: `manual-${Date.now()}-${Math.random()}`,
      source: 'manual',
    };
    setTransactions(prev => [newTransaction, ...prev]);
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
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTransaction = (id: string, updatedData: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, ...updatedData } : t
    ));
  };

  const handleMappingsUpdated = () => {
    setMappingsVersion(prev => prev + 1);
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ExpenseTracker Pro
          </h1>
          <p className="text-gray-600 text-lg">
            Smart financial management with Google Sheets integration and custom field mappings
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1 flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === 'dashboard' && (
            <>
              <Dashboard transactions={transactions} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <FileUpload 
                  onTransactionsLoaded={handleTransactionsLoaded}
                  onSalaryEntriesFound={handleSalaryEntriesFound}
                  onOpenMappingManager={() => setShowMappingManager(true)}
                />
                
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="space-y-4">
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
                    Field Mappings
                  </button>
                  <button
                    onClick={() => setShowSalaryManager(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <DollarSign className="h-4 w-4" />
                    Add Income
                  </button>
                  <button
                    onClick={() => setShowTransactionForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Transaction
                  </button>
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
                <Charts transactions={transactions} />
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