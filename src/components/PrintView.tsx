import { Invoice, Quotation, Customer, AdminSettings } from '../types';
import { Printer, X, Download, Share2 } from 'lucide-react';
import { generateDocumentPDF } from '../utils/pdfGenerator';

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

  const logoImg = '/logo.png';

  const docType = document.type;
  const item = document.data;
  const customer = customers.find((c) => c.id === item.customerId);

  const handlePrint = () => {
    window.print();
  };

  const handleSimulateDownload = async () => {
    try {
      const blob = await generateDocumentPDF(document, customers, settings);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${docNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF download:', err);
      alert('Failed to download PDF');
    }
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
  const numberLabel = isInvoice ? 'Invoice No' : 'Quotation No';
  const dueLabel = isInvoice ? 'Due Date' : 'Valid Until';

  const docDate = isInvoice ? invoice.date : quotation.date;
  const docDueDate = isInvoice ? invoice.dueDate : quotation.validUntil;
  const docNumber = isInvoice ? invoice.number : quotation.number;

  return (
    <div id="print-view-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:relative print:block">
      {/* Container */}
      <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full overflow-hidden">
        
        {/* Controls Bar (Sticky top, Hidden in Print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0 print:hidden sticky top-0 z-10">
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
              className="flex items-center gap-1.5 bg-rose-600 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-rose-700 transition cursor-pointer shadow-sm"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Professional Printable A4 Page Container */}
        <div id="invoice-printable-area" className="flex-1 overflow-y-auto p-8 bg-white text-slate-900 font-['Times_New_Roman',_Times,_serif] font-bold print:p-0 print:overflow-visible">
          <div className="max-w-[210mm] mx-auto space-y-5 bg-white print:max-w-none print:w-full">
            
            {/* Header section: Logo & Document Title */}
            <div className="flex justify-between items-start pb-6 border-b border-slate-200">
              <div>
                <img 
                  src={logoImg} 
                  alt="Skenetic Digital" 
                  className="h-14 w-auto object-contain mb-3" 
                />
                <div className="text-xs text-slate-600 space-y-0.5 font-normal">
                  <p className="font-bold text-slate-900 text-sm">{settings.companyName || 'Skenetic Digital'}</p>
                  <p className="whitespace-pre-line leading-relaxed">{settings.address || '77 Innovation Blvd, Tech Park, Austin, TX 78701'}</p>
                  <p>Mobile: {settings.phone} | Email: {settings.email}</p>
                </div>
              </div>

              <div className="text-right space-y-2">
                <h1 className="text-3xl font-extrabold uppercase tracking-tight text-blue-900">
                  {isInvoice ? 'INVOICE' : 'QUOTATION'}
                </h1>
                <div className="text-xs text-slate-700 space-y-1">
                  <p><span className="font-semibold text-slate-500">{numberLabel}:</span> <span className="font-mono font-bold text-slate-900">{docNumber}</span></p>
                  <p><span className="font-semibold text-slate-500">{dateLabel}:</span> <span className="font-mono text-slate-800">{docDate}</span></p>
                </div>
              </div>
            </div>

            {/* Address Grid: From & Billed To */}
            <div className="grid grid-cols-2 gap-8 py-2 text-xs">
              <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-100">
                <span className="font-bold text-blue-900 uppercase tracking-wider block mb-2 text-xxs">FROM</span>
                <div className="space-y-1 text-slate-700">
                  <p className="font-bold text-slate-900">{settings.companyName || 'Skenetic Digital'}</p>
                  <p className="whitespace-pre-line">{settings.address}</p>
                  <p><span className="font-medium text-slate-500">Phone:</span> {settings.phone}</p>
                  <p><span className="font-medium text-slate-500">Email:</span> {settings.email}</p>
                </div>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-100">
                <span className="font-bold text-blue-900 uppercase tracking-wider block mb-2 text-xxs">BILLED TO</span>
                {customer ? (
                  <div className="space-y-1 text-slate-700">
                    <p className="font-bold text-slate-900">{customer.name}</p>
                    {customer.companyName && <p className="font-medium text-slate-800">{customer.companyName}</p>}
                    <p className="whitespace-pre-line">{customer.billingAddress}</p>
                    <p><span className="font-medium text-slate-500">Mobile:</span> {customer.mobile}</p>
                    <p><span className="font-medium text-slate-500">Email:</span> {customer.email}</p>
                  </div>
                ) : (
                  <p className="text-slate-400">Customer details not available.</p>
                )}
              </div>
            </div>

            {/* Line Items Table: Exact Header required: s.no | item description | Qty | price | total */}
            <div className="overflow-hidden border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3 px-4 w-14 text-center border-r border-blue-800">S.No</th>
                    <th className="py-3 px-4 border-r border-blue-800">Item Description</th>
                    <th className="py-3 px-4 text-center w-20 border-r border-blue-800">Qty</th>
                    <th className="py-3 px-4 text-right w-28 border-r border-blue-800">Price</th>
                    <th className="py-3 px-4 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {item.items.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-center font-mono text-slate-500 border-r border-slate-200">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 border-r border-slate-200">{line.description}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-700 border-r border-slate-200">{line.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 border-r border-slate-200">₹{line.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{line.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Milestone Payment Terms Table */}
            {item.milestones && item.milestones.length > 0 && (
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-indigo-900 uppercase tracking-wider text-xxs">MILESTONE PAYMENT SCHEDULE (PROJECT STAGES)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {item.milestones.map((m, idx) => (
                    <div key={m.id || idx} className="bg-white p-2.5 rounded border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-800 text-xxs">{m.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{m.percentage}% of Grand Total</div>
                      </div>
                      <div className="font-mono font-bold text-indigo-700 text-xs ml-2">
                        ₹{(m.amount || (item.grandTotal * m.percentage) / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ledger Totals & Bank/GPay Details */}
            <div className="flex justify-between items-start gap-8 pt-2">
              
              {/* Bank Account Details & GPay QR */}
              <div className="w-7/12 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs flex justify-between items-center gap-4">
                <div className="space-y-1.5 flex-1">
                  <p className="font-bold text-blue-900 uppercase tracking-wider text-xxs">BANK ACCOUNT & PAYMENT DETAILS</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700 font-mono">
                    <div className="text-slate-500 font-sans">Bank Name:</div>
                    <div className="font-semibold text-slate-900">{settings.bankName || 'Silicon Valley Trust'}</div>
                    
                    <div className="text-slate-500 font-sans">Account No:</div>
                    <div className="font-bold text-slate-900">{settings.bankAccount || '987654321098'}</div>
                    
                    <div className="text-slate-500 font-sans">IFSC Code:</div>
                    <div className="font-semibold text-slate-900">{settings.bankIfsc || 'SVT0001234'}</div>
                    
                    <div className="text-slate-500 font-sans">GPay No:</div>
                    <div className="font-bold text-emerald-700">{settings.gpayNumber || settings.phone || 'N/A'}</div>

                    {settings.upiId && (
                      <>
                        <div className="text-slate-500 font-sans">UPI ID:</div>
                        <div className="font-semibold text-slate-900">{settings.upiId}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* GPay QR Code Box */}
                <div className="text-center shrink-0 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <img
                    src={settings.gpayQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${settings.upiId || settings.gpayNumber || 'company@upi'}&pn=${encodeURIComponent(settings.companyName)}&am=${item.grandTotal}&cu=INR`)}`}
                    alt="GPay QR Code"
                    className="w-20 h-20 object-contain mx-auto"
                  />
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider block mt-1">SCAN TO PAY (GPAY / UPI)</span>
                </div>
              </div>

              {/* Grand Total Breakdown */}
              <div className="w-5/12 text-xs space-y-2.5">
                <div className="flex justify-between text-slate-600 px-2">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">₹{item.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-900 font-bold border-t border-b border-slate-300 py-2.5 px-2 text-sm bg-slate-50 rounded">
                  <span>Grand Total:</span>
                  <span className="font-mono text-blue-900">₹{item.grandTotal.toFixed(2)}</span>
                </div>

                {isInvoice && (
                  <div className="space-y-1.5 px-2 pt-1">
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Paid Amount:</span>
                      <span className="font-mono">₹{invoice.paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold text-xs pt-1 border-t border-slate-200">
                      <span>Balance Due:</span>
                      <span className="font-mono">₹{invoice.balance.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Rating & Feedback Banner */}
            {(settings.googleReviewUrl || settings.feedbackUrl) && (
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between bg-amber-50/60 p-3 rounded-lg border border-amber-200/80 text-xs">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span className="text-amber-500 font-extrabold text-sm">⭐⭐⭐⭐⭐</span>
                    <span>Rate Our Service & Feedback</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Your feedback helps us serve you better!</p>
                </div>
                <div className="flex items-center gap-2">
                  {settings.googleReviewUrl && (
                    <a
                      href={settings.googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-amber-500 hover:bg-amber-600 text-white text-3xxs font-extrabold px-3 py-1.5 rounded-md transition shadow-2xs no-underline"
                    >
                      Google 5-Star Review
                    </a>
                  )}
                  {settings.feedbackUrl && (
                    <a
                      href={settings.feedbackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-800 hover:bg-slate-900 text-white text-3xxs font-extrabold px-3 py-1.5 rounded-md transition shadow-2xs no-underline"
                    >
                      Give Feedback
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Clean Professional Footer Note */}
            {item.notes && (
              <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
                <span className="font-bold text-slate-700 uppercase tracking-wide">Notes / Terms:</span> {item.notes}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
