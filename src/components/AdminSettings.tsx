import React, { useState } from 'react';
import { AdminSettings } from '../types';
import { Save, Settings, Landmark, FileText, CheckCircle, Lock, Upload, Image as ImageIcon, X } from 'lucide-react';

interface AdminSettingsProps {
  settings: AdminSettings;
  onSave: (settings: AdminSettings) => void;
}

export default function AdminSettingsPanel({ settings, onSave }: AdminSettingsProps) {
  const [formData, setFormData] = useState<AdminSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'taxRate' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof AdminSettings) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please upload a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [fieldName]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      setSaveSuccess(true);
      alert('Saved Successful');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to save settings: ' + (err.message || String(err)));
    }
  };

  return (
    <div id="admin-settings-container" className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Admin Settings</h1>
          <p className="text-sm text-slate-500">Configure your business profile, bank details, and invoice prefixes.</p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-sm animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>Settings updated successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Profile */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-medium border-b border-slate-50 pb-3">
            <Settings className="w-5 h-5 text-slate-400" />
            <span>Company Profile</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>



            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Company Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Logo URL (Optional)</label>
              <input
                type="text"
                name="logoUrl"
                value={formData.logoUrl || ''}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xxs text-slate-400 mt-1">Provide a URL to show your custom business logo on the invoice PDFs.</p>
            </div>
          </div>
        </div>

        {/* Bank & Payment Details */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-medium border-b border-slate-50 pb-3">
            <Landmark className="w-5 h-5 text-slate-400" />
            <span>Bank & UPI Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Account Number</label>
              <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">IFSC / Routing Code</label>
              <input
                type="text"
                name="bankIfsc"
                value={formData.bankIfsc}
                onChange={handleChange}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">UPI ID (Fast Payments)</label>
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                placeholder="e.g. company@upi"
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">GPay Number</label>
              <input
                type="text"
                name="gpayNumber"
                value={formData.gpayNumber || ''}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">GPay / UPI QR Code Image</label>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {formData.gpayQrUrl ? (
                  <div className="relative group shrink-0">
                    <img
                      src={formData.gpayQrUrl}
                      alt="GPay QR Preview"
                      className="w-24 h-24 object-contain rounded-lg bg-white p-1 border border-slate-200 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, gpayQrUrl: '' }))}
                      className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition cursor-pointer"
                      title="Remove QR Code"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon className="w-8 h-8 stroke-1" />
                    <span className="text-[10px] font-bold mt-1">No QR Code</span>
                  </div>
                )}

                <div className="space-y-2 flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <label className="bg-[#0439C5] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs inline-flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      <span>Upload QR Code Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'gpayQrUrl')}
                        className="hidden"
                      />
                    </label>
                    <span className="text-3xxs font-medium text-slate-400">PNG, JPG, WEBP (Max 5MB)</span>
                  </div>

                  <div>
                    <span className="text-3xxs text-slate-400 uppercase font-bold block mb-1">Or Enter Image URL:</span>
                    <input
                      type="text"
                      name="gpayQrUrl"
                      value={formData.gpayQrUrl || ''}
                      onChange={handleChange}
                      placeholder="https://domain.com/gpay-qr.png or paste image data URL"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xxs text-slate-400 mt-1">Upload your GPay / UPI QR Code image to automatically print it on invoice PDFs.</p>
            </div>
          </div>
        </div>

        {/* Prefix & Taxation */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-medium border-b border-slate-50 pb-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <span>Document & Tax Configurations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Invoice Prefix</label>
              <input
                type="text"
                name="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={handleChange}
                required
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Quotation Prefix</label>
              <input
                type="text"
                name="quotationPrefix"
                value={formData.quotationPrefix}
                onChange={handleChange}
                required
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>


          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-medium border-b border-slate-50 pb-3">
            <Lock className="w-5 h-5 text-slate-400" />
            <span>Security</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Leads PIN (4 digits)</label>
              <input
                type="password"
                name="leadsPin"
                value={formData.leadsPin || ''}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setFormData(prev => ({ ...prev, leadsPin: val }));
                }}
                maxLength={4}
                inputMode="numeric"
                placeholder="e.g. 1234"
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xxs text-slate-400 mt-1">4-digit PIN required to access the Leads section.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Accounts PIN (4 digits)</label>
              <input
                type="password"
                name="accountsPin"
                value={formData.accountsPin || ''}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setFormData(prev => ({ ...prev, accountsPin: val }));
                }}
                maxLength={4}
                inputMode="numeric"
                placeholder="e.g. 2807"
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xxs text-slate-400 mt-1">4-digit PIN required to access the Accounts section.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Client Pending PIN (4 digits)</label>
              <input
                type="password"
                name="pendingPaymentsPin"
                value={formData.pendingPaymentsPin || ''}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setFormData(prev => ({ ...prev, pendingPaymentsPin: val }));
                }}
                maxLength={6}
                inputMode="numeric"
                placeholder="e.g. 2025"
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
              <p className="text-xxs text-slate-400 mt-1">Security PIN required for Client Pending Payments section.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="save-settings-btn"
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
