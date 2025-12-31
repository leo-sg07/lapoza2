
import React, { useState, useMemo } from 'react';
import { User, ShiftRecord, LeaveRequest, Assignment, AppNotification, Regulation, Role, Branch, AttendanceStatus, ShiftClosingData } from '../../types';
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

  const managerShifts = useMemo(() => {
    if (user.role !== Role.MANAGER) return [];
    return assignments
      .filter(a => a.userId === user.id && a.date === todayDate)
      .map(a => {
        const logId = `s-${todayDate}-${user.id}-${a.shiftType}`;
        const existingLog = logs.find(l => l.id === logId);
        return existingLog || { id: logId, userId: user.id, userName: user.name, userAvatar: user.avatar, date: todayDate, type: a.shiftType, status: 'PENDING', branchId: user.branchId } as ShiftRecord;
      });
  }, [assignments, logs, user, todayDate]);

  const handleApproveRequest = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    alert(status === 'APPROVED' ? 'Đã phê duyệt yêu cầu.' : 'Đã từ chối yêu cầu.');
  };

  const handleCreateNotification = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      date: new Date().toISOString().split('T')[0],
      authorName: user.name,
      branchId: user.role === Role.MANAGER ? user.branchId : undefined
    };
    onAddNotification(newNotif);
    setShowNotifModal(false);
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

  const handleDeleteReg = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa quy định này?")) {
      setRegulations(prev => prev.filter(r => r.id !== id));
    }
  };

  const calculateStatus = (timeStr: string, shiftType: string, isCheckIn: boolean): AttendanceStatus => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const shift = userBranch.shifts[shiftType];
    const [sHours, sMinutes] = (isCheckIn ? shift.start : shift.end).split(':').map(Number);
    const nowMinutes = hours * 60 + minutes;
    const shiftMinutes = sHours * 60 + sMinutes;
    if (isCheckIn) return nowMinutes > shiftMinutes + 5 ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME;
    return nowMinutes < shiftMinutes ? AttendanceStatus.EARLY_LEAVE : AttendanceStatus.ON_TIME;
  };

  const handleAttendanceSuccess = (photo: string) => {
    if (!activeAttendance) return;
    const { type, shiftId } = activeAttendance;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const targetShift = managerShifts.find(s => s.id === shiftId);
    if (!targetShift) return;
    const status = calculateStatus(timeStr, targetShift.type, type === 'CHECK_IN');
    const updatedRecord = type === 'CHECK_IN' 
      ? { ...targetShift, checkInTime: timeStr, checkInPhoto: photo, checkInStatus: status } 
      : { ...targetShift, checkOutTime: timeStr, checkOutPhoto: photo, checkOutStatus: status };
    onAttendanceUpdate(updatedRecord);
    setActiveAttendance(null);
    if (type === 'CHECK_OUT') setShowClosingForm(shiftId);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in pb-20 overflow-y-auto max-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight italic">
            Tổng quan <span className="text-indigo-600">{user.role === Role.ADMIN ? 'Hệ thống' : 'Chi nhánh'}</span>
          </h1>
          <p className="text-slate-500 font-medium">Hôm nay: <span className="font-bold">{new Date().toLocaleDateString('vi-VN')}</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowNotifModal(true)} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Tạo thông báo</button>
          {user.role === Role.ADMIN && (
            <button onClick={() => { setEditingReg(null); setShowRegModal(true); }} className="bg-slate-800 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Thêm quy định</button>
          )}
        </div>
      </header>

      {user.role === Role.MANAGER && managerShifts.length > 0 && (
        <div className="bg-indigo-50 border-2 border-indigo-100 rounded-[3rem] p-8 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-indigo-600 uppercase text-xs tracking-[0.2em] italic">Lịch trực của Quản lý</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managerShifts.map(shift => (
                <div key={shift.id} className="bg-white border border-indigo-100 rounded-[2.5rem] p-6 flex flex-col shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                       <p className="text-sm font-black text-slate-800 italic">Ca {shift.type.split('_').pop()}</p>
                       <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">{shift.status}</span>
                    </div>
                    <div className="mt-auto">
                       {!shift.checkInTime ? (
                         <button onClick={() => setActiveAttendance({ type: 'CHECK_IN', shiftId: shift.id })} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Vào Ca</button>
                       ) : shift.status !== 'COMPLETED' ? (
                         <button onClick={() => setActiveAttendance({ type: 'CHECK_OUT', shiftId: shift.id })} className="w-full bg-slate-800 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Ra Ca & Chốt</button>
                       ) : <div className="text-center py-3 bg-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase">Hoàn thành</div>}
                    </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tỷ lệ điểm danh</p>
          <p className="text-3xl font-black text-slate-800">{todayStats.checkIns}/{todayStats.totalScheduled} <span className="text-xs font-bold text-indigo-500">({todayStats.attendanceRate}%)</span></p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ca đã chốt</p>
          <p className="text-3xl font-black text-slate-800">{todayStats.closedShifts}</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm border-amber-100 bg-amber-50/20">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Đợi duyệt đối soát</p>
          <p className="text-3xl font-black text-amber-600">{todayStats.pendingApprovals}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Quản lý Quy định & Hướng dẫn</h3>
            </div>
            <div className="divide-y divide-slate-100 p-4 space-y-4">
              {regulations.map((reg) => (
                <div key={reg.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-start group">
                  <div className="space-y-1">
                    <p className="font-black text-slate-800 text-sm tracking-tight">{reg.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 italic">{reg.content}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">Cập nhật: {reg.updatedAt}</p>
                  </div>
                  {user.role === Role.ADMIN && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingReg(reg); setShowRegModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDeleteReg(reg.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-6">Yêu cầu cần duyệt</h3>
            <div className="space-y-4">
              {leaveRequests.filter(r => r.status === 'PENDING').slice(0, 3).map(req => (
                <div key={req.id} className="p-5 bg-amber-50/30 border border-amber-100 rounded-3xl space-y-3">
                  <p className="text-sm font-bold text-slate-800">{req.userName}</p>
                  <p className="text-xs text-slate-500 italic">"{req.reason}"</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveRequest(req.id, 'APPROVED')} className="flex-1 py-2 text-[10px] font-black text-white bg-indigo-600 rounded-xl">Duyệt</button>
                    <button onClick={() => handleApproveRequest(req.id, 'REJECTED')} className="flex-1 py-2 text-[10px] font-black text-slate-400 bg-white border border-slate-100 rounded-xl">Hủy</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl animate-in p-10">
            <h3 className="text-2xl font-black text-slate-800 mb-8 italic">{editingReg ? 'Chỉnh sửa quy định' : 'Thêm quy định mới'}</h3>
            <form onSubmit={handleUpdateRegulation} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tiêu đề</label>
                <input name="title" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-bold" defaultValue={editingReg?.title} placeholder="VD: Nội quy chấm công" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nội dung</label>
                <textarea name="content" required rows={6} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-medium text-sm" defaultValue={editingReg?.content} placeholder="Nhập nội dung quy định..."></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setShowRegModal(false); setEditingReg(null); }} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black transition-all">Hủy</button>
                <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">Cập nhật nội dung</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
