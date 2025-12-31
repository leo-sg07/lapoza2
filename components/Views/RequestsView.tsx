
import React, { useState } from 'react';
import { LeaveRequest, User, Role } from '../../types';

interface RequestsViewProps {
  user: User;
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  users: User[];
}

const RequestsView: React.FC<RequestsViewProps> = ({ user, leaveRequests, setLeaveRequests, setUsers, users }) => {
  const [showModal, setShowModal] = useState(false);
  const [requestType, setRequestType] = useState<'LEAVE' | 'REGISTER'>('LEAVE');

  const isManager = user.role === Role.MANAGER || user.role === Role.ADMIN;
  
  // Hiển thị: Nếu là Admin thấy hết, Manager thấy branch mình, Staff thấy của mình
  const displayRequests = user.role === Role.ADMIN 
    ? leaveRequests 
    : isManager 
      ? leaveRequests.filter(r => r.branchId === user.branchId || r.userId === user.id)
      : leaveRequests.filter(r => r.userId === user.id);

  const daysMapping: {[key: string]: string} = {
    '0': 'CN', '1': 'Thứ 2', '2': 'Thứ 3', '3': 'Thứ 4', '4': 'Thứ 5', '5': 'Thứ 6', '6': 'Thứ 7'
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get('date') as string;
    const reason = formData.get('reason') as string;
    const d = new Date(dateStr);
    const dayOfWeek = daysMapping[d.getDay().toString()];

    // Added userAvatar to fix consistency in LeaveRequest interface usage
    const newRequest: LeaveRequest = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      date: dateStr,
      dayOfWeek: dayOfWeek,
      type: requestType,
      reason: reason,
      status: 'PENDING',
      branchId: user.branchId
    };

    setLeaveRequests(prev => [newRequest, ...prev]);
    setShowModal(false);
  };

  const handleApprove = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    alert(status === 'APPROVED' ? 'Đã phê duyệt.' : 'Đã từ chối.');
  };

  return (
    <div className="p-4 md:p-8 animate-in space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Trung tâm <span className="text-indigo-600">Yêu cầu</span></h2>
          <p className="text-sm text-slate-500 font-medium italic">Quản lý nghỉ phép và đăng ký ca làm việc.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          Gửi yêu cầu mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayRequests.length === 0 ? (
          <div className="col-span-full p-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white">
            <p className="text-slate-400 font-black italic uppercase tracking-widest text-sm">Chưa có yêu cầu nào</p>
          </div>
        ) : (
          displayRequests.map((req) => (
            <div key={req.id} className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] ${req.type === 'LEAVE' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {req.type === 'LEAVE' ? 'Xin Nghỉ' : 'Đăng ký'}
                </span>
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${
                  req.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 
                  req.status === 'APPROVED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {req.status}
                </span>
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <img src={req.userAvatar || users.find(u => u.id === req.userId)?.avatar} className="w-8 h-8 rounded-xl bg-slate-100" />
                  <p className="font-black text-slate-800 text-sm">{req.userName}</p>
                </div>
                <p className="text-sm font-black text-slate-700 tracking-tight">{req.date} ({req.dayOfWeek})</p>
                <p className="text-sm text-slate-600 leading-relaxed font-bold italic bg-slate-50 p-4 rounded-2xl">"{req.reason}"</p>
              </div>
              
              {isManager && req.status === 'PENDING' && req.userId !== user.id && (
                <div className="flex gap-3 mt-6">
                  <button onClick={() => handleApprove(req.id, 'APPROVED')} className="flex-1 bg-green-500 text-white py-3 rounded-xl text-xs font-black">Duyệt</button>
                  <button onClick={() => handleApprove(req.id, 'REJECTED')} className="flex-1 bg-white border border-red-100 text-red-500 py-3 rounded-xl text-xs font-black">Từ chối</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl animate-in p-10">
            <h3 className="text-3xl font-black text-slate-800 mb-6 tracking-tight italic">Gửi yêu cầu</h3>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Loại yêu cầu</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setRequestType('LEAVE')} className={`py-4 rounded-2xl border-2 font-black text-xs transition-all ${requestType === 'LEAVE' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>Xin nghỉ phép</button>
                  <button type="button" onClick={() => setRequestType('REGISTER')} className={`py-4 rounded-2xl border-2 font-black text-xs transition-all ${requestType === 'REGISTER' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>Đăng ký ca</button>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Chọn ngày</label>
                <input name="date" type="date" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-6 py-4 outline-none font-black text-slate-700" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Lý do</label>
                <textarea name="reason" rows={3} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-6 py-4 outline-none font-black text-sm" placeholder="Viết lý do cụ thể..."></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black">Hủy</button>
                <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-2xl">Gửi đơn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsView;