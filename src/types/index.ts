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

export interface StudioSettings {
  id: string;
  studioName: string;
  studioAddress?: string;
  studioPhone?: string;
  studioEmail?: string;
  studioWebsite?: string;
  studioInstagram?: string;
  
  // Business hours
  mondayHours: string;
  tuesdayHours: string;
  wednesdayHours: string;
  thursdayHours: string;
  fridayHours: string;
  saturdayHours: string;
  sundayHours: string;
  
  // Pricing settings
  baseGlazeRate: number;
  firingFee: number;
  studioFee: number;
  
  // Email settings
  emailServiceEnabled: boolean;
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
  emailFromName: string;
  emailReplyTo?: string;
  
  // SMS settings
  smsServiceEnabled: boolean;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  
  // Notification settings
  autoNotifyReadyPieces: boolean;
  autoNotifyHoursDelay: number;
  reminderFrequencyDays: number;
  
  // Other settings
  timezone: string;
  currency: string;
  dateFormat: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Legacy properties for backwards compatibility
  glazeRatePerCubicInch: number; // maps to baseGlazeRate
  defaultTicketPrice: number; // maps to studioFee
}

export interface EmailTemplate {
  id: string;
  templateName: string;
  templateType: 'ready_for_pickup' | 'glazing_reminder' | 'custom';
  subjectTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  isDefault: boolean;
  availableVariables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSTemplate {
  id: string;
  templateName: string;
  templateType: 'ready_for_pickup' | 'glazing_reminder' | 'custom';
  messageTemplate: string;
  isActive: boolean;
  isDefault: boolean;
  availableVariables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationHistory {
  id: string;
  customerId: string;
  notificationType: 'email' | 'sms';
  templateType: string;
  recipient: string;
  subject?: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  sentAt?: Date;
  createdAt: Date;
}
