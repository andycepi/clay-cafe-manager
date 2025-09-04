import React from 'react';
import { Calendar, Clock, Users, MapPin, Edit, Trash2, Copy } from 'lucide-react';
import { Event, Customer, EventBooking } from '../types';
import { EVENT_TYPE_COLORS, getStatusColor } from '../constants';
import { Button } from './ui/Button';
import { format } from 'date-fns';
import { ensureDate } from '../utils/dateUtils';

interface EventCardProps {
  event: Event;
  customers: Customer[];
  bookings: EventBooking[];
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onViewRoster: (event: Event) => void;
  onDuplicate: (event: Event) => void;
}


export const EventCard: React.FC<EventCardProps> = ({
  event,
  customers,
  bookings,
  onEdit,
  onDelete,
  onViewRoster,
  onDuplicate
}) => {
  const eventBookings = bookings.filter(b => b.eventId === event.id);
  const confirmedBookings = eventBookings.filter(b => b.status === 'confirmed');
  const availableSpots = event.maxCapacity - confirmedBookings.length;
  const isFullyBooked = availableSpots <= 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onViewRoster(event);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="mb-4">
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${EVENT_TYPE_COLORS[event.type] || 'bg-gray-100 text-gray-800'}`}>
            {event.type.replace('-', ' ')}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('event', event.status)}`}>
            {event.status.replace('-', ' ')}
          </span>
        </div>
        
        {event.description && (
          <p className="text-sm text-gray-600 mb-3">{event.description}</p>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar size={14} />
          <span>{format(ensureDate(event.date) || new Date(), 'MMM dd, yyyy')}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock size={14} />
          <span>{event.startTime} - {event.endTime}</span>
        </div>
        
        {event.location && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin size={14} />
            <span>{event.location}</span>
          </div>
        )}
        
        {event.instructor && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users size={14} />
            <span>Instructor: {event.instructor}</span>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <span className="text-gray-500">Price:</span>
            <span className="ml-2 font-medium text-amber-600">${event.price}</span>
          </div>
          <div>
            <span className="text-gray-500">Capacity:</span>
            <span className="ml-2 font-medium">{confirmedBookings.length}/{event.maxCapacity}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isFullyBooked ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isFullyBooked ? 'Fully Booked' : `${availableSpots} spots available`}
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            {confirmedBookings.length} confirmed booking{confirmedBookings.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(event)}
            className="text-green-600 border-green-600 hover:bg-green-50"
            title="Duplicate Event"
          >
            <Copy size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(event)}
            title="Edit Event"
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(event.id)}
            title="Delete Event"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};
