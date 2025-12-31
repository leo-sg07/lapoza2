
import React, { useState } from 'react';

interface ChangePasswordProps {
  onPasswordChange: (newPassword: string) => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ onPasswordChange, onCancel, showCancel = false }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    onPasswordChange(newPassword);
  };

  return (
    <div className="min-h-screen bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[200] fixed inset-0">
      <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl space-y-8 animate-in border border-slate-100">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto text-3xl font-black">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">Đổi mật khẩu</h1>
          <p className="text-slate-400 font-medium text-sm">Vui lòng thiết lập mật khẩu mới để bảo mật tài khoản.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 text-center">{error}</div>}
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mật khẩu mới</label>
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] px-6 py-4 outline-none transition-all font-bold text-slate-700 shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Xác nhận mật khẩu</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] px-6 py-4 outline-none transition-all font-bold text-slate-700 shadow-inner"
            />
          </div>

          <div className="flex gap-4 pt-4">
            {showCancel && (
              <button 
                type="button" 
                onClick={onCancel}
                className="flex-1 bg-slate-100 text-slate-500 font-black py-5 rounded-[2rem] transition-all hover:bg-slate-200"
              >
                Hủy
              </button>
            )}
            <button 
              type="submit" 
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-indigo-100 active:scale-95"
            >
              Cập nhật
            </button>
          </div>
        </form>
        
        <div className="text-center">
           <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Lapoza v1.0 Security Center</p>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
