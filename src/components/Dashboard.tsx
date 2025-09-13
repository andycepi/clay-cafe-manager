import React, { useState, useMemo, useEffect } from 'react';
import { Users, Palette, TrendingUp, Calendar, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Customer, Piece, Event, EventBooking, StudioSettings } from '../types';
import { EventsViewSection } from './EventsViewSection';
import { PiecesViewSection } from './PiecesViewSection';
import { CustomersViewSection } from './CustomersViewSection';
import { OverviewSection } from './OverviewSection';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Modal } from './ui/Modal';
import { CustomerForm } from './CustomerForm';
import { EventForm } from './EventForm';
import { SimpleCustomerBooking } from './SimpleCustomerBooking';
import { EventDetails } from './EventDetails';
import { EventRoster } from './EventRoster';
import { PieceModal } from './PieceModal';
import { CustomerPiecesSummary } from './CustomerPiecesSummary';
import { NotificationModal } from './NotificationModal';
import { Settings } from './Settings';
import { calculateGlazeCost } from '../utils/glazeCalculations';
import { useDatabase } from '../hooks/useDatabase';
import { useAuth } from '../context/AuthContext';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

type ViewMode = 'customers' | 'pieces' | 'events' | 'overview' | 'settings';
type FilterStatus = 'all' | 'ready-for-pickup' | 'picked-up' | 'in-progress';
type EventFilterStatus = 'all' | 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
type PieceSortMode = 'status' | 'event' | 'customer' | 'date';

