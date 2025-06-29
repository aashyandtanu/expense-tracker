export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  originalDescription?: string;
  isManual?: boolean;
  source?: 'excel' | 'csv' | 'manual';
}

export interface CategoryMapping {
  [keyword: string]: string;
}

export interface CustomMapping {
  id: string;
  keyword: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryData {
  category: string;
  amount: number;
  color: string;
}

export interface UploadedFile {
  file: File;
  password?: string;
}

export interface SalaryEntry {
  id: string;
  amount: number;
  date: string;
  description: string;
  isRecurring: boolean;
  frequency?: 'monthly' | 'weekly' | 'yearly';
}

export interface FieldMapping {
  id: string;
  bankName: string;
  starterWord: string; // Single word that identifies the header row
  dateColumn: string;
  descriptionColumn: string;
  amountColumn?: string;
  withdrawalColumn?: string;
  depositColumn?: string;
  typeColumn?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  originalRow: any;
  success: boolean;
  error?: string;
}