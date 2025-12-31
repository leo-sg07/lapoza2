
import React, { useState, useMemo } from 'react';
// Import ShiftConfig to fix unknown type errors
import { Role, Assignment, Branch, ShiftConfig } from '../../types';

const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

interface ScheduleViewProps {
  role: Role;
  assignments: Assignment[];
  currentUserId: string;
  branches: Branch[];
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ role, assignments, currentUserId, branches }) => {
  const [weekOffset, setWeekOffset] = useState(0);

  const currentUser = useMemo(() => {
    // Giả định người dùng thuộc chi nhánh nào đó, lấy chi nhánh đầu tiên nếu không có
    return branches[0]; 
  }, [branches]);

  const weekRange = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diffToMonday + weekOffset * 7));
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

  const isPersonalView = role === Role.STAFF;

  // Lấy danh sách ca làm việc thực tế của chi nhánh
  const branchShifts = currentUser?.shifts || {};

  return (
    <div className="p-4 md:p-8 animate-in space-y-8 pb-24 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Lịch Trực <span className="text-indigo-600">{isPersonalView ? 'Cá Nhân' : 'Toàn Chi Nhánh'}</span>
          </h2>
          <p className="text-slate-500 font-medium tracking-tight mt-1">Phạm vi: <span className="font-bold text-slate-800">{weekRange.displayRange}</span></p>
        </div>
        
        <div className="flex p-1 bg-white border border-slate-100 rounded-2xl shadow-sm self-stretch md:self-auto">
          <button onClick={() => setWeekOffset(-1)} className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all ${weekOffset === -1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>Trước</button>
          <button onClick={() => setWeekOffset(0)} className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all ${weekOffset === 0 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>Hiện tại</button>
          <button onClick={() => setWeekOffset(1)} className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all ${weekOffset === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>Tiếp theo</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ca làm việc</th>
                {daysOfWeek.map((day, idx) => (
                  <th key={day} className="px-4 py-6 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</p>
                    <p className="text-[11px] font-bold text-indigo-500 mt-1">{new Date(weekRange.weekDates[idx]).getDate()}/{new Date(weekRange.weekDates[idx]).getMonth() + 1}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(branchShifts).map(([type, details]) => {
                // Fixed: Cast details to ShiftConfig to fix unknown type errors
                const shift = details as ShiftConfig;
                return (
                  <tr key={type} className="hover:bg-slate-50/20 transition-all">
                    <td className="px-8 py-8 w-40">
                       <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                          <p className="font-black text-slate-800 text-sm">{shift.name}</p>
                          <p className="text-[9px] text-indigo-500 font-black tracking-widest uppercase mt-1">{shift.start} - {shift.end}</p>
                       </div>
                    </td>
                    {weekRange.weekDates.map(dateStr => {
                      const cellAssignments = assignments.filter(a => a.date === dateStr && a.shiftType === type);
                      const isMyShift = cellAssignments.some(a => a.userId === currentUserId);
                      
                      return (
                        <td key={dateStr} className="p-2">
                          <div className={`min-h-[100px] p-4 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                            isMyShift 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100 scale-[1.05]' 
                              : 'border-slate-50 bg-slate-50/50 grayscale opacity-60'
                          }`}>
                            {isMyShift ? (
                              <>
                                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest text-center">Đã xếp</span>
                              </>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">---</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;