export const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const {
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
    deleteEventBooking,
    getCustomerById,
    getPiecesReadyForPickup,
    getEventById,
    getStudioSettings,
    duplicateEvent
  } = useDatabase();

  const [viewMode, setViewMode] = useState<ViewMode>('events');
  const [studioSettings, setStudioSettings] = useState<StudioSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [eventFilterStatus, setEventFilterStatus] = useState<EventFilterStatus>('all');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPieceModal, setShowPieceModal] = useState(false);
  const [pieceModalMode, setPieceModalMode] = useState<'create' | 'edit'>('create');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventBookingModal, setShowEventBookingModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showEventRosterModal, setShowEventRosterModal] = useState(false);
  const [showCustomerPiecesModal, setShowCustomerPiecesModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedCustomerForPieces, setSelectedCustomerForPieces] = useState<Customer | undefined>();
  const [notificationPiece, setNotificationPiece] = useState<Piece | undefined>();
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [editingPiece, setEditingPiece] = useState<Piece | undefined>();
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [selectedCustomerForPiece, setSelectedCustomerForPiece] = useState<string | undefined>();
  const [pieceSortMode, setPieceSortMode] = useState<PieceSortMode>('status');

  // Load studio settings
  useEffect(() => {
    const loadStudioSettings = async () => {
      try {
        const settings = await getStudioSettings();
        setStudioSettings(settings);
      } catch (error) {
        console.error('Error loading studio settings:', error);
      }
    };
    loadStudioSettings();
  }, [getStudioSettings]);

  // Filter and search logic
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
      );
    }

    return filtered;
  }, [customers, searchTerm]);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        importCustomers(results.data);
      },
      error: (err) => {
        console.error('CSV parsing error:', err);
        toast.error('Error parsing CSV: ' + err.message);
      }
    });
  };
  
  const importCustomers = async (customersArray: any[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;
      let duplicateCount = 0;
      const duplicateNames: string[] = [];
      
      // Filter out empty rows and validate required fields
      const validCustomers = customersArray.filter(customerData => 
        customerData.name?.trim() && customerData.Email?.trim()
      );
      
      if (validCustomers.length === 0) {
        toast.error('No valid customers found in CSV. Please ensure name and Email columns are filled.');
        return;
      }
      
      // Get existing customers to check for duplicates by name
      const existingNames = new Set(customers.map(c => c.name.toLowerCase().trim()));
      
      // Process customers with duplicate detection
      for (const customerData of validCustomers) {
        const name = customerData.name.trim();
        const nameLower = name.toLowerCase();
        
        // Check for duplicates by name
        if (existingNames.has(nameLower)) {
          duplicateCount++;
          duplicateNames.push(name);
          console.log('Skipping duplicate customer by name:', name);
          continue;
        }
        
        try {
          await addCustomer({
            name: name,
            email: customerData.Email.trim(),
            phone: customerData.Phone?.trim() || undefined,
            checkedIn: false
          });
          
          // Add to existing names set to prevent duplicates within the same import
          existingNames.add(nameLower);
          successCount++;
        } catch (error) {
          console.error('Error adding customer:', name, error);
          errorCount++;
        }
      }
      
      // Show comprehensive results
      const messages = [];
      
      if (successCount > 0) {
        messages.push(`✅ Successfully imported ${successCount} new customer${successCount === 1 ? '' : 's'}`);
      }
      
      if (duplicateCount > 0) {
        const duplicateList = duplicateNames.length <= 3 
          ? duplicateNames.join(', ')
          : `${duplicateNames.slice(0, 3).join(', ')} and ${duplicateNames.length - 3} more`;
        messages.push(`⚠️ Skipped ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'}: ${duplicateList}`);
      }
      
      if (errorCount > 0) {
        messages.push(`❌ Failed to import ${errorCount} customer${errorCount === 1 ? '' : 's'}`);
      }
      
      // Show results with appropriate toast type
      if (messages.length > 0) {
        const fullMessage = messages.join('\n');
        if (errorCount > 0) {
          toast.error(fullMessage, { duration: 6000 });
        } else if (duplicateCount > 0 && successCount > 0) {
          toast.success(fullMessage, { duration: 6000 });
        } else if (duplicateCount > 0) {
          toast.error(`All ${duplicateCount} customers were duplicates - no new customers imported`, { duration: 4000 });
        } else {
          toast.success(fullMessage, { duration: 4000 });
        }
      }
      
    } catch (error) {
      console.error('CSV import error:', error);
      toast.error('Failed to import customers from CSV');
    }
  };

  const filteredPieces = useMemo(() => {
    let filtered = pieces;

    if (searchTerm) {
      filtered = filtered.filter(piece => {
        const customer = getCustomerById(piece.customerId);
        return customer && (
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          piece.status.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'in-progress') {
        filtered = filtered.filter(piece => 
          !['ready-for-pickup', 'picked-up'].includes(piece.status)
        );
      } else {
        filtered = filtered.filter(piece => piece.status === filterStatus);
      }
    }

    return filtered;
  }, [pieces, searchTerm, filterStatus, getCustomerById]);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.instructor && event.instructor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (eventFilterStatus !== 'all') {
      filtered = filtered.filter(event => event.status === eventFilterStatus);
    }

    return filtered;
  }, [events, searchTerm, eventFilterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const readyForPickup = getPiecesReadyForPickup();
    const totalValue = pieces.reduce((sum, piece) => sum + (piece.glazeTotal || 0), 0);
    const unpaidPieces = pieces.filter(p => !p.paidGlaze).length;
    const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
    const totalBookings = eventBookings.filter(b => b.status === 'confirmed').length;

    return {
      totalCustomers: customers.length,
      totalPieces: pieces.length,
      readyForPickup: readyForPickup.length,
      totalValue,
      unpaidPieces,
      totalEvents: events.length,
      upcomingEvents,
      totalBookings
    };
  }, [customers.length, pieces, events, eventBookings, getPiecesReadyForPickup]);

  const handleAddCustomer = () => {
    setEditingCustomer(undefined);
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer and all their pieces?')) {
      try {
        await deleteCustomer(customerId);
        toast.success('Customer deleted successfully');
      } catch (error) {
        toast.error('Failed to delete customer');
      }
    }
  };

  const handleViewCustomerPieces = (customer: Customer) => {
    setSelectedCustomerForPieces(customer);
    setShowCustomerPiecesModal(true);
  };

  const handleViewPiece = (piece: Piece) => {
    setEditingPiece(piece);
    setPieceModalMode('edit');
    setShowPieceModal(true);
  };

  const handleUpdatePieceStatus = async (pieceId: string, status: Piece['status']) => {
    try {
      await updatePiece(pieceId, { status });
      toast.success('Piece status updated');
    } catch (error) {
      toast.error('Failed to update piece status');
    }
  };

  const handleBulkStatusUpdate = async (pieceIds: string[], status: Piece['status']) => {
    try {
      await Promise.all(pieceIds.map(id => updatePiece(id, { status })));
      toast.success(`Updated ${pieceIds.length} pieces to ${status.replace('-', ' ')}`);
    } catch (error) {
      console.error('Error updating pieces status:', error);
      toast.error('Failed to update pieces status');
    }
  };


  const handleAddPiece = (customerId?: string) => {
    setEditingPiece(undefined);
    setSelectedCustomerForPiece(customerId);
    setPieceModalMode('create');
    setShowPieceModal(true);
  };

  const handleEditPiece = (piece: Piece) => {
    setEditingPiece(piece);
    setPieceModalMode('edit');
    setShowPieceModal(true);
  };

  const handleEditPieceFromCustomerSummary = (piece: Piece) => {
    setEditingPiece(piece);
    setPieceModalMode('edit');
    setShowPieceModal(true);
  };

  const handleDeletePiece = async (pieceId: string) => {
    if (window.confirm('Are you sure you want to delete this piece?')) {
      try {
        await deletePiece(pieceId);
        toast.success('Piece deleted successfully');
      } catch (error) {
        toast.error('Failed to delete piece');
      }
    }
  };

  const handleNotifyCustomer = async (piece: Piece) => {
    const customer = getCustomerById(piece.customerId);
    if (!customer) {
      toast.error('Customer not found');
      return;
    }

    setNotificationPiece(piece);
    setShowNotificationModal(true);
  };

  const handleNotificationSent = () => {
    toast.success('Notification sent successfully');
  };

  const handleMarkPickedUp = async (pieceId: string) => {
    try {
      await updatePiece(pieceId, {
        status: 'picked-up',
        pickedUpDate: new Date()
      });
      toast.success('Piece marked as picked up');
    } catch (error) {
      toast.error('Failed to update piece status');
    }
  };

  const handleCustomerSubmit = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerData);
        toast.success('Customer updated successfully');
      } else {
        await addCustomer(customerData);
        toast.success('Customer added successfully');
      }
      setShowCustomerModal(false);
    } catch (error) {
      toast.error('Failed to save customer');
    }
  };


  // Event handlers
  const handleAddEvent = () => {
    setEditingEvent(undefined);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event and all its bookings?')) {
      try {
        await deleteEvent(eventId);
        toast.success('Event deleted successfully');
      } catch (error) {
        toast.error('Failed to delete event');
      }
    }
  };

  const handleBookCustomer = (eventId: string) => {
    const event = getEventById(eventId);
    if (event) {
      setSelectedEvent(event);
      setShowEventBookingModal(true);
    }
  };


  const handleViewEventRoster = (event: Event) => {
    setSelectedEvent(event);
    setShowEventRosterModal(true);
  };

  const handleDuplicateEvent = async (event: Event) => {
    try {
      const nextWeek = new Date(event.date.getTime() + 7 * 24 * 60 * 60 * 1000);
      await duplicateEvent(event.id, nextWeek);
      toast.success('Event duplicated successfully');
    } catch (error) {
      console.error('Error duplicating event:', error);
      toast.error('Failed to duplicate event');
    }
  };

  const handleCustomerCheckIn = async (customerId: string, checkedIn: boolean) => {
    try {
      await updateCustomer(customerId, { checkedIn });
      toast.success(`Customer ${checkedIn ? 'checked in' : 'checked out'} successfully`);
    } catch (error) {
      console.error('Error updating customer check-in status:', error);
      toast.error('Failed to update check-in status');
    }
  };

  const handleUpdatePayment = async (customerId: string, field: 'paidGlaze', value: boolean) => {
    try {
      // Find pieces for this customer and update payment status
      const customerPieces = pieces.filter(p => p.customerId === customerId);
      for (const piece of customerPieces) {
        await updatePiece(piece.id, { [field]: value });
      }
      toast.success(`Payment status updated successfully`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const handleUpdatePiecePayment = async (pieceId: string, field: 'paidGlaze', value: boolean) => {
    try {
      await updatePiece(pieceId, { [field]: value });
      toast.success(`Payment status updated successfully`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const handleUpdateCubicInches = async (pieceId: string, cubicInches: number) => {
    try {
      const glazeTotal = studioSettings ? calculateGlazeCost(cubicInches, studioSettings.glazeRatePerCubicInch) : 0;
      await updatePiece(pieceId, { cubicInches, glazeTotal });
      toast.success('Cubic inches and glaze cost updated successfully');
    } catch (error) {
      console.error('Error updating cubic inches:', error);
      toast.error('Failed to update cubic inches');
    }
  };


  const handleBulkDelete = async (pieceIds: string[]) => {
    if (window.confirm(`Are you sure you want to delete ${pieceIds.length} pieces? This action cannot be undone.`)) {
      try {
        await Promise.all(pieceIds.map(id => deletePiece(id)));
        toast.success(`Deleted ${pieceIds.length} pieces`);
        } catch (error) {
        console.error('Error deleting pieces:', error);
        toast.error('Failed to delete pieces');
      }
    }
  };

  const handleBulkPaymentUpdate = async (pieceIds: string[], paidGlaze: boolean) => {
    try {
      await Promise.all(pieceIds.map(id => updatePiece(id, { paidGlaze })));
      toast.success(`Updated payment status for ${pieceIds.length} pieces`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const handleAddPieceFromRoster = (customerId: string) => {
    setSelectedCustomerForPiece(customerId);
    setPieceModalMode('create');
    setShowPieceModal(true);
  };

  const handlePieceModalSubmit = async (pieceData: any) => {
    try {
      if (pieceModalMode === 'create') {
        await addPiece(pieceData);
        toast.success('Piece added successfully');
      } else if (editingPiece) {
        await updatePiece(editingPiece.id, pieceData);
        toast.success('Piece updated successfully');
      }
      setShowPieceModal(false);
      setSelectedCustomerForPiece(undefined);
      setEditingPiece(undefined);
    } catch (error) {
      console.error(`Error ${pieceModalMode === 'create' ? 'adding' : 'updating'} piece:`, error);
      toast.error(`Failed to ${pieceModalMode === 'create' ? 'add' : 'update'} piece`);
    }
  };

  const handleEventSubmit = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        toast.success('Event updated successfully');
      } else {
        await addEvent(eventData);
        toast.success('Event added successfully');
      }
      setShowEventModal(false);
    } catch (error) {
      toast.error('Failed to save event');
    }
  };

  const handleEventBookingSubmit = async (bookingData: Omit<EventBooking, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addEventBooking(bookingData);
      toast.success('Customer booked successfully');
      setShowEventBookingModal(false);
    } catch (error) {
      toast.error('Failed to book customer');
    }
  };

  const handleRemoveBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to remove this booking?')) {
      try {
        await deleteEventBooking(bookingId);
        toast.success('Booking removed successfully');
      } catch (error) {
        toast.error('Failed to remove booking');
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      toast.success('Logged out successfully');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clay Cafe Database</h1>
                <p className="text-sm sm:text-base text-gray-600">Manage customers and ceramic pieces</p>
              </div>
              <div className="hidden sm:flex space-x-3">
                <Button onClick={handleAddCustomer} className="flex items-center space-x-2">
                  <Users size={16} />
                  <span>Add Customer</span>
                </Button>
                <Button onClick={() => handleAddPiece()} className="flex items-center space-x-2">
                  <Palette size={16} />
                  <span>Add Piece</span>
                </Button>
                <Button onClick={handleAddEvent} className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>Add Event</span>
                </Button>
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
            {/* Mobile buttons row */}
            <div className="flex sm:hidden space-x-2 mt-3">
              <Button onClick={handleAddCustomer} size="sm" className="flex items-center space-x-1 flex-1">
                <Users size={14} />
                <span className="text-xs">Customer</span>
              </Button>
              <Button onClick={() => handleAddPiece()} size="sm" className="flex items-center space-x-1 flex-1">
                <Palette size={14} />
                <span className="text-xs">Piece</span>
              </Button>
              <Button onClick={handleAddEvent} size="sm" className="flex items-center space-x-1 flex-1">
                <Calendar size={14} />
                <span className="text-xs">Event</span>
              </Button>
              <Button 
                onClick={handleLogout} 
                size="sm" 
                variant="outline" 
                className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut size={14} />
                <span className="text-xs">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center">
              <Users className="h-5 w-5 sm:h-8 sm:w-8 text-blue-600" />
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Customers</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center">
              <Palette className="h-5 w-5 sm:h-8 sm:w-8 text-purple-600" />
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Pieces</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.totalPieces}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 sm:h-8 sm:w-8 text-green-600" />
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Upcoming Events</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.upcomingEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 sm:h-8 sm:w-8 text-amber-600" />
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Value</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">${stats.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex overflow-x-auto scrollbar-hide px-2 sm:px-6">
              <div className="flex space-x-1 sm:space-x-8 min-w-max">
                {[
                  { key: 'events', label: 'Events', icon: Calendar },
                  { key: 'pieces', label: 'Pieces', icon: Palette },
                  { key: 'customers', label: 'Customers', icon: Users },
                  { key: 'overview', label: 'Overview', icon: TrendingUp },
                  { key: 'settings', label: 'Settings', icon: SettingsIcon }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key as ViewMode)}
                    className={`flex flex-col sm:flex-row items-center justify-center sm:space-x-2 py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                      viewMode === key
                        ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <Icon size={18} className="sm:w-4 sm:h-4" />
                    <span className="mt-1 sm:mt-0">{label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="w-full">
              <Input
                placeholder="Search customers or pieces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {viewMode === 'pieces' && (
                <div className="w-full sm:w-48">
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                    options={[
                      { value: 'all', label: 'All Pieces' },
                      { value: 'in-progress', label: 'In Progress' },
                      { value: 'ready-for-pickup', label: 'Ready for Pickup' },
                      { value: 'picked-up', label: 'Picked Up' }
                    ]}
                  />
                </div>
              )}
              {viewMode === 'events' && (
                <div className="w-full sm:w-48">
                  <Select
                    value={eventFilterStatus}
                    onChange={(e) => setEventFilterStatus(e.target.value as EventFilterStatus)}
                    options={[
                      { value: 'all', label: 'All Events' },
                      { value: 'upcoming', label: 'Upcoming' },
                      { value: 'in-progress', label: 'In Progress' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' }
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'overview' && (
          <OverviewSection
            customers={customers}
            pieces={pieces}
            stats={stats}
            getPiecesReadyForPickup={getPiecesReadyForPickup}
            getCustomerById={getCustomerById}
            onEditPiece={handleEditPiece}
            onDeletePiece={handleDeletePiece}
            onNotifyCustomer={handleNotifyCustomer}
            onMarkPickedUp={handleMarkPickedUp}
            onViewPiece={handleViewPiece}
            onUpdatePieceStatus={handleUpdatePieceStatus}
            onUpdateCubicInches={handleUpdateCubicInches}
            onUpdatePiecePayment={handleUpdatePiecePayment}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onAddPiece={handleAddPiece}
            onViewCustomerPieces={handleViewCustomerPieces}
          />
        )}

        {viewMode === 'customers' && (
          <CustomersViewSection
            customers={filteredCustomers}
            pieces={pieces}
            searchTerm={searchTerm}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            onAddPiece={handleAddPiece}
            onViewPieces={handleViewCustomerPieces}
            onAddCustomer={handleAddCustomer}
            onCSVUpload={handleCSVUpload}
          />
        )}

        {viewMode === 'pieces' && (
          <PiecesViewSection
            pieces={filteredPieces}
            customers={customers}
            events={events}
            searchTerm={searchTerm}
            sortMode={pieceSortMode}
            onSortChange={setPieceSortMode}
            onEdit={handleEditPiece}
            onDelete={handleDeletePiece}
            onNotify={handleNotifyCustomer}
            onMarkPickedUp={handleMarkPickedUp}
            onView={handleViewPiece}
            onStatusChange={handleUpdatePieceStatus}
            onCubicInchesChange={handleUpdateCubicInches}
            onPaymentUpdate={handleUpdatePiecePayment}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onBulkPaymentUpdate={handleBulkPaymentUpdate}
            onBulkDelete={handleBulkDelete}
            onAddPiece={() => handleAddPiece()}
            getCustomerById={getCustomerById}
          />
        )}

        {viewMode === 'events' && (
          <EventsViewSection
            events={filteredEvents}
            customers={customers}
            eventBookings={eventBookings}
            searchTerm={searchTerm}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onViewRoster={handleViewEventRoster}
            onDuplicate={handleDuplicateEvent}
            onAddEvent={handleAddEvent}
          />
        )}

        {viewMode === 'settings' && (
          <Settings />
        )}

      </div>

      {/* Modals */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      >
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleCustomerSubmit}
          onCancel={() => setShowCustomerModal(false)}
        />
      </Modal>


      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={editingEvent ? 'Edit Event' : 'Add Event'}
        size="lg"
      >
        <EventForm
          event={editingEvent}
          onSubmit={handleEventSubmit}
          onCancel={() => setShowEventModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showEventBookingModal}
        onClose={() => setShowEventBookingModal(false)}
        title="Book Customers"
        size="2xl"
        zIndex="overlay"
      >
        {selectedEvent && (
          <SimpleCustomerBooking
            event={selectedEvent}
            customers={customers}
            existingBookings={eventBookings}
            onSubmit={handleEventBookingSubmit}
            onAddCustomer={addCustomer}
            onRemoveBooking={handleRemoveBooking}
            onCancel={() => setShowEventBookingModal(false)}
          />
        )}
      </Modal>

      <Modal
        isOpen={showEventDetailsModal}
        onClose={() => setShowEventDetailsModal(false)}
        title="Event Details"
        size="xl"
      >
        {selectedEvent && (
          <EventDetails
            event={selectedEvent}
            customers={customers}
            bookings={eventBookings}
            pieces={pieces}
            onClose={() => setShowEventDetailsModal(false)}
            onRemoveBooking={handleRemoveBooking}
            onCheckIn={handleCustomerCheckIn}
            onUpdatePayment={handleUpdatePiecePayment}
            onAddPiece={handleAddPiece}
            onEditPiece={handleEditPieceFromCustomerSummary}
            onDuplicateEvent={handleDuplicateEvent}
            onBulkStatusUpdate={handleBulkStatusUpdate}
          />
        )}
      </Modal>

      {/* Event Roster Modal */}
      {showEventRosterModal && selectedEvent && (
        <EventRoster
          event={selectedEvent}
          bookings={eventBookings.filter(b => b.eventId === selectedEvent.id)}
          customers={customers}
          pieces={pieces}
          onClose={() => setShowEventRosterModal(false)}
          onCheckIn={handleCustomerCheckIn}
          onUpdatePayment={handleUpdatePayment}
          onAddPiece={handleAddPieceFromRoster}
          onEditPiece={handleEditPieceFromCustomerSummary}
          onDuplicateEvent={handleDuplicateEvent}
          onBookCustomer={handleBookCustomer}
          onBulkStatusUpdate={handleBulkStatusUpdate}
        />
      )}

      {showCustomerPiecesModal && selectedCustomerForPieces && (
        <CustomerPiecesSummary
          customer={selectedCustomerForPieces}
          pieces={pieces}
          events={events}
          onClose={() => {
            setShowCustomerPiecesModal(false);
            setSelectedCustomerForPieces(undefined);
          }}
          onUpdatePieceStatus={handleUpdatePieceStatus}
          onUpdatePayment={handleUpdatePiecePayment}
          onAddPiece={handleAddPiece}
          onEditPiece={handleEditPieceFromCustomerSummary}
          onNotifyCustomer={handleNotifyCustomer}
        />
      )}

      {/* Unified Piece Modal */}
      {showPieceModal && (
        <PieceModal
          mode={pieceModalMode}
          piece={pieceModalMode === 'edit' ? editingPiece : undefined}
          customers={customers}
          events={events}
          studioSettings={studioSettings || undefined}
          customerId={selectedCustomerForPiece}
          eventId={selectedEvent?.id}
          onSave={handlePieceModalSubmit}
          onClose={() => {
            setShowPieceModal(false);
            setSelectedCustomerForPiece(undefined);
            setEditingPiece(undefined);
          }}
        />
      )}

      {/* Notification Modal (SMS & Email) */}
      {showNotificationModal && notificationPiece && (
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => {
            setShowNotificationModal(false);
            setNotificationPiece(undefined);
          }}
          customer={getCustomerById(notificationPiece.customerId)!}
          piece={notificationPiece}
          onSent={handleNotificationSent}
        />
      )}
    </div>
  );
};
