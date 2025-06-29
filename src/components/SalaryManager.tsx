import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, DollarSign, Calendar } from 'lucide-react';
import { SalaryEntry } from '../types';

interface SalaryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSalaryAdded: (salary: Omit<SalaryEntry, 'id'>) => void;
}

export function SalaryManager({ isOpen, onClose, onSalaryAdded }: SalaryManagerProps) {
  const [salaries, setSalaries] = useState<SalaryEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSalary, setNewSalary] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: 'Monthly Salary',
    isRecurring: true,
    frequency: 'monthly' as 'monthly' | 'weekly' | 'yearly',
  });

  useEffect(() => {
    if (isOpen) {
      loadSalaries();
    }
  }, [isOpen]);

  const loadSalaries = () => {
    try {
      const saved = localStorage.getItem('expense-tracker-salaries');
      setSalaries(saved ? JSON.parse(saved) : []);
    } catch {
      setSalaries([]);
    }
  };

  const saveSalaries = (salariesToSave: SalaryEntry[]) => {
    localStorage.setItem('expense-tracker-salaries', JSON.stringify(salariesToSave));
    setSalaries(salariesToSave);
  };

  const handleAddSalary = () => {
    if (!newSalary.amount || !newSalary.description.trim()) return;

    const salary: SalaryEntry = {
      id: `salary-${Date.now()}`,
      amount: parseFloat(newSalary.amount),
      date: newSalary.date,
      description: newSalary.description.trim(),
      isRecurring: newSalary.isRecurring,
      frequency: newSalary.frequency,
    };

    const updatedSalaries = [...salaries, salary];
    saveSalaries(updatedSalaries);
    
    // Add to transactions
    onSalaryAdded({
      amount: salary.amount,
      date: salary.date,
      description: salary.description,
      isRecurring: salary.isRecurring,
      frequency: salary.frequency,
    });

    setNewSalary({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: 'Monthly Salary',
      isRecurring: true,
      frequency: 'monthly',
    });
    setShowAddForm(false);
  };

  const handleEditSalary = (id: string, field: keyof SalaryEntry, value: any) => {
    setSalaries(prev => prev.map(salary =>
      salary.id === id ? { ...salary, [field]: value } : salary
    ));
  };

  const handleSaveSalary = (id: string) => {
    saveSalaries(salaries);
    setEditingId(null);
  };

  const handleDeleteSalary = (id: string) => {
    const updatedSalaries = salaries.filter(salary => salary.id !== id);
    saveSalaries(updatedSalaries);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Manage Salary & Income</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Add your regular income sources like salary, freelance payments, or other recurring income.
            </p>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Income Entry
            </button>
          </div>

          {showAddForm && (
            <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
              <h3 className="font-medium text-gray-900 mb-3">Add New Income</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSalary.amount}
                    onChange={(e) => setNewSalary(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="50000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newSalary.date}
                    onChange={(e) => setNewSalary(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newSalary.description}
                    onChange={(e) => setNewSalary(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Monthly Salary, Freelance Payment, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newSalary.isRecurring}
                      onChange={(e) => setNewSalary(prev => ({ ...prev, isRecurring: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Recurring Income</span>
                  </label>
                </div>
                {newSalary.isRecurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <select
                      value={newSalary.frequency}
                      onChange={(e) => setNewSalary(prev => ({ ...prev, frequency: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddSalary}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Income
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSalary({
                      amount: '',
                      date: new Date().toISOString().split('T')[0],
                      description: 'Monthly Salary',
                      isRecurring: true,
                      frequency: 'monthly',
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {salaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto opacity-50 mb-3" />
                <p>No income entries added yet.</p>
                <p className="text-sm">Add your first income entry to get started.</p>
              </div>
            ) : (
              salaries.map((salary) => (
                <div key={salary.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Amount
                        </label>
                        {editingId === salary.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={salary.amount}
                            onChange={(e) => handleEditSalary(salary.id, 'amount', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
                            {formatCurrency(salary.amount)}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Date
                        </label>
                        {editingId === salary.id ? (
                          <input
                            type="date"
                            value={salary.date}
                            onChange={(e) => handleEditSalary(salary.id, 'date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                            {new Date(salary.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Description
                        </label>
                        {editingId === salary.id ? (
                          <input
                            type="text"
                            value={salary.description}
                            onChange={(e) => handleEditSalary(salary.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                            {salary.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {salary.isRecurring && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Calendar className="h-3 w-3 mr-1" />
                          {salary.frequency}
                        </span>
                      )}
                      
                      {editingId === salary.id ? (
                        <button
                          onClick={() => handleSaveSalary(salary.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingId(salary.id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteSalary(salary.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}