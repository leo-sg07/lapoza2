
import React, { useState, useMemo } from 'react';
import { User, ShiftRecord, ShiftClosingData, Branch, AttendanceStatus, Assignment, AppNotification, Regulation } from '../../types';
import AttendanceModal from '../AttendanceModal';
import ShiftClosingForm from '../ShiftClosingForm';

interface StaffDashboardProps {
  user: User;
  branches: Branch[];
  onAttendanceUpdate: (log: ShiftRecord) => void;
  attendanceLogs: ShiftRecord[];
  assignments: Assignment[];
  notifications: AppNotification[];
  regulations: Regulation[];
  onConfirmRegulation: (regId: string) => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ 
  user, branches, onAttendanceUpdate, attendanceLogs, assignments, notifications, regulations, onConfirmRegulation 
}) => {
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); 
    return d.toISOString().split('T')[0];
  });
  const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]);

  const todayDate = new Date().toISOString().split('T')[0];
  const userBranch = branches.find(b => b.id === user.branchId) || branches[0];

  const assignedShifts = useMemo(() => {
    return assignments
      .filter(a => a.userId === user.id && a.date === todayDate)
      .map(a => {
        const logId = `s-${todayDate}-${user.id}-${a.shiftType}`;
        const existingLog = attendanceLogs.find(l => l.id === logId);
        return existingLog || { id: logId, userId: user.id, userName: user.name, userAvatar: user.avatar, date: todayDate, type: a.shiftType, status: 'PENDING', branchId: user.branchId } as ShiftRecord;
      });
  }, [assignments, attendanceLogs, user, todayDate]);

  const stats = useMemo(() => {
    const logsInRange = attendanceLogs.filter(l => l.userId === user.id && l.date >= filterStartDate && l.date <= filterEndDate && l.status === 'COMPLETED');
    const workingDays = new Set(logsInRange.map(l => l.date)).size;
    
    let totalMinutes = 0;
    logsInRange.forEach(l => {
      if (l.checkInTime && l.checkOutTime) {
        const [sh, sm] = l.checkInTime.split(':').map(Number);
        const [eh, em] = l.checkOutTime.split(':').map(Number);
        totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
      }
    });

    return {
      workingDays,
      totalHours: (totalMinutes / 60).toFixed(1)
    };
  }, [attendanceLogs, user.id, filterStartDate, filterEndDate]);
  
  const [activeAttendance, setActiveAttendance] = useState<{ type: 'CHECK_IN' | 'CHECK_OUT', shiftId: string } | null>(null);
  const [showClosingForm, setShowClosingForm] = useState<string | null>(null);

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
    const targetShift = assignedShifts.find(s => s.id === shiftId);
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
    const targetShift = assignedShifts.find(s => s.id === showClosingForm);
    if (targetShift) onAttendanceUpdate({ ...targetShift, closingData: data, status: 'COMPLETED' as const });
    setShowClosingForm(null);
    alert('Chốt ca thành công!');
  };

  const handleSkipClosing = () => {
    const targetShift = assignedShifts.find(s => s.id === showClosingForm);
    if (targetShift) {
      // Mark as COMPLETED even without closing data
      onAttendanceUpdate({ ...targetShift, status: 'COMPLETED' as const });
    }
    setShowClosingForm(null);
    alert('Đã bỏ qua báo cáo. Ca làm việc vẫn được ghi nhận hoàn thành.');
  };

  const userNotifications = notifications.filter(n => !n.branchId || n.branchId === user.branchId);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in pb-24 max-h-screen overflow-y-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight italic">
            Dashboard <span className="text-indigo-600">Lapoza</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">Chào mừng <span className="font-bold text-slate-800">{user.name}</span>!</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
           <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Chi nhánh hiện tại</p>
              <p className="text-xs font-black text-indigo-600 uppercase">{userBranch.name}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Thông báo Section */}
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-125 duration-700"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                   </div>
                   <h3 className="text-xl font-black italic tracking-tight">Thông báo quan trọng</h3>
                </div>
                <div className="space-y-4 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                   {userNotifications.length === 0 ? (
                     <p className="text-indigo-100 italic text-sm">Hiện chưa có thông báo mới.</p>
                   ) : (
                     userNotifications.map(n => (
                       <div key={n.id} className="bg-white/10 p-5 rounded-3xl border border-white/10 backdrop-blur-sm">
                          <div className="flex justify-between items-start mb-1">
                             <p className="font-black text-sm">{n.title}</p>
                             <span className="text-[9px] opacity-60 font-bold">{n.date}</span>
                          </div>
                          <p className="text-xs text-indigo-50 leading-relaxed font-medium">{n.content}</p>
                       </div>
                     ))
                   )}
                </div>
             </div>
          </div>

          {/* Performance Statistics */}
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="font-black text-slate-800 italic uppercase text-xs tracking-widest">Hiệu suất tháng</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Khoảng: {filterStartDate} → {filterEndDate}</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="bg-transparent text-[10px] font-black text-slate-600 outline-none" />
                <span className="text-slate-300">→</span>
                <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="bg-transparent text-[10px] font-black text-slate-600 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày công</p>
                <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.workingDays}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng giờ</p>
                <p className="text-3xl font-black text-indigo-600 tracking-tighter">{stats.totalHours}</p>
              </div>
            </div>
          </div>

          {/* Ca trực hôm nay */}
          <div className="space-y-4">
            <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] ml-4 italic">Ca làm việc hôm nay</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {assignedShifts.length === 0 ? (
                 <div className="md:col-span-2 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-16 text-center">
                   <p className="text-slate-400 font-black italic uppercase tracking-widest text-xs">Bạn không có lịch trực hôm nay</p>
                 </div>
               ) : (
                 assignedShifts.map(shift => {
                   const config = userBranch.shifts[shift.type];
                   return (
                     <div key={shift.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">{config.name}</div>
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${shift.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{shift.status}</span>
                        </div>
                        <p className="text-xl font-black text-slate-800 mb-8 italic">{config.start} - {config.end}</p>
                        <div className="grid grid-cols-2 gap-4 flex-1">
                           <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center items-center">
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Check-in</p>
                              <p className="font-black text-slate-800">{shift.checkInTime || '--:--'}</p>
                           </div>
                           <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center items-center">
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Check-out</p>
                              <p className="font-black text-slate-800">{shift.checkOutTime || '--:--'}</p>
                           </div>
                        </div>
                        <div className="mt-8 pt-4">
                           {!shift.checkInTime ? (
                             <button onClick={() => setActiveAttendance({ type: 'CHECK_IN', shiftId: shift.id })} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl">Vào Ca</button>
                           ) : shift.status !== 'COMPLETED' ? (
                             <button onClick={() => setActiveAttendance({ type: 'CHECK_OUT', shiftId: shift.id })} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-sm">Ra Ca & Chốt</button>
                           ) : (
                             <div className="text-center py-4 bg-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest">Đã hoàn thành</div>
                           )}
                        </div>
                     </div>
                   );
                 })
               )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Quy định & Hướng dẫn */}
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm">
             <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs tracking-widest mb-6 italic">Quy định & Hướng dẫn</h3>
             <div className="space-y-6">
                {regulations.map(reg => {
                  const isConfirmed = user.confirmedRegulations?.includes(reg.id);
                  return (
                    <div key={reg.id} className="space-y-4">
                       <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                          <p className="font-black text-slate-800 text-sm tracking-tight">{reg.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{reg.content}</p>
                          <div className="pt-2 flex justify-between items-center">
                             <span className="text-[8px] text-slate-400 font-bold uppercase italic">Cập nhật: {reg.updatedAt}</span>
                             {isConfirmed ? (
                               <span className="flex items-center gap-1 text-[9px] font-black text-green-600 uppercase">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                  Đã xác nhận
                               </span>
                             ) : (
                               <button 
                                 onClick={() => onConfirmRegulation(reg.id)}
                                 className="text-[9px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-indigo-700 transition-all"
                               >
                                 Tôi đã đọc và hiểu
                               </button>
                             )}
                          </div>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      </div>

      {activeAttendance && <AttendanceModal type={activeAttendance.type} onClose={() => setActiveAttendance(null)} onSuccess={handleAttendanceSuccess} branch={userBranch} />}
      {showClosingForm && <ShiftClosingForm onSubmit={handleClosingSubmit} onSkip={handleSkipClosing} />}
    </div>
  );
};

export default StaffDashboard;
