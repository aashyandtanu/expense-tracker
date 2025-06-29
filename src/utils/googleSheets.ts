import * as XLSX from "xlsx";
import { Transaction } from "../types";

export interface GoogleSheetsConfig {
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

interface GoogleCredentials {
  clientId: string;
  apiKey: string;
  timestamp: number;
}

let tokenClient: any;

// Load Google Sheets configuration
export function loadGoogleSheetsConfig(): GoogleSheetsConfig {
  try {
    const saved = localStorage.getItem("expense-tracker-google-sheets-config");
    return saved ? JSON.parse(saved) : { isConnected: false };
  } catch {
    return { isConnected: false };
  }
}

// Save Google Sheets configuration
export function saveGoogleSheetsConfig(config: GoogleSheetsConfig): void {
  localStorage.setItem(
    "expense-tracker-google-sheets-config",
    JSON.stringify(config)
  );
}

// Save Google credentials with timestamp (secure with 1-day timeout)
export function saveGoogleCredentials(clientId: string, apiKey: string): void {
  const credentials: GoogleCredentials = { 
    clientId, 
    apiKey, 
    timestamp: Date.now() 
  };
  localStorage.setItem(
    "google-sheets-credentials",
    JSON.stringify(credentials)
  );
}

// Get Google credentials with timeout check
function getGoogleCredentials(): { clientId: string; apiKey: string } | null {
  try {
    const saved = localStorage.getItem("google-sheets-credentials");
    if (!saved) return null;
    
    const credentials: GoogleCredentials = JSON.parse(saved);
    
    // Check if credentials are older than 1 day (24 hours)
    const oneDayInMs = 24 * 60 * 60 * 1000;
    if (Date.now() - credentials.timestamp > oneDayInMs) {
      // Credentials expired, remove them
      localStorage.removeItem("google-sheets-credentials");
      return null;
    }
    
    return { clientId: credentials.clientId, apiKey: credentials.apiKey };
  } catch {
    return null;
  }
}

// Clear expired credentials
export function clearExpiredCredentials(): void {
  const credentials = getGoogleCredentials();
  if (!credentials) {
    localStorage.removeItem("google-sheets-credentials");
  }
}

// Initialize Google Sheets API
export async function initializeGoogleSheetsAPI(): Promise<boolean> {
  try {
    const credentials = getGoogleCredentials();
    if (!credentials || !credentials.clientId || !credentials.apiKey) {
      throw new Error(
        "Google API credentials not found or expired. Please set up credentials again."
      );
    }

    // Load Google API script if not already loaded
    if (!window.gapi) {
      await loadGoogleAPIScript();
    }

    return new Promise((resolve, reject) => {
      window.gapi.load("client", async () => {
        try {
          await window.gapi.client.init({
            apiKey: credentials.apiKey,
            discoveryDocs: [
              "https://sheets.googleapis.com/$discovery/rest?version=v4",
            ],
          });

          tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: credentials.clientId,
            scope:
              "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
            callback: (tokenResponse: any) => {
              if (tokenResponse.error) {
                reject(tokenResponse);
              } else {
                resolve(true);
              }
            },
          });

          resolve(true);
        } catch (err) {
          console.error("GAPI init failed:", err);
          reject(err);
        }
      });
    });
  } catch (error) {
    console.error("Failed to initialize Google Sheets API:", error);
    return false;
  }
}

// Load Google API script
async function loadGoogleAPIScript(): Promise<void> {
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      if (window.gapi) return resolve();

      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load gapi"));
      document.head.appendChild(script);
    }),
    new Promise<void>((resolve, reject) => {
      if (window.google && window.google.accounts) return resolve();

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load GIS"));
      document.head.appendChild(script);
    }),
  ]);
}

// Authenticate with Google
export async function authenticateGoogle(): Promise<GoogleSheetsConfig> {
  return new Promise((resolve, reject) => {
    tokenClient.requestAccessToken();
    tokenClient.callback = (response: any) => {
      if (response.error) {
        reject(new Error("Failed to authenticate"));
        return;
      }

      const config: GoogleSheetsConfig = {
        isConnected: true,
        accessToken: response.access_token,
        expiresAt: Date.now() + response.expires_in * 1000,
      };

      saveGoogleSheetsConfig(config);
      resolve(config);
    };
  });
}

