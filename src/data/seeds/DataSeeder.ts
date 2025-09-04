/*import { IStorageAdapter } from '../storage/IStorageAdapter';
import { Customer, Piece, Event, EventBooking } from '../../types';

import customersData from './customers.json';
import piecesData from './pieces.json';
import eventsData from './events.json';
import eventBookingsData from './eventBookings.json';
import notificationSettingsData from './notificationSettings.json';
import studioSettingsData from './studioSettings.json';

export class DataSeeder {
  constructor(private storage: IStorageAdapter) {}

  async seedAll(): Promise<void> {
    await this.seedCustomers();
    await this.seedEvents();
    await this.seedPieces();
    await this.seedEventBookings();
    await this.seedNotificationSettings();
    await this.seedStudioSettings();
  }

  async seedCustomers(): Promise<void> {
    const customers: Customer[] = customersData.map(customer => ({
      ...customer,
      createdAt: new Date(customer.createdAt),
      updatedAt: new Date(customer.updatedAt)
    }));
    await this.storage.write('customers', customers);
  }

  async seedPieces(): Promise<void> {
    const pieces: Piece[] = piecesData.map(piece => ({
      ...piece,
      status: piece.status as Piece['status'],
      createdAt: new Date(piece.createdAt),
      updatedAt: new Date(piece.updatedAt),
      readyForPickupDate: piece.readyForPickupDate ? new Date(piece.readyForPickupDate) : undefined
    }));
    await this.storage.write('pieces', pieces);
  }

  async seedEvents(): Promise<void> {
    const events: Event[] = eventsData.map(event => ({
      ...event,
      type: event.type as Event['type'],
      status: event.status as Event['status'],
      date: new Date(event.date),
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt)
    }));
    await this.storage.write('events', events);
  }

  async seedEventBookings(): Promise<void> {
    const eventBookings: EventBooking[] = eventBookingsData.map(booking => ({
      ...booking,
      status: booking.status as EventBooking['status'],
      bookingDate: new Date(booking.bookingDate),
      createdAt: new Date(booking.createdAt),
      updatedAt: new Date(booking.updatedAt)
    }));
    await this.storage.write('eventBookings', eventBookings);
  }

  async seedNotificationSettings(): Promise<void> {
    await this.storage.writeOne('notificationSettings', 'default', notificationSettingsData);
  }

  async seedStudioSettings(): Promise<void> {
    await this.storage.writeOne('studioSettings', 'default', studioSettingsData);
  }

  async isSeeded(): Promise<boolean> {
    const collections = ['customers', 'pieces', 'events', 'eventBookings'];
    for (const collection of collections) {
      if (!(await this.storage.exists(collection))) {
        return false;
      }
    }
    return true;
  }

  async clearAll(): Promise<void> {
    const collections = ['customers', 'pieces', 'events', 'eventBookings', 'notificationSettings', 'studioSettings'];
    for (const collection of collections) {
      await this.storage.clear(collection);
    }
  }
}*/
export {}