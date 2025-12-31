
import { ShiftType } from './types';

export const SHIFT_DETAILS: Record<string, { name: string; time: string; start: string; end: string }> = {
  [ShiftType.SHIFT_1]: { name: 'Ca 1', time: '08:00 - 12:00', start: '08:00', end: '12:00' },
  [ShiftType.SHIFT_2]: { name: 'Ca 2', time: '12:00 - 17:00', start: '12:00', end: '17:00' },
  [ShiftType.SHIFT_3]: { name: 'Ca 3', time: '17:00 - 22:00', start: '17:00', end: '22:00' },
};

// Mock Branch Coordinates (Downtown Saigon)
export const BRANCH_LOCATION = {
  lat: 10.7769,
  lng: 106.7009,
  radius: 100, // meters
};
