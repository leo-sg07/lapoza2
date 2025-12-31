
import React, { useState, useMemo } from 'react';
import { User, ShiftRecord, LeaveRequest, Assignment, AppNotification, Regulation, Role, Branch, AttendanceStatus, ShiftClosingData } from '../../types';
import AttendanceModal from '../AttendanceModal';
import ShiftClosingForm from '../ShiftClosingForm';

interface AdminDashboardProps {
  user: User;
  logs: ShiftRecord[];
  // Fix: Corrected the type of leaveRequests from Dispatch to LeaveRequest[] array.
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
  const [activeAttendance, setActiveAttendance] = useState<{ type: 'CHECK_IN' | 'CHECK_OUT', shiftId: string } | null>(null);
  const [showClosingForm, setShowClosingForm] = useState<string | null>(null);

  const todayDate = new Date().toISOString().split('T')[0];
  const userBranch = branches.find(b => b.id === user.branchId) || branches[0];

  const usersMap: Record<string, any> = {
    'staff_1': { branchId: '1' },
    'manager_1': { branchId: '1' }
  };

  const todayStats = useMemo(() => {
    const branchAssignments = user.role === Role.MANAGER 
      ? assignments.filter(a => a.date === todayDate && usersMap[a.userId]?.branchId === user.branchId)
      : assignments.filter(a => a.date === todayDate);

    const totalScheduled = branchAssignments.length;
    
    const todayLogs = user.role === Role.MANAGER
      ? logs.filter(l => l.date === todayDate && l.branchId === user.branchId)
      : logs.filter(l => l.date === todayDate);

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
  }, [logs, assignments, todayDate, user]);

  const managerShifts = useMemo(() => {
    if (user.role !== Role.MANAGER) return [];
    return assignments
      .filter(a => a.userId === user.id && a.date === todayDate)
      .map(a => {
        const logId = `s-${todayDate}-${user.id}-${a.shiftType}`;
        const existingLog = logs.find(l => l.id === logId);
        return existingLog || { 
          id: logId, 
          userId: user.id, 
          userName: user.name, 
          userAvatar: user.avatar, 
          date: todayDate, 
          type: a.shiftType, 
          status: 'PENDING',
          branchId: user.branchId 
        } as ShiftRecord;
      });
  }, [assignments, logs, user, todayDate]);

  const recentLogs = logs.filter(l => user.role === Role.ADMIN || l.branchId === user.branchId).slice(0, 10);
  const pendingRequests = leaveRequests.filter(r => r.status === 'PENDING' && (user.role === Role.ADMIN || r.branchId === user.branchId)).slice(0, 5);

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
    const newReg: Regulation = {
      id: Date.now().toString(),
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      updatedAt: new Date().toLocaleDateString('vi-VN')
    };
    setRegulations([newReg, ...regulations]);
    setShowRegModal(false);
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

  const handleClosingSubmit = (data: ShiftClosingData) => {
    const targetShift = managerShifts.find(s => s.id === showClosingForm);
    if (targetShift) onAttendanceUpdate({ ...targetShift, closingData: data, status: 'COMPLETED' as const });
    setShowClosingForm(null);
    alert('Manager chốt ca thành công!');
  };

