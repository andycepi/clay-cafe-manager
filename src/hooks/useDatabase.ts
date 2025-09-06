import { useState, useEffect, useCallback } from 'react';
import { database } from '../data/database';
import { Customer, Piece, Event, EventBooking } from '../types';
import { SupabaseAdapter } from '../data/storage/SupabaseAdapter';

export const useDatabase = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventBookings, setEventBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [customersData, piecesData, eventsData, eventBookingsData] = await Promise.all([
        database.getCustomers(),
        database.getPieces(),
        database.getEvents(),
        database.getEventBookings()
      ]);
      setCustomers(customersData);
      setPieces(piecesData);
      setEvents(eventsData);
      setEventBookings(eventBookingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Customer operations
  const addCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCustomer = await database.addCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer]);
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    // Optimistic update - update UI immediately
    const originalCustomer = customers.find(c => c.id === id);
    if (originalCustomer) {
      const optimisticCustomer = {
        ...originalCustomer,
        ...updates,
        updatedAt: new Date()
      };
      setCustomers(prev => prev.map(c => c.id === id ? optimisticCustomer : c));
    }

    try {
      const updatedCustomer = await database.updateCustomer(id, updates);
      if (updatedCustomer) {
        // Update with actual database response
        setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
      }
      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      // Rollback optimistic update on error
      if (originalCustomer) {
        setCustomers(prev => prev.map(c => c.id === id ? originalCustomer : c));
      }
      throw error;
    }
  }, [customers]);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      const success = await database.deleteCustomer(id);
      if (success) {
        setCustomers(prev => prev.filter(c => c.id !== id));
        setPieces(prev => prev.filter(p => p.customerId !== id));
      }
      return success;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }, []);

  // Piece operations
  const addPiece = useCallback(async (pieceData: Omit<Piece, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPiece = await database.addPiece(pieceData);
      setPieces(prev => [...prev, newPiece]);
      return newPiece;
    } catch (error) {
      console.error('Error adding piece:', error);
      throw error;
    }
  }, []);

  const updatePiece = useCallback(async (id: string, updates: Partial<Piece>) => {
    // Optimistic update - update UI immediately
    const originalPiece = pieces.find(p => p.id === id);
    if (originalPiece) {
      const optimisticPiece = {
        ...originalPiece,
        ...updates,
        updatedAt: new Date()
      };
      setPieces(prev => prev.map(p => p.id === id ? optimisticPiece : p));
    }

    try {
      const updatedPiece = await database.updatePiece(id, updates);
      if (updatedPiece) {
        // Update with actual database response
        setPieces(prev => prev.map(p => p.id === id ? updatedPiece : p));
      }
      return updatedPiece;
    } catch (error) {
      console.error('Error updating piece:', error);
      // Rollback optimistic update on error
      if (originalPiece) {
        setPieces(prev => prev.map(p => p.id === id ? originalPiece : p));
      }
      throw error;
    }
  }, [pieces]);

  const deletePiece = useCallback(async (id: string) => {
    try {
      const success = await database.deletePiece(id);
      if (success) {
        setPieces(prev => prev.filter(p => p.id !== id));
      }
      return success;
    } catch (error) {
      console.error('Error deleting piece:', error);
      throw error;
    }
  }, []);

  const updatePiecesBulk = useCallback(async (updates: Array<{id: string, data: Partial<Piece>}>) => {
    // Optimistic updates - update UI immediately
    const optimisticUpdates = new Map<string, Piece>();
    updates.forEach(({ id, data }) => {
      const originalPiece = pieces.find(p => p.id === id);
      if (originalPiece) {
        optimisticUpdates.set(id, {
          ...originalPiece,
          ...data,
          updatedAt: new Date()
        });
      }
    });

    if (optimisticUpdates.size > 0) {
      setPieces(prev => prev.map(p => optimisticUpdates.get(p.id) || p));
    }

    try {
      const updatedPieces = await database.updatePiecesBulk(updates);
      // Update with actual database response
      const updatedMap = new Map(updatedPieces.map(p => [p.id, p]));
      setPieces(prev => prev.map(p => updatedMap.get(p.id) || p));
      return updatedPieces;
    } catch (error) {
      console.error('Error bulk updating pieces:', error);
      // Rollback optimistic updates on error
      if (optimisticUpdates.size > 0) {
        setPieces(prev => prev.map(p => {
          const originalPiece = pieces.find(orig => orig.id === p.id);
          return originalPiece || p;
        }));
      }
      throw error;
    }
  }, [pieces]);

  // Utility functions
  const getCustomerById = useCallback((id: string) => {
    return customers.find(c => c.id === id);
  }, [customers]);

  const getPiecesByCustomer = useCallback((customerId: string) => {
    return pieces.filter(p => p.customerId === customerId);
  }, [pieces]);

  const getPiecesReadyForPickup = useCallback(() => {
    return pieces.filter(p => p.status === 'ready-for-pickup');
  }, [pieces]);

  const getPiecesByStatus = useCallback((status: Piece['status']) => {
    return pieces.filter(p => p.status === status);
  }, [pieces]);

  const getPiecesByEvent = useCallback((eventId: string) => {
    return pieces.filter(p => p.eventId === eventId);
  }, [pieces]);

  // Event operations
  const addEvent = useCallback(async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newEvent = await database.addEvent(eventData);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  }, []);

  const updateEvent = useCallback(async (id: string, updates: Partial<Event>) => {
    try {
      const updatedEvent = await database.updateEvent(id, updates);
      if (updatedEvent) {
        setEvents(prev => prev.map(e => e.id === id ? updatedEvent : e));
      }
      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      const success = await database.deleteEvent(id);
      if (success) {
        setEvents(prev => prev.filter(e => e.id !== id));
        setEventBookings(prev => prev.filter(b => b.eventId !== id));
        setPieces(prev => prev.map(p => p.eventId === id ? { ...p, eventId: undefined } : p));
      }
      return success;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }, []);

  // Event Booking operations
  const addEventBooking = useCallback(async (bookingData: Omit<EventBooking, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newBooking = await database.addEventBooking(bookingData);
      setEventBookings(prev => [...prev, newBooking]);
      // Event capacity is now calculated dynamically from bookings
      return newBooking;
    } catch (error) {
      console.error('Error adding event booking:', error);
      throw error;
    }
  }, []);

  const updateEventBooking = useCallback(async (id: string, updates: Partial<EventBooking>) => {
    try {
      const updatedBooking = await database.updateEventBooking(id, updates);
      if (updatedBooking) {
        setEventBookings(prev => prev.map(b => b.id === id ? updatedBooking : b));
      }
      return updatedBooking;
    } catch (error) {
      console.error('Error updating event booking:', error);
      throw error;
    }
  }, []);

  const deleteEventBooking = useCallback(async (id: string) => {
    try {
      const success = await database.deleteEventBooking(id);
      if (success) {
        setEventBookings(prev => prev.filter(b => b.id !== id));
        // Event capacity is now calculated dynamically from bookings
      }
      return success;
    } catch (error) {
      console.error('Error deleting event booking:', error);
      throw error;
    }
  }, []);

  // Utility functions
  const getEventById = useCallback((id: string) => {
    return events.find(e => e.id === id);
  }, [events]);

  const getBookingsByEvent = useCallback((eventId: string) => {
    return eventBookings.filter(b => b.eventId === eventId);
  }, [eventBookings]);

  const getUpcomingEvents = useCallback(async () => {
    return await database.getUpcomingEvents();
  }, []);

  // Studio settings
  const getStudioSettings = useCallback(async () => {
    return await database.getStudioSettings();
  }, []);

  const updateStudioSettings = useCallback(async (settings: any) => {
    return await database.updateStudioSettings(settings);
  }, []);

  // Event duplication and templates
  const duplicateEvent = useCallback(async (eventId: string, newDate?: Date, overrides?: any) => {
    try {
      const newEvent = await database.duplicateEvent(eventId, newDate, overrides);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (error) {
      console.error('Error duplicating event:', error);
      throw error;
    }
  }, []);

  const calculateGlazePrice = useCallback(async (cubicInches: number) => {
    return await database.calculateGlazePrice(cubicInches);
  }, []);

  return {
    customers,
    pieces,
    events,
    eventBookings,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addPiece,
    updatePiece,
    updatePiecesBulk,
    deletePiece,
    addEvent,
    updateEvent,
    deleteEvent,
    addEventBooking,
    updateEventBooking,
    deleteEventBooking,
    getCustomerById,
    getPiecesByCustomer,
    getPiecesReadyForPickup,
    getPiecesByStatus,
    getPiecesByEvent,
    getEventById,
    getBookingsByEvent,
    getUpcomingEvents,
    getStudioSettings,
    updateStudioSettings,
    duplicateEvent,
    calculateGlazePrice,
    refreshData: loadData
  };
};
