
export enum RoomStatus {
  DIRTY = 'Dirty',
  CLEAN = 'Clean',
  IN_PROGRESS = 'In Progress'
}

export enum GuestStatus {
  STAYOVER = 'Stay Overs',
  CHECKOUT = 'Checked Out',
  ARRIVAL = 'Arrivals',
  VACANT = 'Vacant'
}

export interface Room {
  room: string;
  roomType: string;
  housekeepingStatus: RoomStatus;
  guestStatus: GuestStatus;
  occupancyStatus: string;
  arrivalsRoom: string;
  checkIn: string;
  checkOut: string;
  assignedHk: string;
  minutes: number;
  notes: string;
  done: boolean;
  serviceType: string;
}

export interface HKStaff {
  num: string;
  name: string;
}

export type ViewType = 'FRONT_DESK' | 'HOUSEKEEPING';
