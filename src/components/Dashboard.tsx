import React, { useState, useMemo, useEffect } from 'react';
import { Users, Palette, TrendingUp, Calendar } from 'lucide-react';
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
import { PieceForm } from './PieceForm';
import { EventForm } from './EventForm';
import { CustomerBookingForm } from './CustomerBookingForm';
import { EventDetails } from './EventDetails';
import { EventRoster } from './EventRoster';
import { PieceFormModal } from './PieceFormModal';
import { PieceEditModal } from './PieceEditModal';
import { CustomerPiecesSummary } from './CustomerPiecesSummary';
import { SMSNotificationModal } from './SMSNotificationModal';
import { calculateGlazeCost } from '../utils/glazeCalculations';
import { useDatabase } from '../hooks/useDatabase';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

type ViewMode = 'customers' | 'pieces' | 'events' | 'overview';
type FilterStatus = 'all' | 'ready-for-pickup' | 'picked-up' | 'in-progress';
type EventFilterStatus = 'all' | 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
type PieceSortMode = 'status' | 'event' | 'customer' | 'date';

export const Dashboard: React.FC = () => {
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
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventBookingModal, setShowEventBookingModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showEventRosterModal, setShowEventRosterModal] = useState(false);
  const [showPieceFormModal, setShowPieceFormModal] = useState(false);
  const [showCustomerPiecesModal, setShowCustomerPiecesModal] = useState(false);
  const [showPieceEditModal, setShowPieceEditModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [selectedCustomerForPieces, setSelectedCustomerForPieces] = useState<Customer | undefined>();
  const [smsNotificationPiece, setSMSNotificationPiece] = useState<Piece | undefined>();
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [editingPiece, setEditingPiece] = useState<Piece | undefined>();
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [selectedCustomerForPiece, setSelectedCustomerForPiece] = useState<string | undefined>();
  const [preSelectedCustomerId, setPreSelectedCustomerId] = useState<string | undefined>();
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
        alert('Error parsing CSV: ' + err.message);
      }
    });
  };
  
  const importCustomers = (customersArray: any[]) => {
    customersArray.forEach(customerData => {
      addCustomer({
        name: customerData.name,
        email: customerData.Email,
        phone: customerData.Phone,
        checkedIn: false,
        // ...map other fields as needed
      });
    });
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
    setPreSelectedCustomerId(undefined);
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
    setPreSelectedCustomerId(customerId);
    setShowPieceModal(true);
  };

  const handleEditPiece = (piece: Piece) => {
    setEditingPiece(piece);
    setPreSelectedCustomerId(undefined);
    setShowPieceModal(true);
  };

  const handleEditPieceFromCustomerSummary = (piece: Piece) => {
    setEditingPiece(piece);
    setShowPieceEditModal(true);
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

    setSMSNotificationPiece(piece);
    setShowSMSModal(true);
  };

  const handleSMSSent = () => {
    toast.success('SMS notification sent successfully');
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

  const handlePieceSubmit = async (pieceData: Omit<Piece, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingPiece) {
        await updatePiece(editingPiece.id, pieceData);
        toast.success('Piece updated successfully');
      } else {
        await addPiece(pieceData);
        toast.success('Piece added successfully');
      }
      setShowPieceModal(false);
      setPreSelectedCustomerId(undefined);
    } catch (error) {
      toast.error('Failed to save piece');
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
    setShowPieceFormModal(true);
  };

  const handlePieceFormSubmit = async (pieceData: Omit<Piece, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addPiece(pieceData);
      toast.success('Piece added successfully');
      setShowPieceFormModal(false);
      setSelectedCustomerForPiece(undefined);
    } catch (error) {
      console.error('Error adding piece:', error);
      toast.error('Failed to add piece');
    }
  };

  const handlePieceEditSubmit = async (pieceData: Omit<Piece, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingPiece) return;
    
    try {
      await updatePiece(editingPiece.id, pieceData);
      toast.success('Piece updated successfully');
      setShowPieceEditModal(false);
      setEditingPiece(undefined);
    } catch (error) {
      console.error('Error updating piece:', error);
      toast.error('Failed to update piece');
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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clay Cafe Database</h1>
              <p className="text-gray-600">Manage customers and ceramic pieces</p>
            </div>
            <div className="flex space-x-3">
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
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Palette className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pieces</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPieces}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.upcomingEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-amber-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'events', label: 'Events', icon: Calendar },
                { key: 'pieces', label: 'Pieces', icon: Palette },
                { key: 'customers', label: 'Customers', icon: Users },
                { key: 'overview', label: 'Overview', icon: TrendingUp }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key as ViewMode)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    viewMode === key
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search customers or pieces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            {viewMode === 'pieces' && (
              <div className="sm:w-48">
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
              <div className="sm:w-48">
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
        isOpen={showPieceModal}
        onClose={() => {
          setShowPieceModal(false);
          setPreSelectedCustomerId(undefined);
        }}
        title={editingPiece ? 'Edit Piece' : 'Add Piece'}
        size="lg"
        zIndex="overlay"
      >
        <PieceForm
          piece={editingPiece}
          customers={customers}
          events={events}
          studioSettings={studioSettings || undefined}
          preSelectedCustomerId={preSelectedCustomerId}
          onSubmit={handlePieceSubmit}
          onCancel={() => {
            setShowPieceModal(false);
            setPreSelectedCustomerId(undefined);
          }}
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
        title="Book Customer"
        size="xl"
        zIndex="overlay"
      >
        {selectedEvent && (
          <CustomerBookingForm
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

      {/* Piece Form Modal */}
      {showPieceFormModal && selectedCustomerForPiece && (
        <PieceFormModal
          customerId={selectedCustomerForPiece}
          eventId={selectedEvent?.id}
          onSave={handlePieceFormSubmit}
          onClose={() => {
            setShowPieceFormModal(false);
            setSelectedCustomerForPiece(undefined);
          }}
        />
      )}

      {/* Piece Edit Modal */}
      {showPieceEditModal && editingPiece && (
        <PieceEditModal
          piece={editingPiece}
          onSave={handlePieceEditSubmit}
          onClose={() => {
            setShowPieceEditModal(false);
            setEditingPiece(undefined);
          }}
        />
      )}

      {/* SMS Notification Modal */}
      {showSMSModal && smsNotificationPiece && (
        <SMSNotificationModal
          isOpen={showSMSModal}
          onClose={() => {
            setShowSMSModal(false);
            setSMSNotificationPiece(undefined);
          }}
          customer={getCustomerById(smsNotificationPiece.customerId)!}
          piece={smsNotificationPiece}
          onSent={handleSMSSent}
        />
      )}
    </div>
  );
};
