import { Customer, Piece, Event, EventBooking, StudioSettings } from '../types';
import { IStorageAdapter } from './storage/IStorageAdapter';
import { LocalStorageAdapter } from './storage/LocalStorageAdapter';
import { SupabaseAdapter } from './storage/SupabaseAdapter';
// import { DataSeeder } from './seeds/DataSeeder';


const defaultNotificationSettings = {
  emailEnabled: true,
  smsEnabled: true,
  emailTemplate: 'Hi {{customerName}}, your ceramic piece is ready for pickup at Clay Cafe! Please come by during our business hours.',
  smsTemplate: 'Your ceramic piece is ready for pickup at Clay Cafe!'
};

const defaultStudioSettings: StudioSettings = {
  glazeRatePerCubicInch: 0.20,
  defaultTicketPrice: 15,
  businessHours: {
    monday: { open: "10:00", close: "18:00" },
    tuesday: { open: "10:00", close: "18:00" },
    wednesday: { open: "10:00", close: "18:00" },
    thursday: { open: "10:00", close: "20:00" },
    friday: { open: "10:00", close: "20:00" },
    saturday: { open: "09:00", close: "18:00" },
    sunday: { open: "12:00", close: "17:00" }
  }
};

class Database {
  private storage: IStorageAdapter;
  // private seeder: DataSeeder;
  private initialized = false;

