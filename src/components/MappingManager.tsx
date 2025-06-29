import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Settings, RotateCcw, AlertTriangle } from 'lucide-react';
import { CustomMapping } from '../types';
import { 
  loadCustomMappings, 
  saveCustomMappings, 
  getAllCategories, 
  getCurrentDefaultMappings,
  updateDefaultMappings,
  resetDefaultMappings,
  deleteDefaultMapping,
  updateDefaultMapping,
  BASE_DEFAULT_MAPPINGS
} from '../utils/categoryMappings';

interface MappingManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onMappingsUpdated: () => void;
}

export function MappingManager({ isOpen, onClose, onMappingsUpdated }: MappingManagerProps) {
  const [customMappings, setCustomMappings] = useState<CustomMapping[]>([]);
  const [defaultMappings, setDefaultMappings] = useState<{ [key: string]: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDefault, setEditingDefault] = useState<string | null>(null);
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
      const customs = loadCustomMappings();
      const defaults = getCurrentDefaultMappings();
      
      setCustomMappings(customs);
      setDefaultMappings(defaults);
      setHasUnsavedChanges(false);
      
      console.log('Mappings loaded:', {
        customs: customs.length,
        defaults: Object.keys(defaults).length
      });
    } catch (error) {
      console.error('Error loading mappings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Save custom mappings
      saveCustomMappings(customMappings);
      
      // Save default mappings modifications
      updateDefaultMappings(defaultMappings);
      
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
    
    // Check if keyword already exists
    const existsInDefaults = defaultMappings.hasOwnProperty(keyword);
    const existsInCustoms = customMappings.some(m => m.keyword.toLowerCase() === keyword);
    
    if (existsInDefaults || existsInCustoms) {
      alert('This keyword already exists. Please use a different keyword or edit the existing one.');
      return;
    }

    const mapping: CustomMapping = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      keyword: keyword,
      category: newMapping.category.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setCustomMappings(prev => [...prev, mapping]);
    setNewMapping({ keyword: '', category: '' });
    setShowAddForm(false);
    setHasUnsavedChanges(true);
  };

  const handleEditCustomMapping = (id: string, field: 'keyword' | 'category', value: string) => {
    setCustomMappings(prev => prev.map(mapping =>
      mapping.id === id ? { 
        ...mapping, 
        [field]: field === 'keyword' ? value.toLowerCase() : value 
      } : mapping
    ));
    setHasUnsavedChanges(true);
  };

  const handleEditDefaultMapping = (oldKeyword: string, newKeyword: string, category: string) => {
    const newMappings = { ...defaultMappings };
    
    if (oldKeyword !== newKeyword) {
      // Remove old keyword
      delete newMappings[oldKeyword];
    }
    
    // Add/update new keyword
    newMappings[newKeyword.toLowerCase()] = category;
    
    setDefaultMappings(newMappings);
    setHasUnsavedChanges(true);
    
    if (oldKeyword !== newKeyword) {
      setEditingDefault(newKeyword.toLowerCase());
    }
  };

  const handleDeleteDefaultMapping = (keyword: string) => {
    if (confirm(`Are you sure you want to delete the mapping for "${keyword}"?`)) {
      const newMappings = { ...defaultMappings };
      delete newMappings[keyword];
      setDefaultMappings(newMappings);
      setHasUnsavedChanges(true);
    }
  };

  const handleToggleActive = (id: string) => {
    setCustomMappings(prev => prev.map(mapping =>
      mapping.id === id ? { ...mapping, isActive: !mapping.isActive } : mapping
    ));
    setHasUnsavedChanges(true);
  };

  const handleDeleteCustomMapping = (id: string) => {
    if (confirm('Are you sure you want to delete this custom mapping?')) {
      setCustomMappings(prev => prev.filter(mapping => mapping.id !== id));
      setHasUnsavedChanges(true);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all default mappings to their original state? This will remove all your modifications to default mappings.')) {
      setDefaultMappings({ ...BASE_DEFAULT_MAPPINGS });
      setHasUnsavedChanges(true);
    }
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

  // Group all mappings by category
  const getAllMappingsByCategory = () => {
    const allMappings: { 
      [category: string]: Array<{ 
        keyword: string; 
        type: 'default' | 'custom'; 
        id?: string; 
        isActive?: boolean;
        isBaseDefault?: boolean;
      }> 
    } = {};
    
    // Add default mappings
    Object.entries(defaultMappings).forEach(([keyword, category]) => {
      if (!allMappings[category]) {
        allMappings[category] = [];
      }
      allMappings[category].push({ 
        keyword, 
        type: 'default',
        isBaseDefault: BASE_DEFAULT_MAPPINGS.hasOwnProperty(keyword)
      });
    });
    
    // Add custom mappings
    customMappings.forEach(mapping => {
      if (!allMappings[mapping.category]) {
        allMappings[mapping.category] = [];
      }
      allMappings[mapping.category].push({ 
        keyword: mapping.keyword, 
        type: 'custom', 
        id: mapping.id,
        isActive: mapping.isActive
      });
    });
    
    return allMappings;
  };

  const groupedAllMappings = getAllMappingsByCategory();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
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
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add Custom Mapping
              </button>
              
              <button
                onClick={handleResetDefaults}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Defaults
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <h3 className="font-medium text-gray-900 mb-3">Add Custom Mapping</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keyword *
                  </label>
                  <input
                    type="text"
                    value={newMapping.keyword}
                    onChange={(e) => setNewMapping(prev => ({ ...prev, keyword: e.target.value }))}
                    placeholder="e.g., starbucks, gym, netflix"
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

          {/* All Mappings by Category */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">All Mappings by Category</h3>
              <span className="text-sm text-gray-500">
                {Object.keys(groupedAllMappings).length} categories
              </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(groupedAllMappings).map(([category, mappings]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{category}</h4>
                    <span className="text-xs text-gray-500">
                      {mappings.length} keywords
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {mappings.map((mapping, index) => (
                      <div key={`${mapping.keyword}-${index}`} className="flex items-center justify-between text-sm bg-white rounded p-2">
                        {editingDefault === mapping.keyword && mapping.type === 'default' ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={mapping.keyword}
                              onChange={(e) => {
                                const newKeyword = e.target.value.toLowerCase();
                                handleEditDefaultMapping(mapping.keyword, newKeyword, category);
                              }}
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <select
                              value={category}
                              onChange={(e) => handleEditDefaultMapping(mapping.keyword, mapping.keyword, e.target.value)}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingDefault(null)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                          </div>
                        ) : editingId === mapping.id && mapping.type === 'custom' ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={mapping.keyword}
                              onChange={(e) => mapping.id && handleEditCustomMapping(mapping.id, 'keyword', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <select
                              value={category}
                              onChange={(e) => mapping.id && handleEditCustomMapping(mapping.id, 'category', e.target.value)}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-mono text-gray-700">
                                {mapping.keyword}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                mapping.type === 'default' 
                                  ? mapping.isBaseDefault
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-purple-100 text-purple-800'
                                  : mapping.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {mapping.type === 'default' 
                                  ? mapping.isBaseDefault ? 'Default' : 'Modified'
                                  : mapping.isActive ? 'Custom' : 'Inactive'
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {mapping.type === 'custom' && mapping.id && (
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={mapping.isActive}
                                    onChange={() => handleToggleActive(mapping.id!)}
                                    className="mr-1 text-xs"
                                    disabled={isLoading}
                                  />
                                </label>
                              )}
                              <button
                                onClick={() => {
                                  if (mapping.type === 'default') {
                                    setEditingDefault(mapping.keyword);
                                  } else if (mapping.id) {
                                    setEditingId(mapping.id);
                                  }
                                }}
                                disabled={isLoading}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                                title="Edit mapping"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (mapping.type === 'default') {
                                    handleDeleteDefaultMapping(mapping.keyword);
                                  } else if (mapping.id) {
                                    handleDeleteCustomMapping(mapping.id);
                                  }
                                }}
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

          {/* Custom Mappings Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Custom Mappings Only</h3>
              <span className="text-sm text-gray-500">
                {customMappings.length} custom mappings ({customMappings.filter(m => m.isActive).length} active)
              </span>
            </div>

            <div className="space-y-3">
              {customMappings.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                  <Settings className="h-12 w-12 mx-auto opacity-50 mb-3" />
                  <p>No custom mappings created yet.</p>
                  <p className="text-sm">Add your first custom mapping to override defaults or create new ones.</p>
                </div>
              ) : (
                customMappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className={`border rounded-lg p-4 transition-all ${
                      mapping.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Keyword
                          </label>
                          {editingId === mapping.id ? (
                            <input
                              type="text"
                              value={mapping.keyword}
                              onChange={(e) => handleEditCustomMapping(mapping.id, 'keyword', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isLoading}
                            />
                          ) : (
                            <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono">
                              {mapping.keyword}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Category
                          </label>
                          {editingId === mapping.id ? (
                            <select
                              value={mapping.category}
                              onChange={(e) => handleEditCustomMapping(mapping.id, 'category', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isLoading}
                            >
                              {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                              {mapping.category}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={mapping.isActive}
                            onChange={() => handleToggleActive(mapping.id)}
                            className="mr-2"
                            disabled={isLoading}
                          />
                          <span className="text-sm text-gray-600">Active</span>
                        </label>
                        
                        {editingId === mapping.id ? (
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={isLoading}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingId(mapping.id)}
                            disabled={isLoading}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteCustomMapping(mapping.id)}
                          disabled={isLoading}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
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