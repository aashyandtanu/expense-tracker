import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Download, Upload, Calendar, FileSpreadsheet, AlertCircle, CheckCircle, Loader, ExternalLink, Copy, Eye, EyeOff } from 'lucide-react';
import { Transaction } from '../types';
import {
  loadGoogleSheetsConfig,
  initializeGoogleSheetsAPI,
  authenticateGoogle,
  signOutGoogle,
  saveTransactionsToGoogleSheets,
  loadTransactionsFromGoogleSheets,
  getAvailableMonths,
  exportTransactionsToExcel,
  GoogleSheetsConfig,
  saveGoogleCredentials
} from '../utils/googleSheets';

interface GoogleSheetsManagerProps {
  transactions: Transaction[];
  onTransactionsLoaded: (transactions: Transaction[]) => void;
  selectedMonth?: string;
  selectedYear?: number;
}

export function GoogleSheetsManager({ 
  transactions, 
  onTransactionsLoaded, 
  selectedMonth, 
  selectedYear 
}: GoogleSheetsManagerProps) {
  const [config, setConfig] = useState<GoogleSheetsConfig>({ isConnected: false });
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [loadMonth, setLoadMonth] = useState('');
  const [loadYear, setLoadYear] = useState(new Date().getFullYear());
  const [saveMonth, setSaveMonth] = useState('');
  const [saveYear, setSaveYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [credentials, setCredentials] = useState({
    clientId: '',
    apiKey: ''
  });
  const [showCredentials, setShowCredentials] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const savedConfig = loadGoogleSheetsConfig();
    setConfig(savedConfig);
    
    // Check if credentials are already saved
    const savedCredentials = localStorage.getItem('google-sheets-credentials');
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials);
        setCredentials(parsed);
      } catch (error) {
        console.error('Failed to load saved credentials:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      setSaveMonth(selectedMonth);
      setSaveYear(selectedYear);
    }
  }, [selectedMonth, selectedYear]);

  const showStatus = (type: 'success' | 'error' | 'info', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 5000);
  };

  const handleSaveCredentials = () => {
    if (!credentials.clientId.trim() || !credentials.apiKey.trim()) {
      showStatus('error', 'Please enter both Client ID and API Key');
      return;
    }

    saveGoogleCredentials(credentials.clientId.trim(), credentials.apiKey.trim());
    setShowSetup(false);
    showStatus('success', 'Credentials saved! You can now connect to Google Sheets.');
  };

  const handleConnect = async () => {
    // Check if credentials are set
    const savedCredentials = localStorage.getItem('google-sheets-credentials');
    if (!savedCredentials) {
      setShowSetup(true);
      showStatus('info', 'Please set up your Google API credentials first');
      return;
    }

    setIsInitializing(true);
    try {
      const initialized = await initializeGoogleSheetsAPI();
      if (!initialized) {
        throw new Error('Failed to initialize Google Sheets API');
      }

      const newConfig = await authenticateGoogle();
      setConfig(newConfig);
      showStatus('success', 'Successfully connected to Google Sheets!');
    } catch (error) {
      console.error('Connection failed:', error);
      showStatus('error', 'Failed to connect to Google Sheets. Please check your credentials and try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await signOutGoogle();
      setConfig({ isConnected: false });
      setAvailableMonths([]);
      showStatus('info', 'Disconnected from Google Sheets');
    } catch (error) {
      console.error('Disconnect failed:', error);
      showStatus('error', 'Failed to disconnect properly');
    }
  };

  const handleLoadMonths = async () => {
    if (!config.isConnected) return;

    setIsLoading(true);
    try {
      const months = await getAvailableMonths(loadYear);
      setAvailableMonths(months);
      showStatus('info', `Found ${months.length} months for ${loadYear}`);
    } catch (error) {
      console.error('Failed to load months:', error);
      showStatus('error', 'Failed to load available months');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTransactions = async () => {
    if (!config.isConnected || !loadMonth) return;

    setIsLoading(true);
    try {
      const loadedTransactions = await loadTransactionsFromGoogleSheets(loadYear, loadMonth);
      onTransactionsLoaded(loadedTransactions);
      showStatus('success', `Loaded ${loadedTransactions.length} transactions from ${loadMonth} ${loadYear}`);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      showStatus('error', 'Failed to load transactions from Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTransactions = async () => {
    if (!config.isConnected || !saveMonth || transactions.length === 0) return;

    setIsLoading(true);
    try {
      await saveTransactionsToGoogleSheets(transactions, saveYear, saveMonth);
      showStatus('success', `Saved ${transactions.length} transactions to ${saveMonth} ${saveYear}`);
    } catch (error) {
      console.error('Failed to save transactions:', error);
      showStatus('error', 'Failed to save transactions to Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (transactions.length === 0) {
      showStatus('error', 'No transactions to export');
      return;
    }

    const filename = `Expense_Tracker_${saveYear}.xlsx`;
    exportTransactionsToExcel(transactions, filename);
    showStatus('success', `Exported ${transactions.length} transactions to ${filename}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showStatus('success', 'Copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {config.isConnected ? (
            <Cloud className="h-6 w-6 text-green-600" />
          ) : (
            <CloudOff className="h-6 w-6 text-gray-400" />
          )}
          <h2 className="text-xl font-semibold text-gray-900">Google Sheets Integration</h2>
        </div>
        
        {config.isConnected ? (
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <CloudOff className="h-4 w-4" />
            Disconnect
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Setup
            </button>
            <button
              onClick={handleConnect}
              disabled={isInitializing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isInitializing ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Cloud className="h-4 w-4" />
              )}
              {isInitializing ? 'Connecting...' : 'Connect to Google Sheets'}
            </button>
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Google Sheets Setup</h3>
              <button
                onClick={() => setShowSetup(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">📋 Setup Instructions</h4>
                <p className="text-blue-800 text-sm mb-3">
                  Follow these steps to set up Google Sheets integration:
                </p>
                
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>
                    Go to{' '}
                    <a 
                      href="https://console.cloud.google.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Google Cloud Console
                    </a>
                  </li>
                  <li>Create a new project or select an existing one</li>
                  <li>
                    Enable the{' '}
                    <a 
                      href="https://console.cloud.google.com/apis/library/sheets.googleapis.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Google Sheets API
                    </a>
                    {' '}and{' '}
                    <a 
                      href="https://console.cloud.google.com/apis/library/drive.googleapis.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Google Drive API
                    </a>
                  </li>
                  <li>
                    Go to{' '}
                    <a 
                      href="https://console.cloud.google.com/apis/credentials" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Credentials
                    </a>
                    {' '}page
                  </li>
                  <li>Click "Create Credentials" → "OAuth 2.0 Client ID"</li>
                  <li>Choose "Web application" as the application type</li>
                  <li>
                    Add authorized JavaScript origins:
                    <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono flex items-center justify-between">
                      <span>http://localhost:5173</span>
                      <button
                        onClick={() => copyToClipboard('http://localhost:5173')}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono flex items-center justify-between">
                      <span>https://your-domain.com</span>
                      <span className="text-gray-500">(for production)</span>
                    </div>
                  </li>
                  <li>Copy the Client ID from the created OAuth 2.0 client</li>
                  <li>Go back to Credentials and click "Create Credentials" → "API Key"</li>
                  <li>Copy the API Key</li>
                  <li>Enter both credentials below</li>
                </ol>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Client ID *
                  </label>
                  <div className="relative">
                    <input
                      type={showCredentials ? "text" : "password"}
                      value={credentials.clientId}
                      onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                      placeholder="123456789-abcdefghijklmnop.apps.googleusercontent.com"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredentials(!showCredentials)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCredentials ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google API Key *
                  </label>
                  <div className="relative">
                    <input
                      type={showCredentials ? "text" : "password"}
                      value={credentials.apiKey}
                      onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="AIzaSyABC123DEF456GHI789JKL012MNO345PQR"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredentials(!showCredentials)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCredentials ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h5 className="font-medium text-yellow-900 mb-2">🔒 Security Note</h5>
                  <p className="text-yellow-800 text-sm">
                    Your credentials are stored locally in your browser and are never sent to our servers. 
                    They are only used to authenticate directly with Google's APIs.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveCredentials}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Credentials
                  </button>
                  <button
                    onClick={() => setShowSetup(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {status && (
        <div className={`mb-4 p-3 rounded-lg border ${
          status.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          status.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {status.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {status.type === 'info' && <Calendar className="h-4 w-4" />}
            <span className="text-sm">{status.message}</span>
          </div>
        </div>
      )}

      {!config.isConnected ? (
        <div className="text-center py-8">
          <CloudOff className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Google Sheets</h3>
          <p className="text-gray-600 mb-4">
            Store your transactions in Google Sheets organized by year and month.
            Each year gets its own spreadsheet with monthly sheets.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Creates one spreadsheet per year (e.g., "Expense Tracker 2024")</li>
              <li>• Each month gets its own sheet within the yearly spreadsheet</li>
              <li>• Load specific months when needed - keeps the app lightweight</li>
              <li>• Export to Excel for offline backup</li>
              <li>• All data syncs across devices</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Load Transactions Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-600" />
              Load Transactions from Google Sheets
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={loadYear}
                  onChange={(e) => setLoadYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Months
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleLoadMonths}
                    disabled={isLoading}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {isLoading ? 'Loading...' : 'Refresh'}
                  </button>
                  <select
                    value={loadMonth}
                    onChange={(e) => setLoadMonth(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={availableMonths.length === 0}
                  >
                    <option value="">Select month</option>
                    {availableMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleLoadTransactions}
                  disabled={!loadMonth || isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Load Transactions'}
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              This will replace current transactions with data from the selected month.
            </p>
          </div>

          {/* Save Transactions Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4 text-green-600" />
              Save Current Transactions to Google Sheets
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={saveYear}
                  onChange={(e) => setSaveYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={saveMonth}
                  onChange={(e) => setSaveMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select month</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleSaveTransactions}
                  disabled={!saveMonth || transactions.length === 0 || isLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : `Save ${transactions.length} Transactions`}
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              This will overwrite existing data in the selected month sheet.
            </p>
          </div>

          {/* Export Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-purple-600" />
              Export to Excel File
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Download current transactions as an Excel file with monthly sheets.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {transactions.length} transactions ready for export
                </p>
              </div>
              
              <button
                onClick={handleExportToExcel}
                disabled={transactions.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Export to Excel
              </button>
            </div>
          </div>

          {/* Usage Tips */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">💡 Usage Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use this tool monthly to save your transactions to Google Sheets</li>
              <li>• Load specific months when you need to review historical data</li>
              <li>• Export to Excel for offline analysis or backup</li>
              <li>• Each year gets its own spreadsheet for better organization</li>
              <li>• Data is automatically formatted with currency and proper headers</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}