// Sign out from Google
export function signOutGoogle(): void {
  const config: GoogleSheetsConfig = { isConnected: false };
  saveGoogleSheetsConfig(config);
}

// Get month name from date
function getMonthFromDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long' });
}

// Create or get spreadsheet for the year
export async function getOrCreateYearlySpreadsheet(
  year: number
): Promise<string> {
  try {
    const spreadsheetTitle = `Expense Tracker ${year}`;

    // Search for existing spreadsheet
    const searchResponse = await window.gapi.client.request({
      path: "https://www.googleapis.com/drive/v3/files",
      params: {
        q: `name='${spreadsheetTitle}' and mimeType='application/vnd.google-apps.spreadsheet'`,
        fields: "files(id, name)",
      },
    });

    if (searchResponse.result.files && searchResponse.result.files.length > 0) {
      return searchResponse.result.files[0].id;
    }

    // Create new spreadsheet
    const createResponse = await window.gapi.client.sheets.spreadsheets.create({
      properties: {
        title: spreadsheetTitle,
      },
      sheets: [
        {
          properties: {
            title: "January",
            gridProperties: {
              rowCount: 1000,
              columnCount: 10,
            },
          },
        },
      ],
    });

    const spreadsheetId = createResponse.result.spreadsheetId;

    // Add headers to January sheet
    await addHeadersToSheet(spreadsheetId, "January");

    return spreadsheetId;
  } catch (error) {
    console.error("Failed to create/get yearly spreadsheet:", error);
    throw new Error("Failed to access Google Sheets");
  }
}

// Get or create monthly sheet
export async function getOrCreateMonthlySheet(
  spreadsheetId: string,
  month: string
): Promise<void> {
  try {
    // Get existing sheets
    const response = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    const existingSheets =
      response.result.sheets?.map((sheet) => sheet.properties?.title) || [];

    if (!existingSheets.includes(month)) {
      // Create new sheet for the month
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requests: [
          {
            addSheet: {
              properties: {
                title: month,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 10,
                },
              },
            },
          },
        ],
      });

      // Add headers to the new sheet
      await addHeadersToSheet(spreadsheetId, month);
    }
  } catch (error) {
    console.error("Failed to create monthly sheet:", error);
    throw new Error("Failed to create monthly sheet");
  }
}

// Add headers to sheet
async function addHeadersToSheet(
  spreadsheetId: string,
  sheetName: string
): Promise<void> {
  const headers = [
    "Date",
    "Description",
    "Amount",
    "Type",
    "Category",
  ];

  await window.gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: `${sheetName}!A1:E1`,
    valueInputOption: "RAW",
    values: [headers],
  });

  // Format headers
  await window.gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId,
    requests: [
      {
        repeatCell: {
          range: {
            sheetId: await getSheetId(spreadsheetId, sheetName),
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 5,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
              textFormat: { bold: true },
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)",
        },
      },
    ],
  });
}

// Get sheet ID by name
async function getSheetId(
  spreadsheetId: string,
  sheetName: string
): Promise<number> {
  const response = await window.gapi.client.sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId,
  });

  const sheet = response.result.sheets?.find(
    (s) => s.properties?.title === sheetName
  );
  return sheet?.properties?.sheetId || 0;
}

