import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Settings, Database } from 'lucide-react';
import { FieldMapping } from '../types';
import { loadFieldMappings, saveFieldMappings, createFieldMapping } from '../utils/fieldMappings';

interface FieldMappingManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onMappingsUpdated: () => void;
}

export function FieldMappingManager({ isOpen, onClose, onMappingsUpdated }: FieldMappingManagerProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMapping, setNewMapping] = useState({
    bankName: '',
    starterWord: '',
    dateColumn: '',
    descriptionColumn: '',
    amountColumn: '',
    withdrawalColumn: '',
    depositColumn: '',
    typeColumn: '',
    useAmountColumn: true,
  });

  useEffect(() => {
    if (isOpen) {
      setMappings(loadFieldMappings());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveFieldMappings(mappings);
    onMappingsUpdated();
    onClose();
  };

  const handleAddMapping = () => {
    if (!newMapping.bankName.trim() || !newMapping.starterWord.trim() || !newMapping.dateColumn.trim() || !newMapping.descriptionColumn.trim()) {
      return;
    }

    const mapping = createFieldMapping(
      newMapping.bankName.trim(),
      newMapping.starterWord.trim(),
      newMapping.dateColumn.trim(),
      newMapping.descriptionColumn.trim(),
      {
        amountColumn: newMapping.useAmountColumn ? newMapping.amountColumn.trim() || undefined : undefined,
        withdrawalColumn: !newMapping.useAmountColumn ? newMapping.withdrawalColumn.trim() || undefined : undefined,
        depositColumn: !newMapping.useAmountColumn ? newMapping.depositColumn.trim() || undefined : undefined,
        typeColumn: newMapping.typeColumn.trim() || undefined,
      }
    );

    setMappings(prev => [...prev, mapping]);
    setNewMapping({
      bankName: '',
      starterWord: '',
      dateColumn: '',
      descriptionColumn: '',
      amountColumn: '',
      withdrawalColumn: '',
      depositColumn: '',
      typeColumn: '',
      useAmountColumn: true,
    });
    setShowAddForm(false);
  };

  const handleEditMapping = (id: string, field: keyof FieldMapping, value: string) => {
    setMappings(prev => prev.map(mapping =>
      mapping.id === id ? { ...mapping, [field]: value } : mapping
    ));
  };

  const handleDeleteMapping = (id: string) => {
    setMappings(prev => prev.filter(mapping => mapping.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Field Mappings</h2>
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
              Configure how different bank statement formats should be parsed. Each format uses a single starter word to identify the header row, then maps specific columns to transaction fields.
            </p>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Bank Format
            </button>
          </div>

          {showAddForm && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <h3 className="font-medium text-gray-900 mb-3">Add New Bank Format</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={newMapping.bankName}
                    onChange={(e) => setNewMapping(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g., My Bank"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starter Word *
                  </label>
                  <input
                    type="text"
                    value={newMapping.starterWord}
                    onChange={(e) => setNewMapping(prev => ({ ...prev, starterWord: e.target.value }))}
                    placeholder="e.g., Date, Transaction, Txn"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Word that appears in the header row to identify it
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Column *
                  </label>
                  <input
                    type="text"
                    value={newMapping.dateColumn}
                    onChange={(e) => setNewMapping(prev => ({ ...prev, dateColumn: e.target.value }))}
                    placeholder="e.g., Date, Transaction Date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description Column *
                  </label>
                  <input
                    type="text"
                    value={newMapping.descriptionColumn}
                    onChange={(e) => setNewMapping(prev => ({ ...prev, descriptionColumn: e.target.value }))}
                    placeholder="e.g., Description, Narration, Particulars"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="radio"
                    checked={newMapping.useAmountColumn}
                    onChange={() => setNewMapping(prev => ({ ...prev, useAmountColumn: true }))}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Single Amount Column</span>
                </label>
                
                {newMapping.useAmountColumn && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount Column
                      </label>
                      <input
                        type="text"
                        value={newMapping.amountColumn}
                        onChange={(e) => setNewMapping(prev => ({ ...prev, amountColumn: e.target.value }))}
                        placeholder="e.g., Amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type Column (Optional)
                      </label>
                      <input
                        type="text"
                        value={newMapping.typeColumn}
                        onChange={(e) => setNewMapping(prev => ({ ...prev, typeColumn: e.target.value }))}
                        placeholder="e.g., Type, Transaction Type"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="radio"
                    checked={!newMapping.useAmountColumn}
                    onChange={() => setNewMapping(prev => ({ ...prev, useAmountColumn: false }))}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Separate Debit/Credit Columns</span>
                </label>
                
                {!newMapping.useAmountColumn && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Debit Column
                      </label>
                      <input
                        type="text"
                        value={newMapping.withdrawalColumn}
                        onChange={(e) => setNewMapping(prev => ({ ...prev, withdrawalColumn: e.target.value }))}
                        placeholder="e.g., Withdrawal, Debit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Credit Column
                      </label>
                      <input
                        type="text"
                        value={newMapping.depositColumn}
                        onChange={(e) => setNewMapping(prev => ({ ...prev, depositColumn: e.target.value }))}
                        placeholder="e.g., Deposit, Credit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddMapping}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Format
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewMapping({
                      bankName: '',
                      starterWord: '',
                      dateColumn: '',
                      descriptionColumn: '',
                      amountColumn: '',
                      withdrawalColumn: '',
                      depositColumn: '',
                      typeColumn: '',
                      useAmountColumn: true,
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* All Mappings Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bank Formats</h3>
              <span className="text-sm text-gray-500">
                {mappings.length} formats
              </span>
            </div>

            <div className="space-y-3">
              {mappings.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                  <Database className="h-12 w-12 mx-auto opacity-50 mb-3" />
                  <p>No formats available.</p>
                  <p className="text-sm">Add your first bank format to get started.</p>
                </div>
              ) : (
                mappings.map((mapping) => (
                  <div key={mapping.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Bank Name
                            </label>
                            {editingId === mapping.id ? (
                              <input
                                type="text"
                                value={mapping.bankName}
                                onChange={(e) => handleEditMapping(mapping.id, 'bankName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                                {mapping.bankName}
                                {mapping.isDefault && (
                                  <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">Default</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Starter Word
                            </label>
                            {editingId === mapping.id ? (
                              <input
                                type="text"
                                value={mapping.starterWord}
                                onChange={(e) => handleEditMapping(mapping.id, 'starterWord', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <div className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-mono">
                                {mapping.starterWord}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Date Column
                            </label>
                            {editingId === mapping.id ? (
                              <input
                                type="text"
                                value={mapping.dateColumn}
                                onChange={(e) => handleEditMapping(mapping.id, 'dateColumn', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                                {mapping.dateColumn}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Description Column
                            </label>
                            {editingId === mapping.id ? (
                              <input
                                type="text"
                                value={mapping.descriptionColumn}
                                onChange={(e) => handleEditMapping(mapping.id, 'descriptionColumn', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                                {mapping.descriptionColumn}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                          {mapping.amountColumn && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Amount Column
                              </label>
                              {editingId === mapping.id ? (
                                <input
                                  type="text"
                                  value={mapping.amountColumn}
                                  onChange={(e) => handleEditMapping(mapping.id, 'amountColumn', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <div className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                                  {mapping.amountColumn}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {mapping.withdrawalColumn && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Debit Column
                              </label>
                              {editingId === mapping.id ? (
                                <input
                                  type="text"
                                  value={mapping.withdrawalColumn}
                                  onChange={(e) => handleEditMapping(mapping.id, 'withdrawalColumn', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <div className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm">
                                  {mapping.withdrawalColumn}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {mapping.depositColumn && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Credit Column
                              </label>
                              {editingId === mapping.id ? (
                                <input
                                  type="text"
                                  value={mapping.depositColumn}
                                  onChange={(e) => handleEditMapping(mapping.id, 'depositColumn', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <div className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                                  {mapping.depositColumn}
                                </div>
                              )}
                            </div>
                          )}

                          {mapping.typeColumn && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Type Column
                              </label>
                              {editingId === mapping.id ? (
                                <input
                                  type="text"
                                  value={mapping.typeColumn}
                                  onChange={(e) => handleEditMapping(mapping.id, 'typeColumn', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <div className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm">
                                  {mapping.typeColumn}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {editingId === mapping.id ? (
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingId(mapping.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        
                        {!mapping.isDefault && (
                          <button
                            onClick={() => handleDeleteMapping(mapping.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Usage Tips */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">💡 How Starter Words Work</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• The starter word helps identify which row contains the column headers</li>
              <li>• For HDFC: "Date" appears in the header row, so we use "Date" as starter word</li>
              <li>• For ICICI: "Transaction" appears in "Transaction Date", so we use "Transaction"</li>
              <li>• Once the header row is found, column mapping works by exact or partial matching</li>
              <li>• This approach handles bank statements with varying header positions</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}