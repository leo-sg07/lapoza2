
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl space-y-8 animate-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto text-3xl font-black">LZ</div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lapoza <span className="text-indigo-600">system</span></h1>
          <p className="text-slate-400 font-medium tracking-tight uppercase text-[10px] font-black">Hệ thống quản lý nhân sự 4.0</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 text-center">{error}</div>}
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tên đăng nhập</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username của bạn"
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] px-6 py-4 outline-none transition-all font-bold text-slate-700"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mật khẩu</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] px-6 py-4 outline-none transition-all font-bold text-slate-700"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-indigo-100 translate-y-2"
          >
            Đăng nhập hệ thống
          </button>
        </form>

        <div className="text-center">
           <p className="text-xs text-slate-300 font-medium italic">Lapoza system - Bảo mật đa lớp sinh trắc học</p>
        </div>
      </div>
    </div>
  );
};

export default Login;