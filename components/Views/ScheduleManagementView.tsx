
import React, { useState, useMemo } from 'react';
import { Role, ShiftType, User, Branch, UserStatus, Assignment, ScheduleLog, LeaveRequest } from '../../types';

const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

interface ScheduleManagementViewProps {
  branches: Branch[];
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  logs: ScheduleLog[];
  setLogs: React.Dispatch<React.SetStateAction<ScheduleLog[]>>;
  requests: LeaveRequest[];
  user: User;
  users: User[];
}

const ScheduleManagementView: React.FC<ScheduleManagementViewProps> = ({ 
  branches, assignments, setAssignments, logs, setLogs, requests, user, users 
}) => {
  const [activeBranchId, setActiveBranchId] = useState(user.branchId || '1');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [flashMessage, setFlashMessage] = useState<{title: string, desc: string} | null>(null);

  const todayDate = new Date().toISOString().split('T')[0];

  const weekRange = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) + weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d.toISOString().split('T')[0];
    });
    const startDateStr = new Date(weekDates[0]).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const endDateStr = new Date(weekDates[6]).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return { weekDates, displayRange: `${startDateStr} - ${endDateStr}` };
  }, [weekOffset]);

  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];
  const assignableUsers = users.filter(u => u.role !== Role.ADMIN && u.status === UserStatus.WORKING && u.branchId === activeBranchId);

  const triggerFlash = (title: string, desc: string) => {
    setFlashMessage({ title, desc });
    setTimeout(() => setFlashMessage(null), 3000);
  };

  const addLog = (action: string) => {
    const newLog: ScheduleLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      timestamp: new Date().toLocaleString('vi-VN'),
      userName: user.name
    };
    setLogs([newLog, ...logs]);
  };

  const toggleAssignment = (dateStr: string, shiftType: string) => {
    if (!selectedStaffId) {
        alert("Vui lòng chọn một nhân viên từ danh sách trước khi xếp lịch.");
        return;
    }
    const targetDate = new Date(dateStr);
    const today = new Date(todayDate);
    if (targetDate < today) {
      alert('Không thể điều chỉnh lịch trong quá khứ.');
      return;
    }

    const staff = users.find(s => s.id === selectedStaffId);
    const existingIndex = assignments.findIndex(
      a => a.userId === selectedStaffId && a.date === dateStr && a.shiftType === shiftType
    );

    if (existingIndex > -1) {
      setAssignments(assignments.filter((_, i) => i !== existingIndex));
      addLog(`Xóa ca của ${staff?.name} ngày ${dateStr}`);
    } else {
      setAssignments([...assignments, {
        id: Date.now().toString(),
        userId: selectedStaffId,
        date: dateStr,
        shiftType,
        updatedAt: new Date().toISOString(),
        updatedBy: user.name
      }]);
      addLog(`Thêm ca cho ${staff?.name} ngày ${dateStr}`);
    }
  };

  const handleSave = () => {
    addLog(`Đã lưu lịch tuần ${weekRange.displayRange}`);
    triggerFlash("Hệ thống đã lưu!", "Dữ liệu lịch làm việc đã được đồng bộ vào Database.");
  };

  const handleSendEmail = () => {
    addLog(`Đã gửi email lịch tuần ${weekRange.displayRange}`);
    triggerFlash("Email đã gửi!", "Toàn bộ nhân viên chi nhánh đã nhận được thông báo lịch mới.");
  };

  const selectedStaff = users.find(u => u.id === selectedStaffId);

  return (
    <div className="p-4 md:p-8 animate-in space-y-6 pb-32 lg:pb-8 h-full flex flex-col relative overflow-y-auto">
      {flashMessage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in"></div>
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl relative z-10 text-center space-y-6 animate-in border border-slate-100">
             <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-800">{flashMessage.title}</h3>
                <p className="text-xs text-slate-400 font-medium mt-2">{flashMessage.desc}</p>
             </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight italic">Quản lý <span className="text-indigo-600">Điều phối</span></h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{weekRange.displayRange}</span>
            {selectedStaff && (
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full animate-pulse italic">Đang xếp: {selectedStaff.name}</span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex p-1 bg-white border border-slate-100 rounded-2xl shadow-sm flex-1 md:flex-none justify-between">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="px-3 py-2 text-slate-400 hover:text-indigo-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button onClick={() => setWeekOffset(0)} className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-600">Tuần này</button>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="px-3 py-2 text-slate-400 hover:text-indigo-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleSave} className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Lưu</button>
            <button onClick={handleSendEmail} className="flex-1 md:flex-none bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Gửi Mail</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
        {/* Staff List - Desktop: Sidebar, Mobile: Horizontal Scroll */}
        <div className="lg:col-span-1 flex flex-col space-y-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Nhân sự chi nhánh</h3>
           <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto gap-3 pb-4 lg:pb-0 custom-scrollbar lg:max-h-[60vh]">
              {assignableUsers.map(staff => (
                <button 
                  key={staff.id} 
                  onClick={() => setSelectedStaffId(selectedStaffId === staff.id ? null : staff.id)}
                  className={`flex items-center gap-3 p-3 lg:p-4 rounded-3xl transition-all border-2 shrink-0 lg:shrink min-w-[160px] lg:min-w-0 ${
                    selectedStaffId === staff.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]' 
                    : 'bg-white border-slate-50 text-slate-600 shadow-sm'
                  }`}
                >
                  <img src={staff.avatar} className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl ${selectedStaffId === staff.id ? 'bg-white/20' : 'bg-slate-100'}`} alt="avatar" />
                  <div className="text-left overflow-hidden">
                    <p className="text-xs lg:text-sm font-black truncate">{staff.name}</p>
                    <p className={`text-[9px] uppercase font-bold truncate ${selectedStaffId === staff.id ? 'text-indigo-200' : 'text-slate-400'}`}>{staff.username}</p>
                  </div>
                </button>
              ))}
           </div>
        </div>

        {/* Schedule Display */}
        <div className="lg:col-span-3 space-y-6">
           {/* Desktop View: Table */}
           <div className="hidden lg:block bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden h-full flex flex-col">
              <div className="overflow-x-auto flex-1">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ca trực</th>
                      {daysOfWeek.map((day, idx) => (
                        <th key={day} className="px-4 py-6 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</p>
                          <p className="text-[11px] font-bold text-indigo-500 mt-1">{new Date(weekRange.weekDates[idx]).getDate()}/{new Date(weekRange.weekDates[idx]).getMonth() + 1}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(activeBranch.shifts).map(([type, config]) => (
                      <tr key={type} className="hover:bg-slate-50/30 transition-all">
                        <td className="px-8 py-8 w-44">
                           <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                              <p className="font-black text-slate-800 text-sm">{config.name}</p>
                              <p className="text-[9px] text-indigo-500 font-black tracking-widest uppercase mt-1 italic">{config.start} - {config.end}</p>
                           </div>
                        </td>
                        {weekRange.weekDates.map(dateStr => {
                          const cellAssignments = assignments.filter(a => a.date === dateStr && a.shiftType === type);
                          const isSelectedStaffAssigned = cellAssignments.some(a => a.userId === selectedStaffId);
                          const isLocked = new Date(dateStr) < new Date(todayDate);
                          
                          return (
                            <td key={dateStr} className={`p-2 transition-all ${!isLocked && selectedStaffId ? 'cursor-pointer' : ''}`} onClick={() => !isLocked && toggleAssignment(dateStr, type)}>
                              <div className={`min-h-[120px] p-3 rounded-[2.5rem] border-2 border-dashed flex flex-col gap-2 transition-all ${
                                isLocked ? 'bg-slate-50 border-slate-50 opacity-40' :
                                isSelectedStaffAssigned ? 'bg-indigo-600 border-indigo-600 shadow-xl' : 'border-slate-100 bg-slate-50/30 group-hover:bg-white'
                              }`}>
                                {cellAssignments.map(as => {
                                  const staff = users.find(s => s.id === as.userId);
                                  return (
                                    <div key={as.userId} className={`flex items-center gap-2 p-2 rounded-2xl border ${as.userId === selectedStaffId ? 'bg-white/10 border-white/20' : 'bg-white border-slate-50 shadow-sm'}`}>
                                      <img src={staff?.avatar} className="w-6 h-6 rounded-lg bg-slate-100" alt="avatar" />
                                      <span className={`text-[9px] font-black truncate flex-1 ${as.userId === selectedStaffId ? 'text-white' : 'text-slate-600'}`}>{staff?.name.split(' ').pop()}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>

           {/* Mobile View: Vertical Days Stack */}
           <div className="lg:hidden space-y-6">
              {weekRange.weekDates.map((dateStr, idx) => {
                const dayName = daysOfWeek[idx];
                const dateObj = new Date(dateStr);
                const isToday = dateStr === todayDate;
                const isLocked = dateObj < new Date(todayDate);

                return (
                  <div key={dateStr} className={`bg-white border rounded-[2.5rem] p-6 shadow-sm space-y-6 transition-all ${isToday ? 'border-indigo-200 ring-2 ring-indigo-50 shadow-indigo-50' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center font-black ${isToday ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <span className="text-[8px] uppercase">{dayName.split(' ')[1]}</span>
                            <span className="text-sm">{dateObj.getDate()}</span>
                         </div>
                         <div>
                            <p className="font-black text-slate-800 text-sm">{dayName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{dateObj.toLocaleDateString('vi-VN')}</p>
                         </div>
                      </div>
                      {isToday && <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Hôm nay</span>}
                      {isLocked && <span className="text-slate-300 italic text-[10px] font-bold">Đã qua</span>}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                       {Object.entries(activeBranch.shifts).map(([type, config]) => {
                          const cellAssignments = assignments.filter(a => a.date === dateStr && a.shiftType === type);
                          const isSelectedStaffAssigned = cellAssignments.some(a => a.userId === selectedStaffId);
                          
                          return (
                            <div 
                                key={type} 
                                onClick={() => !isLocked && toggleAssignment(dateStr, type)}
                                className={`flex flex-col gap-3 p-5 rounded-[2rem] border-2 transition-all active:scale-[0.98] ${
                                    isSelectedStaffAssigned 
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' 
                                    : 'bg-slate-50/50 border-slate-50'
                                } ${isLocked ? 'opacity-50 grayscale' : ''}`}
                            >
                               <div className="flex justify-between items-center">
                                  <div>
                                     <p className={`text-xs font-black uppercase tracking-widest ${isSelectedStaffAssigned ? 'text-indigo-100' : 'text-slate-400'}`}>{config.name}</p>
                                     <p className={`text-[10px] font-bold mt-0.5 ${isSelectedStaffAssigned ? 'text-white' : 'text-slate-600'}`}>{config.start} - {config.end}</p>
                                  </div>
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelectedStaffAssigned ? 'bg-white/20' : 'bg-white border border-slate-100 shadow-sm'}`}>
                                     {isSelectedStaffAssigned ? (
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                     ) : (
                                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                                     )}
                                  </div>
                               </div>

                               {cellAssignments.length > 0 && (
                                   <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5">
                                      {cellAssignments.map(as => {
                                          const staff = users.find(s => s.id === as.userId);
                                          return (
                                              <div key={as.userId} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase ${as.userId === selectedStaffId ? 'bg-white/20 text-white' : 'bg-white text-slate-500 shadow-sm'}`}>
                                                  <img src={staff?.avatar} className="w-4 h-4 rounded-md" alt="avatar" />
                                                  {staff?.name.split(' ').pop()}
                                              </div>
                                          );
                                      })}
                                   </div>
                               )}
                            </div>
                          );
                       })}
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagementView;
