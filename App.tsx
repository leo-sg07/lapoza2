
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
import { db } from './lib/supabase';

type TabId = 'dashboard' | 'schedule' | 'schedule-mgt' | 'requests' | 'attendance' | 'reports' | 'config' | 'staff-mgt' | 'attendance-report';

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(`lapoza_${key}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
};

const DEFAULT_ADMIN: User = {
  id: 'admin_root',
  username: 'admin',
  name: 'Quản trị viên Hệ thống',
  email: 'admin@lapoza.com',
  password: '123',
  role: Role.ADMIN,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  status: UserStatus.WORKING,
  isFirstLogin: false
};

const App: React.FC = () => {
  // Duy trì phiên đăng nhập: Khởi tạo user từ localStorage
  const [user, setUser] = useState<User | null>(() => loadFromStorage('currentUser', null));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // States
  const [branches, setBranches] = useState<Branch[]>(() => loadFromStorage('branches', []));
  const [users, setUsers] = useState<User[]>(() => loadFromStorage('users', []));
  const [attendanceLogs, setAttendanceLogs] = useState<ShiftRecord[]>(() => loadFromStorage('attendanceLogs', []));
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => loadFromStorage('leaveRequests', []));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadFromStorage('notifications', []));
  const [regulations, setRegulations] = useState<Regulation[]>(() => loadFromStorage('regulations', []));
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadFromStorage('assignments', []));
  const [scheduleLogs, setScheduleLogs] = useState<ScheduleLog[]>(() => loadFromStorage('scheduleLogs', []));

  // 1. Initial Load từ Supabase
  useEffect(() => {
    const initData = async () => {
      setIsSyncing(true);
      try {
        const data = await db.fetchInitialData();
        
        // Cập nhật state nếu có dữ liệu từ Cloud
        if (data.users.length > 0) {
          setUsers(data.users);
          // Cập nhật thông tin user hiện tại nếu có thay đổi từ Cloud (như đổi quyền, đổi tên)
          if (user) {
            const latestUser = data.users.find((u: User) => u.id === user.id);
            if (latestUser) {
              setUser(latestUser);
              localStorage.setItem('lapoza_currentUser', JSON.stringify(latestUser));
            }
          }
        } else {
          setUsers([DEFAULT_ADMIN]);
        }

        if (data.branches.length > 0) setBranches(data.branches);
        if (data.attendanceLogs.length > 0) setAttendanceLogs(data.attendanceLogs);
        if (data.leaveRequests.length > 0) setLeaveRequests(data.leaveRequests);
      } catch (e) {
        console.error("Cloud loading failed, using offline cache.");
        if (users.length === 0) setUsers([DEFAULT_ADMIN]);
      } finally {
        setIsSyncing(false);
      }
    };
    initData();
  }, []);

  // 2. Persistence to LocalStorage (Cache)
  useEffect(() => { localStorage.setItem('lapoza_branches', JSON.stringify(branches)); }, [branches]);
  useEffect(() => { localStorage.setItem('lapoza_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('lapoza_attendanceLogs', JSON.stringify(attendanceLogs)); }, [attendanceLogs]);
  useEffect(() => { localStorage.setItem('lapoza_leaveRequests', JSON.stringify(leaveRequests)); }, [leaveRequests]);
  useEffect(() => { localStorage.setItem('lapoza_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('lapoza_regulations', JSON.stringify(regulations)); }, [regulations]);
  useEffect(() => { localStorage.setItem('lapoza_assignments', JSON.stringify(assignments)); }, [assignments]);

  // 3. Tự động đồng bộ lên Supabase
  useEffect(() => { 
    const syncAll = async () => {
      if (branches.length > 0) await db.syncBranches(branches);
      if (users.length > 0) await db.syncUsers(users);
      if (attendanceLogs.length > 0) await db.syncLogs(attendanceLogs);
      if (leaveRequests.length > 0) await db.syncRequests(leaveRequests);
    };
    syncAll();
  }, [branches, users, attendanceLogs, leaveRequests]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('lapoza_currentUser', JSON.stringify(u));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      setUser(null);
      localStorage.removeItem('lapoza_currentUser');
    }
  };

  const handlePasswordUpdate = (newPass: string) => {
    if (!user) return;
    const updatedUser = { ...user, password: newPass, isFirstLogin: false };
    setUser(updatedUser);
    localStorage.setItem('lapoza_currentUser', JSON.stringify(updatedUser));
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
    localStorage.setItem('lapoza_currentUser', JSON.stringify(updatedUser));
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    alert('Đã xác nhận đọc quy định!');
  };

  const handleExportData = () => {
    const backupData = { branches, users, attendanceLogs, leaveRequests, notifications, regulations, assignments, backupDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lapoza_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (data: any) => {
    if (window.confirm("CẢNH BÁO: Việc nhập file sẽ ghi đè dữ liệu. Bạn có chắc chắn?")) {
      if (data.branches) setBranches(data.branches);
      if (data.users) setUsers(data.users);
      if (data.attendanceLogs) setAttendanceLogs(data.attendanceLogs);
      if (data.leaveRequests) setLeaveRequests(data.leaveRequests);
      alert("Đã khôi phục dữ liệu!");
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'requests', label: 'Yêu cầu', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'attendance', label: 'Nhật ký', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  if (user?.role !== Role.ADMIN) {
     navItems.splice(1, 0, { id: 'schedule', label: 'Lịch của tôi', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' });
  }

  if (user?.role === Role.ADMIN || user?.role === Role.MANAGER) {
    navItems.push({ id: 'schedule-mgt', label: 'Điều phối', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' });
    navItems.push({ id: 'attendance-report', label: 'Chấm công', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' });
    navItems.push({ id: 'staff-mgt', label: 'Nhân sự', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' });
    navItems.push({ id: 'reports', label: 'Tài chính', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' });
  }

  if (user?.role === Role.ADMIN) {
    navItems.push({ id: 'config', label: 'Hệ thống', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' });
  }

  if (!user) return <Login onLogin={handleLogin} users={users} />;
  
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
        return <SystemConfigView branches={branches} setBranches={setBranches} onExportData={handleExportData} onImportData={handleImportData} />;
      case 'staff-mgt':
        return <StaffManagementView role={user.role} branches={branches} users={users} setUsers={setUsers} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {isSyncing && (
        <div className="fixed top-4 right-4 z-[200] bg-white border border-indigo-100 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 animate-in">
           <div className="w-3 h-3 bg-indigo-600 rounded-full animate-ping"></div>
           <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Đang đồng bộ DB...</span>
        </div>
      )}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-100 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-xl">LZ</div>
            <span className="text-2xl font-black text-slate-800 tracking-tighter italic">Lapoza <span className="text-indigo-600">Pro</span></span>
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
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 text-red-500 font-black hover:bg-red-50 rounded-[1.5rem] transition-all text-sm group">
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
