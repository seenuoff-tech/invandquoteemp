import React, { useState, useEffect } from 'react';
import { Invoice, Quotation, Customer, AdminSettings } from '../types';
import { X, Copy, Check, Phone, MessageCircle, Download, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { generateDocumentPDF } from '../utils/pdfGenerator';

type DocType = 'invoice' | 'quotation';

interface WhatsAppShareModalProps {
  docType: DocType;
  doc: Invoice | Quotation;
  customers: Customer[];
  settings: AdminSettings;
  onClose: () => void;
}

// ── Build the WhatsApp message ───────────────────────────────────────────────
function buildMessage(
  docType: DocType,
  doc: Invoice | Quotation,
  customer: Customer | undefined,
  settings: AdminSettings
): string {
  const isInvoice = docType === 'invoice';
  const inv = doc as Invoice;
  const quot = doc as Quotation;

  const greeting = customer?.name ? `Hi *${customer.name}*,` : 'Hello,';
  const docLabel = isInvoice ? 'Invoice' : 'Quotation';
  const docNum = isInvoice ? inv.number : quot.number;
  const total = `₹${doc.grandTotal.toFixed(2)}`;

  let lines = [
    greeting,
    '',
    `📄 *${docLabel} — ${docNum}*`,
    `🏢 From: *${settings.companyName}*`,
    '',
    `📅 Date: ${doc.date || '—'}`,
  ];

  if (isInvoice) {
    lines.push(`⏰ Due Date: ${inv.dueDate || '—'}`);
    lines.push(`💰 Grand Total: *${total}*`);
    if (inv.balance > 0) {
      lines.push(`⚠️ Balance Due: *₹${inv.balance.toFixed(2)}*`);
    } else {
      lines.push(`✅ Status: *Fully Paid*`);
    }
  } else {
    lines.push(`📅 Valid Until: ${quot.validUntil || '—'}`);
    lines.push(`💰 Grand Total: *${total}*`);
    lines.push(`📋 Status: *${quot.status}*`);
  }

  // Item summary (top 3)
  if (doc.items && doc.items.length > 0) {
    lines.push('', '🛒 *Items:*');
    doc.items.slice(0, 3).forEach(item => {
      lines.push(`  • ${item.description} × ${item.quantity} — ₹${item.subtotal.toFixed(2)}`);
    });
    if (doc.items.length > 3) {
      lines.push(`  _...and ${doc.items.length - 3} more item(s)_`);
    }
  }

  // Payment details
  if (settings.upiId || settings.gpayNumber || settings.bankAccount) {
    lines.push('', '💳 *Payment Details:*');
    if (settings.upiId) lines.push(`  UPI: \`${settings.upiId}\``);
    if (settings.gpayNumber) lines.push(`  GPay: \`${settings.gpayNumber}\``);
    if (settings.bankAccount) {
      lines.push(`  Bank: ${settings.bankName || ''}`);
      lines.push(`  A/C: \`${settings.bankAccount}\``);
      if (settings.bankIfsc) lines.push(`  IFSC: \`${settings.bankIfsc}\``);
    }
  }

  if (doc.notes) {
    lines.push('', `📝 _${doc.notes}_`);
  }

  lines.push('', `Thank you for your business! 🙏`);
  if (settings.phone) lines.push(`📞 ${settings.phone}`);

  return lines.join('\n');
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function WhatsAppShareModal({
  docType, doc, customers, settings, onClose
}: WhatsAppShareModalProps) {
  const customer = customers.find(c => c.id === doc.customerId);
  const defaultPhone = customer?.mobile?.replace(/\D/g, '') || '';
  const docNum = docType === 'invoice' ? (doc as Invoice).number : (doc as Quotation).number;

  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [step, setStep] = useState<'compose' | 'sent'>('compose');

  useEffect(() => {
    setMessage(buildMessage(docType, doc, customer, settings));
  }, []);

  // Pre-generate PDF in background
  useEffect(() => {
    const gen = async () => {
      try {
        const blob = await generateDocumentPDF({ type: docType, data: doc }, customers, settings);
        setPdfBlob(blob);
        setPdfReady(true);
      } catch (e) {
        console.error('PDF pre-gen failed:', e);
      }
    };
    gen();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadPDF = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docNum}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      // Try native Web Share (works on Android/iOS Chrome)
      if (pdfBlob && navigator.canShare) {
        const file = new File([pdfBlob], `${docNum}.pdf`, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: docNum, text: message });
          setStep('sent');
          setLoading(false);
          return;
        }
      }

      // Desktop fallback: download PDF + open wa.me
      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docNum}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }

      const waUrl = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        : `https://web.whatsapp.com/`;
      window.open(waUrl, '_blank');
      setStep('sent');
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        // Fallback if share cancelled or errored
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
        setStep('sent');
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center shadow-md shadow-green-200">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Share via WhatsApp</h3>
              <p className="text-xs text-slate-400">{docNum} · {customer?.name || 'Unknown Client'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {step === 'sent' ? (
            /* ── Success State ── */
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 bg-[#25D366]/10 border-2 border-[#25D366]/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-[#25D366]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">WhatsApp Opened!</h4>
                <p className="text-sm text-slate-500 mt-1">
                  The PDF was downloaded and WhatsApp opened with the message pre-filled.
                  <br />Just attach the PDF and hit Send!
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1ebe5a] transition cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* ── Phone Number ── */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Recipient's WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="wa-phone-input"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 919876543210 (with country code)"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Include country code — e.g. <strong>91</strong> for India</p>
              </div>

              {/* ── PDF Status ── */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${pdfReady ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                {pdfReady ? (
                  <>
                    <Check className="w-4 h-4 shrink-0" />
                    <span>PDF ready — <strong>{docNum}.pdf</strong></span>
                    <button onClick={handleDownloadPDF} className="ml-auto flex items-center gap-1 text-xs font-semibold underline cursor-pointer">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Generating PDF…</span>
                  </>
                )}
              </div>

              {/* ── Message Preview ── */}
              <div>
                <button
                  onClick={() => setShowPreview(v => !v)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 cursor-pointer"
                >
                  <span>Message Preview</span>
                  {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showPreview && (
                  <div className="relative">
                    {/* WhatsApp bubble style */}
                    <div className="bg-[#f0fdf4] border border-[#25D366]/20 rounded-2xl rounded-tl-sm p-4 max-h-56 overflow-y-auto">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                        {message}
                      </pre>
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                )}

                {/* Editable textarea */}
                <div className="mt-2">
                  <label className="text-xs text-slate-400 mb-1 block">Edit message (optional)</label>
                  <textarea
                    id="wa-message-textarea"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10 resize-none font-mono text-slate-600"
                  />
                </div>
              </div>

              {/* ── How it works ── */}
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-600">How it works:</p>
                <p>📱 <strong>Mobile:</strong> PDF + message shared directly to WhatsApp</p>
                <p>💻 <strong>Desktop:</strong> PDF downloads → WhatsApp Web opens with message pre-filled → Attach PDF & Send</p>
              </div>
            </>
          )}
        </div>

        {/* ── Footer Actions ── */}
        {step !== 'sent' && (
          <div className="px-5 py-4 border-t border-slate-100 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="wa-send-btn"
              onClick={handleSend}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-md shadow-green-200 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send via WhatsApp
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
