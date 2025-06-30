import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Settings, RotateCcw, AlertTriangle, Download } from 'lucide-react';
import { 
  getActiveMappings, 
  saveUserMappings, 
  getAllCategories, 
  getSuggestedMappings,
  addOrUpdateMapping,
  deleteMapping,
  resetAllMappings,
  initializeUserMappings
} from '../utils/categoryMappings';

interface MappingManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onMappingsUpdated: () => void;
}

export function MappingManager({ isOpen, onClose, onMappingsUpdated }: MappingManagerProps) {
  const [userMappings, setUserMappings] = useState<{ [key: string]: string }>({});
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ keyword: '', category: '' });
  const [newMapping, setNewMapping] = useState({ keyword: '', category: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories] = useState(getAllCategories());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMappings();
    }
  }, [isOpen]);

  const loadMappings = () => {
    try {
      setIsLoading(true);
      
      // Initialize if empty
      initializeUserMappings();
      
      const mappings = getActiveMappings();
      setUserMappings(mappings);
      setHasUnsavedChanges(false);
      
      console.log('Mappings loaded:', Object.keys(mappings).length);
    } catch (error) {
      console.error('Error loading mappings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      saveUserMappings(userMappings);
      setHasUnsavedChanges(false);
      onMappingsUpdated();
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onClose();
    } catch (error) {
      console.error('Error saving mappings:', error);
      alert('Failed to save mappings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMapping = () => {
    if (!newMapping.keyword.trim() || !newMapping.category.trim()) {
      alert('Please enter both keyword and category.');
      return;
    }

    const keyword = newMapping.keyword.trim().toLowerCase();
    
    if (userMappings.hasOwnProperty(keyword)) {
      alert('This keyword already exists. Please use a different keyword or edit the existing one.');
      return;
    }

    const updatedMappings = { ...userMappings };
    updatedMappings[keyword] = newMapping.category.trim();
    
    setUserMappings(updatedMappings);
    setNewMapping({ keyword: '', category: '' });
    setShowAddForm(false);
    setHasUnsavedChanges(true);
  };

  const handleEditMapping = (oldKeyword: string, newKeyword: string, category: string) => {
    const updatedMappings = { ...userMappings };
    
    if (oldKeyword !== newKeyword) {
      delete updatedMappings[oldKeyword];
    }
    
    updatedMappings[newKeyword.toLowerCase()] = category;
    setUserMappings(updatedMappings);
    setHasUnsavedChanges(true);
  };

  const handleDeleteMapping = (keyword: string) => {
    if (confirm(`Are you sure you want to delete the mapping for "${keyword}"?`)) {
      const updatedMappings = { ...userMappings };
      delete updatedMappings[keyword];
      setUserMappings(updatedMappings);
      setHasUnsavedChanges(true);
    }
  };

  const handleResetToSuggested = () => {
    if (confirm('Are you sure you want to reset all mappings to suggested defaults? This will remove all your custom mappings.')) {
      const suggestedMappings = getSuggestedMappings();
      setUserMappings(suggestedMappings);
      setHasUnsavedChanges(true);
    }
  };

  const handleStartEdit = (keyword: string) => {
    setEditingKeyword(keyword);
    setEditingData({ keyword, category: userMappings[keyword] });
  };

  const handleSaveEdit = () => {
    if (editingKeyword && editingData.keyword.trim() && editingData.category.trim()) {
      handleEditMapping(editingKeyword, editingData.keyword.trim(), editingData.category.trim());
      setEditingKeyword(null);
      setEditingData({ keyword: '', category: '' });
    }
  };

  const handleCancelEdit = () => {
    setEditingKeyword(null);
    setEditingData({ keyword: '', category: '' });
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        loadMappings();
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Group mappings by category
  const getMappingsByCategory = () => {
    const mappingsByCategory: { [category: string]: string[] } = {};
    
    Object.entries(userMappings).forEach(([keyword, category]) => {
      if (!mappingsByCategory[category]) {
        mappingsByCategory[category] = [];
      }
      mappingsByCategory[category].push(keyword);
    });
    
    return mappingsByCategory;
  };

  const mappingsByCategory = getMappingsByCategory();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Category Mappings</h2>
            {hasUnsavedChanges && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Unsaved Changes
              </span>
            )}
            {isLoading && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Loading...
              </span>
            )}
          </div>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Manage how transaction descriptions are automatically categorized. Keywords are matched against transaction descriptions (case-insensitive).
            </p>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add Mapping
              </button>
              
              <button
                onClick={handleResetToSuggested}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Suggested
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <h3 className="font-medium text-gray-900 mb-3">Add New Mapping</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keyword *
                  </label>
                  <input
                    type="text"
                    value={newMapping.keyword}
                    onChange={(e) => setNewMapping(prev => ({ ...prev, keyword: e.target.value }))}
                    placeholder="e.g., zomato, uber, netflix"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newMapping.category}
                    onChange={(e) => setNewMapping(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddMapping}
                  disabled={!newMapping.keyword.trim() || !newMapping.category.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Add Mapping
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewMapping({ keyword: '', category: '' });
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Mappings by Category */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mappings by Category</h3>
              <span className="text-sm text-gray-500">
                {Object.keys(mappingsByCategory).length} categories, {Object.keys(userMappings).length} total mappings
              </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(mappingsByCategory).map(([category, keywords]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 truncate">{category}</h4>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      {keywords.length}
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {keywords.map((keyword) => (
                      <div key={keyword} className="flex items-center justify-between text-sm bg-white rounded p-2">
                        {editingKeyword === keyword ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingData.keyword}
                              onChange={(e) => setEditingData(prev => ({ ...prev, keyword: e.target.value }))}
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <select
                              value={editingData.category}
                              onChange={(e) => setEditingData(prev => ({ ...prev, category: e.target.value }))}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-mono text-gray-700 truncate flex-1" title={keyword}>
                              {keyword}
                            </span>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleStartEdit(keyword)}
                                disabled={isLoading}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                                title="Edit mapping"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteMapping(keyword)}
                                disabled={isLoading}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Delete mapping"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning about unsaved changes */}
          {hasUnsavedChanges && (
            <div className="mt-6 bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-800 font-medium">
                  You have unsaved changes. Make sure to save before closing.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}