
import React, { useState } from 'react';
import { Branch, ShiftType, ShiftConfig } from '../../types';

interface SystemConfigViewProps {
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
}

const SystemConfigView: React.FC<SystemConfigViewProps> = ({ branches, setBranches }) => {
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleBranchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingBranch) return;
    const { name, value } = e.target;
    setEditingBranch({
      ...editingBranch,
      [name]: name === 'lat' || name === 'lng' || name === 'radius' ? parseFloat(value) : value
    });
  };

  const handleShiftChange = (type: string, field: 'start' | 'end', value: string) => {
    if (!editingBranch) return;
    setEditingBranch({
      ...editingBranch,
      shifts: {
        ...editingBranch.shifts,
        [type]: { ...(editingBranch.shifts as any)[type], [field]: value }
      }
    });
  };

  const removeShift = (type: string) => {
    if (!editingBranch) return;
    const newShifts = { ...editingBranch.shifts } as any;
    delete newShifts[type];
    setEditingBranch({ ...editingBranch, shifts: newShifts });
  };

  const addShift = () => {
    if (!editingBranch) return;
    const currentCount = Object.keys(editingBranch.shifts).length;
    const nextKey = `SHIFT_${currentCount + 1}` as ShiftType;
    setEditingBranch({
      ...editingBranch,
      shifts: { ...editingBranch.shifts, [nextKey]: { name: `Ca ${currentCount + 1}`, start: '09:00', end: '18:00' } }
    });
  };

  const updateFromGPS = () => {
    if (!editingBranch) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditingBranch({
          ...editingBranch,
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6))
        });
        setIsLocating(false);
        alert('Tọa độ đã được cập nhật chính xác theo vị trí thực tế của bạn!');
      },
      (err) => {
        alert('Lỗi: Vui lòng cấp quyền GPS cho trình duyệt.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const saveBranch = () => {
    if (!editingBranch) return;
    const exists = branches.some(b => b.id === editingBranch.id);
    if (exists) {
      setBranches(prev => prev.map(b => b.id === editingBranch.id ? editingBranch : b));
    } else {
      setBranches(prev => [...prev, { ...editingBranch, isActive: true }]);
    }
    setEditingBranch(null);
    alert('Đã lưu cấu hình chi nhánh thành công!');
  };

  const createNewBranch = () => {
    const newBranch: Branch = {
      id: Date.now().toString(),
      name: 'Chi nhánh mới',
      lat: 10.7769,
      lng: 106.7009,
      radius: 100,
      address: 'Nhập địa chỉ...',
      isActive: true,
      shifts: {
        'SHIFT_1': { name: 'Ca Sáng', start: '08:00', end: '12:00' },
        'SHIFT_2': { name: 'Ca Chiều', start: '12:00', end: '17:00' }
      }
    };
    setEditingBranch(newBranch);
  };

  const toggleBranchStatus = (id: string) => {
    setBranches(prev => prev.map(b => {
      if (b.id === id) {
        const nextStatus = !b.isActive;
        return { ...b, isActive: nextStatus };
      }
      return b;
    }));
  };

  return (
    <div className="p-4 md:p-8 animate-in space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 italic tracking-tight">Cấu hình <span className="text-indigo-600">Core</span></h2>
          <p className="text-sm text-slate-500 font-medium italic underline">Quản lý mạng lưới chi nhánh và định vị điểm danh.</p>
        </div>
        <button 
          onClick={createNewBranch}
          className="bg-indigo-600 text-white px-10 py-4 rounded-[2rem] text-sm font-black shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
          Thêm chi nhánh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {branches.map(branch => (
          <div key={branch.id} className={`bg-white border-2 rounded-[3.5rem] p-10 shadow-sm transition-all relative group ${branch.isActive ? 'border-slate-100' : 'border-red-100 opacity-80'}`}>
            {editingBranch?.id === branch.id ? (
              <div className="space-y-6 animate-in">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-black text-indigo-600 text-xl tracking-tight italic">Thiết lập chi nhánh</h3>
                   <div className="flex gap-2">
                      <button onClick={saveBranch} className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Lưu</button>
                      <button onClick={() => setEditingBranch(null)} className="bg-slate-100 text-slate-500 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Hủy</button>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Tên chi nhánh</label>
                    <input name="name" value={editingBranch.name} onChange={handleBranchChange} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-black text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Địa chỉ</label>
                    <input name="address" value={editingBranch.address || ''} onChange={handleBranchChange} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-black text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Vĩ độ</label>
                    <input name="lat" type="number" step="0.000001" value={editingBranch.lat} onChange={handleBranchChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Kinh độ</label>
                    <input name="lng" type="number" step="0.000001" value={editingBranch.lng} onChange={handleBranchChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-sm outline-none" />
                  </div>
                  <div className="col-span-2">
                    <button onClick={updateFromGPS} disabled={isLocating} className="w-full py-4 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl">
                      {isLocating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>}
                      Cập nhật GPS tại vị trí hiện tại
                    </button>
                  </div>
                </div>

                <div className="p-8 bg-indigo-50/50 rounded-[3rem] border border-indigo-100">
                  <div className="flex justify-between items-center mb-6">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ca trực định sẵn</label>
                    <button onClick={addShift} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg></button>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(editingBranch.shifts).map(([type, details]) => {
                      // Fixed: Cast details to ShiftConfig to fix unknown type and spread errors
                      const config = details as ShiftConfig;
                      return (
                        <div key={type} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                          <input type="text" value={config.name} onChange={(e) => {
                              if (!editingBranch) return;
                              setEditingBranch({
                                ...editingBranch,
                                shifts: { ...editingBranch.shifts, [type]: { ...config, name: e.target.value } }
                              });
                            }} className="bg-slate-50 border-none text-[10px] font-black text-slate-600 w-24 px-3 py-1.5 rounded-lg outline-none" />
                          <div className="flex-1 flex items-center gap-2 justify-center">
                             <input type="time" value={config.start} onChange={(e) => handleShiftChange(type, 'start', e.target.value)} className="bg-slate-50 border-none text-xs font-black text-indigo-600 rounded-lg p-2 outline-none" />
                             <span className="text-slate-300 font-bold">→</span>
                             <input type="time" value={config.end} onChange={(e) => handleShiftChange(type, 'end', e.target.value)} className="bg-slate-50 border-none text-xs font-black text-indigo-600 rounded-lg p-2 outline-none" />
                          </div>
                          <button onClick={() => removeShift(type)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full relative">
                <div className="flex justify-between items-start mb-10">
                  <div className={`p-6 text-white rounded-[1.5rem] shadow-xl ${branch.isActive ? 'bg-indigo-600 shadow-indigo-100' : 'bg-slate-400 shadow-slate-50 grayscale'}`}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingBranch(branch)} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                      onClick={() => toggleBranchStatus(branch.id)} 
                      className={`p-3 rounded-2xl transition-all opacity-0 group-hover:opacity-100 shadow-sm ${branch.isActive ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`} 
                      title={branch.isActive ? "Ngừng kích hoạt" : "Kích hoạt"}
                    >
                      {branch.isActive ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5.636 18.364a9 9 0 0112.728-12.728m-12.728 12.728L18.364 5.636M5.636 18.364a9 9 0 0012.728 12.728"></path></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className={`text-2xl font-black tracking-tight ${branch.isActive ? 'text-slate-800' : 'text-slate-400 italic'}`}>{branch.name}</h3>
                    {!branch.isActive && <span className="bg-red-50 text-red-600 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-red-100">Ngừng hoạt động</span>}
                  </div>
                  <p className="text-xs text-slate-400 font-bold mb-8 italic">{branch.address}</p>
                  <div className={`flex gap-4 text-[10px] font-black uppercase tracking-[0.2em] mb-10 p-5 rounded-3xl border ${branch.isActive ? 'text-indigo-500 bg-slate-50 border-slate-100 shadow-inner' : 'text-slate-300 bg-slate-100 border-slate-200 grayscale'}`}>
                    <span>Vĩ độ: {branch.lat}</span>
                    <span className="text-slate-200 font-normal">|</span>
                    <span>Kinh độ: {branch.lng}</span>
                  </div>
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 ml-4">Lịch biểu chi nhánh</p>
                    {Object.values(branch.shifts).map((s: any) => (
                      <div key={s.name} className={`flex justify-between items-center p-5 rounded-2xl border border-slate-50 transition-all ${branch.isActive ? 'bg-slate-50/50 hover:border-indigo-100 hover:bg-white' : 'bg-slate-200/20'}`}>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">{s.name}</span>
                        <span className={`text-sm font-black ${branch.isActive ? 'text-slate-800' : 'text-slate-400'}`}>{s.start} - {s.end}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {editingBranch && !branches.some(b => b.id === editingBranch.id) && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[110] p-4 overflow-y-auto">
          <div className="bg-white rounded-[4rem] w-full max-w-xl shadow-2xl animate-in p-12 overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-slate-800 mb-10 tracking-tight italic">Thiết lập <span className="text-indigo-600">Chi nhánh mới</span></h3>
            <div className="space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-6">Tên chi nhánh</label>
                    <input name="name" value={editingBranch.name} onChange={handleBranchChange} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-[1.5rem] px-8 py-5 text-sm font-black outline-none" placeholder="Lapoza..." />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-6">Địa chỉ</label>
                    <input name="address" value={editingBranch.address || ''} onChange={handleBranchChange} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-[1.5rem] px-8 py-5 text-sm font-black outline-none" placeholder="Nhập số nhà, tên đường..." />
                  </div>
               </div>
               <div className="flex gap-4 pt-6">
                  <button onClick={() => setEditingBranch(null)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase tracking-widest">Hủy</button>
                  <button onClick={saveBranch} className="flex-[2] py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl">Lưu Chi nhánh</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemConfigView;
