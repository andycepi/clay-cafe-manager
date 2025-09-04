import React, { useEffect } from 'react';
import { Event } from '../types';
import { useForm } from '../hooks/useForm';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';

interface EventFormProps {
  event?: Event;
  onSubmit: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const eventTypes = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'open-studio', label: 'Open Studio' },
  { value: 'private-party', label: 'Private Party' },
  { value: 'class', label: 'Class' },
  { value: 'special-event', label: 'Special Event' }
];

const eventStatuses = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const EventForm: React.FC<EventFormProps> = ({
  event,
  onSubmit,
  onCancel
}) => {
  const initialData = {
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    maxCapacity: '',
    price: '',
    type: 'workshop' as Event['type'],
    status: 'upcoming' as Event['status'],
    instructor: '',
    location: '',
    notes: ''
  };

  const validationRules = {
    name: { required: true },
    date: { required: true },
    startTime: { required: true },
    endTime: { 
      required: true,
      custom: (value: string, formData: typeof initialData) => {
        if (formData.startTime && value) {
          const start = new Date(`2000-01-01T${formData.startTime}`);
          const end = new Date(`2000-01-01T${value}`);
          if (start >= end) {
            return 'End time must be after start time';
          }
        }
      }
    },
    maxCapacity: {
      required: true,
      custom: (value: string) => {
        if (!value || isNaN(Number(value)) || Number(value) <= 0) {
          return 'Valid capacity is required';
        }
      }
    },
    price: {
      required: true,
      custom: (value: string) => {
        if (!value || isNaN(Number(value)) || Number(value) < 0) {
          return 'Valid price is required';
        }
      }
    }
  };

  const {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    handleCancel,
    setFormData
  } = useForm({
    initialData,
    validationRules,
    onSubmit: (data) => {
      onSubmit({
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        maxCapacity: Number(data.maxCapacity),
        currentBookings: event?.currentBookings || 0,
        price: Number(data.price),
        type: data.type,
        status: data.status,
        instructor: data.instructor.trim() || undefined,
        location: data.location.trim() || undefined,
        notes: data.notes.trim() || undefined
      });
    },
    onCancel
  });

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description || '',
        date: event.date.toISOString().split('T')[0],
        startTime: event.startTime,
        endTime: event.endTime,
        maxCapacity: event.maxCapacity.toString(),
        price: event.price.toString(),
        type: event.type,
        status: event.status,
        instructor: event.instructor || '',
        location: event.location || '',
        notes: event.notes || ''
      });
    }
  }, [event, setFormData]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Event Name *"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        placeholder="Enter event name"
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
          placeholder="Event description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date *"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          error={errors.date}
        />

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Start Time *"
            type="time"
            value={formData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            error={errors.startTime}
          />

          <Input
            label="End Time *"
            type="time"
            value={formData.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
            error={errors.endTime}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Event Type *"
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          options={eventTypes}
        />

        <Select
          label="Status *"
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          options={eventStatuses}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Max Capacity *"
          type="number"
          min="1"
          value={formData.maxCapacity}
          onChange={(e) => handleChange('maxCapacity', e.target.value)}
          error={errors.maxCapacity}
          placeholder="8"
        />

        <Input
          label="Price *"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => handleChange('price', e.target.value)}
          error={errors.price}
          placeholder="0.00"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Instructor"
          value={formData.instructor}
          onChange={(e) => handleChange('instructor', e.target.value)}
          placeholder="Instructor name"
        />

        <Input
          label="Location"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Studio location"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={2}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {event ? 'Update Event' : 'Add Event'}
        </Button>
      </div>
    </form>
  );
};
