import { Invoice, Customer, EmployeeSalary, AccountEntry, Quotation, ManualPendingEntry } from '../types';

/**
 * Generic Excel / CSV file generator
 */
export function exportToExcel(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Invoices to Excel
 */
export function exportInvoicesToExcel(invoices: Invoice[], customers: Customer[]) {
  const headers = ['Invoice Number', 'Customer Name', 'Company Name', 'Issue Date', 'Due Date', 'Subtotal (INR)', 'Tax Amount (INR)', 'Grand Total (INR)', 'Paid Amount (INR)', 'Balance (INR)', 'Status'];
  const rows = invoices.map((inv) => {
    const cust = customers.find((c) => c.id === inv.customerId);
    return [
      inv.number,
      cust?.name || 'Unknown',
      cust?.companyName || '',
      inv.date,
      inv.dueDate,
      inv.subtotal.toFixed(2),
      (inv.taxAmount || 0).toFixed(2),
      inv.grandTotal.toFixed(2),
      inv.paidAmount.toFixed(2),
      inv.balance.toFixed(2),
      inv.status,
    ];
  });
  exportToExcel(`Invoices_Export_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}

/**
 * Export Customers to Excel
 */
export function exportCustomersToExcel(customers: Customer[], invoices: Invoice[]) {
  const headers = ['Customer Name', 'Company Name', 'Mobile', 'Email', 'Billing Address', 'Invoices Count', 'Total Invoiced (INR)', 'Total Paid (INR)', 'Outstanding Balance (INR)', 'Created At'];
  const rows = customers.map((c) => {
    const clientInvoices = invoices.filter((i) => i.customerId === c.id);
    const totalBilled = clientInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
    const totalPaid = clientInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
    const totalPending = totalBilled - totalPaid;
    return [
      c.name,
      c.companyName || '',
      c.mobile || '',
      c.email || '',
      c.billingAddress || '',
      clientInvoices.length,
      totalBilled.toFixed(2),
      totalPaid.toFixed(2),
      totalPending.toFixed(2),
      c.createdAt || '',
    ];
  });
  exportToExcel(`Customers_Directory_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}

/**
 * Export Employee Salaries to Excel
 */
export function exportSalariesToExcel(salaries: EmployeeSalary[]) {
  const headers = ['Employee Name', 'Month', 'Base Salary (INR)', 'Paid Amount (INR)', 'Balance Amount (INR)', 'Payment Status', 'Paid Date', 'Payment Method', 'Notes'];
  const rows = salaries.map((s) => [
    s.employeeName,
    s.month,
    s.salaryAmount.toFixed(2),
    s.paidAmount.toFixed(2),
    s.balanceAmount.toFixed(2),
    s.status,
    s.paidDate || '-',
    s.paymentMethod || 'Bank Transfer',
    s.notes || '',
  ]);
  exportToExcel(`Employee_Salaries_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}

/**
 * Export Accounts Income & Expense to Excel
 */
export function exportAccountsToExcel(accounts: AccountEntry[]) {
  const headers = ['Date', 'Type (Income/Expense)', 'Category', 'Amount (INR)', 'Description', 'Created At'];
  const rows = accounts.map((a) => [
    a.date,
    a.type.toUpperCase(),
    a.category,
    a.amount.toFixed(2),
    a.description || '',
    a.createdAt || '',
  ]);
  exportToExcel(`Accounts_Ledger_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}

/**
 * Export Quotations to Excel
 */
export function exportQuotationsToExcel(quotations: Quotation[], customers: Customer[]) {
  const headers = ['Quotation Number', 'Customer Name', 'Date', 'Valid Until', 'Subtotal (INR)', 'Tax Amount (INR)', 'Grand Total (INR)', 'Status'];
  const rows = quotations.map((q) => {
    const cust = customers.find((c) => c.id === q.customerId);
    return [
      q.number,
      cust?.name || 'Unknown',
      q.date,
      q.validUntil,
      q.subtotal.toFixed(2),
      (q.taxAmount || 0).toFixed(2),
      q.grandTotal.toFixed(2),
      q.status,
    ];
  });
  exportToExcel(`Quotations_Export_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}

/**
 * Export Client Pending Balances to Excel
 */
export function exportClientPendingsToExcel(
  invoices: Invoice[],
  customers: Customer[],
  manualPendings: ManualPendingEntry[]
) {
  const headers = ['Client Name', 'Company Name', 'Mobile', 'Total Billed / Record (INR)', 'Total Paid (INR)', 'Pending Balance (INR)', 'Status'];
  
  // Group invoices & manual pendings
  const map = new Map<string, { name: string; company: string; mobile: string; total: number; paid: number; pending: number; isOverdue: boolean }>();

  customers.forEach((c) => {
    map.set(c.id, { name: c.name, company: c.companyName || '', mobile: c.mobile || '', total: 0, paid: 0, pending: 0, isOverdue: false });
  });

  const todayStr = new Date().toISOString().split('T')[0];

  invoices.forEach((inv) => {
    let entry = map.get(inv.customerId);
    if (!entry) {
      entry = { name: `Client #${inv.customerId.slice(-4)}`, company: '', mobile: '', total: 0, paid: 0, pending: 0, isOverdue: false };
      map.set(inv.customerId, entry);
    }
    entry.total += inv.grandTotal;
    entry.paid += inv.paidAmount;
    const bal = inv.balance > 0 ? inv.balance : (inv.grandTotal - inv.paidAmount);
    if (inv.status !== 'Paid' && bal > 0) {
      entry.pending += bal;
      if (inv.dueDate < todayStr || inv.status === 'Overdue') entry.isOverdue = true;
    }
  });

  manualPendings.forEach((m) => {
    const key = m.customerId || `manual-${m.clientName.toLowerCase().trim()}`;
    let entry = map.get(key);
    if (!entry) {
      entry = { name: m.clientName, company: 'Manual Record', mobile: m.mobile || '', total: 0, paid: 0, pending: 0, isOverdue: false };
      map.set(key, entry);
    }
    entry.total += m.totalAmount;
    entry.paid += m.paidAmount;
    if (m.balanceAmount > 0) {
      entry.pending += m.balanceAmount;
      if (m.dueDate && m.dueDate < todayStr) entry.isOverdue = true;
    }
  });

  const rows = Array.from(map.values())
    .filter((e) => e.pending > 0)
    .map((e) => [
      e.name,
      e.company,
      e.mobile,
      e.total.toFixed(2),
      e.paid.toFixed(2),
      e.pending.toFixed(2),
      e.isOverdue ? 'Overdue' : 'Pending',
    ]);

  exportToExcel(`Client_Pending_Balances_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}