  constructor(storageAdapter?: IStorageAdapter) {
    //this.storage = storageAdapter || new LocalStorageAdapter();
    this.storage = storageAdapter || new SupabaseAdapter();
    // this.seeder = new DataSeeder(this.storage);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      // if (!(await this.seeder.isSeeded())) {
      //   await this.seeder.seedAll();
      // }
      this.initialized = true;
    }
  }

  async migrateFromLegacy(): Promise<void> {
    const legacyKey = 'clay-cafe-database';
    const legacyData = localStorage.getItem(legacyKey);
    
    if (legacyData /* && !(await this.seeder.isSeeded()) */) {
      try {
        const parsed = JSON.parse(legacyData);
        
        if (parsed.customers) {
          const customers = parsed.customers.map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt)
          }));
          await this.storage.write('customers', customers);
        }

        if (parsed.pieces) {
          const pieces = parsed.pieces.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
            readyForPickupDate: p.readyForPickupDate ? new Date(p.readyForPickupDate) : undefined,
            pickedUpDate: p.pickedUpDate ? new Date(p.pickedUpDate) : undefined
          }));
          await this.storage.write('pieces', pieces);
        }

        if (parsed.events) {
          const events = parsed.events.map((e: any) => ({
            ...e,
            date: new Date(e.date),
            createdAt: new Date(e.createdAt),
            updatedAt: new Date(e.updatedAt)
          }));
          await this.storage.write('events', events);
        }

        if (parsed.eventBookings) {
          const eventBookings = parsed.eventBookings.map((b: any) => ({
            ...b,
            bookingDate: new Date(b.bookingDate),
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt)
          }));
          await this.storage.write('eventBookings', eventBookings);
        }

        if (parsed.notificationSettings) {
          await this.storage.writeOne('notificationSettings', 'default', parsed.notificationSettings);
        }

        localStorage.removeItem(legacyKey);
        this.initialized = true;
      } catch (error) {
        console.error('Error migrating legacy data:', error);
      }
    }
  }

  // Customer CRUD operations
  async getCustomers(): Promise<Customer[]> {
    await this.ensureInitialized();
    return await this.storage.read<Customer>('customers');
  }

  async getCustomer(id: string): Promise<Customer | null> {
    await this.ensureInitialized();
    return await this.storage.readOne<Customer>('customers', id);
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    await this.ensureInitialized();
    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.storage.writeOne('customers', newCustomer.id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    await this.ensureInitialized();
    const existingCustomer = await this.storage.readOne<Customer>('customers', id);
    if (!existingCustomer) return null;
    
    const updatedCustomer = {
      ...existingCustomer,
      ...updates,
      updatedAt: new Date()
    };
    await this.storage.writeOne('customers', id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const success = await this.storage.deleteOne('customers', id);
    if (success) {
      // Also delete associated pieces
      const pieces = await this.storage.read<Piece>('pieces');
      const associatedPieces = pieces.filter(p => p.customerId === id);
      for (const piece of associatedPieces) {
        await this.storage.deleteOne('pieces', piece.id);
      }
    }
    return success;
  }

  // Piece CRUD operations
  async getPieces(): Promise<Piece[]> {
    await this.ensureInitialized();
    return await this.storage.read<Piece>('pieces');
  }

  async getPiece(id: string): Promise<Piece | null> {
    await this.ensureInitialized();
    return await this.storage.readOne<Piece>('pieces', id);
  }

  async getPiecesByCustomer(customerId: string): Promise<Piece[]> {
    const pieces = await this.getPieces();
    return pieces.filter(p => p.customerId === customerId);
  }

  async addPiece(piece: Omit<Piece, 'id' | 'createdAt' | 'updatedAt'>): Promise<Piece> {
    await this.ensureInitialized();
    const newPiece: Piece = {
      ...piece,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.storage.writeOne('pieces', newPiece.id, newPiece);
    return newPiece;
  }

  async updatePiece(id: string, updates: Partial<Piece>): Promise<Piece | null> {
    await this.ensureInitialized();
    const existingPiece = await this.storage.readOne<Piece>('pieces', id);
    if (!existingPiece) return null;
    
    const updatedPiece = {
      ...existingPiece,
      ...updates,
      updatedAt: new Date()
    };
    await this.storage.writeOne('pieces', id, updatedPiece);
    return updatedPiece;
  }

  async deletePiece(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return await this.storage.deleteOne('pieces', id);
  }

  // Notification settings
  async getNotificationSettings() {
    await this.ensureInitialized();
    const settings = await this.storage.readOne('notificationSettings', 'default');
    return settings || defaultNotificationSettings;
  }

  async updateNotificationSettings(settings: Partial<typeof defaultNotificationSettings>) {
    await this.ensureInitialized();
    const currentSettings = await this.getNotificationSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await this.storage.writeOne('notificationSettings', 'default', updatedSettings);
    return updatedSettings;
  }

  // Studio settings
  async getStudioSettings(): Promise<StudioSettings> {
    await this.ensureInitialized();
    const settings = await this.storage.readOne<StudioSettings>('studioSettings', 'default');
    return settings || defaultStudioSettings;
  }

  async updateStudioSettings(settings: Partial<StudioSettings>): Promise<StudioSettings> {
    await this.ensureInitialized();
    const currentSettings = await this.getStudioSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await this.storage.writeOne('studioSettings', 'default', updatedSettings);
    return updatedSettings;
  }

  async calculateGlazePrice(cubicInches: number): Promise<number> {
    const studioSettings = await this.getStudioSettings();
    return Math.round(cubicInches * studioSettings.glazeRatePerCubicInch * 100) / 100;
  }

  // Event CRUD operations
  async getEvents(): Promise<Event[]> {
    await this.ensureInitialized();
    return await this.storage.read<Event>('events');
  }

  async getEvent(id: string): Promise<Event | null> {
    await this.ensureInitialized();
    return await this.storage.readOne<Event>('events', id);
  }

  async addEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    await this.ensureInitialized();
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.storage.writeOne('events', newEvent.id, newEvent);
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
    await this.ensureInitialized();
    const existingEvent = await this.storage.readOne<Event>('events', id);
    if (!existingEvent) return null;
    
    const updatedEvent = {
      ...existingEvent,
      ...updates,
      updatedAt: new Date()
    };
    await this.storage.writeOne('events', id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const success = await this.storage.deleteOne('events', id);
    if (success) {
      // Also delete associated bookings
      const eventBookings = await this.storage.read<EventBooking>('eventBookings');
      const associatedBookings = eventBookings.filter(b => b.eventId === id);
      for (const booking of associatedBookings) {
        await this.storage.deleteOne('eventBookings', booking.id);
      }
      
      // Update pieces to remove eventId reference
      const pieces = await this.storage.read<Piece>('pieces');
      const associatedPieces = pieces.filter(p => p.eventId === id);
      for (const piece of associatedPieces) {
        const updatedPiece = { ...piece, eventId: undefined, updatedAt: new Date() };
        await this.storage.writeOne('pieces', piece.id, updatedPiece);
      }
    }
    return success;
  }

  async duplicateEvent(id: string, newDate?: Date, overrides?: Partial<Event>): Promise<Event> {
    await this.ensureInitialized();
    const originalEvent = await this.storage.readOne<Event>('events', id);
    if (!originalEvent) {
      throw new Error('Event not found');
    }

    const duplicatedEvent: Event = {
      ...originalEvent,
      ...overrides,
      id: Date.now().toString(),
      date: newDate || new Date(originalEvent.date.getTime() + 7 * 24 * 60 * 60 * 1000), // Default to next week
      currentBookings: 0,
      status: 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.writeOne('events', duplicatedEvent.id, duplicatedEvent);
    return duplicatedEvent;
  }

  async createEventTemplate(name: string, eventData: Omit<Event, 'id' | 'date' | 'createdAt' | 'updatedAt' | 'currentBookings' | 'status'>): Promise<void> {
    await this.storage.writeOne('eventTemplates', name, {
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async getEventTemplates(): Promise<Record<string, any>> {
    try {
      const templateCollections = await this.storage.read('eventTemplates');
      return templateCollections.reduce((acc: Record<string, any>, template: any) => {
        acc[template.name] = template;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error loading event templates:', error);
      return {};
    }
  }

  async createEventFromTemplate(templateName: string, date: Date, overrides?: Partial<Event>): Promise<Event> {
    const template = await this.storage.readOne('eventTemplates', templateName) as any;
    if (!template) {
      throw new Error('Template not found');
    }

    const newEvent: Event = {
      name: template.name || 'Untitled Event',
      description: template.description,
      startTime: template.startTime || '10:00',
      endTime: template.endTime || '12:00',
      maxCapacity: template.maxCapacity || 10,
      price: template.price || 15,
      type: template.type || 'workshop',
      instructor: template.instructor,
      location: template.location,
      notes: template.notes,
      ...overrides,
      id: Date.now().toString(),
      date,
      currentBookings: 0,
      status: 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.writeOne('events', newEvent.id, newEvent);
    return newEvent;
  }

  // Event Booking CRUD operations
  async getEventBookings(): Promise<EventBooking[]> {
    await this.ensureInitialized();
    return await this.storage.read<EventBooking>('eventBookings');
  }

  async getEventBooking(id: string): Promise<EventBooking | null> {
    await this.ensureInitialized();
    return await this.storage.readOne<EventBooking>('eventBookings', id);
  }

  async getBookingsByEvent(eventId: string): Promise<EventBooking[]> {
    const eventBookings = await this.getEventBookings();
    return eventBookings.filter(b => b.eventId === eventId);
  }

  async getBookingsByCustomer(customerId: string): Promise<EventBooking[]> {
    const eventBookings = await this.getEventBookings();
    return eventBookings.filter(b => b.customerId === customerId);
  }

  async addEventBooking(booking: Omit<EventBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<EventBooking> {
    await this.ensureInitialized();
    const newBooking: EventBooking = {
      ...booking,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.storage.writeOne('eventBookings', newBooking.id, newBooking);
    
    // Update event's current bookings count
    const event = await this.storage.readOne<Event>('events', booking.eventId);
    if (event) {
      const updatedEvent = {
        ...event,
        currentBookings: event.currentBookings + 1,
        updatedAt: new Date()
      };
      await this.storage.writeOne('events', booking.eventId, updatedEvent);
    }
    
    return newBooking;
  }

  async updateEventBooking(id: string, updates: Partial<EventBooking>): Promise<EventBooking | null> {
    await this.ensureInitialized();
    const existingBooking = await this.storage.readOne<EventBooking>('eventBookings', id);
    if (!existingBooking) return null;
    
    const updatedBooking = {
      ...existingBooking,
      ...updates,
      updatedAt: new Date()
    };
    await this.storage.writeOne('eventBookings', id, updatedBooking);
    return updatedBooking;
  }

  async deleteEventBooking(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const booking = await this.storage.readOne<EventBooking>('eventBookings', id);
    if (!booking) return false;
    
    const success = await this.storage.deleteOne('eventBookings', id);
    
    if (success) {
      // Update event's current bookings count
      const event = await this.storage.readOne<Event>('events', booking.eventId);
      if (event) {
        const updatedEvent = {
          ...event,
          currentBookings: Math.max(0, event.currentBookings - 1),
          updatedAt: new Date()
        };
        await this.storage.writeOne('events', booking.eventId, updatedEvent);
      }
    }
    
    return success;
  }

  // Utility methods
  async getPiecesReadyForPickup(): Promise<Piece[]> {
    const pieces = await this.getPieces();
    return pieces.filter(p => p.status === 'ready-for-pickup');
  }

  async getPiecesByStatus(status: Piece['status']): Promise<Piece[]> {
    const pieces = await this.getPieces();
    return pieces.filter(p => p.status === status);
  }

  async getPiecesByEvent(eventId: string): Promise<Piece[]> {
    const pieces = await this.getPieces();
    return pieces.filter(p => p.eventId === eventId);
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const events = await this.getEvents();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events.filter(e => e.date >= today && e.status === 'upcoming');
  }

  async getEventsByDate(date: Date): Promise<Event[]> {
    const events = await this.getEvents();
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return events.filter(e => {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= targetDate && eventDate < nextDay;
    });
  }

  // Database management
  async backup(): Promise<string> {
    return await this.storage.backup();
  }

  async restore(backupData: string): Promise<void> {
    await this.storage.restore(backupData);
    this.initialized = false;
    await this.ensureInitialized();
  }

  async clearAllData(): Promise<void> {
    // await this.seeder.clearAll();
    
    // Also clear any legacy data
    const legacyKey = 'clay-cafe-database';
    if (localStorage.getItem(legacyKey)) {
      localStorage.removeItem(legacyKey);
    }
    
    this.initialized = false;
  }

  async reseedData(): Promise<void> {
    await this.clearAllData();
    // await this.seeder.seedAll();
    this.initialized = true;
  }

  getStorageInfo() {
    if (this.storage instanceof LocalStorageAdapter) {
      return this.storage.getStorageInfo();
    }
    return { used: 0, available: 0, collections: [] };
  }
}

const database = new Database();

// Initialize and migrate on first use
database.migrateFromLegacy().catch(console.error);

export { database };
