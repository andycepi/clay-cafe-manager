import React, { useState } from 'react';
import { Event, Customer, EventBooking } from '../types';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { formatShortDate } from '../utils/dateUtils';

interface EventBookingFormProps {
  event: Event;
  customers: Customer[];
  existingBookings: EventBooking[];
  onSubmit: (booking: Omit<EventBooking, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const EventBookingForm: React.FC<EventBookingFormProps> = ({
  event,
  customers,
  existingBookings,
  onSubmit,
  onCancel
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get customers who are not already booked for this event
  const availableCustomers = customers.filter(customer => 
    !existingBookings.some(booking => 
      booking.customerId === customer.id && booking.status === 'confirmed'
    )
  );

  const customerOptions = availableCustomers.map(customer => ({
    value: customer.id,
    label: `${customer.name} (${customer.email})`
  }));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedCustomerId) {
      newErrors.customer = 'Please select a customer';
    }

    if (availableCustomers.length === 0) {
      newErrors.customer = 'No available customers to book';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      eventId: event.id,
      customerId: selectedCustomerId,
      bookingDate: new Date(),
      status: 'confirmed',
      notes: notes.trim() || undefined
    });
  };

  const handleCustomerChange = (value: string) => {
    setSelectedCustomerId(value);
    if (errors.customer) {
      setErrors(prev => ({ ...prev, customer: '' }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-800 mb-2">Booking for: {event.name}</h3>
        <div className="text-sm text-amber-700">
          <p>Date: {formatShortDate(event.date)}</p>
          <p>Time: {event.startTime} - {event.endTime}</p>
          <p>Available spots: {event.maxCapacity - existingBookings.filter(b => b.status === 'confirmed').length}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Select Customer *"
          value={selectedCustomerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
          options={customerOptions}
          error={errors.customer}
        />

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

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={availableCustomers.length === 0}>
            Book Customer
          </Button>
        </div>
      </form>
    </div>
  );
};
