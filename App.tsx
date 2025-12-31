
import React, { useState, useEffect } from 'react';
import { User, Role, UserStatus, Branch, ShiftRecord, Assignment, ScheduleLog, LeaveRequest, AppNotification, Regulation } from './types';
import StaffDashboard from './components/Dashboard/StaffDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import ScheduleView from './components/Views/ScheduleView';
import ScheduleManagementView from './components/Views/ScheduleManagementView';
import AttendanceLogView from './components/Views/AttendanceLogView';
import ReportsView from './components/Views/ReportsView';
import RequestsView from './components/Views/RequestsView';
import SystemConfigView from './components/Views/SystemConfigView';
import StaffManagementView from './components/Views/StaffManagementView';
import AttendanceReportView from './components/Views/AttendanceReportView';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';

type TabId = 'dashboard' | 'schedule' | 'schedule-mgt' | 'requests' | 'attendance' | 'reports' | 'config' | 'staff-mgt' | 'attendance-report';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [branches, setBranches] = useState<Branch[]>([
    { 
      id: '1', name: 'Chi nhánh Quận 1', lat: 10.7769, lng: 106.7009, radius: 100, address: '72 Lê Thánh Tôn, Quận 1', isActive: true,
      shifts: {
        'SHIFT_1': { name: 'Ca 1', start: '08:00', end: '12:00' },
        'SHIFT_2': { name: 'Ca 2', start: '12:00', end: '17:00' },
        'SHIFT_3': { name: 'Ca 3', start: '17:00', end: '22:00' }
      }
    },
    { 
      id: '2', name: 'Chi nhánh Quận 7', lat: 10.7289, lng: 106.7082, radius: 150, address: '101 Tôn Dật Tiên, Quận 7', isActive: true,
      shifts: {
        'SHIFT_1': { name: 'Ca Sáng', start: '07:30', end: '11:30' },
        'SHIFT_2': { name: 'Ca Chiều', start: '11:30', end: '16:30' },
        'SHIFT_3': { name: 'Ca Tối', start: '16:30', end: '21:30' }
      }
    },
  ]);

  const [users, setUsers] = useState<User[]>([
    { id: 'admin_1', username: 'admin', name: 'Hệ thống Admin', email: 'admin@lapoza.com', password: '123', role: Role.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', status: UserStatus.WORKING, isFirstLogin: false, confirmedRegulations: [] },
    { id: 'manager_1', username: 'quanly', name: 'Quản lý Chi nhánh', email: 'manager@lapoza.com', password: '123', role: Role.MANAGER, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manager', status: UserStatus.WORKING, branchId: '1', isFirstLogin: false, confirmedRegulations: [] },
    { id: 'staff_1', username: 'nv1', name: 'Nhân viên 1', email: 'nv1@lapoza.com', password: '123', role: Role.STAFF, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Staff1', status: UserStatus.WORKING, branchId: '1', isFirstLogin: false, confirmedRegulations: [] },
  ]);

  const [attendanceLogs, setAttendanceLogs] = useState<ShiftRecord[]>([]);
  const [scheduleLogs, setScheduleLogs] = useState<ScheduleLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 'n1', title: 'Chào mừng Lapoza v1.0', content: 'Hệ thống quản lý Lapoza chính thức đi vào hoạt động. Vui lòng kiểm tra lịch trực thường xuyên.', date: '2024-03-20', authorName: 'Admin' }
  ]);
  const [regulations, setRegulations] = useState<Regulation[]>([
    { id: 'r1', title: 'Nội quy chấm công', content: '1. Nhân viên phải có mặt trước 5 phút để chuẩn bị.\n2. Phải chụp ảnh rõ mặt khi điểm danh.\n3. Vị trí điểm danh phải nằm trong bán kính cho phép của chi nhánh.', updatedAt: '2024-03-15' }
  ]);

  const todayDate = new Date().toISOString().split('T')[0];
  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: 'a1', userId: 'staff_1', date: todayDate, shiftType: 'SHIFT_1', updatedAt: new Date().toISOString(), updatedBy: 'Admin' },
    { id: 'a-mgr', userId: 'manager_1', date: todayDate, shiftType: 'SHIFT_1', updatedAt: new Date().toISOString(), updatedBy: 'Admin' },
  ]);

  const handleLogin = (u: User) => {
    setUser(u);
    setActiveTab('dashboard');
  };

  const handlePasswordUpdate = (newPass: string) => {
    if (!user) return;
    const updatedUser = { ...user, password: newPass, isFirstLogin: false };
    setUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setIsChangingPassword(false);
    alert('Đổi mật khẩu thành công!');
  };

  const addAttendanceLog = (log: ShiftRecord) => {
    setAttendanceLogs(prev => {
      const exists = prev.findIndex(l => l.id === log.id);
      if (exists > -1) {
        const newLogs = [...prev];
        newLogs[exists] = { ...log, branchId: user?.branchId };
        return newLogs;
      }
      return [{ ...log, branchId: user?.branchId }, ...prev];
    });
  };

  const addNotification = (notif: AppNotification) => {
    setNotifications(prev => [notif, ...prev]);
  };

  const confirmRegulation = (regId: string) => {
    if (!user) return;
    const updatedUser = { 
      ...user, 
      confirmedRegulations: [...(user.confirmedRegulations || []), regId] 
    };
    setUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    alert('Đã xác nhận đọc quy định!');
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'requests', label: 'Yêu cầu', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'attendance', label: 'Điểm danh', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  if (user?.role !== Role.ADMIN) {
     navItems.splice(1, 0, { id: 'schedule', label: 'Lịch của tôi', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' });
  }

  if (user?.role === Role.ADMIN || user?.role === Role.MANAGER) {
    navItems.push({ id: 'schedule-mgt', label: 'Điều phối', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' });
    navItems.push({ id: 'attendance-report', label: 'Chấm công', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' });
    navItems.push({ id: 'staff-mgt', label: 'Nhân sự', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' });
    navItems.push({ id: 'reports', label: 'Báo cáo', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' });
  }

  if (user?.role === Role.ADMIN) {
    navItems.push({ id: 'config', label: 'Hệ thống', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' });
  }

  if (!user) return <Login onLogin={handleLogin} users={users} />;
  
  // Hiển thị đổi mật khẩu lần đầu hoặc khi nhấn đổi mật khẩu
  if (user.isFirstLogin || isChangingPassword) {
    return <ChangePassword onPasswordChange={handlePasswordUpdate} onCancel={() => setIsChangingPassword(false)} showCancel={!user.isFirstLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return user.role === Role.STAFF 
          ? <StaffDashboard user={user} branches={branches} onAttendanceUpdate={addAttendanceLog} attendanceLogs={attendanceLogs} assignments={assignments} notifications={notifications} regulations={regulations} onConfirmRegulation={confirmRegulation} />
          : <AdminDashboard 
              user={user} 
              logs={attendanceLogs} 
              leaveRequests={leaveRequests} 
              setLeaveRequests={setLeaveRequests} 
              assignments={assignments} 
              onAddNotification={addNotification} 
              notifications={notifications} 
              regulations={regulations} 
              setRegulations={setRegulations}
              branches={branches}
              onAttendanceUpdate={addAttendanceLog}
            />;
      case 'schedule':
        return <ScheduleView role={user.role} assignments={assignments} currentUserId={user.id} branches={branches} />;
      case 'schedule-mgt':
        return <ScheduleManagementView branches={branches} assignments={assignments} setAssignments={setAssignments} logs={scheduleLogs} setLogs={setScheduleLogs} requests={leaveRequests} user={user} users={users} />;
      case 'requests':
        return <RequestsView user={user} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} setUsers={setUsers} users={users} />;
      case 'attendance':
        return <AttendanceLogView role={user.role} logs={attendanceLogs} setLogs={setAttendanceLogs} userId={user.id} branches={branches} managerName={user.name} />;
      case 'attendance-report':
        return <AttendanceReportView role={user.role} logs={attendanceLogs} user={user} branches={branches} assignments={assignments} users={users} />;
      case 'reports':
        return <ReportsView role={user.role} logs={attendanceLogs} setLogs={setAttendanceLogs} user={user} branches={branches} />;
      case 'config':
        return <SystemConfigView branches={branches} setBranches={setBranches} />;
      case 'staff-mgt':
        return <StaffManagementView role={user.role} branches={branches} users={users} setUsers={setUsers} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-100 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-xl">LZ</div>
            <span className="text-2xl font-black text-slate-800 tracking-tighter italic">Lapoza <span className="text-indigo-600">v1.0</span></span>
          </div>
          <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id as TabId); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] font-black transition-all text-sm ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}>
                <svg className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon}></path></svg>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="pt-8 border-t border-slate-100 space-y-2">
            <button onClick={() => { setIsChangingPassword(true); setIsSidebarOpen(false); }} className="w-full flex items-center gap-4 px-5 py-4 text-slate-400 font-black hover:bg-slate-50 hover:text-slate-800 rounded-[1.5rem] transition-all text-sm group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
              Đổi mật khẩu
            </button>
            <button onClick={() => setUser(null)} className="w-full flex items-center gap-4 px-5 py-4 text-red-500 font-black hover:bg-red-50 rounded-[1.5rem] transition-all text-sm group">
              <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
          <div className="flex-1 px-4"><h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight italic">{navItems.find(i => i.id === activeTab)?.label}</h2></div>
          <div className="flex items-center gap-6 text-right"><div className="hidden sm:block"><p className="text-sm font-black text-slate-800 tracking-tight">{user.name}</p><p className="text-[10px] text-indigo-500 uppercase tracking-[0.2em] font-black">{user.role}</p></div><img src={user.avatar} className="w-12 h-12 rounded-2xl border-4 border-slate-100 shadow-sm" alt="profile" /></div>
        </header>
        <div className="flex-1 overflow-y-auto bg-slate-50/50">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
