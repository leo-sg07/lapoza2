
import { createClient } from '@supabase/supabase-js';

// Thông tin kết nối chính thức từ người dùng
const supabaseUrl = 'https://aenuuxonxfphbxbqloxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbnV1eG9ueGZwaGJ4YnFsb3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNTM2NjgsImV4cCI6MjA4MjcyOTY2OH0.AxXLjVBt9Jrcin_4vZXBRxVbzBUEDlc8uYqg1lYpZCc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  // Tải toàn bộ dữ liệu khi khởi động App
  async fetchInitialData() {
    try {
      const { data: branches } = await supabase.from('branches').select('*');
      const { data: users } = await supabase.from('users').select('*');
      const { data: logs } = await supabase.from('attendance_logs').select('*').order('date', { ascending: false });
      const { data: requests } = await supabase.from('leave_requests').select('*').order('date', { ascending: false });

      return {
        branches: branches || [],
        users: users || [],
        attendanceLogs: logs?.map(l => ({
          ...l,
          userId: l.user_id,
          userName: l.user_name,
          userAvatar: l.user_avatar,
          checkInTime: l.check_in_time,
          checkOutTime: l.check_out_time,
          checkInPhoto: l.check_in_photo,
          checkOutPhoto: l.check_out_photo,
          branchId: l.branch_id,
          closingData: l.closing_data
        })) || [],
        leaveRequests: requests?.map(r => ({
          ...r,
          userId: r.user_id,
          userName: r.user_name,
          userAvatar: r.user_avatar,
          branchId: r.branch_id
        })) || []
      };
    } catch (error) {
      console.error("Fetch error:", error);
      return { branches: [], users: [], attendanceLogs: [], leaveRequests: [] };
    }
  },

  // Đồng bộ Nhân sự
  async syncUsers(users: any[]) {
    if (!users || users.length === 0) return;
    const { error } = await supabase.from('users').upsert(users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      avatar: u.avatar,
      status: u.status,
      branch_id: u.branchId,
      is_first_login: u.isFirstLogin,
      confirmed_regulations: u.confirmedRegulations
    })));
    if (error) console.error('Sync Users Error:', error);
  },

  // Đồng bộ Chấm công
  async syncLogs(logs: any[]) {
    if (!logs || logs.length === 0) return;
    const { error } = await supabase.from('attendance_logs').upsert(logs.map(l => ({
      id: l.id,
      user_id: l.userId,
      user_name: l.userName,
      user_avatar: l.userAvatar,
      date: l.date,
      type: l.type,
      check_in_time: l.checkInTime,
      check_out_time: l.checkOutTime,
      check_in_photo: l.checkInPhoto,
      check_out_photo: l.checkOutPhoto,
      status: l.status,
      closing_data: l.closingData,
      branch_id: l.branchId
    })));
    if (error) console.error('Sync Logs Error:', error);
  },

  // Đồng bộ Chi nhánh
  async syncBranches(branches: any[]) {
    if (!branches || branches.length === 0) return;
    const { error } = await supabase.from('branches').upsert(branches);
    if (error) console.error('Sync Branches Error:', error);
  },

  // Đồng bộ Yêu cầu
  async syncRequests(requests: any[]) {
    if (!requests || requests.length === 0) return;
    const { error } = await supabase.from('leave_requests').upsert(requests.map(r => ({
      id: r.id,
      user_id: r.userId,
      user_name: r.userName,
      user_avatar: r.userAvatar,
      date: r.date,
      type: r.type,
      reason: r.reason,
      status: r.status,
      branch_id: r.branchId
    })));
    if (error) console.error('Sync Requests Error:', error);
  }
};
