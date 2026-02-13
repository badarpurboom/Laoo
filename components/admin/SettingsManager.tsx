
import React, { useRef } from 'react';
import { useStore } from '../../store';
import { QRCodeSVG } from 'qrcode.react';
import ImageUploader from '../common/ImageUploader';

const SettingsManager: React.FC = () => {
   const { settings, aiConfig, paymentConfig, updateSettings, updateAIConfig, updatePaymentConfig, activeRestaurantId, restaurants } = useStore();
   const currentRestaurant = restaurants.find(r => r.id === activeRestaurantId);
   const publicUrl = `${window.location.origin}${window.location.pathname}#/r/${currentRestaurant?.slug || ''}`;
   const qrCodeRef = useRef<HTMLDivElement>(null);

   const downloadQRCode = () => {
      if (qrCodeRef.current) {
         const svgElement = qrCodeRef.current.querySelector('svg');
         if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            const downloadLink = document.createElement('a');
            downloadLink.href = svgUrl;
            downloadLink.download = `${settings.name || 'restaurant'}-qr-code.svg`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(svgUrl);
         }
      }
   };

   return (
      <div className="max-w-4xl mx-auto space-y-8">
         {/* Restaurant Info */}
         <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <i className="fas fa-store text-indigo-600"></i> Restaurant Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="col-span-full">
                  <div className="flex items-start gap-6">
                     <div className="w-40">
                        <ImageUploader
                           currentImage={settings.logoUrl}
                           onImageUploaded={(url) => updateSettings({ ...settings, logoUrl: url })}
                           label="Restaurant Logo"
                        />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-800 mt-2">Restaurant Logo</p>
                        <p className="text-xs text-slate-500">Upload a high-quality square image. This will be displayed on your digital menu and QR code.</p>
                     </div>
                  </div>
               </div>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Restaurant Name</label>
                     <input
                        type="text"
                        value={settings.name}
                        onChange={e => updateSettings({ ...settings, name: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GST/VAT Number</label>
                     <input
                        type="text"
                        value={settings.gstNumber}
                        onChange={e => updateSettings({ ...settings, gstNumber: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                     />
                  </div>
               </div>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Details</label>
                     <input
                        type="text"
                        value={settings.contact}
                        onChange={e => updateSettings({ ...settings, contact: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Open Status</label>
                     <div className="flex items-center gap-3">
                        <button
                           onClick={() => updateSettings({ ...settings, isOpen: !settings.isOpen })}
                           className={`relative w-12 h-6 rounded-full transition-colors ${settings.isOpen ? 'bg-green-500' : 'bg-slate-300'}`}
                        >
                           <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.isOpen ? 'left-7' : 'left-1'}`}></div>
                        </button>
                        <span className="text-sm font-medium text-slate-700">{settings.isOpen ? 'Accepting Orders' : 'Closed'}</span>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Order Configuration */}
         <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <i className="fas fa-cog text-orange-600"></i> Order Settings
            </h3>
            <div className="space-y-4">
               {/* Dine-in Toggle */}
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                     <h4 className="font-bold text-slate-800">Dine-in Orders</h4>
                     <p className="text-xs text-slate-500">Enable ordering from tables.</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <button
                        onClick={() => updateSettings({
                           ...settings,
                           orderPreferences: { ...settings.orderPreferences, dineIn: !settings.orderPreferences?.dineIn }
                        })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings.orderPreferences?.dineIn ? 'bg-green-500' : 'bg-slate-300'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.orderPreferences?.dineIn ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>
               </div>

               {/* Table Number Toggle (Only if Dine-in is active) */}
               {settings.orderPreferences?.dineIn && (
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 ml-8">
                     <div>
                        <h4 className="font-bold text-slate-800">Require Table Number</h4>
                        <p className="text-xs text-slate-500">Ask customers to enter their table number.</p>
                     </div>
                     <button
                        onClick={() => updateSettings({
                           ...settings,
                           orderPreferences: { ...settings.orderPreferences, requireTableNumber: !settings.orderPreferences?.requireTableNumber }
                        })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings.orderPreferences?.requireTableNumber ? 'bg-indigo-500' : 'bg-slate-300'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.orderPreferences?.requireTableNumber ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>
               )}

               {/* Takeaway Toggle */}
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                     <h4 className="font-bold text-slate-800">Takeaway / Pickup</h4>
                     <p className="text-xs text-slate-500">Enable self-pickup orders.</p>
                  </div>
                  <button
                     onClick={() => updateSettings({
                        ...settings,
                        orderPreferences: { ...settings.orderPreferences, takeaway: !settings.orderPreferences?.takeaway }
                     })}
                     className={`relative w-12 h-6 rounded-full transition-colors ${settings.orderPreferences?.takeaway ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.orderPreferences?.takeaway ? 'left-7' : 'left-1'}`}></div>
                  </button>
               </div>

               {/* Delivery Toggle */}
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                     <h4 className="font-bold text-slate-800">Home Delivery</h4>
                     <p className="text-xs text-slate-500">Enable delivery orders.</p>
                  </div>
                  <button
                     onClick={() => updateSettings({
                        ...settings,
                        orderPreferences: { ...settings.orderPreferences, delivery: !settings.orderPreferences?.delivery }
                     })}
                     className={`relative w-12 h-6 rounded-full transition-colors ${settings.orderPreferences?.delivery ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.orderPreferences?.delivery ? 'left-7' : 'left-1'}`}></div>
                  </button>
               </div>
            </div>
         </section>

         {/* Tax & Delivery Configuration */}
         <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <i className="fas fa-percentage text-blue-600"></i> Tax & Delivery Charges
            </h3>
            <div className="space-y-6">
               {/* GST Settings */}
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <div>
                        <h4 className="font-bold text-slate-800">GST / Tax</h4>
                        <p className="text-xs text-slate-500">Apply tax on item total.</p>
                     </div>
                     <div className="flex items-center gap-3">
                        {settings.taxEnabled && (
                           <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg">
                              <input
                                 type="number"
                                 value={settings.taxPercentage}
                                 onChange={(e) => updateSettings({ ...settings, taxPercentage: Number(e.target.value) })}
                                 className="w-12 bg-transparent text-right font-bold outline-none"
                              />
                              <span className="text-sm font-bold text-slate-600">%</span>
                           </div>
                        )}
                        <button
                           onClick={() => updateSettings({ ...settings, taxEnabled: !settings.taxEnabled })}
                           className={`relative w-12 h-6 rounded-full transition-colors ${settings.taxEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}
                        >
                           <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.taxEnabled ? 'left-7' : 'left-1'}`}></div>
                        </button>
                     </div>
                  </div>
               </div>

               <div className="h-px bg-slate-100"></div>

               {/* Delivery Charge Settings */}
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <div>
                        <h4 className="font-bold text-slate-800">Delivery Charges</h4>
                        <p className="text-xs text-slate-500">Apply fee on delivery orders.</p>
                     </div>
                     <button
                        onClick={() => updateSettings({ ...settings, deliveryChargesEnabled: !settings.deliveryChargesEnabled })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings.deliveryChargesEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.deliveryChargesEnabled ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>

                  {settings.deliveryChargesEnabled && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Standard Charge (₹)</label>
                           <input
                              type="number"
                              value={settings.deliveryCharges}
                              onChange={(e) => updateSettings({ ...settings, deliveryCharges: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-500"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Free Delivery Above (₹)</label>
                           <input
                              type="number"
                              value={settings.deliveryFreeThreshold}
                              onChange={(e) => updateSettings({ ...settings, deliveryFreeThreshold: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-500"
                              placeholder="e.g. 500"
                           />
                           <p className="text-[10px] text-slate-400 mt-1">Leave 0 to always charge.</p>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </section>

         {/* AI Configuration */}
         <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <i className="fas fa-brain text-purple-600"></i> AI Data Analyst Configuration
            </h3>
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Provider</label>
                     <select
                        value={aiConfig.provider}
                        onChange={(e) => updateAIConfig({ ...aiConfig, provider: e.target.value as 'openai' | 'gemini' })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                     >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI GPT-4o</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Model</label>
                     <select
                        value={aiConfig.model}
                        onChange={(e) => updateAIConfig({ ...aiConfig, model: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                     >
                        {aiConfig.provider === 'gemini' ? (
                           <>
                              <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                              <option value="gemini-3-pro-preview">gemini-3-pro-preview</option>
                              <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                           </>
                        ) : (
                           <>
                              <option value="gpt-4o">gpt-4o</option>
                              <option value="gpt-4-turbo">gpt-4-turbo</option>
                              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                           </>
                        )}
                     </select>
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Key</label>
                  <div className="relative">
                     <input
                        type="password"
                        value={aiConfig.apiKey}
                        onChange={(e) => updateAIConfig({ ...aiConfig, apiKey: e.target.value })}
                        placeholder={`Enter your ${aiConfig.provider === 'gemini' ? 'Google AI' : 'OpenAI'} API Key`}
                        className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-mono text-sm"
                     />
                     <div className="absolute right-3 top-2.5 text-slate-400">
                        <i className="fas fa-key"></i>
                     </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                     Your key is stored locally in your browser and used only for requests.
                  </p>
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Prompt</label>
                  <textarea
                     value={aiConfig.promptSystem}
                     onChange={e => updateAIConfig({ ...aiConfig, promptSystem: e.target.value })}
                     className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none h-24 text-sm"
                  ></textarea>
               </div>
            </div>
         </section>

         {/* Payment Gateway */}
         <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <i className="fas fa-credit-card text-emerald-600"></i> Payment Integrations
            </h3>
            <div className="space-y-4">
               <div className="p-4 border rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <i className="fab fa-stripe text-2xl"></i>
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-slate-800">Stripe Integration</h4>
                        <p className="text-xs text-slate-500">Credit/Debit cards, Apple Pay, Google Pay</p>
                     </div>
                  </div>
                  <button
                     onClick={() => updatePaymentConfig({ ...paymentConfig, stripeEnabled: !paymentConfig.stripeEnabled })}
                     className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${paymentConfig.stripeEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}
                  >
                     {paymentConfig.stripeEnabled ? 'Enabled' : 'Disabled'}
                  </button>
               </div>
               <div className="p-4 border rounded-xl flex items-center justify-between opacity-50 grayscale">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center text-white">
                        <i className="fas fa-wallet text-xl"></i>
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-slate-800">Razorpay Integration</h4>
                        <p className="text-xs text-slate-500">UPI, Net Banking, Wallets (Region Specific)</p>
                     </div>
                  </div>
                  <button disabled className="px-4 py-1.5 bg-slate-100 text-slate-400 rounded-full text-xs font-bold">Configure</button>
               </div>
            </div>
         </section>

         {/* Public Menu & QR Code */}
         <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <i className="fas fa-qrcode text-indigo-600"></i> Public Menu & QR Code
            </h3>
            <div className="flex flex-col md:flex-row gap-8 items-center">
               <div className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100" ref={qrCodeRef}>
                  <QRCodeSVG
                     value={publicUrl}
                     size={180}
                     level="H"
                     includeMargin={true}
                  />
               </div>
               <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                     <h4 className="font-bold text-slate-800">Your Menu is Public!</h4>
                     <p className="text-sm text-slate-500 mt-1">Customers can scan this QR code to view your menu and place orders instantly. No app download or login required.</p>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                     <button
                        onClick={downloadQRCode}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                     >
                        <i className="fas fa-download"></i> Download QR Code
                     </button>
                     <button
                        onClick={() => {
                           navigator.clipboard.writeText(publicUrl);
                           alert('Public link copied!');
                        }}
                        className="bg-white text-slate-700 px-6 py-2.5 rounded-xl font-bold text-sm border border-slate-200 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                     >
                        <i className="fas fa-copy"></i> Copy Public Link
                     </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                     <p className="text-[10px] font-mono text-slate-500 break-all">{publicUrl}</p>
                  </div>
               </div>
            </div>
         </section>
      </div>
   );
};

export default SettingsManager;
