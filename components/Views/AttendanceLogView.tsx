
import React, { useState } from 'react';
import { Role, ShiftRecord, AttendanceStatus, Branch, ShiftClosingData, ShiftAuditLog } from '../../types';
import { SHIFT_DETAILS } from '../../constants';
import { formatCurrency } from '../../utils/formatUtils';
import ShiftClosingForm from '../ShiftClosingForm';

interface AttendanceLogViewProps {
  role: Role;
  logs: ShiftRecord[];
  setLogs: React.Dispatch<React.SetStateAction<ShiftRecord[]>>;
  userId?: string;
  branches: Branch[];
  managerName: string;
}

const AttendanceLogView: React.FC<AttendanceLogViewProps> = ({ role, logs, setLogs, userId, branches, managerName }) => {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLog, setSelectedLog] = useState<ShiftRecord | null>(null);
  const [closingShiftId, setClosingShiftId] = useState<string | null>(null);

  const displayLogs = role === Role.STAFF 
    ? logs.filter(log => log.userId === userId)
    : logs;

  const getStatusBadge = (status?: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.ON_TIME:
        return <span className="bg-green-50 text-green-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">ĐÚNG GIỜ</span>;
      case AttendanceStatus.LATE:
        return <span className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">VÀO TRỄ</span>;
      case AttendanceStatus.EARLY_LEAVE:
        return <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">VỀ SỚM</span>;
      default:
        return <span className="bg-slate-50 text-slate-400 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">--</span>;
    }
  };

  const handleManualClosing = (data: ShiftClosingData) => {
    if (!closingShiftId) return;

    const newAudit: ShiftAuditLog = {
      id: Date.now().toString(),
      action: 'QUẢN LÝ BỔ SUNG BÁO CÁO',
      timestamp: new Date().toLocaleString('vi-VN'),
      userName: managerName,
      comment: "Dữ liệu chốt ca được Quản lý bổ sung thủ công sau khi nhân viên bỏ qua."
    };

    setLogs(prev => prev.map(log => log.id === closingShiftId ? {
      ...log,
      closingData: data,
      status: 'COMPLETED' as const,
      auditLog: [...(log.auditLog || []), newAudit]
    } : log));

    setClosingShiftId(null);
    alert('Đã bổ sung báo cáo chốt ca thành công!');
  };

  const isManager = role === Role.MANAGER || role === Role.ADMIN;

  return (
    <div className="p-4 md:p-8 animate-in space-y-6 overflow-y-auto h-full pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 italic">Nhật ký <span className="text-indigo-600">Điểm danh</span></h2>
          <p className="text-sm text-slate-500 italic">Theo dõi lịch sử vào ca và các phản hồi đối soát từ quản lý.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {displayLogs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-slate-500 font-medium">Chưa có dữ liệu điểm danh nào được ghi nhận.</p>
          </div>
        ) : (
          displayLogs.map((log) => (
            <div 
              key={log.id} 
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all flex flex-col md:flex-row items-center gap-6 group relative"
            >
              <div onClick={() => setSelectedLog(log)} className="flex items-center gap-5 w-full md:w-auto shrink-0 cursor-pointer">
                 <div className="relative">
                   <img src={log.userAvatar} className="w-12 h-12 rounded-2xl border border-slate-100 group-hover:scale-105 transition-transform" />
                   <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-slate-200 flex items-center justify-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${log.isConfirmed ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                   </div>
                 </div>
                 <div>
                   <p className="font-extrabold text-slate-800 text-base">{log.userName}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{SHIFT_DETAILS[log.type as any]?.name || log.type} • {log.date}</p>
                 </div>
              </div>

              <div onClick={() => setSelectedLog(log)} className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 w-full cursor-pointer">
                <div className="space-y-2">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vào ca</p>
                   <div className="flex items-center gap-2">
                      <p className="text-base font-black text-slate-700">{log.checkInTime || '--:--'}</p>
                      {getStatusBadge(log.checkInStatus)}
                   </div>
                </div>

                <div className="space-y-2">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ra ca</p>
                   <div className="flex items-center gap-2">
                      <p className="text-base font-black text-slate-700">{log.checkOutTime || '--:--'}</p>
                      {getStatusBadge(log.checkOutStatus)}
                   </div>
                </div>

                <div className="hidden lg:flex flex-col justify-center border-l border-slate-100 pl-6">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Duyệt đối soát</p>
                   <div className="flex items-center gap-2">
                      {log.isConfirmed ? (
                        <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-lg font-black uppercase">ĐÃ DUYỆT</span>
                      ) : (
                        <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-lg font-black uppercase">ĐANG CHỜ</span>
                      )}
                   </div>
                </div>

                <div className="hidden lg:flex flex-col justify-center border-l border-slate-100 pl-6">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tiền mặt bàn giao</p>
                   {log.closingData ? (
                      <p className="text-sm font-black text-slate-700">
                        {formatCurrency(log.adjustedClosingData?.totalCash ?? log.closingData?.totalCash ?? 0)}đ
                      </p>
                   ) : isManager ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setClosingShiftId(log.id); }}
                        className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-black uppercase tracking-tighter shadow-sm hover:bg-indigo-700 transition-all"
                      >
                        Bổ sung chốt ca
                      </button>
                   ) : (
                      <p className="text-sm font-black text-slate-300 italic">Chưa báo cáo</p>
                   )}
                </div>
              </div>

              <div onClick={() => setSelectedLog(log)} className="p-2 text-slate-300 group-hover:text-indigo-600 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Bổ sung chốt ca */}
      {closingShiftId && (
        <ShiftClosingForm 
           onSubmit={handleManualClosing} 
           onSkip={() => setClosingShiftId(null)} 
        />
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl my-8 animate-in overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-start">
              <div className="flex items-center gap-6">
                <img src={selectedLog.userAvatar} className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-xl" />
                <div>
                  <h3 className="text-xl font-black">{selectedLog.userName}</h3>
                  <p className="text-indigo-100 font-bold text-[10px] tracking-widest uppercase italic">{selectedLog.date} • {SHIFT_DETAILS[selectedLog.type as any]?.name || selectedLog.type}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Check-in</p>
                   <div className="aspect-video bg-white rounded-2xl overflow-hidden border border-slate-200 mb-2">
                      {selectedLog.checkInPhoto ? <img src={selectedLog.checkInPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-xs uppercase">Không có ảnh</div>}
                   </div>
                   <p className="text-center font-black text-slate-800 text-sm">{selectedLog.checkInTime || '--:--'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Check-out</p>
                   <div className="aspect-video bg-white rounded-2xl overflow-hidden border border-slate-200 mb-2">
                      {selectedLog.checkOutPhoto ? <img src={selectedLog.checkOutPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-xs uppercase">Không có ảnh</div>}
                   </div>
                   <p className="text-center font-black text-slate-800 text-sm">{selectedLog.checkOutTime || '--:--'}</p>
                </div>
              </div>

              {selectedLog.closingData ? (
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
                   <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4 italic underline underline-offset-4 decoration-indigo-200">Báo cáo tài chính & Đối soát</h4>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-3 bg-slate-50 rounded-2xl">
                         <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Tiền mặt (Bạn chốt)</p>
                         <p className="font-black text-slate-800 text-sm">{formatCurrency(selectedLog.closingData.totalCash)}đ</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl">
                         <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Chuyển khoản (Bạn chốt)</p>
                         <p className="font-black text-slate-800 text-sm">{formatCurrency(selectedLog.closingData.totalTransfer)}đ</p>
                      </div>
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                         <p className="text-[9px] text-indigo-500 font-bold uppercase mb-1">Tiền mặt (Xác nhận)</p>
                         <p className="font-black text-indigo-700 text-sm">{formatCurrency(selectedLog.adjustedClosingData?.totalCash ?? selectedLog.closingData.totalCash)}đ</p>
                      </div>
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                         <p className="text-[9px] text-indigo-500 font-bold uppercase mb-1">C.Khoản (Xác nhận)</p>
                         <p className="font-black text-indigo-700 text-sm">{formatCurrency(selectedLog.adjustedClosingData?.totalTransfer ?? selectedLog.closingData.totalTransfer)}đ</p>
                      </div>
                   </div>

                   {selectedLog.isConfirmed && (
                     <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                           <p className="text-[10px] font-black text-indigo-600 uppercase italic tracking-widest">Phản hồi đối soát từ {selectedLog.confirmedBy}</p>
                        </div>
                        <p className="text-xs text-slate-600 italic font-medium leading-relaxed">
                          {selectedLog.managerComment ? `"${selectedLog.managerComment}"` : "Dữ liệu đã được kiểm duyệt và ghi nhận chính xác."}
                        </p>
                     </div>
                   )}

                   <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Lịch sử điều chỉnh số liệu (Audit Log)</h5>
                      <div className="space-y-3">
                         {selectedLog.auditLog && selectedLog.auditLog.length > 0 ? (
                            selectedLog.auditLog.map(audit => (
                              <div key={audit.id} className="p-4 border border-slate-50 rounded-2xl bg-slate-50/50">
                                 <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter italic underline decoration-indigo-200">{audit.action}</span>
                                    <span className="text-[9px] text-slate-400 font-bold italic">{audit.timestamp}</span>
                                 </div>
                                 {audit.changes && audit.changes.map((c, i) => (
                                   <p key={i} className="text-[10px] text-slate-500 mb-1">
                                      <span className="font-bold">{c.field}:</span> {formatCurrency(c.from)}đ <span className="text-indigo-400">→</span> {formatCurrency(c.to)}đ
                                   </p>
                                 ))}
                                 {audit.comment && <p className="text-xs text-slate-500 italic mt-2 p-2 bg-white rounded-lg">"{audit.comment}"</p>}
                                 <p className="text-[9px] text-slate-300 font-bold mt-2 uppercase tracking-tighter italic">Thực hiện bởi: {audit.userName}</p>
                              </div>
                            ))
                         ) : (
                            <p className="text-xs text-slate-300 italic text-center py-4">Chưa có hoạt động đối soát nào cho ca này.</p>
                         )}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                   <p className="text-slate-400 font-black italic text-sm uppercase tracking-widest mb-4">Ca trực này chưa có báo cáo chốt ca</p>
                   {isManager && (
                     <button 
                       onClick={() => { setClosingShiftId(selectedLog.id); setSelectedLog(null); }}
                       className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100"
                     >
                       Bổ sung báo cáo ngay
                     </button>
                   )}
                </div>
              )}
            </div>
            
            <div className="p-8 pt-0 flex justify-end">
              <button onClick={() => setSelectedLog(null)} className="px-10 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">Đóng chi tiết</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceLogView;
