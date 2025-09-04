export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  instagram?: string;
  checkedIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Piece {
  id: string;
  customerId: string;
  eventId?: string; // Track which event this piece was made at
  status: 'in-progress' | 'bisque-fired' | 'glazed' | 'glaze-fired' | 'ready-for-pickup' | 'picked-up';
  cubicInches?: number;
  paidGlaze: boolean;
  glazeTotal?: number;
  notes?: string;
  imageUrl?: string; // URL or data URI for piece image
  createdAt: Date;
  updatedAt: Date;
  readyForPickupDate?: Date;
  pickedUpDate?: Date;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  date: Date;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  maxCapacity: number;
  currentBookings: number;
  price: number;
  type: 'workshop' | 'open-studio' | 'private-party' | 'class' | 'special-event';
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  instructor?: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventBooking {
  id: string;
  eventId: string;
  customerId: string;
  bookingDate: Date;
  status: 'confirmed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailTemplate: string;
  smsTemplate: string;
}

export interface StudioSettings {
  glazeRatePerCubicInch: number;
  defaultTicketPrice: number;
  businessHours: {
    monday: { open: string; close: string; closed?: boolean };
    tuesday: { open: string; close: string; closed?: boolean };
    wednesday: { open: string; close: string; closed?: boolean };
    thursday: { open: string; close: string; closed?: boolean };
    friday: { open: string; close: string; closed?: boolean };
    saturday: { open: string; close: string; closed?: boolean };
    sunday: { open: string; close: string; closed?: boolean };
  };
}

export interface AppState {
  customers: Customer[];
  pieces: Piece[];
  events: Event[];
  eventBookings: EventBooking[];
  notificationSettings: NotificationSettings;
  studioSettings: StudioSettings;
}
