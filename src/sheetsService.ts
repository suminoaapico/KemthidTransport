import { 
  Customer, Driver, Vehicle, Employee, TransportJob, 
  DailyExpense, CreditIncome, Invoice, Receipt, PartnerPayment, 
  WithholdingTaxRecord, PayrollRecord 
} from './types';

// Let's declare our default Spreadsheet ID.
// The user provided: https://docs.google.com/spreadsheets/d/1jLTU3yLzlzYXSa2yJVvOIbhrR3o2g6UICmhcqJz25JQ/edit?usp=sharing
export const DEFAULT_SPREADSHEET_ID = "1jLTU3yLzlzYXSa2yJVvOIbhrR3o2g6UICmhcqJz25JQ";

interface LocalDataState {
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  employees: Employee[];
  jobs: TransportJob[];
  expenses: DailyExpense[];
  incomes: CreditIncome[];
  invoices: Invoice[];
  receipts: Receipt[];
  partnerPayments: PartnerPayment[];
  withholdingTaxes: WithholdingTaxRecord[];
  payroll: PayrollRecord[];
}

const DEFAULT_LOCAL_STATE: LocalDataState = {
  customers: [],
  drivers: [],
  vehicles: [],
  employees: [],
  jobs: [],
  expenses: [],
  incomes: [],
  invoices: [],
  receipts: [],
  partnerPayments: [],
  withholdingTaxes: [],
  payroll: []
};

// Key name for local Storage
const LS_KEY = "khemthit_logistics_data";

export function loadLocalData(): LocalDataState {
  const saved = localStorage.getItem(LS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Check if it is the old mock data containing CUST-001 from the template setting
      if (parsed.customers && parsed.customers.some((c: any) => c.id === 'CUST-001' && c.name.includes('คอนเทนเนอร์ บลู บูล'))) {
        // Discard cached mock data to force a clean slate from Supabase
        localStorage.removeItem(LS_KEY);
        return DEFAULT_LOCAL_STATE;
      }
      return { ...DEFAULT_LOCAL_STATE, ...parsed };
    } catch {
      return DEFAULT_LOCAL_STATE;
    }
  }
  return DEFAULT_LOCAL_STATE;
}

export function saveLocalData(data: LocalDataState) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

/**
 * Google Sheets Integration Helper Actions
 */
export async function testSpreadsheetAccess(spreadsheetId: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.ok;
  } catch (err) {
    console.error("Error verifying spreadsheet access:", err);
    return false;
  }
}

/**
 * Synchronize local data arrays into Google Sheets
 * If sheets are missing, it attempts to generate them to build out the database worksheets.
 */
