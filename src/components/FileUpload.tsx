import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Settings, DollarSign, Eye, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { Transaction, FieldMapping, ParsedTransaction } from '../types';
import { parseExcelCSV } from '../utils/excelParser';
import { loadFieldMappings, getDefaultMapping } from '../utils/fieldMappings';
import { categorizeTransaction, getAllCategories } from '../utils/categoryMappings';

interface FileUploadProps {
  onTransactionsLoaded: (transactions: Transaction[]) => void;
  onSalaryEntriesFound: (entries: Array<{ amount: number; date: string; description: string }>) => void;
  onOpenMappingManager: () => void;
}

export function FileUpload({ onTransactionsLoaded, onSalaryEntriesFound, onOpenMappingManager }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<FieldMapping>(getDefaultMapping());
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [showParseResults, setShowParseResults] = useState(false);
  const [editingEntries, setEditingEntries] = useState<{ [key: number]: ParsedTransaction }>({});
  const [categories] = useState(getAllCategories());
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);

  // Load field mappings on component mount and when mappings are updated
  useEffect(() => {
    const loadMappings = () => {
      const mappings = loadFieldMappings();
      setFieldMappings(mappings);
      
      // Update selected mapping if it exists in the new list
      const currentMapping = mappings.find(m => m.id === selectedMapping.id);
      if (currentMapping) {
        setSelectedMapping(currentMapping);
      } else {
        // Fallback to default if current mapping is not found
        setSelectedMapping(getDefaultMapping());
      }
    };

    loadMappings();

    // Listen for storage changes to update mappings when they're modified
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'expense-tracker-field-mappings' || e.key === 'expense-tracker-default-field-mappings') {
        loadMappings();
      }
    };

    // Listen for custom events when mappings are updated
    const handleMappingsUpdate = () => {
      loadMappings();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('fieldMappingsUpdated', handleMappingsUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('fieldMappingsUpdated', handleMappingsUpdate);
    };
  }, [selectedMapping.id]);

  const processFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setParsedData([]);
    setShowParseResults(false);
    setEditingEntries({});

    try {
      const result = await parseExcelCSV(file, selectedMapping);
      
      if (result.transactions.length === 0) {
        throw new Error('No valid transactions found in the file. Please check the field mappings and file format.');
      }

      // Check for salary entries
      const salaryEntries = result.transactions
        .filter(t => t.type === 'credit' && isSalaryTransaction(t.description))
        .map(t => ({
          amount: t.amount,
          date: t.date,
          description: t.description
        }));

      if (salaryEntries.length > 0) {
        onSalaryEntriesFound(salaryEntries);
      }

      onTransactionsLoaded(result.transactions);
      setParsedData(result.parsedData);
      setFileHeaders(result.headers);
      setShowParseResults(true);
      
    } catch (err: any) {
      console.error('File processing error:', err);
      setError(err.message || 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    await processFile(file);
  }, [selectedMapping]);

  const handleEditEntry = (index: number) => {
    setEditingEntries(prev => ({
      ...prev,
      [index]: { ...parsedData[index] }
    }));
  };

  const handleSaveEntry = (index: number) => {
    const editedEntry = editingEntries[index];
    if (!editedEntry) return;

    const updatedData = [...parsedData];
    updatedData[index] = editedEntry;
    setParsedData(updatedData);

    setEditingEntries(prev => {
      const newEditing = { ...prev };
      delete newEditing[index];
      return newEditing;
    });
  };

  const handleCancelEdit = (index: number) => {
    setEditingEntries(prev => {
      const newEditing = { ...prev };
      delete newEditing[index];
      return newEditing;
    });
  };

  const handleFieldChange = (index: number, field: keyof ParsedTransaction, value: any) => {
    setEditingEntries(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value
      }
    }));
  };

  const handleApplyChanges = () => {
    const updatedTransactions: Transaction[] = parsedData
      .filter(entry => entry.success)
      .map((entry, index) => ({
        id: `excel-edited-${index}-${Date.now()}`,
        date: entry.date,
        description: entry.description,
        amount: entry.amount,
        type: entry.type,
        category: categorizeTransaction(entry.description),
        originalDescription: entry.description,
        isManual: false,
        source: 'excel' as const,
      }));

    onTransactionsLoaded(updatedTransactions);
    setShowParseResults(false);
  };

  const isSalaryTransaction = (description: string): boolean => {
    const lowerDesc = description.toLowerCase();
    return ['salary', 'sal', 'wage', 'pay', 'payroll'].some(keyword => lowerDesc.includes(keyword));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  // Group mappings by type for better organization
  const defaultMappings = fieldMappings.filter(m => m.isDefault);
  const customMappings = fieldMappings.filter(m => !m.isDefault);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          Upload Bank Statement
        </h2>
        <button
          onClick={onOpenMappingManager}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          title="Manage Category Mappings"
        >
          <Settings className="h-4 w-4" />
          Categories
        </button>
      </div>

      {/* Field Mapping Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Bank Format
        </label>
        <select
          value={selectedMapping.id}
          onChange={(e) => {
            const mapping = fieldMappings.find(m => m.id === e.target.value);
            if (mapping) setSelectedMapping(mapping);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {/* Default Mappings Group */}
          {defaultMappings.length > 0 && (
            <optgroup label="📋 Default Bank Formats">
              {defaultMappings.map((mapping) => (
                <option key={mapping.id} value={mapping.id}>
                  {mapping.bankName}
                </option>
              ))}
            </optgroup>
          )}
          
          {/* Custom Mappings Group */}
          {customMappings.length > 0 && (
            <optgroup label="⚙️ Custom Bank Formats">
              {customMappings.map((mapping) => (
                <option key={mapping.id} value={mapping.id}>
                  {mapping.bankName} (Custom)
                </option>
              ))}
            </optgroup>
          )}
          
          {/* Fallback if no mappings */}
          {fieldMappings.length === 0 && (
            <option value="">No mappings available</option>
          )}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Choose the format that matches your bank statement columns. 
          {customMappings.length > 0 && (
            <span className="text-blue-600"> Custom formats are marked with (Custom).</span>
          )}
        </p>
      </div>

      {/* Current Mapping Details */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">Current Mapping Configuration:</h4>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            selectedMapping.isDefault 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-purple-100 text-purple-800'
          }`}>
            {selectedMapping.isDefault ? '📋 Default' : '⚙️ Custom'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div><strong>Starter Word:</strong> "{selectedMapping.starterWord}"</div>
          <div><strong>Date:</strong> {selectedMapping.dateColumn}</div>
          <div><strong>Description:</strong> {selectedMapping.descriptionColumn}</div>
          {selectedMapping.amountColumn && (
            <div><strong>Amount:</strong> {selectedMapping.amountColumn}</div>
          )}
          {selectedMapping.withdrawalColumn && (
            <div><strong>Withdrawal:</strong> {selectedMapping.withdrawalColumn}</div>
          )}
          {selectedMapping.depositColumn && (
            <div><strong>Deposit:</strong> {selectedMapping.depositColumn}</div>
          )}
          {selectedMapping.typeColumn && (
            <div><strong>Type:</strong> {selectedMapping.typeColumn}</div>
          )}
        </div>
      </div>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          
          {isProcessing ? (
            <div className="text-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="font-medium">Processing your bank statement...</p>
              <p className="text-sm text-gray-500 mt-1">Parsing transactions using {selectedMapping.bankName} format...</p>
            </div>
          ) : (
            <>
              <div className="text-gray-600">
                <p className="font-medium">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your bank statement'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports Excel (.xlsx, .xls) and CSV files
                </p>
              </div>
              
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Choose File
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Parse Results Summary - Editable */}
      {showParseResults && parsedData.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Processing Summary ({parsedData.filter(e => e.success).length} successful, {parsedData.filter(e => !e.success).length} failed)
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApplyChanges}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                Apply Changes
              </button>
              <button
                onClick={() => setShowParseResults(false)}
                className="text-green-600 hover:text-green-800 text-xs"
              >
                Hide
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-green-100 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium">Date</th>
                  <th className="text-left p-2 font-medium">Description</th>
                  <th className="text-left p-2 font-medium">Amount</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((entry, index) => {
                  const isEditing = editingEntries[index];
                  const currentEntry = isEditing || entry;
                  
                  return (
                    <tr key={index} className={`border-b ${entry.success ? 'bg-white' : 'bg-red-50'}`}>
                      <td className="p-2">
                        {entry.success ? (
                          isEditing ? (
                            <input
                              type="date"
                              value={currentEntry.date}
                              onChange={(e) => handleFieldChange(index, 'date', e.target.value)}
                              className="w-full text-xs border rounded px-1 py-1"
                            />
                          ) : (
                            currentEntry.date
                          )
                        ) : (
                          <span className="text-red-600 text-xs">Invalid</span>
                        )}
                      </td>
                      <td className="p-2 max-w-xs">
                        {entry.success ? (
                          isEditing ? (
                            <input
                              type="text"
                              value={currentEntry.description}
                              onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                              className="w-full text-xs border rounded px-1 py-1"
                            />
                          ) : (
                            <span className="truncate" title={currentEntry.description}>
                              {currentEntry.description}
                            </span>
                          )
                        ) : '-'}
                      </td>
                      <td className="p-2">
                        {entry.success ? (
                          isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={currentEntry.amount}
                              onChange={(e) => handleFieldChange(index, 'amount', parseFloat(e.target.value))}
                              className="w-full text-xs border rounded px-1 py-1"
                            />
                          ) : (
                            `₹${currentEntry.amount.toLocaleString()}`
                          )
                        ) : '-'}
                      </td>
                      <td className="p-2">
                        {entry.success ? (
                          isEditing ? (
                            <select
                              value={currentEntry.type}
                              onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                              className="w-full text-xs border rounded px-1 py-1"
                            >
                              <option value="debit">Debit</option>
                              <option value="credit">Credit</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs ${
                              currentEntry.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {currentEntry.type}
                            </span>
                          )
                        ) : '-'}
                      </td>
                      <td className="p-2">
                        {entry.success ? (
                          <span className="text-green-600 text-xs">✓ Success</span>
                        ) : (
                          <span className="text-red-600 text-xs" title={entry.error}>
                            ✗ Failed
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        {entry.success && (
                          <div className="flex gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEntry(index)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Save changes"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleCancelEdit(index)}
                                  className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                  title="Cancel editing"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleEditEntry(index)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit entry"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-3 text-xs text-green-700">
            <strong>Tip:</strong> Edit any incorrect entries above and click "Apply Changes" to update your transactions.
            If the parsing isn't working well, try a different bank format or create a custom mapping.
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div className="text-xs text-gray-500">
          <p><strong>Supported formats:</strong> Excel (.xlsx, .xls), CSV</p>
          <p><strong>Features:</strong> Configurable field mappings, automatic categorization, editable results</p>
          <p><strong>Privacy:</strong> All processing happens locally - your data never leaves your device</p>
        </div>
        
        <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1 text-xs text-green-600">
            <DollarSign className="h-3 w-3" />
            <span>Auto-detects salary entries</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Eye className="h-3 w-3" />
            <span>Editable parsing results</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-600">
            <Settings className="h-3 w-3" />
            <span>Configurable field mappings</span>
          </div>
        </div>
      </div>
    </div>
  );
}