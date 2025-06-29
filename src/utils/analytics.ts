import { Transaction, MonthlyData, CategoryData } from '../types';
import { categoryColors } from './categoryMappings';

export function calculateMonthlyData(transactions: Transaction[]): MonthlyData[] {
  const monthlyMap = new Map<string, { income: number; expenses: number }>();
  
  transactions.forEach(transaction => {
    const monthKey = transaction.date.substring(0, 7); // YYYY-MM
    const existing = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };
    
    if (transaction.type === 'credit') {
      existing.income += transaction.amount;
    } else {
      existing.expenses += transaction.amount;
    }
    
    monthlyMap.set(monthKey, existing);
  });
  
  return Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month: formatMonthLabel(month),
      income: data.income,
      expenses: data.expenses,
      balance: data.income - data.expenses,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function calculateCategoryData(transactions: Transaction[]): CategoryData[] {
  const categoryMap = new Map<string, number>();
  
  transactions
    .filter(t => t.type === 'debit')
    .forEach(transaction => {
      const existing = categoryMap.get(transaction.category) || 0;
      categoryMap.set(transaction.category, existing + transaction.amount);
    });
  
  return Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      color: categoryColors[category] || categoryColors['Miscellaneous'],
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function calculateTotals(transactions: Transaction[]) {
  const totals = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'credit') {
        acc.totalIncome += transaction.amount;
      } else {
        acc.totalExpenses += transaction.amount;
      }
      return acc;
    },
    { totalIncome: 0, totalExpenses: 0 }
  );
  
  return {
    ...totals,
    balance: totals.totalIncome - totals.totalExpenses,
  };
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}