import React, { useState, useMemo } from 'react';
import { Event, Customer, EventBooking } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { formatShortDate } from '../utils/dateUtils';
import { useForm } from '../hooks/useForm';
import { Search, User, Phone, Mail, UserCheck, UserX, Plus, CheckSquare, Square, Users, UserMinus, Trash2 } from 'lucide-react';

interface CustomerBookingFormProps {
  event: Event;
  customers: Customer[];
  existingBookings: EventBooking[];
  onSubmit: (booking: Omit<EventBooking, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  onRemoveBooking?: (bookingId: string) => void;
  onCancel: () => void;
}

export const CustomerBookingForm: React.FC<CustomerBookingFormProps> = ({
  event,
  customers,
  existingBookings,
  onSubmit,
  onAddCustomer,
  onRemoveBooking,
  onCancel
}) => {
  const [mode, setMode] = useState<'existing' | 'new' | 'remove'>('existing');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState<'all' | 'available' | 'booked'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const CUSTOMERS_PER_PAGE = 6;

  // Get booking status and booking IDs for customers
  const customerBookingInfo = useMemo(() => {
    const statusMap = new Map<string, boolean>();
    const bookingIdMap = new Map<string, string>();
    existingBookings.forEach(booking => {
      if (booking.status === 'confirmed') {
        statusMap.set(booking.customerId, true);
        bookingIdMap.set(booking.customerId, booking.id);
      }
    });
    return { statusMap, bookingIdMap };
  }, [existingBookings]);

  const customerBookingStatus = customerBookingInfo.statusMap;

  // Filter and search customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        (customer.phone && customer.phone.includes(term))
      );
    }

    // Booking status filter
    if (showFilter === 'available') {
      filtered = filtered.filter(customer => !customerBookingStatus.get(customer.id));
    } else if (showFilter === 'booked') {
      filtered = filtered.filter(customer => customerBookingStatus.get(customer.id));
    }

    return filtered;
  }, [customers, searchTerm, showFilter, customerBookingStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * CUSTOMERS_PER_PAGE;
    return filteredCustomers.slice(startIndex, startIndex + CUSTOMERS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showFilter]);

  // Bulk selection helpers
  const toggleCustomerSelection = (customerId: string) => {
    // In remove mode, only allow selecting booked customers
    // In add mode, only allow selecting unbooked customers
    if (mode === 'remove') {
      if (!customerBookingStatus.get(customerId)) return; // Only select booked customers
    } else {
      if (customerBookingStatus.get(customerId)) return; // Don't select already booked customers
    }
    
    setSelectedCustomerIds(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
    
    // Clear errors when making selections
    if (errors.customer) {
      setErrors(prev => ({ ...prev, customer: '' }));
    }
  };


  const clearAllSelections = () => {
    setSelectedCustomerIds([]);
  };

  const getSelectableCustomersOnPage = () => {
    return paginatedCustomers.filter(c => 
      mode === 'remove' 
        ? customerBookingStatus.get(c.id)  // In remove mode, select booked customers
        : !customerBookingStatus.get(c.id) // In add mode, select unbooked customers
    );
  };

  const isAllPageSelected = () => {
    const selectableOnPage = getSelectableCustomersOnPage();
    return selectableOnPage.length > 0 && selectableOnPage.every(c => selectedCustomerIds.includes(c.id));
  };

  const toggleSelectAllOnPage = () => {
    const selectableOnPage = getSelectableCustomersOnPage();
    if (isAllPageSelected()) {
      // Deselect all on this page
      setSelectedCustomerIds(prev => 
        prev.filter(id => !selectableOnPage.some(c => c.id === id))
      );
    } else {
      // Select all selectable on this page
      const newSelections = selectableOnPage.filter(c => !selectedCustomerIds.includes(c.id)).map(c => c.id);
      setSelectedCustomerIds(prev => [...prev, ...newSelections]);
    }
  };

  // New customer form using our generic hook
  const {
    formData: newCustomerData,
    errors: newCustomerErrors,
    isSubmitting,
    handleChange: handleNewCustomerChange,
    handleSubmit: handleNewCustomerSubmit
  } = useForm({
    initialData: {
      name: '',
      email: '',
      phone: '',
      checkedIn: false
    },
    validationRules: {
      name: { required: true },
      email: { 
        required: true,
        custom: (value: string) => {
          if (value && !/\S+@\S+\.\S+/.test(value)) {
            return 'Email is invalid';
          }
        }
      },
      phone: {
        custom: (value: string) => {
          if (value && !/^[\d\s\-()+=]+$/.test(value)) {
            return 'Phone number is invalid';
          }
        }
      }
    },
    onSubmit: async (customerData) => {
      try {
        const newCustomer = await onAddCustomer(customerData);
        // Book the new customer immediately
        onSubmit({
          eventId: event.id,
          customerId: newCustomer.id,
          bookingDate: new Date(),
          status: 'confirmed',
          notes: notes.trim() || undefined
        });
      } catch (error) {
        console.error('Failed to add customer:', error);
      }
    }
  });

  const validateExistingCustomers = () => {
    const newErrors: Record<string, string> = {};

    if (selectedCustomerIds.length === 0) {
      newErrors.customer = 'Please select at least one customer';
    }

    // Check if any selected customers are already booked
    const alreadyBooked = selectedCustomerIds.filter(id => customerBookingStatus.get(id));
    if (alreadyBooked.length > 0) {
      newErrors.customer = 'Some selected customers are already booked for this event';
    }

    // Check if event has capacity for all selected customers
    const bookedCount = existingBookings.filter(b => b.status === 'confirmed').length;
    const remainingCapacity = event.maxCapacity - bookedCount;
    if (selectedCustomerIds.length > remainingCapacity) {
      newErrors.customer = `Only ${remainingCapacity} spots available, but ${selectedCustomerIds.length} customers selected`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExistingCustomerSubmit = async () => {
    if (!validateExistingCustomers()) {
      return;
    }

    try {
      // Submit each booking individually
      for (const customerId of selectedCustomerIds) {
        await new Promise(resolve => {
          onSubmit({
            eventId: event.id,
            customerId,
            bookingDate: new Date(),
            status: 'confirmed',
            notes: notes.trim() || undefined
          });
          // Small delay to prevent overwhelming the system
          setTimeout(resolve, 50);
        });
      }
    } catch (error) {
      console.error('Error booking customers:', error);
    }
  };

  const handleRemoveCustomersSubmit = async () => {
    if (!onRemoveBooking) return;
    
    if (selectedCustomerIds.length === 0) {
      setErrors({ customer: 'Please select at least one customer to remove' });
      return;
    }

    try {
      // Remove each booking individually
      for (const customerId of selectedCustomerIds) {
        const bookingId = customerBookingInfo.bookingIdMap.get(customerId);
        if (bookingId) {
          await new Promise(resolve => {
            onRemoveBooking(bookingId);
            // Small delay to prevent overwhelming the system
            setTimeout(resolve, 50);
          });
        }
      }
      // Clear selections after successful removal
      setSelectedCustomerIds([]);
    } catch (error) {
      console.error('Error removing customers:', error);
    }
  };

  const availableSpots = event.maxCapacity - existingBookings.filter(b => b.status === 'confirmed').length;

  return (
    <div className="space-y-4">
      {/* Event Info Header */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-800 mb-2">Booking for: {event.name}</h3>
        <div className="text-sm text-amber-700">
          <p>Date: {formatShortDate(event.date)}</p>
          <p>Time: {event.startTime} - {event.endTime}</p>
          <p>Available spots: <span className={availableSpots <= 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>{availableSpots}</span></p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => {
            setMode('existing');
            setSelectedCustomerIds([]);
            setErrors({});
          }}
          className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === 'existing'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <User size={16} />
            <span>Add Customer</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('new');
            setSelectedCustomerIds([]);
            setErrors({});
          }}
          className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === 'new'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Plus size={16} />
            <span>New Customer</span>
          </div>
        </button>
        {onRemoveBooking && (
          <button
            type="button"
            onClick={() => {
              setMode('remove');
              setSelectedCustomerIds([]);
              setErrors({});
            }}
            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'remove'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <UserMinus size={16} />
              <span>Remove Customer</span>
            </div>
          </button>
        )}
      </div>

      {mode === 'existing' || mode === 'remove' ? (
        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            {/* Filter Buttons and Selection Info */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    showFilter === 'all'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({customers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilter('available')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    showFilter === 'available'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Available ({customers.filter(c => !customerBookingStatus.get(c.id)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilter('booked')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    showFilter === 'booked'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Already Booked ({customers.filter(c => customerBookingStatus.get(c.id)).length})
                </button>
              </div>
              
              {/* Selection Summary */}
              {selectedCustomerIds.length > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-amber-600 font-medium">
                    {selectedCustomerIds.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={clearAllSelections}
                    className="text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Customer List */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* List Header with Select All */}
            {paginatedCustomers.length > 0 && getSelectableCustomersOnPage().length > 0 && (
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllOnPage}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {isAllPageSelected() ? (
                      <CheckSquare size={16} className={mode === 'remove' ? 'text-red-600' : 'text-amber-600'} />
                    ) : (
                      <Square size={16} />
                    )}
                    <span>
                      {isAllPageSelected() ? 'Deselect all on page' : 'Select all on page'}
                    </span>
                  </button>
                  {getSelectableCustomersOnPage().length < paginatedCustomers.length && (
                    <span className="text-xs text-gray-400">
                      ({getSelectableCustomersOnPage().length} {mode === 'remove' ? 'booked' : 'available'})
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="max-h-96 overflow-y-auto">
              {paginatedCustomers.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {paginatedCustomers.map((customer) => {
                    const isBooked = customerBookingStatus.get(customer.id);
                    const isSelected = selectedCustomerIds.includes(customer.id);
                    const isSelectable = mode === 'remove' ? isBooked : !isBooked;
                    
                    return (
                      <div
                        key={customer.id}
                        onClick={() => isSelectable && toggleCustomerSelection(customer.id)}
                        className={`p-4 cursor-pointer transition-colors ${
                          !isSelectable 
                            ? 'bg-gray-50 cursor-not-allowed opacity-60' 
                            : isSelected
                            ? mode === 'remove' 
                              ? 'bg-red-50 border-l-4 border-red-400'
                              : 'bg-amber-50 border-l-4 border-amber-400'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {/* Selection Checkbox */}
                            <div className="flex-shrink-0">
                              {!isSelectable ? (
                                <div className="w-5 h-5 rounded border-2 border-gray-300 bg-gray-100 opacity-50"></div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCustomerSelection(customer.id);
                                  }}
                                  className={`w-5 h-5 rounded border-2 border-gray-300 hover:border-${mode === 'remove' ? 'red' : 'amber'}-400 focus:outline-none focus:ring-2 focus:ring-${mode === 'remove' ? 'red' : 'amber'}-500 focus:ring-offset-2 transition-colors`}
                                >
                                  {isSelected && (
                                    <CheckSquare size={16} className={`${mode === 'remove' ? 'text-red-600' : 'text-amber-600'} -m-0.5`} />
                                  )}
                                </button>
                              )}
                            </div>
                            
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isSelected 
                                ? mode === 'remove' ? 'bg-red-100' : 'bg-amber-100'
                                : 'bg-gray-100'
                            }`}>
                              <User size={20} className={
                                isSelected 
                                  ? mode === 'remove' ? 'text-red-600' : 'text-amber-600'
                                  : 'text-gray-500'
                              } />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{customer.name}</h4>
                                {isBooked && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    mode === 'remove' 
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    <UserCheck size={12} className="mr-1" />
                                    {mode === 'remove' ? 'Registered' : 'Already Booked'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Mail size={12} />
                                  <span>{customer.email}</span>
                                </div>
                                {customer.phone && (
                                  <div className="flex items-center space-x-1">
                                    <Phone size={12} />
                                    <span>{customer.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {isSelected && isSelectable && (
                            <div className={mode === 'remove' ? 'text-red-600' : 'text-amber-600'}>
                              {mode === 'remove' ? <Trash2 size={20} /> : <Users size={20} />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <UserX size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No customers found</p>
                  {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * CUSTOMERS_PER_PAGE) + 1} to {Math.min(currentPage * CUSTOMERS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} customers
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {errors.customer && (
            <div className="text-red-600 text-sm">{errors.customer}</div>
          )}

          {/* Booking Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Booking Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              placeholder="Any special notes for this booking..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            {mode === 'remove' ? (
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleRemoveCustomersSubmit}
                disabled={selectedCustomerIds.length === 0}
                className="flex items-center space-x-2"
              >
                <Trash2 size={16} />
                <span>
                  Remove {selectedCustomerIds.length === 1 
                    ? '1 Customer' 
                    : `${selectedCustomerIds.length} Customers`}
                </span>
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="primary" 
                onClick={handleExistingCustomerSubmit}
                disabled={selectedCustomerIds.length === 0 || availableSpots <= 0}
                className="flex items-center space-x-2"
              >
                <Users size={16} />
                <span>
                  Book {selectedCustomerIds.length === 1 
                    ? '1 Customer' 
                    : `${selectedCustomerIds.length} Customers`}
                </span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleNewCustomerSubmit} className="space-y-4">
          <Input
            label="Customer Name *"
            value={newCustomerData.name}
            onChange={(e) => handleNewCustomerChange('name', e.target.value)}
            error={newCustomerErrors.name}
            placeholder="Enter customer name"
          />

          <Input
            label="Email *"
            type="email"
            value={newCustomerData.email}
            onChange={(e) => handleNewCustomerChange('email', e.target.value)}
            error={newCustomerErrors.email}
            placeholder="customer@email.com"
          />

          <Input
            label="Phone"
            type="tel"
            value={newCustomerData.phone}
            onChange={(e) => handleNewCustomerChange('phone', e.target.value)}
            error={newCustomerErrors.phone}
            placeholder="(555) 123-4567"
          />

          <div>
            <label htmlFor="notes-new" className="block text-sm font-medium text-gray-700 mb-1">
              Booking Notes
            </label>
            <textarea
              id="notes-new"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              placeholder="Any special notes for this booking..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              Add & Book Customer
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};