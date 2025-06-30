import { CategoryMapping, CustomMapping } from '../types';

// Suggested mappings - these are just suggestions for users
export const SUGGESTED_MAPPINGS: CategoryMapping = {
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
  'savana': 'Shopping',
  'reliance': 'Shopping',
  'shopping': 'Shopping',
  'mall': 'Shopping',
  
  // Groceries
  'big basket': 'Groceries',
  'grofers': 'Groceries',
  'blinkit': 'Groceries',
  'zepto': 'Groceries',
  
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
  'refund': 'Refunds',
  'cashback': 'Cashback',
  
  // Banking & Digital Payments
  'atm': 'Banking',
  'bank': 'Banking',
  'transfer': 'Transfers',
  'upi': 'UPI/Digital Payments',
  'paytm': 'UPI/Digital Payments',
  'phonepe': 'UPI/Digital Payments',
  'gpay': 'UPI/Digital Payments',
  'googlepay': 'UPI/Digital Payments',
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
  'Refunds': '#74B9FF',
  'Cashback': '#00CEC9',
  'Banking': '#2D3436',
  'Transfers': '#636E72',
  'UPI/Digital Payments': '#E17055',
  'Miscellaneous': '#B2BEC3',
};

// Storage key for user mappings
const USER_MAPPINGS_KEY = 'expense-tracker-user-mappings';

// Load user mappings from localStorage
export function loadUserMappings(): CategoryMapping {
  try {
    const saved = localStorage.getItem(USER_MAPPINGS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Error loading user mappings:', error);
    localStorage.removeItem(USER_MAPPINGS_KEY);
    return {};
  }
}

// Save user mappings to localStorage
export function saveUserMappings(mappings: CategoryMapping): void {
  try {
    localStorage.setItem(USER_MAPPINGS_KEY, JSON.stringify(mappings));
    console.log('User mappings saved:', Object.keys(mappings).length);
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('categoryMappingsUpdated'));
  } catch (error) {
    console.error('Error saving user mappings:', error);
  }
}

// Get all active mappings (user mappings take precedence)
export function getActiveMappings(): CategoryMapping {
  const userMappings = loadUserMappings();
  
  // If user has no mappings, start with suggested mappings
  if (Object.keys(userMappings).length === 0) {
    return { ...SUGGESTED_MAPPINGS };
  }
  
  return userMappings;
}

// Add or update a mapping
export function addOrUpdateMapping(keyword: string, category: string): void {
  const mappings = loadUserMappings();
  mappings[keyword.toLowerCase().trim()] = category.trim();
  saveUserMappings(mappings);
}

// Delete a mapping
export function deleteMapping(keyword: string): void {
  const mappings = loadUserMappings();
  delete mappings[keyword.toLowerCase().trim()];
  saveUserMappings(mappings);
}

// Initialize user mappings with suggested ones (only if empty)
export function initializeUserMappings(): void {
  const userMappings = loadUserMappings();
  if (Object.keys(userMappings).length === 0) {
    saveUserMappings({ ...SUGGESTED_MAPPINGS });
  }
}

// Categorize transaction using active mappings
export function categorizeTransaction(description: string): string {
  const lowerDescription = description.toLowerCase().trim();
  const mappings = getActiveMappings();
  
  // Check for exact keyword matches first
  for (const [keyword, category] of Object.entries(mappings)) {
    if (lowerDescription.includes(keyword.toLowerCase())) {
      return category;
    }
  }
  
  // Enhanced credit transaction detection
  if (isCreditTransaction(description)) {
    // Check for specific credit types
    if (isSalaryTransaction(description)) return 'Salary';
    if (isBonusTransaction(description)) return 'Bonus';
    if (isInvestmentReturn(description)) return 'Investment Returns';
    if (isRefundTransaction(description)) return 'Refunds';
    if (isCashbackTransaction(description)) return 'Cashback';
    
    // Default to Credits for other credit transactions
    return 'Credits';
  }
  
  // Fallback patterns for unmatched transactions
  const patterns = [
    { pattern: /food|restaurant|cafe|dining|meal/i, category: 'Food & Dining' },
    { pattern: /shop|store|mall|purchase|buy/i, category: 'Shopping' },
    { pattern: /fuel|petrol|gas|transport|taxi|uber|ola/i, category: 'Transportation' },
    { pattern: /medical|health|doctor|pharmacy|hospital/i, category: 'Healthcare' },
    { pattern: /bill|utility|electric|water|internet|mobile/i, category: 'Bills & Utilities' },
    { pattern: /entertainment|movie|game|music|netflix/i, category: 'Entertainment' },
    { pattern: /grocery|vegetables|fruits|supermarket/i, category: 'Groceries' },
  ];
  
  for (const { pattern, category } of patterns) {
    if (pattern.test(description)) {
      return category;
    }
  }
  
  return 'Miscellaneous';
}

