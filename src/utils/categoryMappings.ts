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

// Load modified default mappings from localStorage
function loadModifiedDefaultMappings(): CategoryMapping {
  try {
    const saved = localStorage.getItem('expense-tracker-default-mappings');
    if (saved) {
      const modifications = JSON.parse(saved);
      // Only apply modifications that exist in the base mappings
      const validModifications: CategoryMapping = {};
      Object.keys(modifications).forEach(keyword => {
        if (BASE_DEFAULT_MAPPINGS.hasOwnProperty(keyword)) {
          validModifications[keyword] = modifications[keyword];
        }
      });
      return { ...BASE_DEFAULT_MAPPINGS, ...validModifications };
    }
  } catch (error) {
    console.error('Error loading modified default mappings:', error);
    // Clear corrupted data
    localStorage.removeItem('expense-tracker-default-mappings');
  }
  return { ...BASE_DEFAULT_MAPPINGS };
}

// Save only the modifications to default mappings
function saveModifiedDefaultMappings(mappings: CategoryMapping): void {
  try {
    const modifications: CategoryMapping = {};
    
    // Only save mappings that differ from base defaults
    Object.keys(mappings).forEach(keyword => {
      if (BASE_DEFAULT_MAPPINGS.hasOwnProperty(keyword) && 
          mappings[keyword] !== BASE_DEFAULT_MAPPINGS[keyword]) {
        modifications[keyword] = mappings[keyword];
      }
    });
    
    // Save deletions as null values
    Object.keys(BASE_DEFAULT_MAPPINGS).forEach(keyword => {
      if (!mappings.hasOwnProperty(keyword)) {
        modifications[keyword] = null as any; // Mark as deleted
      }
    });
    
    localStorage.setItem('expense-tracker-default-mappings', JSON.stringify(modifications));
  } catch (error) {
    console.error('Error saving modified default mappings:', error);
  }
}

// Load custom mappings from localStorage
export function loadCustomMappings(): CustomMapping[] {
  try {
    const saved = localStorage.getItem('expense-tracker-custom-mappings');
    if (saved) {
      const mappings = JSON.parse(saved);
      // Validate the structure
      if (Array.isArray(mappings)) {
        return mappings.filter(mapping => 
          mapping && 
          typeof mapping === 'object' && 
          mapping.id && 
          mapping.keyword && 
          mapping.category
        );
      }
    }
  } catch (error) {
    console.error('Error loading custom mappings:', error);
    // Clear corrupted data
    localStorage.removeItem('expense-tracker-custom-mappings');
  }
  return [];
}

// Save custom mappings to localStorage
export function saveCustomMappings(mappings: CustomMapping[]): void {
  try {
    // Validate mappings before saving
    const validMappings = mappings.filter(mapping => 
      mapping && 
      typeof mapping === 'object' && 
      mapping.id && 
      mapping.keyword && 
      mapping.category &&
      typeof mapping.isActive === 'boolean'
    );
    
    localStorage.setItem('expense-tracker-custom-mappings', JSON.stringify(validMappings));
  } catch (error) {
    console.error('Error saving custom mappings:', error);
  }
}

// Get current default mappings (base + modifications)
export function getCurrentDefaultMappings(): CategoryMapping {
  return loadModifiedDefaultMappings();
}

// Update default mappings (used by MappingManager)
export function updateDefaultMappings(mappings: CategoryMapping): void {
  saveModifiedDefaultMappings(mappings);
}

// Get combined mappings (default + custom) for categorization
export function getCombinedMappings(): CategoryMapping {
  const defaultMappings = loadModifiedDefaultMappings();
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
    if (lowerDescription.includes(keyword)) {
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

// Get all available categories (from defaults, custom mappings, and colors)
export function getAllCategories(): string[] {
  const defaultMappings = loadModifiedDefaultMappings();
  const customMappings = loadCustomMappings();
  
  // Get categories from default mappings
  const defaultCategories = [...new Set(Object.values(defaultMappings))];
  
  // Get categories from custom mappings
  const customCategories = [...new Set(customMappings.map(m => m.category))];
  
  // Get categories from color definitions (ensures we don't lose any)
  const colorCategories = Object.keys(categoryColors);
  
  // Combine all categories and remove duplicates
  const allCategories = [...new Set([...defaultCategories, ...customCategories, ...colorCategories])];
  
  return allCategories.sort();
}

// Reset default mappings to base state
export function resetDefaultMappings(): void {
  localStorage.removeItem('expense-tracker-default-mappings');
}

// Export the base default mappings for reference
export { BASE_DEFAULT_MAPPINGS as defaultCategoryMappings };