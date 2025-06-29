import { CategoryMapping, CustomMapping } from '../types';

let defaultCategoryMappings: CategoryMapping = {
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

// Load and apply modified default mappings
function loadDefaultMappings(): CategoryMapping {
  try {
    const saved = localStorage.getItem('expense-tracker-default-mappings');
    if (saved) {
      const modifiedDefaults = JSON.parse(saved);
      return { ...defaultCategoryMappings, ...modifiedDefaults };
    }
  } catch {
    // Ignore errors and use original defaults
  }
  return defaultCategoryMappings;
}

// Initialize with potentially modified defaults
defaultCategoryMappings = loadDefaultMappings();

// Load custom mappings from localStorage
export function loadCustomMappings(): CustomMapping[] {
  try {
    const saved = localStorage.getItem('expense-tracker-custom-mappings');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Save custom mappings to localStorage
export function saveCustomMappings(mappings: CustomMapping[]): void {
  localStorage.setItem('expense-tracker-custom-mappings', JSON.stringify(mappings));
}

// Get combined mappings (default + custom)
export function getCombinedMappings(): CategoryMapping {
  const modifiedDefaults = loadDefaultMappings();
  const customMappings = loadCustomMappings();
  const combined = { ...modifiedDefaults };
  
  customMappings
    .filter(mapping => mapping.isActive)
    .forEach(mapping => {
      combined[mapping.keyword.toLowerCase()] = mapping.category;
    });
  
  return combined;
}

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

// Get all available categories
export function getAllCategories(): string[] {
  const modifiedDefaults = loadDefaultMappings();
  const defaultCategories = [...new Set(Object.values(modifiedDefaults))];
  const customMappings = loadCustomMappings();
  const customCategories = [...new Set(customMappings.map(m => m.category))];
  
  return [...new Set([...defaultCategories, ...customCategories])].sort();
}

export { defaultCategoryMappings }