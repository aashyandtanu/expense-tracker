import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { Transaction } from '../types';
import { calculateTotals } from '../utils/analytics';

interface DashboardProps {
  transactions: Transaction[];
}

export function Dashboard({ transactions }: DashboardProps) {
  const { totalIncome, totalExpenses, balance } = calculateTotals(transactions);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium">Total Income</p>
            <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="p-3 bg-green-400 bg-opacity-30 rounded-full">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm font-medium">Total Expenses</p>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="p-3 bg-red-400 bg-opacity-30 rounded-full">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white rounded-xl p-6 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
          </div>
          <div className="p-3 bg-blue-400 bg-opacity-30 rounded-full">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm font-medium">Transactions</p>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </div>
          <div className="p-3 bg-purple-400 bg-opacity-30 rounded-full">
            <PieChart className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}