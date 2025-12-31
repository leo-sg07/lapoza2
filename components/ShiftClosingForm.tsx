
import React, { useState } from 'react';
import { ShiftClosingData, DiscountDetail } from '../types';
import { formatCurrency, parseCurrency } from '../utils/formatUtils';

interface ShiftClosingFormProps {
  onSubmit: (data: ShiftClosingData) => void;
  onSkip: () => void;
}

const ShiftClosingForm: React.FC<ShiftClosingFormProps> = ({ onSubmit, onSkip }) => {
  const [formData, setFormData] = useState<ShiftClosingData>({
    totalBills: 0,
    totalTransfer: 0,
    totalCash: 0,
    totalDiscounts: 0,
    discountsDetails: [],
    openingBalance: 0,
    closingBalance: 0,
    incidents: '',
    customerFeedback: ''
  });

  const [newDiscount, setNewDiscount] = useState<DiscountDetail>({ billId: '', reason: '', amount: 0 });

  const handleAddDiscount = () => {
    if (newDiscount.billId && newDiscount.amount > 0) {
      setFormData(prev => ({
        ...prev,
        discountsDetails: [...prev.discountsDetails, newDiscount],
        totalDiscounts: prev.totalDiscounts + Number(newDiscount.amount)
      }));
      setNewDiscount({ billId: '', reason: '', amount: 0 });
    }
  };

  const handleNumberChange = (field: keyof ShiftClosingData, value: string) => {
    const num = parseCurrency(value);
    setFormData({ ...formData, [field]: num });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8 animate-in">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Báo Cáo Chốt Ca</h2>
            <button onClick={onSkip} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Tổng số bill</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={formatCurrency(formData.totalBills)}
                  onChange={(e) => handleNumberChange('totalBills', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Số tiền thực nhận đầu ca</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formatCurrency(formData.openingBalance)}
                  onChange={(e) => handleNumberChange('openingBalance', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Tổng doanh thu tiền mặt</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formatCurrency(formData.totalCash)}
                  onChange={(e) => handleNumberChange('totalCash', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Tổng doanh thu chuyển khoản</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formatCurrency(formData.totalTransfer)}
                  onChange={(e) => handleNumberChange('totalTransfer', e.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Tổng tiền mặt bàn giao</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formatCurrency(formData.closingBalance)}
                  onChange={(e) => handleNumberChange('closingBalance', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Chi tiết chiết khấu (Giảm giá)</label>
                <div className="space-y-2 mb-2 max-h-32 overflow-y-auto">
                   {formData.discountsDetails.map((d, i) => (
                     <div key={i} className="flex justify-between text-xs bg-indigo-50 p-2 rounded-lg text-indigo-700">
                       <span className="truncate mr-2 font-medium">#{d.billId} - {d.reason}</span>
                       <span className="font-bold shrink-0">{formatCurrency(d.amount)}đ</span>
                     </div>
                   ))}
                </div>
                <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex gap-2">
                    <input placeholder="Mã bill" className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2 py-2" 
                      value={newDiscount.billId} onChange={e => setNewDiscount({...newDiscount, billId: e.target.value})} />
                    <input type="text" placeholder="Số tiền" className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2 py-2"
                      value={formatCurrency(newDiscount.amount)} onChange={e => setNewDiscount({...newDiscount, amount: parseCurrency(e.target.value)})} />
                  </div>
                  <div className="flex gap-2">
                    <input placeholder="Lý do chiết khấu" className="flex-[3] text-xs bg-white border border-slate-200 rounded-lg px-2 py-2"
                      value={newDiscount.reason} onChange={e => setNewDiscount({...newDiscount, reason: e.target.value})} />
                    <button onClick={handleAddDiscount} className="flex-1 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Ghi chú & Phản hồi</label>
                <textarea rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  placeholder="Ghi nhận các sự cố hoặc phản hồi của khách..."
                  value={formData.incidents}
                  onChange={(e) => setFormData({...formData, incidents: e.target.value, customerFeedback: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button onClick={onSkip} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">
              Bỏ qua báo cáo
            </button>
            <button onClick={() => onSubmit(formData)} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
              Xác nhận chốt ca
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftClosingForm;
