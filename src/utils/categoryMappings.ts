import { CategoryMapping, CustomMapping } from '../types';

// Base default mappings - these should never be modified directly
const BASE_DEFAULT_MAPPINGS: CategoryMapping = {
  // Food & Dining
  'zomato': 'Food & Dining',
  'swiggy': 'Food & Dining',
  'dominos': 'Food & Dining',
  'kfc': 'Food & Dining',
  'mcdonalds': 'Food & Dining',
  'restaurant': 'Food & Dining',
  'cafe': 'Food & Dining',
  'starbucks': 'Food & Dining',
  'food': 'Food & Dining',
  'dining': 'Food & Dining',
  
  // Shopping
  'amazon': 'Shopping',
  'flipkart': 'Shopping',
  'myntra': 'Shopping',
  'ajio': 'Shopping',
  'nykaa': 'Shopping',
  'big basket': 'Groceries',
  'grofers': 'Groceries',
  'reliance': 'Shopping',
  'shopping': 'Shopping',
  'mall': 'Shopping',
  
  // Transportation
  'uber': 'Transportation',
  'ola': 'Transportation',
  'rapido': 'Transportation',
  'metro': 'Transportation',
  'petrol': 'Transportation',
  'fuel': 'Transportation',
  'parking': 'Transportation',
  'taxi': 'Transportation',
  'bus': 'Transportation',
  
  // Entertainment
  'netflix': 'Entertainment',
  'amazon prime': 'Entertainment',
  'hotstar': 'Entertainment',
  'spotify': 'Entertainment',
  'youtube': 'Entertainment',
  'movie': 'Entertainment',
  'cinema': 'Entertainment',
  'bookmyshow': 'Entertainment',
  'game': 'Entertainment',
  
  // Bills & Utilities
  'electricity': 'Bills & Utilities',
  'gas': 'Bills & Utilities',
  'water': 'Bills & Utilities',
  'internet': 'Bills & Utilities',
  'broadband': 'Bills & Utilities',
  'mobile': 'Bills & Utilities',
  'airtel': 'Bills & Utilities',
  'jio': 'Bills & Utilities',
  'bsnl': 'Bills & Utilities',
  'bill': 'Bills & Utilities',
  
  // Healthcare
  'hospital': 'Healthcare',
  'pharmacy': 'Healthcare',
  'medical': 'Healthcare',
  'doctor': 'Healthcare',
  'medicine': 'Healthcare',
  'clinic': 'Healthcare',
  
  // Income
  'salary': 'Salary',
  'bonus': 'Bonus',
  'dividend': 'Investment Returns',
  'interest': 'Investment Returns',
  'deposit': 'Credits',
  'transfer in': 'Transfers',
  
  // Banking
  'atm': 'Banking',
  'bank': 'Banking',
  'transfer': 'Transfers',
  'upi': 'UPI/Digital Payments',
  'paytm': 'UPI/Digital Payments',
  'phonepe': 'UPI/Digital Payments',
  'gpay': 'UPI/Digital Payments',
  'googlepay': 'UPI/Digital Payments',
  'digital payment': 'UPI/Digital Payments',
};

export const categoryColors: { [key: string]: string } = {
  'Food & Dining': '#FF6B6B',
  'Shopping': '#4ECDC4',
  'Groceries': '#45B7D1',
  'Transportation': '#96CEB4',
  'Entertainment': '#FFEAA7',
  'Bills & Utilities': '#DDA0DD',
  'Healthcare': '#FF7675',
  'Salary': '#00B894',
  'Bonus': '#00B894',
  'Investment Returns': '#6C5CE7',
  'Credits': '#A29BFE',
  'Deposits': '#00B894',
  'Banking': '#2D3436',
  'Transfers': '#636E72',
  'UPI/Digital Payments': '#E17055',
  'Miscellaneous': '#B2BEC3',
};

// Storage keys
const CUSTOM_MAPPINGS_KEY = 'expense-tracker-custom-mappings';
const DEFAULT_MODIFICATIONS_KEY = 'expense-tracker-default-modifications';
const DELETED_DEFAULTS_KEY = 'expense-tracker-deleted-defaults';