export async function syncToGoogleSheets(spreadsheetId: string, token: string, state: LocalDataState): Promise<boolean> {
  try {
    // 1. Get existing sheet list
    const metaResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!metaResponse.ok) {
      throw new Error("Unable to read Spreadsheet structure");
    }

    const metaData = await metaResponse.json();
    const existingTitles: string[] = metaData.sheets.map((s: any) => s.properties.title);

    // List of worksheets we want to exist
    const requiredSheets = [
      "Customers", "Drivers", "Vehicles", "Employees",
      "Transport_Jobs", "Daily_Expenses", "Credit_Income",
      "Invoice", "Receipt", "Partner_Payment", "Withholding_Tax", "Payroll"
    ];

    const sheetsToCreate = requiredSheets.filter(title => !existingTitles.includes(title));

    // If worksheet creation is needed, call batchUpdate
    if (sheetsToCreate.length > 0) {
      const requests = sheetsToCreate.map(title => ({
        addSheet: { properties: { title } }
      }));

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requests })
      });
    }

    // 2. Perform writing/syncing
    // We will batch-write values for all sheets to avoid triggering rate limits
    const dataToWrite = [
      {
        range: "Customers!A1:G",
        values: [
          ["CustomerID", "CustomerName", "Company", "Phone", "LineID", "CreditTerm", "Address"],
          ...state.customers.map(c => [c.id, c.name, c.company, c.phone, c.line, c.creditTerm, c.address])
        ]
      },
      {
        range: "Drivers!A1:G",
        values: [
          ["DriverID", "DriverName", "Phone", "LicenseNo", "ExpiryDate", "VehicleLicense", "Status"],
          ...state.drivers.map(d => [d.id, d.name, d.phone, d.licenseNo, d.expiryDate, d.vehicleLicense, d.status])
        ]
      },
      {
        range: "Vehicles!A1:G",
        values: [
          ["LicensePlate", "VehicleType", "Brand", "Year", "ActExpiry", "InsExpiry", "Status"],
          ...state.vehicles.map(v => [v.licensePlate, v.type, v.brand, v.year, v.actExpiry, v.insExpiry, v.status])
        ]
      },
      {
        range: "Employees!A1:G",
        values: [
          ["EmployeeID", "EmployeeName", "Position", "Department", "Phone", "Salary", "StartDate"],
          ...state.employees.map(e => [e.id, e.name, e.position, e.department, e.phone, e.salary, e.startDate])
        ]
      },
      {
        range: "Transport_Jobs!A1:N",
        values: [
          ["JobNo", "Date", "CustomerID", "CustomerName", "Origin", "Destination", "VehicleLicense", "DriverName", "VehicleType", "BookingNo", "Shipper", "ContainersJson", "TotalAmount", "Status"],
          ...state.jobs.map(j => [j.jobNo, j.date, j.customerId, j.customerName, j.origin, j.destination, j.vehicleLicense, j.driverName, j.vehicleType, j.bookingNo, j.shipper, JSON.stringify(j.containers), j.totalAmount, j.status])
        ]
      },
      {
        range: "Daily_Expenses!A1:I",
        values: [
          ["ID", "Date", "Type", "Description", "VehicleLicense", "DriverName", "Amount", "Note", "BillType"],
          ...state.expenses.map(e => [e.id, e.date, e.type, e.description, e.vehicleLicense, e.driverName, e.amount, e.note, e.billType])
        ]
      },
      {
        range: "Credit_Income!A1:G",
        values: [
          ["ID", "CustomerName", "BillingDate", "CreditTerms", "DueDate", "Amount", "Status"],
          ...state.incomes.map(i => [i.id, i.customerName, i.billingDate, i.creditTerms, i.dueDate, i.amount, i.status])
        ]
      },
      {
        range: "Invoice!A1:P",
        values: [
          ["InvoiceNo", "Date", "CustomerID", "CustomerName", "JobNo", "InvoiceType", "BookingNo", "Shipper", "ContainersJson", "AdvanceItemsJson", "Subtotal", "WithholdingTax", "VatAmount", "GrandTotal", "TotalText", "Status"],
          ...state.invoices.map(inv => [
            inv.invoiceNo, inv.date, inv.customerId, inv.customerName, inv.jobNo, inv.invoiceType, inv.bookingNo, inv.shipper,
            JSON.stringify(inv.containers), JSON.stringify(inv.advanceItems), inv.subtotal, inv.withholdingTax, inv.vatAmount, inv.grandTotal, inv.totalText, inv.status
          ])
        ]
      },
      {
        range: "Receipt!A1:G",
        values: [
          ["ReceiptNo", "Date", "InvoiceNo", "CustomerName", "Amount", "PaymentMethod", "ReceiptType"],
          ...state.receipts.map(r => [r.receiptNo, r.date, r.invoiceNo, r.customerName, r.amount, r.paymentMethod, r.receiptType])
        ]
      },
      {
        range: "Partner_Payment!A1:I",
        values: [
          ["ID", "Date", "PartnerName", "JobNo", "PaymentType", "Revenue", "ExpensesDeduction", "NetPaid", "Status"],
          ...state.partnerPayments.map(p => [p.id, p.date, p.partnerName, p.jobNo, p.paymentType, p.revenue, p.expensesDeduction, p.netPaid, p.status])
        ]
      },
      {
        range: "Withholding_Tax!A1:H",
        values: [
          ["TaxID", "Date", "PayeeName", "TaxIDNumber", "BaseAmount", "Rate", "TaxAmount", "Type"],
          ...state.withholdingTaxes.map(w => [w.id, w.date, w.payeeName, w.taxIDNumber, w.baseAmount, w.rate, w.taxAmount, w.type])
        ]
      },
      {
        range: "Payroll!A1:K",
        values: [
          ["ID", "EmployeeId", "EmployeeName", "Role", "PayDate", "Salary", "OT", "Bonus", "Deduction", "NetSalary", "Status"],
          ...state.payroll.map(pr => [pr.id, pr.employeeId, pr.employeeName, pr.role, pr.payDate, pr.salary, pr.ot, pr.bonus, pr.deduction, pr.netSalary, pr.status])
        ]
      }
    ];

    // Clear and write using values:batchUpdate
    const clearRanges = requiredSheets.map(title => `${title}!A1:Z500`);
    
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ranges: clearRanges })
    });

    const writeResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: dataToWrite
      })
    });

    return writeResponse.ok;
  } catch (err) {
    console.error("Sheets Sync Error:", err);
    return false;
  }
}

