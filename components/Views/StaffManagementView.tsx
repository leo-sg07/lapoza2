
import React, { useState } from 'react';
import { User, Role, UserStatus, Branch } from '../../types';

interface StaffManagementViewProps {
  role: Role;
  branches: Branch[];
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const StaffManagementView: React.FC<StaffManagementViewProps> = ({ role, branches, users, setUsers }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const isAdmin = role === Role.ADMIN;

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    const formData = new FormData(e.currentTarget);
    const userData: User = {
      id: editingUser?.id || `staff_${Date.now()}`,
      username: formData.get('username') as string,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as Role,
      status: formData.get('status') as UserStatus,
      branchId: formData.get('branchId') as string,
      avatar: editingUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.get('username')}`,
      password: editingUser?.password || '123',
      isFirstLogin: editingUser ? editingUser.isFirstLogin : false,
      confirmedRegulations: editingUser?.confirmedRegulations || []
    };

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? userData : u));
    } else {
      setUsers([...users, userData]);
    }
    setShowModal(false);
    setEditingUser(null);
  };

  const handleResetPassword = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Reset mật khẩu nhân viên này về "123"?')) {
      setUsers(users.map(u => u.id === id ? { ...u, password: '123' } : u));
      alert('Đã reset thành công về mật khẩu mặc định.');
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (!isAdmin) return;
    if (window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản của [${name}] không? Hành động này không thể hoàn tác.`)) {
      setUsers(prev => prev.filter(u => u.id !== id));
      alert(`Đã xóa tài khoản ${name} khỏi hệ thống.`);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-in space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">Quản lý <span className="text-indigo-600">Nhân sự</span></h2>
          <p className="text-sm text-slate-500 font-medium italic underline">Hệ thống phân quyền Lapoza Core.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setEditingUser(null); setShowModal(true); }}
            className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] text-sm font-black shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            Thêm tài khoản
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-6">Nhân viên / Liên hệ</th>
                <th className="px-8 py-6">Vai trò</th>
                <th className="px-8 py-6">Chi nhánh</th>
                <th className="px-8 py-6 text-center">Trạng thái</th>
                <th className="px-8 py-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="text-sm text-slate-700 hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <img src={u.avatar} className="w-12 h-12 rounded-2xl border-2 border-slate-100 group-hover:scale-110 transition-transform" alt={u.name} />
                      <div>
                        <p className="font-black text-slate-800">{u.name}</p>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">@{u.username} • {u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${u.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : u.role === Role.MANAGER ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-bold text-slate-600 italic">
                    {branches.find(b => b.id === u.branchId)?.name || 'Hệ thống'}
                  </td>
                  <td className="px-8 py-6 text-center">
                    {u.status === UserStatus.WORKING ? (
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Đang làm việc</span>
                    ) : (
                      <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100">Đã nghỉ việc</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {isAdmin && (
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleResetPassword(u.id)} className="text-amber-500 hover:bg-amber-50 p-2.5 rounded-xl transition-all" title="Reset mật khẩu">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                        <button onClick={() => { setEditingUser(u); setShowModal(true); }} className="text-indigo-600 hover:bg-indigo-50 p-2.5 rounded-xl transition-all" title="Sửa thông tin">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteUser(u.id, u.name)} className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all" title="Xóa tài khoản">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-in p-10 overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight italic">{editingUser ? 'Cập nhật thông tin' : 'Tạo tài khoản mới'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Họ và tên</label>
                <input name="name" required defaultValue={editingUser?.name} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none transition-all font-bold" placeholder="VD: Nguyễn Văn A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tên đăng nhập</label>
                  <input name="username" required defaultValue={editingUser?.username} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none transition-all font-bold" placeholder="nv123" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email liên hệ</label>
                  <input name="email" type="email" required defaultValue={editingUser?.email} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none transition-all font-bold" placeholder="abc@lapoza.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Vai trò</label>
                  <select name="role" defaultValue={editingUser?.role || Role.STAFF} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-bold">
                    <option value={Role.STAFF}>Nhân viên</option>
                    <option value={Role.MANAGER}>Quản lý</option>
                    <option value={Role.ADMIN}>Admin hệ thống</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chi nhánh</label>
                  <select name="branchId" defaultValue={editingUser?.branchId} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-bold">
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Trạng thái làm việc</label>
                <select name="status" defaultValue={editingUser?.status || UserStatus.WORKING} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-bold">
                  <option value={UserStatus.WORKING}>Đang làm việc (Kích hoạt)</option>
                  <option value={UserStatus.RESIGNED}>Đã nghỉ việc (Vô hiệu hóa)</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black transition-all">Hủy</button>
                <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">Lưu dữ liệu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementView;
