import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Trash2, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Save, X, Check, Cloud } from 'lucide-react';
import { Transaction } from '../types';
import { downloadCSV } from '../utils/excelParser';
import { categoryColors, getAllCategories } from '../utils/categoryMappings';
import { saveTransactionsToGoogleSheets } from '../utils/googleSheets';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction?: (id: string, updatedTransaction: Partial<Transaction>) => void;
}

type SortField = 'date' | 'amount' | 'description' | 'category';
type SortDirection = 'asc' | 'desc';

export function TransactionList({ transactions, onDeleteTransaction, onUpdateTransaction }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Transaction>>({});
  const [isSavingToSheets, setIsSavingToSheets] = useState(false);

  const categories = useMemo(() => {
    return getAllCategories();
  }, []);

  const months = useMemo(() => {
    const uniqueMonths = [...new Set(transactions.map(t => {
      const date = new Date(t.date);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }))];
    return uniqueMonths.sort().reverse();
  }, [transactions]);

  const years = useMemo(() => {
    const uniqueYears = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))];
    return uniqueYears.sort().reverse();
  }, [transactions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditingData({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category
    });
  };

  const handleSaveEdit = () => {
    if (editingId && onUpdateTransaction) {
      onUpdateTransaction(editingId, editingData);
    }
    setEditingId(null);
    setEditingData({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleSaveToGoogleSheets = async () => {
    if (filteredAndSortedTransactions.length === 0) return;

    // Get the month from the first transaction or use current month
    const firstTransaction = filteredAndSortedTransactions[0];
    const date = new Date(firstTransaction.date);
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();

    setIsSavingToSheets(true);
    try {
      await saveTransactionsToGoogleSheets(filteredAndSortedTransactions, year, month);
      alert(`Successfully saved ${filteredAndSortedTransactions.length} transactions to ${month} ${year} in Google Sheets!`);
    } catch (error) {
      console.error('Failed to save to Google Sheets:', error);
      alert('Failed to save to Google Sheets. Please make sure you are connected.');
    } finally {
      setIsSavingToSheets(false);
    }
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || transaction.type === filterType;
      const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
      
      const transactionDate = new Date(transaction.date);
      const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
      const transactionYear = transactionDate.getFullYear();
      
      const matchesMonth = filterMonth === 'all' || transactionMonth === filterMonth;
      const matchesYear = filterYear === 'all' || transactionYear === parseInt(filterYear);
      
      return matchesSearch && matchesType && matchesCategory && matchesMonth && matchesYear;
    });

    // Sort the filtered transactions
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchTerm, filterType, filterCategory, filterMonth, filterYear, sortField, sortDirection]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatMonthYear = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const handleExport = () => {
    downloadCSV(filteredAndSortedTransactions, 'expense-tracker-transactions.csv');
  };

  const truncateDescription = (description: string, maxLength: number = 60) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
          <div className="flex gap-2">
            <button
              onClick={handleSaveToGoogleSheets}
              disabled={filteredAndSortedTransactions.length === 0 || isSavingToSheets}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Cloud className="h-4 w-4" />
              {isSavingToSheets ? 'Saving...' : 'Save to Google Sheets'}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'debit' | 'credit')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="debit">Debits</option>
            <option value="credit">Credits</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Months</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {formatMonthYear(month)}
              </option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Years</option>
            {years.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredAndSortedTransactions.length} of {transactions.length} transactions
        </div>
      </div>

      {/* Responsive Table - No Horizontal Scroll */}
      <div className="w-full">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Date
                  {getSortIcon('date')}
                </div>
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center gap-1">
                  Description
                  {getSortIcon('description')}
                </div>
              </th>
              <th 
                className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  Category
                  {getSortIcon('category')}
                </div>
              </th>
              <th 
                className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center gap-1">
                  Amount
                  {getSortIcon('amount')}
                </div>
              </th>
              <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                {/* Date Column */}
                <td className="px-3 py-4 text-sm text-gray-900">
                  {editingId === transaction.id ? (
                    <input
                      type="date"
                      value={editingData.date || ''}
                      onChange={(e) => setEditingData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-xs">
                      {formatDate(transaction.date)}
                    </div>
                  )}
                </td>

                {/* Description Column - Responsive with tooltip */}
                <td className="px-3 py-4 text-sm text-gray-900">
                  {editingId === transaction.id ? (
                    <textarea
                      value={editingData.description || ''}
                      onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                      placeholder="Transaction description"
                    />
                  ) : (
                    <div className="flex items-start gap-2">
                      {transaction.isManual && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                          Manual
                        </span>
                      )}
                      <span 
                        className="break-words leading-relaxed text-xs cursor-help"
                        title={transaction.description}
                      >
                        {truncateDescription(transaction.description)}
                      </span>
                    </div>
                  )}
                </td>

                {/* Category Column */}
                <td className="px-3 py-4 text-sm">
                  {editingId === transaction.id ? (
                    <select
                      value={editingData.category || ''}
                      onChange={(e) => setEditingData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: categoryColors[transaction.category] || categoryColors['Miscellaneous'] }}
                      title={transaction.category}
                    >
                      {transaction.category.length > 10 ? 
                        transaction.category.substring(0, 10) + '...' : 
                        transaction.category
                      }
                    </span>
                  )}
                </td>

                {/* Amount Column */}
                <td className="px-3 py-4 text-sm font-medium">
                  {editingId === transaction.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editingData.amount || ''}
                      onChange={(e) => setEditingData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  ) : (
                    <span className={`text-xs ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  )}
                </td>

                {/* Type Column */}
                <td className="px-3 py-4 text-sm">
                  {editingId === transaction.id ? (
                    <select
                      value={editingData.type || ''}
                      onChange={(e) => setEditingData(prev => ({ ...prev, type: e.target.value as 'debit' | 'credit' }))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.type === 'credit' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                    </span>
                  )}
                </td>

                {/* Actions Column */}
                <td className="px-3 py-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    {editingId === transaction.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Save changes"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                          title="Cancel editing"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(transaction.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}