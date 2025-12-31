
export enum Role {
  STAFF = 'STAFF',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  WORKING = 'WORKING',
  RESIGNED = 'RESIGNED'
}

export enum ShiftType {
  SHIFT_1 = 'SHIFT_1',
  SHIFT_2 = 'SHIFT_2',
  SHIFT_3 = 'SHIFT_3'
}

export enum AttendanceStatus {
  ON_TIME = 'ON_TIME',
  LATE = 'LATE',
  EARLY_LEAVE = 'EARLY_LEAVE',
  MISSED = 'MISSED'
}

export interface ShiftConfig {
  name: string;
  start: string;
  end: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string;
  isFirstLogin?: boolean;
  role: Role;
  avatar: string;
  status: UserStatus;
  branchId?: string;
  notes?: string;
  confirmedRegulations?: string[];
}

export interface Assignment {
  id: string;
  userId: string;
  date: string;
  shiftType: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ScheduleLog {
  id: string;
  action: string;
  timestamp: string;
  userName: string;
}

export interface DiscountDetail {
  billId: string;
  reason: string;
  amount: number;
}

export interface ShiftClosingData {
  totalBills: number;
  totalTransfer: number;
  totalCash: number;
  totalDiscounts: number;
  discountsDetails: DiscountDetail[];
  openingBalance: number;
  closingBalance: number;
  incidents: string;
  customerFeedback: string;
}

export interface Branch {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  address?: string;
  shifts: Record<string, ShiftConfig>;
  isActive?: boolean;
}

export interface ShiftAuditLog {
  id: string;
  action: string;
  timestamp: string;
  userName: string;
  comment?: string;
  changes?: {
    field: string;
    from: any;
    to: any;
  }[];
}

export interface ShiftRecord {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  date: string;
  type: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInPhoto?: string;
  checkOutPhoto?: string;
  checkInStatus?: AttendanceStatus;
  checkOutStatus?: AttendanceStatus;
  status: 'PENDING' | 'COMPLETED' | 'ABSENT' | 'APPROVED';
  closingData?: ShiftClosingData;
  adjustedClosingData?: Partial<ShiftClosingData>;
  isConfirmed?: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  managerComment?: string;
  auditLog?: ShiftAuditLog[];
  branchId?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  date: string;
  dayOfWeek?: string;
  type: 'LEAVE' | 'REGISTER';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  shiftType?: string;
  branchId?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
  branchId?: string;
}

export interface Regulation {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}