  const handleSkipClosing = () => {
    const targetShift = managerShifts.find(s => s.id === showClosingForm);
    if (targetShift) {
      // Mark as COMPLETED even without closing data
      onAttendanceUpdate({ ...targetShift, status: 'COMPLETED' as const });
    }
    setShowClosingForm(null);
    alert('Đã bỏ qua báo cáo. Ca làm việc vẫn được ghi nhận hoàn thành.');
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
          <button 
            onClick={() => setShowNotifModal(true)}
            className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100"
          >
            Tạo thông báo
          </button>
          {user.role === Role.ADMIN && (
            <button 
              onClick={() => setShowRegModal(true)}
              className="bg-slate-800 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            >
              Cập nhật quy định
            </button>
          )}
        </div>
      </header>

      {/* Manager's Own Attendance Section */}
      {user.role === Role.MANAGER && managerShifts.length > 0 && (
        <div className="bg-indigo-50 border-2 border-indigo-100 rounded-[3rem] p-8 shadow-sm animate-in">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-indigo-600 uppercase text-xs tracking-[0.2em] italic">Lịch trực của Quản lý hôm nay</h3>
              <div className="bg-white px-3 py-1 rounded-full text-[9px] font-black text-indigo-500 shadow-sm uppercase tracking-widest">{userBranch.name}</div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managerShifts.map(shift => {
                const config = userBranch.shifts[shift.type];
                return (
                  <div key={shift.id} className="bg-white border border-indigo-100 rounded-[2.5rem] p-6 flex flex-col shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                       <p className="text-sm font-black text-slate-800 italic">{config.name} ({config.start} - {config.end})</p>
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${shift.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{shift.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                       <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">In</p>
                          <p className="font-black text-slate-800 text-xs">{shift.checkInTime || '--:--'}</p>
                       </div>
                       <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Out</p>
                          <p className="font-black text-slate-800 text-xs">{shift.checkOutTime || '--:--'}</p>
                       </div>
                    </div>
                    <div className="mt-auto">
                       {!shift.checkInTime ? (
                         <button onClick={() => setActiveAttendance({ type: 'CHECK_IN', shiftId: shift.id })} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Vào Ca</button>
                       ) : shift.status !== 'COMPLETED' ? (
                         <button onClick={() => setActiveAttendance({ type: 'CHECK_OUT', shiftId: shift.id })} className="w-full bg-slate-800 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Ra Ca & Chốt</button>
                       ) : (
                         <div className="text-center py-3 bg-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">Đã hoàn thành</div>
                       )}
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tỷ lệ điểm danh</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-slate-800">{todayStats.checkIns}/{todayStats.totalScheduled}</p>
            <p className="text-xs font-bold text-indigo-500 mb-1">({todayStats.attendanceRate}%)</p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${todayStats.attendanceRate}%` }}></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ca đã chốt hôm nay</p>
          <p className="text-3xl font-black text-slate-800">{todayStats.closedShifts}</p>
          <div className="flex items-center gap-1 mt-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Cập nhật trực tiếp</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm border-amber-100 bg-amber-50/20">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Đợi duyệt đối soát</p>
          <p className="text-3xl font-black text-amber-600">{todayStats.pendingApprovals}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-3 italic">Dữ liệu tài chính chưa xác nhận</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Tổng nhân sự hôm nay</p>
          <p className="text-3xl font-black">{todayStats.totalScheduled}</p>
          <p className="text-[10px] font-bold mt-3 opacity-80 uppercase tracking-tighter italic">Theo lịch điều phối</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Attendance Activity */}
          <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs tracking-widest">Hoạt động Điểm danh mới nhất</h3>
              <span className="text-[9px] bg-indigo-50 text-indigo-600 font-black px-3 py-1 rounded-full uppercase tracking-widest">Live</span>
            </div>
            <div className="divide-y divide-slate-100">
              {recentLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-bold italic text-sm">Chưa có hoạt động điểm danh nào hôm nay.</div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <img src={log.userAvatar} className="w-10 h-10 rounded-xl border border-slate-200" alt="avatar" />
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{log.userName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{log.type} • {log.checkInTime || '--:--'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${log.checkInStatus === 'ON_TIME' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {log.checkInStatus || 'PENDING'}
                       </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Pending Requests */}
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm">
            <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs tracking-widest mb-6 italic">Yêu cầu cần duyệt</h3>
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <p className="text-slate-400 text-xs italic text-center py-4">Không có yêu cầu chờ duyệt</p>
              ) : (
                pendingRequests.map(req => (
                  <div key={req.id} className="p-5 bg-amber-50/30 border border-amber-100 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                      <img src={req.userAvatar} className="w-10 h-10 rounded-2xl bg-white shadow-sm" alt="avatar" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{req.userName}</p>
                        <span className="text-[9px] font-black text-amber-600 uppercase italic">Chờ phê duyệt</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed italic">"{req.reason}"</p>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleApproveRequest(req.id, 'APPROVED')} className="flex-1 py-3 text-[10px] font-black text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">Duyệt</button>
                      <button onClick={() => handleApproveRequest(req.id, 'REJECTED')} className="flex-1 py-3 text-[10px] font-black text-slate-500 bg-white border border-slate-100 rounded-xl">Từ chối</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {activeAttendance && <AttendanceModal type={activeAttendance.type} onClose={() => setActiveAttendance(null)} onSuccess={handleAttendanceSuccess} branch={userBranch} />}
      {showClosingForm && <ShiftClosingForm onSubmit={handleClosingSubmit} onSkip={handleSkipClosing} />}

      {/* Modals for Notifications & Regulations */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl animate-in p-10">
            <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight italic">Tạo thông báo mới</h3>
            <form onSubmit={handleCreateNotification} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tiêu đề</label>
                <input name="title" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="VD: Thông báo nghỉ lễ..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nội dung</label>
                <textarea name="content" required rows={4} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-medium text-sm" placeholder="Viết nội dung thông báo..."></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowNotifModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black transition-all">Hủy</button>
                <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">Đăng thông báo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl animate-in p-10">
            <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight italic">Cập nhật Quy định</h3>
            <form onSubmit={handleUpdateRegulation} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tiêu đề quy định</label>
                <input name="title" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-bold" defaultValue="Nội quy chung" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nội dung chi tiết</label>
                <textarea name="content" required rows={6} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-medium text-sm" placeholder="Mô tả các nội quy..."></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowRegModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black transition-all">Hủy</button>
                <button type="submit" className="flex-[2] py-5 bg-slate-800 text-white rounded-2xl font-black shadow-xl transition-all">Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
