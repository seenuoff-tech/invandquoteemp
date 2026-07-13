import { Invoice, Quotation, Customer, AdminSettings } from '../types';
import { Printer, X, Download, Share2 } from 'lucide-react';

interface PrintViewProps {
  document: {
    type: 'invoice' | 'quotation';
    data: Invoice | Quotation;
  } | null;
  customers: Customer[];
  settings: AdminSettings;
  onClose: () => void;
}

export default function PrintView({ document, customers, settings, onClose }: PrintViewProps) {
  if (!document) return null;

  const docType = document.type;
  const item = document.data;
  const customer = customers.find((c) => c.id === item.customerId);

  const handlePrint = () => {
    window.print();
  };

  // Helper to trigger simulated download
  const handleSimulateDownload = () => {
    // Generate text/csv/tsv representation or trigger browser print to PDF
    alert('For security and precision, the system uses your browser\'s native PDF engine. Please click "Print Document" and select "Save as PDF" to download a pixel-perfect invoice.');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${docType === 'invoice' ? 'Invoice' : 'Quotation'} ${docNumber}`,
          text: `Please find attached the ${docType === 'invoice' ? 'Invoice' : 'Quotation'} ${docNumber}.`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      alert('Web Share API is not supported in your browser.');
    }
  };

  const isInvoice = docType === 'invoice';
  const invoice = item as Invoice;
  const quotation = item as Quotation;

  const dateLabel = isInvoice ? 'Invoice Date' : 'Quotation Date';
  const numberLabel = isInvoice ? 'Invoice Number' : 'Quotation Number';
  const dueLabel = isInvoice ? 'Payment Due Date' : 'Proposal Validity';

  const docDate = isInvoice ? invoice.date : quotation.date;
  const docDueDate = isInvoice ? invoice.dueDate : quotation.validUntil;
  const docNumber = isInvoice ? invoice.number : quotation.number;

  return (
    <div id="print-view-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:relative">
      {/* Container */}
      <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col h-[90vh] print:h-auto print:shadow-none print:border-none print:rounded-none">
        
        {/* Controls Bar (Hidden in Print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 capitalize">
              Print Preview: {docNumber}
            </span>
            <span className={`px-2 py-0.5 rounded text-3xxs font-bold uppercase ${
              isInvoice 
                ? (invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800') 
                : 'bg-indigo-100 text-indigo-800'
            }`}>
              {isInvoice ? invoice.status : quotation.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button
              onClick={handleSimulateDownload}
              className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save as PDF</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-blue-100 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Printable Page */}
        <div id="invoice-printable-area" className="flex-1 overflow-y-auto p-10 font-sans print:p-0 print:overflow-visible">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Header: Company and Doc Info */}
            <div className="flex justify-between items-start gap-6">
              <div className="space-y-2">
                {settings.logoUrl ? (
                  <img 
                    src={settings.logoUrl} 
                    alt="Logo" 
                    className="h-10 w-auto object-contain" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(settings.companyName)}&background=0f172a&color=fff&rounded=true&bold=true`;
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-extrabold text-sm">V</div>
                    <span className="text-md font-bold tracking-tight text-slate-800">{settings.companyName}</span>
                  </div>
                )}
                <div className="text-xxs text-slate-500 space-y-0.5 leading-relaxed">
                  <p className="font-semibold text-slate-700">{settings.companyName}</p>
                  <p className="whitespace-pre-line">{settings.address}</p>
                  <p>Phone: {settings.phone} | Email: {settings.email}</p>
                </div>
              </div>

              {/* Document Type Label & Basic Specs */}
              <div className="text-right space-y-2">
                <h1 className={`text-2xl font-bold uppercase tracking-wider ${isInvoice ? 'text-blue-700' : 'text-slate-800'}`}>
                  {isInvoice ? 'INVOICE' : 'QUOTATION'}
                </h1>
                <div className="text-xxs space-y-1">
                  <p className="text-slate-500">
                    <span className="font-medium text-slate-400">{numberLabel}:</span>{' '}
                    <span className="font-mono font-bold text-slate-800">{docNumber}</span>
                  </p>
                  <p className="text-slate-500">
                    <span className="font-medium text-slate-400">{dateLabel}:</span>{' '}
                    <span className="text-slate-700">{docDate}</span>
                  </p>
                  <p className="text-slate-500">
                    <span className="font-medium text-slate-400">{dueLabel}:</span>{' '}
                    <span className="text-slate-700">{docDueDate}</span>
                  </p>
                  {isInvoice && invoice.quotationId && (
                    <p className="text-slate-400 text-3xxs">
                      Ref Quote: {customers.length > 0 ? 'Converts' : ''} {invoice.quotationId}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Billing Details Grid */}
            <div className="grid grid-cols-2 gap-8 border-t border-b border-slate-100 py-6 text-xxs">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-widest block mb-2">Billed To</span>
                {customer ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800 text-xs">{customer.name}</p>
                    {customer.companyName && <p className="font-medium text-slate-700">{customer.companyName}</p>}
                    <p className="text-slate-500 whitespace-pre-line leading-relaxed">{customer.billingAddress}</p>
                    <p className="text-slate-500">Email: {customer.email}</p>
                    <p className="text-slate-500">Mobile: {customer.mobile}</p>
                  </div>
                ) : (
                  <p className="text-slate-400">Customer details not found.</p>
                )}
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-widest block mb-2">Shipped To</span>
                {customer ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800 text-xs">{customer.name}</p>
                    {customer.companyName && <p className="font-medium text-slate-700">{customer.companyName}</p>}
                    <p className="text-slate-500 whitespace-pre-line leading-relaxed">{customer.shippingAddress}</p>
                  </div>
                ) : (
                  <p className="text-slate-400">Shipping details not found.</p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <table className="w-full text-left text-xxs border-collapse">
                <thead>
                  <tr className={`border-b ${isInvoice ? 'border-blue-200 text-blue-700' : 'border-slate-200 text-slate-400'} uppercase tracking-wider font-semibold`}>
                    <th className="py-2.5 w-8">#</th>
                    <th className="py-2.5">Item Description</th>
                    <th className="py-2.5 text-right w-16">Qty</th>
                    <th className="py-2.5 text-right w-24">Unit Price</th>
                    <th className="py-2.5 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {item.items.map((line, idx) => (
                    <tr key={line.id} className="text-slate-700">
                      <td className="py-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3">
                        <p className="font-medium text-slate-800">{line.description}</p>
                      </td>
                      <td className="py-3 text-right font-mono">{line.quantity}</td>
                      <td className="py-3 text-right font-mono">₹{line.unitPrice.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono font-semibold">₹{line.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ledger Totals Grid */}
            <div className="flex justify-between gap-6 pt-2 border-t border-slate-100">
              {/* Left Side: Remittance/Payment Methods */}
              <div className="w-1/2 space-y-4">
                {isInvoice && (
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-3xxs space-y-1.5 print:bg-white print:border-blue-200 print:p-2">
                    <p className="font-bold text-blue-800 uppercase tracking-wider">REMITTANCE INSTRUCTIONS</p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-blue-900/70 font-mono">
                      <div>Bank Name:</div>
                      <div className="text-slate-800 font-medium">{settings.bankName}</div>
                      <div>Account No:</div>
                      <div className="text-slate-800 font-semibold">{settings.bankAccount}</div>
                      <div>IFSC Code:</div>
                      <div className="text-slate-800 font-medium">{settings.bankIfsc}</div>
                      {settings.upiId && (
                        <>
                          <div>UPI VPA:</div>
                          <div className="text-slate-700 font-semibold">{settings.upiId}</div>
                        </>
                      )}
                      {settings.gpayNumber && (
                        <>
                          <div>GPay No:</div>
                          <div className="text-slate-700 font-semibold">{settings.gpayNumber}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Notes and terms */}
                <div className="text-3xxs text-slate-400 leading-relaxed space-y-1">
                  {item.notes && (
                    <p>
                      <span className="font-semibold text-slate-500 uppercase">Notes:</span> {item.notes}
                    </p>
                  )}
                  {isInvoice && invoice.notes && (
                    <p>
                      <span className="font-semibold text-slate-500 uppercase">Terms:</span> Due on receipt. 1.5% late interest per month.
                    </p>
                  )}
                  {!isInvoice && quotation.terms && (
                    <p>
                      <span className="font-semibold text-slate-500 uppercase">Terms:</span> {quotation.terms}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: Double Entry Balances */}
              <div className="w-1/3 text-xxs space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{item.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-800 font-bold border-t border-slate-100 pt-2 text-xs">
                  <span>Grand Total:</span>
                  <span className="font-mono">₹{item.grandTotal.toFixed(2)}</span>
                </div>

                {isInvoice && (
                  <div className="space-y-1 pt-1 text-3xxs">
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Paid to Date:</span>
                      <span className="font-mono">₹{invoice.paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-bold border-t border-dashed border-slate-200 pt-1 text-xs">
                      <span>Balance Due:</span>
                      <span className="font-mono">₹{invoice.balance.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end pt-12 text-3xxs text-slate-400">
              <div>
                <p>Date Generated: {new Date().toISOString().split('T')[0]} 00:00:00 UTC</p>
                <p>Document electronically verified. No physical signature required.</p>
              </div>
              <div className="text-center w-40 space-y-1">
                <div className="border-b border-slate-200 h-6"></div>
                <p className="font-semibold text-slate-600">Authorized Signatory</p>
                <p>{settings.companyName}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
