import { FieldMapping } from '../types';

const DEFAULT_MAPPINGS: FieldMapping[] = [
  {
    id: 'hdfc-default',
    bankName: 'HDFC Bank',
    starterWord: 'Date', // HDFC uses "Date" as the first column header
    dateColumn: 'Date',
    descriptionColumn: 'Narration',
    withdrawalColumn: 'Withdrawal Amt.',
    depositColumn: 'Deposit Amt.',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'icici-default',
    bankName: 'ICICI Bank',
    starterWord: 'Transaction', // ICICI often starts with "Transaction Date"
    dateColumn: 'Transaction Date',
    descriptionColumn: 'Transaction Remarks',
    withdrawalColumn: 'Withdrawal Amount (INR )',
    depositColumn: 'Deposit Amount (INR )',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sbi-default',
    bankName: 'State Bank of India',
    starterWord: 'Txn', // SBI often uses "Txn Date"
    dateColumn: 'Txn Date',
    descriptionColumn: 'Description',
    withdrawalColumn: 'Debit',
    depositColumn: 'Credit',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'axis-default',
    bankName: 'Axis Bank',
    starterWord: 'Tran', // Axis often uses "Tran Date"
    dateColumn: 'Tran Date',
    descriptionColumn: 'Particulars',
    withdrawalColumn: 'Debit',
    depositColumn: 'Credit',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'generic-default',
    bankName: 'Generic Format',
    starterWord: 'Date', // Generic format typically starts with "Date"
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    typeColumn: 'Type',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

export function loadFieldMappings(): FieldMapping[] {
  try {
    const saved = localStorage.getItem('expense-tracker-field-mappings');
    const customMappings = saved ? JSON.parse(saved) : [];
    
    // Load modified default mappings
    const savedDefaults = localStorage.getItem('expense-tracker-default-field-mappings');
    const modifiedDefaults = savedDefaults ? JSON.parse(savedDefaults) : {};
    
    // Merge default mappings with any modifications
    const defaultMappings = DEFAULT_MAPPINGS.map(mapping => ({
      ...mapping,
      ...modifiedDefaults[mapping.id]
    }));
    
    return [...defaultMappings, ...customMappings];
  } catch {
    return DEFAULT_MAPPINGS;
  }
}

export function saveFieldMappings(mappings: FieldMapping[]): void {
  // Separate default and custom mappings
  const defaultMappings: { [key: string]: Partial<FieldMapping> } = {};
  const customMappings: FieldMapping[] = [];
  
  mappings.forEach(mapping => {
    if (mapping.isDefault) {
      // Store only the changes from the original default
      const original = DEFAULT_MAPPINGS.find(d => d.id === mapping.id);
      if (original) {
        const changes: Partial<FieldMapping> = {};
        Object.keys(mapping).forEach(key => {
          if (mapping[key as keyof FieldMapping] !== original[key as keyof FieldMapping]) {
            changes[key as keyof FieldMapping] = mapping[key as keyof FieldMapping] as any;
          }
        });
        if (Object.keys(changes).length > 0) {
          defaultMappings[mapping.id] = changes;
        }
      }
    } else {
      customMappings.push(mapping);
    }
  });
  
  // Save both separately
  localStorage.setItem('expense-tracker-default-field-mappings', JSON.stringify(defaultMappings));
  localStorage.setItem('expense-tracker-field-mappings', JSON.stringify(customMappings));
}

export function getDefaultMapping(): FieldMapping {
  const mappings = loadFieldMappings();
  return mappings.find(m => m.id === 'hdfc-default') || mappings[0];
}

export function createFieldMapping(
  bankName: string,
  starterWord: string,
  dateColumn: string,
  descriptionColumn: string,
  options: {
    amountColumn?: string;
    withdrawalColumn?: string;
    depositColumn?: string;
    typeColumn?: string;
  }
): FieldMapping {
  return {
    id: `custom-${Date.now()}`,
    bankName,
    starterWord,
    dateColumn,
    descriptionColumn,
    amountColumn: options.amountColumn,
    withdrawalColumn: options.withdrawalColumn,
    depositColumn: options.depositColumn,
    typeColumn: options.typeColumn,
    isDefault: false,
    createdAt: new Date().toISOString(),
  };
}