// Save transactions to Google Sheets (organized by month based on transaction date)
export async function saveTransactionsToGoogleSheets(
  transactions: Transaction[],
  year: number,
  targetMonth?: string
): Promise<void> {
  try {
    const spreadsheetId = await getOrCreateYearlySpreadsheet(year);

    // Group transactions by month based on their date
    const transactionsByMonth = transactions.reduce((acc, transaction) => {
      const month = getMonthFromDate(transaction.date);
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);

    // If targetMonth is specified, only save to that month
    const monthsToProcess = targetMonth 
      ? { [targetMonth]: transactionsByMonth[targetMonth] || [] }
      : transactionsByMonth;

    // Process each month
    for (const [month, monthTransactions] of Object.entries(monthsToProcess)) {
      if (!monthTransactions || monthTransactions.length === 0) continue;

      await getOrCreateMonthlySheet(spreadsheetId, month);

      // Clear existing data (except headers)
      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: spreadsheetId,
        range: `${month}!A2:E`,
      });

      // Prepare data for Google Sheets
      const values = monthTransactions.map((transaction) => [
        transaction.date,
        transaction.description,
        transaction.amount,
        transaction.type === "credit" ? "Credit" : "Debit",
        transaction.category,
      ]);

      // Write data to sheet
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `${month}!A2:E${values.length + 1}`,
        valueInputOption: "RAW",
        values: values,
      });

      // Format amount column as currency
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: await getSheetId(spreadsheetId, month),
                startRowIndex: 1,
                endRowIndex: values.length + 1,
                startColumnIndex: 2,
                endColumnIndex: 3,
              },
              cell: {
                userEnteredFormat: {
                  numberFormat: {
                    type: "CURRENCY",
                    pattern: "₹#,##0.00",
                  },
                },
              },
              fields: "userEnteredFormat.numberFormat",
            },
          },
        ],
      });
    }
  } catch (error) {
    console.error("Failed to save transactions to Google Sheets:", error);
    throw new Error("Failed to save to Google Sheets");
  }
}

// Load transactions from Google Sheets (single month)
export async function loadTransactionsFromGoogleSheets(
  year: number,
  month: string
): Promise<Transaction[]> {
  try {
    const spreadsheetId = await getOrCreateYearlySpreadsheet(year);

    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${month}!A2:E`,
    });

    const rows = response.result.values || [];

    return rows.map((row, index) => ({
      id: `sheets-${year}-${month}-${index}`,
      date: row[0] || "",
      description: row[1] || "",
      amount: parseFloat(row[2]) || 0,
      type: (row[3]?.toLowerCase() === "credit" ? "credit" : "debit") as
        | "credit"
        | "debit",
      category: row[4] || "Miscellaneous",
      source: "manual" as "excel" | "csv" | "manual",
      isManual: true,
    }));
  } catch (error) {
    console.error("Failed to load transactions from Google Sheets:", error);
    return [];
  }
}

// Load transactions from multiple months
export async function loadTransactionsFromMultipleMonths(
  year: number,
  months: string[]
): Promise<Transaction[]> {
  try {
    const allTransactions: Transaction[] = [];
    
    for (const month of months) {
      const monthTransactions = await loadTransactionsFromGoogleSheets(year, month);
      allTransactions.push(...monthTransactions);
    }
    
    return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Failed to load transactions from multiple months:", error);
    return [];
  }
}

// Get available months for a year
export async function getAvailableMonths(year: number): Promise<string[]> {
  try {
    const spreadsheetId = await getOrCreateYearlySpreadsheet(year);

    const response = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    const sheets = response.result.sheets || [];
    return sheets.map((sheet) => sheet.properties?.title || "").filter(Boolean);
  } catch (error) {
    console.error("Failed to get available months:", error);
    return [];
  }
}

// Export transactions to Excel file (for local download)
export function exportTransactionsToExcel(
  transactions: Transaction[],
  filename: string
): void {
  const workbook = XLSX.utils.book_new();

  // Group transactions by month
  const transactionsByMonth = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = date.toLocaleDateString("en-US", { month: "long" });

    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Create a sheet for each month
  Object.entries(transactionsByMonth).forEach(([month, monthTransactions]) => {
    const data = [
      ["Date", "Description", "Amount", "Type", "Category"],
      ...monthTransactions.map((t) => [
        t.date,
        t.description,
        t.amount,
        t.type === "credit" ? "Credit" : "Debit",
        t.category,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, month);
  });

  // Download the file
  XLSX.writeFile(workbook, filename);
}

// Declare global types for Google API
declare global {
  interface Window {
    gapi: typeof any;
    google: typeof any;
  }
}