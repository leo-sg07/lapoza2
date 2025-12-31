
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aenuuxonxfphbxbqloxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbnV1eG9ueGZwaGJ4YnFsb3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNTM2NjgsImV4cCI6MjA4MjcyOTY2OH0.AxXLjVBt9Jrcin_4vZXBRxVbzBUEDlc8uYqg1lYpZCc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
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
      console.error("Lỗi khi tải dữ liệu ban đầu:", error);
      return { branches: [], users: [], attendanceLogs: [], leaveRequests: [] };
    }
  },

  async syncUsers(users: any[]) {
    if (!users || users.length === 0) return;
    
    // Lọc bỏ những user có branchId không hợp lệ hoặc xử lý dữ liệu trước khi gửi
    const payload = users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email || '',
      password: u.password || '123',
      role: u.role,
      avatar: u.avatar || '',
      status: u.status || 'WORKING',
      branch_id: u.branchId || null, // Nếu không có branchId thì để null
      is_first_login: u.isFirstLogin || false,
      confirmed_regulations: u.confirmedRegulations || []
    }));

    const { error } = await supabase.from('users').upsert(payload);
    if (error) {
      console.error('❌ Lỗi đồng bộ Nhân sự:', error.message);
      if (error.message.includes('foreign key constraint')) {
        console.warn('💡 Gợi ý: Hãy đảm bảo Chi nhánh của nhân viên này đã được tạo trong mục Hệ Thống trước.');
      }
    } else {
      console.log('✅ Đã đồng bộ nhân sự lên Cloud.');
    }
  },

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
    if (error) console.error('❌ Lỗi đồng bộ Chấm công:', error.message);
  },

  async syncBranches(branches: any[]) {
    if (!branches || branches.length === 0) return;
    const { error } = await supabase.from('branches').upsert(branches);
    if (error) {
      console.error('❌ Lỗi đồng bộ Chi nhánh:', error.message);
    } else {
      console.log('✅ Đã đồng bộ chi nhánh lên Cloud.');
    }
  },

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
    if (error) console.error('❌ Lỗi đồng bộ Yêu cầu:', error.message);
  }
};