// Load custom mappings from localStorage
export function loadCustomMappings(): CustomMapping[] {
  try {
    const saved = localStorage.getItem(CUSTOM_MAPPINGS_KEY);
    if (saved) {
      const mappings = JSON.parse(saved);
      if (Array.isArray(mappings)) {
        return mappings.filter(mapping => 
          mapping && 
          typeof mapping === 'object' && 
          mapping.id && 
          mapping.keyword && 
          mapping.category &&
          typeof mapping.isActive === 'boolean'
        );
      }
    }
  } catch (error) {
    console.error('Error loading custom mappings:', error);
    localStorage.removeItem(CUSTOM_MAPPINGS_KEY);
  }
  return [];
}

// Save custom mappings to localStorage
export function saveCustomMappings(mappings: CustomMapping[]): void {
  try {
    const validMappings = mappings.filter(mapping => 
      mapping && 
      typeof mapping === 'object' && 
      mapping.id && 
      mapping.keyword && 
      mapping.category &&
      typeof mapping.isActive === 'boolean'
    );
    
    localStorage.setItem(CUSTOM_MAPPINGS_KEY, JSON.stringify(validMappings));
    console.log('Custom mappings saved:', validMappings.length);
  } catch (error) {
    console.error('Error saving custom mappings:', error);
  }
}