/**
 * Fetch and import data from a connected Google Sheets
 * If sheets are empty or default values are not present, it loads local state.
 */
export async function loadFromGoogleSheets(spreadsheetId: string, token: string): Promise<LocalDataState | null> {
  try {
    const requiredSheets = [
      "Customers", "Drivers", "Vehicles", "Employees",
      "Transport_Jobs", "Daily_Expenses", "Credit_Income",
      "Invoice", "Receipt", "Partner_Payment", "Withholding_Tax", "Payroll"
    ];

    const ranges = requiredSheets.map(sheet => `${sheet}!A2:Z500`);
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges.map(encodeURIComponent).join("&")}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Sheets fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    const valueRanges = data.valueRanges || [];

    // Parse values back to typescript objects
    const state: Partial<LocalDataState> = {};

    requiredSheets.forEach((sheet, idx) => {
      const rows = valueRanges[idx]?.values || [];
      
      switch (sheet) {
        case "Customers":
          state.customers = rows.map((r: any) => ({
            id: r[0] || "",
            name: r[1] || "",
            company: r[2] || "",
            phone: r[3] || "",
            line: r[4] || "",
            creditTerm: parseInt(r[5]) || 0,
            address: r[6] || ""
          }));
          break;
        case "Drivers":
          state.drivers = rows.map((r: any) => ({
            id: r[0] || "",
            name: r[1] || "",
            phone: r[2] || "",
            licenseNo: r[3] || "",
            expiryDate: r[4] || "",
            vehicleLicense: r[5] || "",
            status: r[6] as any || "Available"
          }));
          break;
        case "Vehicles":
          state.vehicles = rows.map((r: any) => ({
            licensePlate: r[0] || "",
            type: r[1] || "",
            brand: r[2] || "",
            year: r[3] || "",
            actExpiry: r[4] || "",
            insExpiry: r[5] || "",
            status: r[6] as any || "Available"
          }));
          break;
        case "Employees":
          state.employees = rows.map((r: any) => ({
            id: r[0] || "",
            name: r[1] || "",
            position: r[2] || "",
            department: r[3] || "",
            phone: r[4] || "",
            salary: parseFloat(r[5]) || 0,
            startDate: r[6] || ""
          }));
          break;
        case "Transport_Jobs":
          state.jobs = rows.map((r: any) => ({
            jobNo: r[0] || "",
            date: r[1] || "",
            customerId: r[2] || "",
            customerName: r[3] || "",
            origin: r[4] || "",
            destination: r[5] || "",
            vehicleLicense: r[6] || "",
            driverName: r[7] || "",
            vehicleType: r[8] || "",
            bookingNo: r[9] || "",
            shipper: r[10] || "",
            containers: r[11] ? JSON.parse(r[11]) : [],
            totalAmount: parseFloat(r[12]) || 0,
            status: r[13] as any || "รอดำเนินการ"
          }));
          break;
        case "Daily_Expenses":
          state.expenses = rows.map((r: any) => ({
            id: r[0] || "",
            date: r[1] || "",
            type: r[2] as any || "อื่นๆ",
            description: r[3] || "",
            vehicleLicense: r[4] || "",
            driverName: r[5] || "",
            amount: parseFloat(r[6]) || 0,
            note: r[7] || "",
            billType: r[8] as any || "Normal"
          }));
          break;
        case "Credit_Income":
          state.incomes = rows.map((r: any) => ({
            id: r[0] || "",
            customerName: r[1] || "",
            billingDate: r[2] || "",
            creditTerms: parseInt(r[3]) || 0,
            dueDate: r[4] || "",
            amount: parseFloat(r[5]) || 0,
            status: r[6] as any || "ยังไม่ถึงกำหนด"
          }));
          break;
        case "Invoice":
          state.invoices = rows.map((r: any) => ({
            invoiceNo: r[0] || "",
            date: r[1] || "",
            customerId: r[2] || "",
            customerName: r[3] || "",
            jobNo: r[4] || "",
            invoiceType: r[5] as any || "Transport",
            bookingNo: r[6] || "",
            shipper: r[7] || "",
            containers: r[8] ? JSON.parse(r[8]) : [],
            advanceItems: r[9] ? JSON.parse(r[9]) : [],
            subtotal: parseFloat(r[10]) || 0,
            withholdingTax: parseFloat(r[11]) || 0,
            vatAmount: parseFloat(r[12]) || 0,
            grandTotal: parseFloat(r[13]) || 0,
            totalText: r[14] || "",
            status: r[15] as any || "ยังไม่จ่าย"
          }));
          break;
        case "Receipt":
          state.receipts = rows.map((r: any) => ({
            receiptNo: r[0] || "",
            date: r[1] || "",
            invoiceNo: r[2] || "",
            customerName: r[3] || "",
            amount: parseFloat(r[4]) || 0,
            paymentMethod: r[5] as any || "โอนเงิน",
            receiptType: r[6] as any || "Transport"
          }));
          break;
        case "Partner_Payment":
          state.partnerPayments = rows.map((r: any) => ({
            id: r[0] || "",
            date: r[1] || "",
            partnerName: r[2] || "",
            jobNo: r[3] || "",
            paymentType: r[4] as any || "PAY_PARTNER",
            revenue: parseFloat(r[5]) || 0,
            expensesDeduction: parseFloat(r[6]) || 0,
            netPaid: parseFloat(r[7]) || 0,
            status: r[8] as any || "ยังไม่ได้เคลียร์"
          }));
          break;
        case "Withholding_Tax":
          state.withholdingTaxes = rows.map((r: any) => ({
            id: r[0] || "",
            date: r[1] || "",
            payeeName: r[2] || "",
            taxIDNumber: r[3] || "",
            baseAmount: parseFloat(r[4]) || 0,
            rate: parseFloat(r[5]) || 0,
            taxAmount: parseFloat(r[6]) || 0,
            type: r[7] as any || "Transportation"
          }));
          break;
        case "Payroll":
          state.payroll = rows.map((r: any) => ({
            id: r[0] || "",
            employeeId: r[1] || "",
            employeeName: r[2] || "",
            role: r[3] as any || "Staff",
            payDate: r[4] || "",
            salary: parseFloat(r[5]) || 0,
            ot: parseFloat(r[6]) || 0,
            bonus: parseFloat(r[7]) || 0,
            deduction: parseFloat(r[8]) || 0,
            netSalary: parseFloat(r[9]) || 0,
            status: r[10] as any || "Unpaid"
          }));
          break;
      }
    });

    // Check if everything is completely empty (e.g., brand new sheet)
    const isTotallyEmpty = 
      (!state.customers || state.customers.length === 0) &&
      (!state.jobs || state.jobs.length === 0);

    if (isTotallyEmpty) {
      return DEFAULT_LOCAL_STATE;
    }

    // Fill missing items with empty arrays
    return {
      customers: state.customers || [],
      drivers: state.drivers || [],
      vehicles: state.vehicles || [],
      employees: state.employees || [],
      jobs: state.jobs || [],
      expenses: state.expenses || [],
      incomes: state.incomes || [],
      invoices: state.invoices || [],
      receipts: state.receipts || [],
      partnerPayments: state.partnerPayments || [],
      withholdingTaxes: state.withholdingTaxes || [],
      payroll: state.payroll || []
    };
  } catch (err) {
    console.error("Error loading worksheets from Sheets API:", err);
    return null;
  }
}