// Helper functions for credit transaction categorization
function isCreditTransaction(description: string): boolean {
  const lowerDesc = description.toLowerCase();
  const creditKeywords = [
    'salary', 'sal', 'wage', 'pay', 'deposit', 'credit', 'credited',
    'interest', 'dividend', 'bonus', 'transfer in', 'received',
    'incoming', 'refund', 'cashback', 'reward'
  ];
  
  return creditKeywords.some(keyword => lowerDesc.includes(keyword));
}

function isSalaryTransaction(description: string): boolean {
  const lowerDesc = description.toLowerCase();
  return ['salary', 'sal', 'wage', 'payroll', 'monthly pay'].some(keyword => 
    lowerDesc.includes(keyword)
  );
}

function isBonusTransaction(description: string): boolean {
  const lowerDesc = description.toLowerCase();
  return ['bonus', 'incentive', 'commission', 'reward'].some(keyword => 
    lowerDesc.includes(keyword)
  );
}

function isInvestmentReturn(description: string): boolean {
  const lowerDesc = description.toLowerCase();
  return ['dividend', 'interest', 'investment', 'mutual fund', 'sip'].some(keyword => 
    lowerDesc.includes(keyword)
  );
}

function isRefundTransaction(description: string): boolean {
  const lowerDesc = description.toLowerCase();
  return ['refund', 'return', 'reversal', 'chargeback'].some(keyword => 
    lowerDesc.includes(keyword)
  );
}

function isCashbackTransaction(description: string): boolean {
  const lowerDesc = description.toLowerCase();
  return ['cashback', 'cash back', 'reward', 'points'].some(keyword => 
    lowerDesc.includes(keyword)
  );
}

// Get all available categories
export function getAllCategories(): string[] {
  const mappings = getActiveMappings();
  const categories = [...new Set(Object.values(mappings))];
  const colorCategories = Object.keys(categoryColors);
  
  const allCategories = [...new Set([...categories, ...colorCategories])];
  return allCategories.sort();
}

// Reset all mappings
export function resetAllMappings(): void {
  localStorage.removeItem(USER_MAPPINGS_KEY);
  console.log('All mappings reset');
  window.dispatchEvent(new CustomEvent('categoryMappingsUpdated'));
}

// Get suggested mappings for UI
export function getSuggestedMappings(): CategoryMapping {
  return { ...SUGGESTED_MAPPINGS };
}

// Legacy support - remove these exports
export const defaultCategoryMappings = SUGGESTED_MAPPINGS;
export const BASE_DEFAULT_MAPPINGS = SUGGESTED_MAPPINGS;

// Remove all the complex default mapping functions
export function loadCustomMappings(): CustomMapping[] {
  return [];
}

export function saveCustomMappings(mappings: CustomMapping[]): void {
  // Convert custom mappings to user mappings format
  const userMappings = loadUserMappings();
  mappings.forEach(mapping => {
    if (mapping.isActive) {
      userMappings[mapping.keyword.toLowerCase()] = mapping.category;
    }
  });
  saveUserMappings(userMappings);
}

export function getCurrentDefaultMappings(): CategoryMapping {
  return getActiveMappings();
}

export function updateDefaultMappings(newMappings: CategoryMapping): void {
  saveUserMappings(newMappings);
}

export function resetDefaultMappings(): void {
  resetAllMappings();
}

export function getCombinedMappings(): CategoryMapping {
  return getActiveMappings();
}