// Load deleted default keywords
function loadDeletedDefaults(): Set<string> {
  try {
    const saved = localStorage.getItem(DELETED_DEFAULTS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch (error) {
    console.error('Error loading deleted defaults:', error);
    localStorage.removeItem(DELETED_DEFAULTS_KEY);
    return new Set();
  }
}

// Save deleted default keywords
function saveDeletedDefaults(deletedKeywords: Set<string>): void {
  try {
    localStorage.setItem(DELETED_DEFAULTS_KEY, JSON.stringify(Array.from(deletedKeywords)));
    console.log('Deleted defaults saved:', deletedKeywords.size);
  } catch (error) {
    console.error('Error saving deleted defaults:', error);
  }
}

// Load default mapping modifications
function loadDefaultModifications(): CategoryMapping {
  try {
    const saved = localStorage.getItem(DEFAULT_MODIFICATIONS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Error loading default modifications:', error);
    localStorage.removeItem(DEFAULT_MODIFICATIONS_KEY);
    return {};
  }
}

// Save default mapping modifications
function saveDefaultModifications(modifications: CategoryMapping): void {
  try {
    localStorage.setItem(DEFAULT_MODIFICATIONS_KEY, JSON.stringify(modifications));
    console.log('Default modifications saved:', Object.keys(modifications).length);
  } catch (error) {
    console.error('Error saving default modifications:', error);
  }
}

// Get current default mappings (base + modifications - deletions)
export function getCurrentDefaultMappings(): CategoryMapping {
  const deletedKeywords = loadDeletedDefaults();
  const modifications = loadDefaultModifications();
  const result: CategoryMapping = {};
  
  // Start with base mappings, excluding deleted ones
  Object.entries(BASE_DEFAULT_MAPPINGS).forEach(([keyword, category]) => {
    if (!deletedKeywords.has(keyword)) {
      result[keyword] = category;
    }
  });
  
  // Apply modifications
  Object.entries(modifications).forEach(([keyword, category]) => {
    if (!deletedKeywords.has(keyword)) {
      result[keyword] = category;
    }
  });
  
  return result;
}

// Update default mappings
export function updateDefaultMappings(newMappings: CategoryMapping): void {
  const deletedKeywords = new Set<string>();
  const modifications: CategoryMapping = {};
  
  // Find deletions (keywords in base but not in new mappings)
  Object.keys(BASE_DEFAULT_MAPPINGS).forEach(keyword => {
    if (!newMappings.hasOwnProperty(keyword)) {
      deletedKeywords.add(keyword);
    }
  });
  
  // Find modifications (keywords with different categories than base)
  Object.entries(newMappings).forEach(([keyword, category]) => {
    if (BASE_DEFAULT_MAPPINGS.hasOwnProperty(keyword)) {
      if (BASE_DEFAULT_MAPPINGS[keyword] !== category) {
        modifications[keyword] = category;
      }
    } else {
      // New keyword not in base defaults
      modifications[keyword] = category;
    }
  });
  
  // Save changes
  saveDeletedDefaults(deletedKeywords);
  saveDefaultModifications(modifications);
  
  console.log('Default mappings updated:', {
    deletions: deletedKeywords.size,
    modifications: Object.keys(modifications).length
  });
}

// Delete a default mapping
export function deleteDefaultMapping(keyword: string): void {
  const deletedKeywords = loadDeletedDefaults();
  deletedKeywords.add(keyword);
  saveDeletedDefaults(deletedKeywords);
  
  // Also remove from modifications if it exists
  const modifications = loadDefaultModifications();
  if (modifications.hasOwnProperty(keyword)) {
    delete modifications[keyword];
    saveDefaultModifications(modifications);
  }
  
  console.log('Default mapping deleted:', keyword);
}

// Add or update a default mapping
export function updateDefaultMapping(keyword: string, category: string): void {
  const deletedKeywords = loadDeletedDefaults();
  const modifications = loadDefaultModifications();
  
  // Remove from deleted list if it was deleted
  if (deletedKeywords.has(keyword)) {
    deletedKeywords.delete(keyword);
    saveDeletedDefaults(deletedKeywords);
  }
  
  // Check if this is different from base default
  if (BASE_DEFAULT_MAPPINGS.hasOwnProperty(keyword)) {
    if (BASE_DEFAULT_MAPPINGS[keyword] !== category) {
      modifications[keyword] = category;
    } else {
      // Same as base, remove from modifications
      delete modifications[keyword];
    }
  } else {
    // New keyword
    modifications[keyword] = category;
  }
  
  saveDefaultModifications(modifications);
  console.log('Default mapping updated:', keyword, '→', category);
}

// Get combined mappings for categorization (default + active custom)
export function getCombinedMappings(): CategoryMapping {
  const defaultMappings = getCurrentDefaultMappings();
  const customMappings = loadCustomMappings();
  const combined = { ...defaultMappings };
  
  // Apply active custom mappings (they override defaults)
  customMappings
    .filter(mapping => mapping.isActive)
    .forEach(mapping => {
      combined[mapping.keyword.toLowerCase()] = mapping.category;
    });
  
  return combined;
}

// Categorize transaction using combined mappings
export function categorizeTransaction(description: string): string {
  const lowerDescription = description.toLowerCase();
  const mappings = getCombinedMappings();
  
  // First check for exact matches
  for (const [keyword, category] of Object.entries(mappings)) {
    if (lowerDescription.includes(keyword.toLowerCase())) {
      return category;
    }
  }
  
  // If no match found, try partial matching with common patterns
  const patterns = [
    { pattern: /salary|wage|pay(?:ment)?/i, category: 'Salary' },
    { pattern: /food|restaurant|cafe|dining/i, category: 'Food & Dining' },
    { pattern: /shop|store|mall|purchase/i, category: 'Shopping' },
    { pattern: /fuel|petrol|gas|transport/i, category: 'Transportation' },
    { pattern: /medical|health|doctor|pharmacy/i, category: 'Healthcare' },
    { pattern: /bill|utility|electric|water/i, category: 'Bills & Utilities' },
    { pattern: /entertainment|movie|game|music/i, category: 'Entertainment' },
  ];
  
  for (const { pattern, category } of patterns) {
    if (pattern.test(description)) {
      return category;
    }
  }
  
  return 'Miscellaneous';
}

// Get all available categories
export function getAllCategories(): string[] {
  const defaultMappings = getCurrentDefaultMappings();
  const customMappings = loadCustomMappings();
  
  const defaultCategories = [...new Set(Object.values(defaultMappings))];
  const customCategories = [...new Set(customMappings.map(m => m.category))];
  const colorCategories = Object.keys(categoryColors);
  
  const allCategories = [...new Set([...defaultCategories, ...customCategories, ...colorCategories])];
  return allCategories.sort();
}

// Reset all mappings to base state
export function resetAllMappings(): void {
  localStorage.removeItem(CUSTOM_MAPPINGS_KEY);
  localStorage.removeItem(DEFAULT_MODIFICATIONS_KEY);
  localStorage.removeItem(DELETED_DEFAULTS_KEY);
  console.log('All mappings reset to base state');
}

// Reset only default mappings to base state
export function resetDefaultMappings(): void {
  localStorage.removeItem(DEFAULT_MODIFICATIONS_KEY);
  localStorage.removeItem(DELETED_DEFAULTS_KEY);
  console.log('Default mappings reset to base state');
}

// Export base mappings for reference
export { BASE_DEFAULT_MAPPINGS };

// Legacy support - these are kept for backward compatibility
export const defaultCategoryMappings = BASE_DEFAULT_MAPPINGS;