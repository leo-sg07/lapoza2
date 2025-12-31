
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
  const [activeAttendance, setActiveAttendance] = useState<{ type: 'CHECK_IN' | 'CHECK_OUT', shiftId: string } | null>(null);
  const [showClosingForm, setShowClosingForm] = useState<string | null>(null);

  const todayDate = new Date().toISOString().split('T')[0];
  const userBranch = branches.find(b => b.id === user.branchId) || branches[0];

  const assignedShifts = useMemo(() => {
    return assignments
      .filter(a => a.userId === user.id && a.date === todayDate)
      .map(a => {
        // Tìm bản ghi log thực tế dựa trên các tiêu chí thay vì chỉ dùng ID cứng
        const existingLog = attendanceLogs.find(l => 
          l.userId === user.id && 
          l.date === todayDate && 
          l.type === a.shiftType
        );
        
        return existingLog || { 
          id: `s-${todayDate}-${user.id}-${a.shiftType}`, 
          userId: user.id, 
          userName: user.name, 
          userAvatar: user.avatar, 
          date: todayDate, 
          type: a.shiftType, 
          status: 'PENDING', 
          branchId: user.branchId 
        } as ShiftRecord;
      });
  }, [assignments, attendanceLogs, user, todayDate]);

  const handleAttendanceSuccess = (photo: string) => {
    if (!activeAttendance) return;
    const { type, shiftId } = activeAttendance;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const targetShift = assignedShifts.find(s => s.id === shiftId);
    if (!targetShift) return;
    
    // Cập nhật record với giờ và ảnh
    const updatedRecord: ShiftRecord = type === 'CHECK_IN' 
      ? { ...targetShift, checkInTime: timeStr, checkInPhoto: photo, checkInStatus: AttendanceStatus.ON_TIME } 
      : { 
          ...targetShift, 
          checkOutTime: timeStr, 
          checkOutPhoto: photo, 
          checkOutStatus: AttendanceStatus.ON_TIME,
          // Tự động chuyển trạng thái thành COMPLETED khi Ra ca để Dashboard cập nhật
          status: 'COMPLETED' 
        };
    
    onAttendanceUpdate(updatedRecord);
    setActiveAttendance(null);
    
    // Hiển thị form chốt ca nếu là Ra ca
    if (type === 'CHECK_OUT') {
      setShowClosingForm(shiftId);
    }
  };

  const handleClosingSubmit = (data: ShiftClosingData) => {
    const targetShift = attendanceLogs.find(s => s.id === showClosingForm) || assignedShifts.find(s => s.id === showClosingForm);
    if (targetShift) {
      onAttendanceUpdate({ 
        ...targetShift, 
        closingData: data, 
        status: 'COMPLETED' 
      });
    }
    setShowClosingForm(null);
    alert('Đã lưu báo cáo chốt ca thành công!');
  };

  const handleSkipClosing = () => {
    setShowClosingForm(null);
  };

  return (
    <div className="p-4 space-y-6 animate-in pb-32">
      {/* Mini Profile Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={user.avatar} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" alt="" />
          <div>
            <p className="text-xs font-black text-slate-800 leading-none">{user.name}</p>
            <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest mt-1">{userBranch.name}</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">Trực tuyến</div>
      </header>

      {/* Notifications */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Thông báo mới</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="w-full p-6 bg-slate-50 rounded-3xl text-center text-[10px] font-bold text-slate-400 uppercase italic">Chưa có thông báo</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="min-w-[280px] snap-center bg-indigo-600 p-5 rounded-[2rem] text-white shadow-lg shadow-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10"><svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">{n.date} • {n.authorName}</p>
                <h4 className="font-black text-sm mb-2">{n.title}</h4>
                <p className="text-[11px] text-indigo-50 leading-relaxed line-clamp-3">{n.content}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Today Shifts */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Ca trực của bạn</h3>
        <div className="grid grid-cols-1 gap-4">
          {assignedShifts.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-100 p-10 rounded-[2.5rem] text-center">
              <p className="text-slate-400 font-black italic uppercase text-xs">Hôm nay bạn không có ca trực</p>
            </div>
          ) : (
            assignedShifts.map(shift => {
              const config = userBranch.shifts[shift.type];
              return (
                <div key={shift.id} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase">{config?.name || shift.type}</span>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${shift.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      {shift.status === 'COMPLETED' ? 'HOÀN TẤT' : 'ĐANG TRỰC'}
                    </span>
                  </div>
                  <div className="text-center py-2">
                     <p className="text-2xl font-black text-slate-800 italic">{config?.start || '--:--'} - {config?.end || '--:--'}</p>
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Giờ làm việc quy định</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-slate-50 rounded-2xl p-3 text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Vào ca</p>
                        <p className="text-sm font-black text-slate-800">{shift.checkInTime || '--:--'}</p>
                     </div>
                     <div className="bg-slate-50 rounded-2xl p-3 text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Ra ca</p>
                        <p className="text-sm font-black text-slate-800">{shift.checkOutTime || '--:--'}</p>
                     </div>
                  </div>
                  
                  {!shift.checkInTime ? (
                    <button onClick={() => setActiveAttendance({ type: 'CHECK_IN', shiftId: shift.id })} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">Điểm danh Vào Ca</button>
                  ) : shift.status !== 'COMPLETED' ? (
                    <button onClick={() => setActiveAttendance({ type: 'CHECK_OUT', shiftId: shift.id })} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-all">Điểm danh Ra Ca</button>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-center py-4 bg-slate-100 rounded-2xl text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Ca làm việc đã hoàn tất
                      </div>
                      {!shift.closingData && (
                        <button onClick={() => setShowClosingForm(shift.id)} className="w-full bg-indigo-50 text-indigo-600 border border-indigo-100 py-3 rounded-2xl font-black text-xs uppercase tracking-widest active:bg-indigo-600 active:text-white transition-all">Bổ sung báo cáo chốt ca</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Regulations Section */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Quy định & Hướng dẫn</h3>
        <div className="space-y-4">
          {regulations.map(reg => {
            const isConfirmed = user.confirmedRegulations?.includes(reg.id);
            return (
              <div key={reg.id} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black text-slate-800 italic">{reg.title}</h4>
                  {isConfirmed && <span className="bg-green-50 text-green-600 p-1 rounded-full"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></span>}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap break-words font-medium italic">
                  {reg.content}
                </p>
                {!isConfirmed && (
                  <button 
                    onClick={() => onConfirmRegulation(reg.id)}
                    className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 active:bg-indigo-600 active:text-white transition-all"
                  >
                    Tôi đã đọc và hiểu
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {activeAttendance && <AttendanceModal type={activeAttendance.type} onClose={() => setActiveAttendance(null)} onSuccess={handleAttendanceSuccess} branch={userBranch} />}
      {showClosingForm && <ShiftClosingForm onSubmit={handleClosingSubmit} onSkip={handleSkipClosing} />}
    </div>
  );
};

export default StaffDashboard;
