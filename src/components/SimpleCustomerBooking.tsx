import React, { useState, useMemo } from 'react';
import { Event, Customer, EventBooking } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Search, User, UserCheck } from 'lucide-react';

interface SimpleCustomerBookingProps {
  event: Event;
  customers: Customer[];
  existingBookings: EventBooking[];
  onSubmit: (booking: Omit<EventBooking, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  onRemoveBooking?: (bookingId: string) => void;
  onCancel: () => void;
}

export const SimpleCustomerBooking: React.FC<SimpleCustomerBookingProps> = ({
  event,
  customers,
  existingBookings,
  onSubmit,
  onAddCustomer,
  onRemoveBooking,
  onCancel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '', email: '', phone: ''
  });

  // Get booked customer IDs for quick lookup
  const bookedCustomerIds = useMemo(() => {
    const bookedIds = new Set<string>();
    existingBookings.forEach(booking => {
      if (booking.status === 'confirmed' && booking.eventId === event.id) {
        bookedIds.add(booking.customerId);
      }
    });
    return bookedIds;
  }, [existingBookings, event.id]);

  // Filter customers by search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      (customer.phone && customer.phone.includes(term))
    );
  }, [customers, searchTerm]);

  // Available spots calculation
  const availableSpots = event.maxCapacity - bookedCustomerIds.size;

  const handleBookCustomer = () => {
    if (!selectedCustomerId) return;
    
    const booking = {
      eventId: event.id,
      customerId: selectedCustomerId,
      bookingDate: new Date(),
      status: 'confirmed' as EventBooking['status'],
      notes: ''
    };
    
    onSubmit(booking);
    setSelectedCustomerId('');
  };

  const handleAddNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerData.name.trim() || !newCustomerData.email.trim()) return;

    try {
      const newCustomer = await onAddCustomer({
        ...newCustomerData,
        checkedIn: false
      });
      
      // Auto-select the new customer for booking
      setSelectedCustomerId(newCustomer.id);
      setShowNewCustomerForm(false);
      setNewCustomerData({ name: '', email: '', phone: '' });
    } catch (error) {
      alert('Failed to add customer');
    }
  };

  const handleRemoveCustomer = (customerId: string) => {
    const booking = existingBookings.find(b => 
      b.customerId === customerId && b.eventId === event.id && b.status === 'confirmed'
    );
    if (booking && onRemoveBooking) {
      onRemoveBooking(booking.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Event Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg">{event.name}</h3>
        <p className="text-sm text-gray-600">
          {new Date(event.date).toLocaleDateString()} • {event.location}
        </p>
        <p className="text-sm font-medium">
          {bookedCustomerIds.size}/{event.maxCapacity} spots filled 
          {availableSpots > 0 && <span className="text-green-600"> ({availableSpots} available)</span>}
        </p>
      </div>

      {availableSpots > 0 && (
        <>
          {/* Customer Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Customers
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer to Book
            </label>
            <div className="max-h-40 overflow-y-auto border rounded-lg">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No customers found
                </div>
              ) : (
                filteredCustomers.map(customer => {
                  const isBooked = bookedCustomerIds.has(customer.id);
                  return (
                    <div
                      key={customer.id}
                      className={`p-3 border-b last:border-b-0 flex items-center justify-between ${
                        isBooked ? 'bg-green-50' : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                      onClick={!isBooked ? () => setSelectedCustomerId(customer.id) : undefined}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="customer"
                          value={customer.id}
                          checked={selectedCustomerId === customer.id}
                          onChange={() => !isBooked && setSelectedCustomerId(customer.id)}
                          disabled={isBooked}
                          className="h-4 w-4"
                        />
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                        </div>
                      </div>
                      {isBooked ? (
                        <div className="flex items-center space-x-2">
                          <UserCheck className="text-green-600" size={16} />
                          <span className="text-sm text-green-600">Booked</span>
                          {onRemoveBooking && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCustomer(customer.id);
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ) : (
                        <User className="text-gray-400" size={16} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* New Customer Form */}
          {!showNewCustomerForm ? (
            <Button
              variant="outline"
              onClick={() => setShowNewCustomerForm(true)}
              className="w-full"
            >
              Add New Customer
            </Button>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium">Add New Customer</h4>
              <form onSubmit={handleAddNewCustomer} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Full Name *"
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email *"
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
                <Input
                  type="tel"
                  placeholder="Phone"
                  value={newCustomerData.phone}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                />
                <div className="flex space-x-2">
                  <Button type="submit" size="sm">Add Customer</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowNewCustomerForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {availableSpots === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
          <p className="text-yellow-800">This event is at full capacity</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {selectedCustomerId && availableSpots > 0 && (
          <Button onClick={handleBookCustomer}>
            Book Selected Customer
          </Button>
        )}
      </div>
    </div>
  );
};