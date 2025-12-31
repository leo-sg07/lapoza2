
import React, { useState, useMemo } from 'react';
import { Role, ShiftRecord, User, Branch, Assignment, AttendanceStatus } from '../../types';

interface AttendanceReportViewProps {
  role: Role;
  logs: ShiftRecord[];
  user: User;
  branches: Branch[];
  assignments: Assignment[];
  users: User[];
}

const AttendanceReportView: React.FC<AttendanceReportViewProps> = ({ role, logs, user, branches, assignments, users }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user.branchId || '1');

  const reportData = useMemo(() => {
    const rangeAssignments = assignments.filter(a => a.date >= startDate && a.date <= endDate);
    const branchStaffIds = users.filter(u => u.branchId === selectedBranchId).map(u => u.id);
    const filteredAssignments = rangeAssignments.filter(a => branchStaffIds.includes(a.userId));

    return filteredAssignments.map(as => {
      const staff = users.find(u => u.id === as.userId);
      const logId = `s-${as.date}-${as.userId}-${as.shiftType}`;
      const log = logs.find(l => l.id === logId);
      const branch = branches.find(b => b.id === selectedBranchId);
      const shiftConfig = branch?.shifts[as.shiftType];

      let workingHours = 0;
      if (log?.checkInTime && log?.checkOutTime) {
        const [sh, sm] = log.checkInTime.split(':').map(Number);
        const [eh, em] = log.checkOutTime.split(':').map(Number);
        workingHours = (eh * 60 + em - (sh * 60 + sm)) / 60;
      }

      return {
        ...as,
        staffName: staff?.name || 'Ẩn danh',
        avatar: staff?.avatar,
        shiftName: shiftConfig?.name || 'N/A',
        checkIn: log?.checkInTime || '--:--',
        checkOut: log?.checkOutTime || '--:--',
        status: log?.status || 'MISSED',
        checkInStatus: log?.checkInStatus,
        workingHours: workingHours.toFixed(1)
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [startDate, endDate, selectedBranchId, assignments, logs, users, branches]);

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      alert("Hiện không có dữ liệu để xuất!");
      return;
    }

    const branch = branches.find(b => b.id === selectedBranchId);
    const filename = `Bao-cao-cham-cong-${branch?.name.replace(/\s+/g, '-')}-${startDate}-den-${endDate}.csv`;

    const headers = ["Nhân viên", "Ngày", "Ca trực", "Check-in", "Check-out", "Số giờ làm", "Trạng thái"];
    const rows = reportData.map(row => [
      `"${row.staffName}"`,
      row.date,
      `"${row.shiftName}"`,
      row.checkIn,
      row.checkOut,
      row.workingHours,
      row.status === 'COMPLETED' ? "Hoàn thành" : row.status === 'PENDING' ? "Đang trực" : "Vắng mặt"
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 animate-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">Báo cáo <span className="text-indigo-600">Chấm công</span></h2>
          <p className="text-sm text-slate-500 italic font-medium">Lịch sử chuyên cần và tổng hợp giờ công nhân sự.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {role === Role.ADMIN && (
            <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} className="bg-white border border-slate-100 px-6 py-3 rounded-2xl text-xs font-black text-slate-700 shadow-sm outline-none">
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-black text-slate-700 outline-none" />
            <span className="text-slate-300 font-bold">→</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-black text-slate-700 outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
          <h3 className="font-black text-slate-800 text-xs tracking-[0.2em] uppercase">Bảng chấm công chi tiết</h3>
          <button onClick={handleExportCSV} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Xuất file CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-6">Nhân viên</th>
                <th className="px-8 py-6 text-center">Ngày</th>
                <th className="px-8 py-6">Ca trực</th>
                <th className="px-8 py-6 text-center">Check-in</th>
                <th className="px-8 py-6 text-center">Check-out</th>
                <th className="px-8 py-6 text-center">Số giờ</th>
                <th className="px-8 py-6 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">Không có dữ liệu trong khoảng thời gian này</td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <img src={row.avatar} className="w-9 h-9 rounded-xl border-2 border-slate-100" alt="avatar" />
                        <span className="font-bold text-slate-700 text-sm">{row.staffName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center font-bold text-slate-500 text-sm">{row.date}</td>
                    <td className="px-8 py-6">
                       <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{row.shiftName}</span>
                    </td>
                    <td className="px-8 py-6 text-center font-black text-slate-800 text-sm">
                      {row.checkIn}
                      {row.checkInStatus === AttendanceStatus.LATE && <span className="block text-[8px] text-red-500 uppercase italic">Trễ</span>}
                    </td>
                    <td className="px-8 py-6 text-center font-black text-slate-800 text-sm">{row.checkOut}</td>
                    <td className="px-8 py-6 text-center">
                       <div className="inline-flex items-center gap-1 bg-slate-900 text-white px-3 py-1 rounded-xl shadow-sm">
                          <span className="text-xs font-black">{row.workingHours}</span>
                          <span className="text-[8px] opacity-60 font-bold uppercase">H</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       {row.status === 'COMPLETED' ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm">Hoàn thành</span>
                       ) : row.status === 'PENDING' ? (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm">Đang trực</span>
                       ) : (
                          <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm">Vắng mặt</span>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReportView;
