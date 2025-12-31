
import React, { useState, useMemo } from 'react';
// Added Assignment to the list of imports from types.ts
import { User, ShiftRecord, LeaveRequest, AppNotification, Regulation, Role, Branch, AttendanceStatus, Assignment } from '../../types';
import AttendanceModal from '../AttendanceModal';
import ShiftClosingForm from '../ShiftClosingForm';

interface AdminDashboardProps {
  user: User;
  logs: ShiftRecord[];
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  assignments: Assignment[];
  onAddNotification: (n: AppNotification) => void;
  notifications: AppNotification[];
  regulations: Regulation[];
  setRegulations: React.Dispatch<React.SetStateAction<Regulation[]>>;
  branches: Branch[];
  onAttendanceUpdate: (log: ShiftRecord) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, logs, leaveRequests, setLeaveRequests, assignments, onAddNotification, notifications, regulations, setRegulations, branches, onAttendanceUpdate 
}) => {
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [editingReg, setEditingReg] = useState<Regulation | null>(null);
  const [activeAttendance, setActiveAttendance] = useState<{ type: 'CHECK_IN' | 'CHECK_OUT', shiftId: string } | null>(null);
  const [showClosingForm, setShowClosingForm] = useState<string | null>(null);

  const todayDate = new Date().toISOString().split('T')[0];
  const userBranch = branches.find(b => b.id === user.branchId) || branches[0];

  const todayStats = useMemo(() => {
    const branchAssignments = assignments.filter(a => a.date === todayDate && (user.role === Role.ADMIN || user.branchId === branches.find(b => b.id === user.branchId)?.id));
    const totalScheduled = branchAssignments.length;
    const todayLogs = user.role === Role.ADMIN ? logs.filter(l => l.date === todayDate) : logs.filter(l => l.date === todayDate && l.branchId === user.branchId);
    const checkIns = todayLogs.filter(l => !!l.checkInTime).length;
    const closedShifts = todayLogs.filter(l => l.status === 'COMPLETED').length;
    const pendingApprovals = logs.filter(l => l.status === 'COMPLETED' && !l.isConfirmed && (user.role === Role.ADMIN || l.branchId === user.branchId)).length;

    return {
      totalScheduled,
      checkIns,
      closedShifts,
      pendingApprovals,
      attendanceRate: totalScheduled > 0 ? Math.round((checkIns / totalScheduled) * 100) : 0
    };
  }, [logs, assignments, todayDate, user, branches]);

  const handleCreateNotification = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      date: new Date().toLocaleDateString('vi-VN'),
      authorName: user.name,
      branchId: user.role === Role.MANAGER ? user.branchId : undefined
    };
    onAddNotification(newNotif);
    setShowNotifModal(false);
    alert("Đã đăng thông báo mới!");
  };

  const handleUpdateRegulation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    
    if (editingReg) {
      setRegulations(prev => prev.map(r => r.id === editingReg.id ? { 
        ...r, title, content, updatedAt: new Date().toLocaleDateString('vi-VN') 
      } : r));
    } else {
      const newReg: Regulation = {
        id: Date.now().toString(),
        title,
        content,
        updatedAt: new Date().toLocaleDateString('vi-VN')
      };
      setRegulations([newReg, ...regulations]);
    }
    setShowRegModal(false);
    setEditingReg(null);
  };

  const handleApproveRequest = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in pb-32">
      {/* Header Mobile Optimized */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight italic">Tổng quan <span className="text-indigo-600">Lapoza</span></h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNotifModal(true)} className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 active:scale-90 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </button>
          {user.role === Role.ADMIN && (
            <button onClick={() => { setEditingReg(null); setShowRegModal(true); }} className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </button>
          )}
        </div>
      </header>

      {/* Stats Cards - Grid 2 columns for Mobile */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Điểm danh</p>
          <p className="text-xl font-black text-slate-800">{todayStats.checkIns}/{todayStats.totalScheduled}</p>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
             <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${todayStats.attendanceRate}%` }}></div>
          </div>
        </div>
        <div className="bg-indigo-600 p-4 rounded-3xl shadow-lg shadow-indigo-100 text-white">
          <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Tỷ lệ</p>
          <p className="text-xl font-black">{todayStats.attendanceRate}%</p>
          <p className="text-[8px] font-bold opacity-60 mt-2 italic">Dữ liệu thực tế</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Đã chốt ca</p>
          <p className="text-xl font-black text-slate-800">{todayStats.closedShifts}</p>
        </div>
        <div className={`p-4 rounded-3xl border shadow-sm ${todayStats.pendingApprovals > 0 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-white border-slate-100 text-slate-400'}`}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-1">Đợi duyệt</p>
          <p className="text-xl font-black">{todayStats.pendingApprovals}</p>
        </div>
      </div>

      {/* Requests Section - Scrollable horizontally or simple card stack */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Yêu cầu chờ duyệt</h3>
        {leaveRequests.filter(r => r.status === 'PENDING').length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-6 text-center text-[10px] font-bold text-slate-400 uppercase">Trống</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x custom-scrollbar">
            {leaveRequests.filter(r => r.status === 'PENDING').map(req => (
              <div key={req.id} className="min-w-[240px] snap-center bg-white border border-slate-100 p-4 rounded-3xl shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <img src={req.userAvatar} className="w-8 h-8 rounded-lg" alt="" />
                  <div>
                    <p className="text-xs font-black text-slate-800">{req.userName}</p>
                    <p className="text-[8px] text-indigo-500 font-bold uppercase">{req.date}</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic line-clamp-2">"{req.reason}"</p>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveRequest(req.id, 'APPROVED')} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase">Duyệt</button>
                  <button onClick={() => handleApproveRequest(req.id, 'REJECTED')} className="flex-1 py-2 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase">Hủy</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Regulations List - Fixed display errors */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Quy định hiện hành</h3>
        <div className="space-y-3">
          {regulations.map(reg => (
            <div key={reg.id} className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-black text-slate-800 italic">{reg.title}</h4>
                <div className="flex gap-1">
                   <button onClick={() => { setEditingReg(reg); setShowRegModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                </div>
              </div>
              {/* Fix: whitespace-pre-wrap to handle newlines, break-words to handle long strings */}
              <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap break-words italic">{reg.content}</p>
              <p className="text-[8px] text-slate-300 font-bold uppercase mt-3">Cập nhật: {reg.updatedAt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Sheet Modal - Tối ưu cho Mobile */}
      {(showNotifModal || showRegModal) && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowNotifModal(false); setShowRegModal(false); }}></div>
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl relative z-10 animate-in p-8 sm:p-10 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 sm:hidden"></div>
            
            {showNotifModal ? (
              <>
                <h3 className="text-xl font-black text-slate-800 mb-6 italic">Đăng <span className="text-indigo-600">Thông báo</span> mới</h3>
                <form onSubmit={handleCreateNotification} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Tiêu đề ngắn</label>
                    <input name="title" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-5 py-4 outline-none font-bold text-sm" placeholder="VD: Lịch họp tháng 4..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nội dung chi tiết</label>
                    <textarea name="content" required rows={4} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-5 py-4 outline-none font-medium text-sm" placeholder="Nhập nội dung cần truyền tải..."></textarea>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowNotifModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs">Đóng</button>
                    <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-100">Đăng ngay</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3 className="text-xl font-black text-slate-800 mb-6 italic">{editingReg ? 'Sửa' : 'Thêm'} <span className="text-indigo-600">Quy định</span></h3>
                <form onSubmit={handleUpdateRegulation} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Tiêu đề quy định</label>
                    <input name="title" defaultValue={editingReg?.title} required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-5 py-4 outline-none font-bold text-sm" placeholder="VD: Quy trình chốt ca..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nội dung (hỗ trợ xuống dòng)</label>
                    <textarea name="content" defaultValue={editingReg?.content} required rows={6} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-5 py-4 outline-none font-medium text-sm" placeholder="1. Bước một...&#10;2. Bước hai..."></textarea>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowRegModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs">Đóng</button>
                    <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-100">Lưu dữ liệu</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
