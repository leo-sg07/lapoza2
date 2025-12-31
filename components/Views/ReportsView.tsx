
import React, { useState, useMemo, useEffect } from 'react';
import { Role, ShiftRecord, User, Branch, ShiftAuditLog } from '../../types';
import { formatCurrency, parseCurrency } from '../../utils/formatUtils';

interface ReportsViewProps {
  role: Role;
  logs: ShiftRecord[];
  setLogs: React.Dispatch<React.SetStateAction<ShiftRecord[]>>;
  user: User;
  branches: Branch[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ role, logs, setLogs, user, branches }) => {
  const isManagerOnly = role === Role.MANAGER;
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - (isManagerOnly ? 3 : 7));
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLog, setSelectedLog] = useState<ShiftRecord | null>(null);
  const [confirmingLog, setConfirmingLog] = useState<ShiftRecord | null>(null);

  const [adjCashInput, setAdjCashInput] = useState("");
  const [adjTransferInput, setAdjTransferInput] = useState("");

  useEffect(() => {
    if (confirmingLog) {
      setAdjCashInput(formatCurrency(confirmingLog.closingData?.totalCash || 0));
      setAdjTransferInput(formatCurrency(confirmingLog.closingData?.totalTransfer || 0));
    }
  }, [confirmingLog]);

  const setQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const isWithinDate = l.date >= startDate && l.date <= endDate;
      const isCorrectBranch = user.role === Role.ADMIN || l.branchId === user.branchId;
      return isWithinDate && isCorrectBranch;
    });
  }, [logs, startDate, endDate, user]);

  const completedLogs = filteredLogs.filter(l => l.status === 'COMPLETED' && l.closingData);
  
  const totalCash = completedLogs.reduce((acc, curr) => acc + (curr.adjustedClosingData?.totalCash ?? curr.closingData?.totalCash ?? 0), 0);
  const totalTransfer = completedLogs.reduce((acc, curr) => acc + (curr.adjustedClosingData?.totalTransfer ?? curr.closingData?.totalTransfer ?? 0), 0);
  const totalDiscounts = completedLogs.reduce((acc, curr) => acc + (curr.closingData?.totalDiscounts || 0), 0);
  const totalRevenue = totalCash + totalTransfer;

  const handleConfirmSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!confirmingLog) return;

    const adjCash = parseCurrency(adjCashInput);
    const adjTransfer = parseCurrency(adjTransferInput);
    const comment = (e.currentTarget.elements.namedItem('comment') as HTMLTextAreaElement).value;

    const changes = [];
    if (adjCash !== confirmingLog.closingData?.totalCash) {
      changes.push({ field: 'Tiền mặt', from: confirmingLog.closingData?.totalCash, to: adjCash });
    }
    if (adjTransfer !== confirmingLog.closingData?.totalTransfer) {
      changes.push({ field: 'Chuyển khoản', from: confirmingLog.closingData?.totalTransfer, to: adjTransfer });
    }

    const newAudit: ShiftAuditLog = {
      id: Date.now().toString(),
      action: 'ĐỐI SOÁT & DUYỆT',
      timestamp: new Date().toLocaleString('vi-VN'),
      userName: user.name,
      comment: comment || "Đối soát ca trực hoàn tất.",
      changes: changes
    };

    setLogs(prev => prev.map(l => l.id === confirmingLog.id ? { 
      ...l, 
      isConfirmed: true, 
      confirmedBy: user.name, 
      confirmedAt: new Date().toLocaleString('vi-VN'),
      managerComment: comment,
      adjustedClosingData: { totalCash: adjCash, totalTransfer: adjTransfer },
      auditLog: [...(l.auditLog || []), newAudit]
    } : l));

    setConfirmingLog(null);
    alert('Đã chốt doanh thu sau đối soát!');
  };

  return (
    <div className="p-4 md:p-8 animate-in space-y-8 pb-20 overflow-y-auto h-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">Lapoza <span className="text-indigo-600">Finance</span></h2>
          <p className="text-sm text-slate-500 italic font-medium">Báo cáo doanh thu đã đối soát và xác nhận thực tế.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            <button onClick={() => setQuickFilter(3)} className="px-4 py-2 text-[10px] font-black uppercase hover:bg-slate-50 rounded-xl transition-all text-slate-500">3 ngày</button>
            <button onClick={() => setQuickFilter(7)} className="px-4 py-2 text-[10px] font-black uppercase hover:bg-slate-50 rounded-xl transition-all text-slate-500">7 ngày</button>
            <button onClick={() => setQuickFilter(30)} className="px-4 py-2 text-[10px] font-black uppercase hover:bg-slate-50 rounded-xl transition-all text-slate-500">Tháng</button>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-black text-slate-700 outline-none" />
            <span className="text-slate-300 font-bold">→</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-black text-slate-700 outline-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform">
            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Thực thu Doanh thu</p>
          <p className="text-3xl font-black">{formatCurrency(totalRevenue)}đ</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tiền mặt (Đã đối soát)</p>
          <p className="text-3xl font-black text-slate-800">{formatCurrency(totalCash)}đ</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chuyển khoản (Đã đối soát)</p>
          <p className="text-3xl font-black text-indigo-600">{formatCurrency(totalTransfer)}đ</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Tổng Giảm giá</p>
          <p className="text-3xl font-black text-red-500">{formatCurrency(totalDiscounts)}đ</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs tracking-widest">Danh sách chốt ca & Đối soát</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-6">Ngày / Ca</th>
                <th className="px-8 py-6">Nhân viên</th>
                <th className="px-8 py-6 text-right">Tiền mặt</th>
                <th className="px-8 py-6 text-right">Chuyển khoản</th>
                <th className="px-8 py-6 text-right">Giảm giá</th>
                <th className="px-8 py-6 text-center">Trạng thái</th>
                <th className="px-8 py-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {completedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">Không tìm thấy dữ liệu bàn giao</td>
                </tr>
              ) : (
                completedLogs.map((log) => (
                  <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-800 text-sm">{log.date}</p>
                      <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">Ca {log.type.split('_').pop()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <img src={log.userAvatar} className="w-8 h-8 rounded-xl bg-slate-100 shadow-sm" alt="avatar" />
                        <span className="font-bold text-slate-600 text-sm">{log.userName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-slate-700">
                      {formatCurrency(log.adjustedClosingData?.totalCash ?? log.closingData?.totalCash ?? 0)}đ
                    </td>
                    <td className="px-8 py-6 text-right font-black text-indigo-600">
                      {formatCurrency(log.adjustedClosingData?.totalTransfer ?? log.closingData?.totalTransfer ?? 0)}đ
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-red-400">
                      -{formatCurrency(log.closingData?.totalDiscounts || 0)}đ
                    </td>
                    <td className="px-8 py-6 text-center">
                       {log.isConfirmed ? (
                          <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">ĐÃ DUYỆT</span>
                       ) : (
                          <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">CHỜ DUYỆT</span>
                       )}
                    </td>
                    <td className="px-8 py-6 text-right">
                       {!log.isConfirmed ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmingLog(log); }}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                          >
                            Duyệt đối soát
                          </button>
                       ) : (
                          <span className="text-[10px] text-slate-300 font-black uppercase">Chi tiết</span>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmingLog && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[120] p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-in p-10">
              <h3 className="text-2xl font-black text-slate-800 mb-6 italic">Xác nhận <span className="text-indigo-600">Đối soát ca</span></h3>
              <form onSubmit={handleConfirmSubmit} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Tiền mặt (NV chốt)</label>
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-400 text-sm">
                          {formatCurrency(confirmingLog.closingData?.totalCash || 0)}đ
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-indigo-400 uppercase ml-4 tracking-widest">Tiền mặt (Xác nhận)</label>
                       <input 
                          name="adjCash" 
                          value={adjCashInput}
                          onChange={(e) => setAdjCashInput(formatCurrency(e.target.value))}
                          className="w-full bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 rounded-2xl px-4 py-4 outline-none font-black text-indigo-700" 
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">C.Khoản (NV chốt)</label>
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-400 text-sm">
                          {formatCurrency(confirmingLog.closingData?.totalTransfer || 0)}đ
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-indigo-400 uppercase ml-4 tracking-widest">C.Khoản (Xác nhận)</label>
                       <input 
                          name="adjTransfer" 
                          value={adjTransferInput}
                          onChange={(e) => setAdjTransferInput(formatCurrency(e.target.value))}
                          className="w-full bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 rounded-2xl px-4 py-4 outline-none font-black text-indigo-700" 
                        />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Ghi chú đối soát</label>
                    <textarea name="comment" rows={3} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-medium text-sm" placeholder="Lý do điều chỉnh hoặc nhận xét..."></textarea>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setConfirmingLog(null)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black">Hủy</button>
                    <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">Chốt & Lưu</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[110] p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl animate-in p-8 overflow-y-auto max-h-[95vh] relative">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
               <h3 className="text-2xl font-black text-slate-800 italic">Chi tiết <span className="text-indigo-600">Báo cáo & Đối soát</span></h3>
               <button onClick={() => setSelectedLog(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
               <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Hình ảnh Ra Ca</p>
                     <div className="aspect-video bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                        {selectedLog.checkOutPhoto ? <img src={selectedLog.checkOutPhoto} className="w-full h-full object-cover" alt="check-out" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-xs">Không có ảnh</div>}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tổng số bill</p>
                       <p className="text-lg font-black text-slate-800">{selectedLog.closingData?.totalBills || 0}</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Dư đầu ca</p>
                       <p className="text-lg font-black text-slate-800">{formatCurrency(selectedLog.closingData?.openingBalance || 0)}đ</p>
                    </div>
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl col-span-2 shadow-sm">
                       <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Tiền mặt bàn giao thực tế</p>
                       <p className="text-xl font-black text-indigo-700">{formatCurrency(selectedLog.closingData?.closingBalance || 0)}đ</p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase mb-3 italic">Ghi chú & Sự cố</p>
                     <p className="text-sm text-slate-600 font-bold italic leading-relaxed">"{selectedLog.closingData?.incidents || 'Không có ghi nhận'}"</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400">Kết quả Đối soát</h4>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                       <span className="text-[10px] font-bold text-white/60">Tiền mặt xác nhận</span>
                       <span className="text-base font-black">{formatCurrency(selectedLog.adjustedClosingData?.totalCash ?? selectedLog.closingData?.totalCash ?? 0)}đ</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                       <span className="text-[10px] font-bold text-white/60">Chuyển khoản xác nhận</span>
                       <span className="text-base font-black text-indigo-400">{formatCurrency(selectedLog.adjustedClosingData?.totalTransfer ?? selectedLog.closingData?.totalTransfer ?? 0)}đ</span>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                       <p className="text-[9px] font-black text-white/40 uppercase mb-1">Thực thu doanh thu thuần ca này</p>
                       <p className="text-3xl font-black text-indigo-500">
                          {formatCurrency((selectedLog.adjustedClosingData?.totalCash ?? selectedLog.closingData?.totalCash ?? 0) + (selectedLog.adjustedClosingData?.totalTransfer ?? selectedLog.closingData?.totalTransfer ?? 0))}đ
                       </p>
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Chi tiết Giảm giá / Chiết khấu</h4>
                       <span className="bg-red-50 text-red-500 px-3 py-1 rounded-lg font-black text-[10px]">-{formatCurrency(selectedLog.closingData?.totalDiscounts || 0)}đ</span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                       {selectedLog.closingData?.discountsDetails && selectedLog.closingData.discountsDetails.length > 0 ? (
                         selectedLog.closingData.discountsDetails.map((disc, idx) => (
                           <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                              <div>
                                 <p className="text-xs font-black text-slate-800">Bill #{disc.billId}</p>
                                 <p className="text-[9px] text-slate-400 italic font-bold">{disc.reason}</p>
                              </div>
                              <span className="text-xs font-black text-red-500">-{formatCurrency(disc.amount)}đ</span>
                           </div>
                         ))
                       ) : <p className="text-center text-[10px] text-slate-300 py-4 italic">Không có chiết khấu</p>}
                    </div>
                  </div>

                  {selectedLog.isConfirmed && (
                    <div className="p-6 bg-green-50 border border-green-100 rounded-[2rem]">
                       <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          <p className="text-[10px] font-black text-green-700 uppercase italic">Hoàn tất đối soát bởi {selectedLog.confirmedBy}</p>
                       </div>
                       <p className="text-xs text-slate-600 font-medium italic">"{selectedLog.managerComment || 'Ca trực đã được kiểm duyệt hợp lệ.'}"</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nhật ký Audit & Lịch sử thay đổi</h4>
               <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-4 border border-slate-100 shadow-inner">
                  {selectedLog.auditLog && selectedLog.auditLog.length > 0 ? (
                    selectedLog.auditLog.map(audit => (
                      <div key={audit.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                         <div className="shrink-0 md:w-40 border-r border-slate-50 pr-4">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter mb-1">{audit.action}</p>
                            <p className="text-[9px] text-slate-400 font-bold">{audit.timestamp}</p>
                         </div>
                         <div className="flex-1 space-y-2">
                            {audit.changes && audit.changes.length > 0 && (
                              <div className="space-y-1 py-1">
                                 {audit.changes.map((change, i) => (
                                   <p key={i} className="text-[10px] text-slate-600">
                                      <span className="font-bold">{change.field}:</span> {formatCurrency(change.from)}đ <span className="text-indigo-400 mx-1">→</span> <span className="font-black text-slate-800">{formatCurrency(change.to)}đ</span>
                                   </p>
                                 ))}
                              </div>
                            )}
                            {audit.comment && <p className="text-[11px] text-slate-500 italic p-3 bg-slate-50 rounded-xl">"{audit.comment}"</p>}
                            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Người thực hiện: {audit.userName}</p>
                         </div>
                      </div>
                    ))
                  ) : <p className="text-center text-xs text-slate-300 py-6 italic">Không có nhật ký tác động.</p>}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
