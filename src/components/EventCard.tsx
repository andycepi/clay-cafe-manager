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
      className="group bg-gradient-to-br from-white via-white to-gray-50/80 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer backdrop-blur-sm p-6"
      onClick={handleCardClick}
    >
      <div className="mb-4">
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-xl font-bold text-gray-900">{event.name}</h3>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${EVENT_TYPE_COLORS[event.type] || 'bg-gray-100 text-gray-800'}`}>
            {event.type.replace('-', ' ')}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor('event', event.status)}`}>
            {event.status.replace('-', ' ')}
          </span>
        </div>
        
        {event.description && (
          <p className="text-sm text-gray-700 leading-relaxed mb-3 italic">"{event.description}"</p>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center space-x-3 text-sm text-gray-700">
          <div className="p-1.5 bg-blue-100/80 rounded-lg">
            <Calendar size={16} className="text-blue-600" />
          </div>
          <span>{format(ensureDate(event.date) || new Date(), 'MMM dd, yyyy')}</span>
        </div>
        
        <div className="flex items-center space-x-3 text-sm text-gray-700">
          <div className="p-1.5 bg-green-100/80 rounded-lg">
            <Clock size={16} className="text-green-600" />
          </div>
          <span>{event.startTime} - {event.endTime}</span>
        </div>
        
        {event.location && (
          <div className="flex items-center space-x-3 text-sm text-gray-700">
            <div className="p-1.5 bg-purple-100/80 rounded-lg">
              <MapPin size={16} className="text-purple-600" />
            </div>
            <span>{event.location}</span>
          </div>
        )}
        
        {event.instructor && (
          <div className="flex items-center space-x-3 text-sm text-gray-700">
            <div className="p-1.5 bg-orange-100/80 rounded-lg">
              <Users size={16} className="text-orange-600" />
            </div>
            <span>Instructor: {event.instructor}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200/50 pt-4">
        <div className="grid grid-cols-2 gap-6 text-sm mb-4">
          <div>
            <span className="text-gray-500">Price:</span>
            <span className="ml-2 font-bold text-lg text-green-600">${event.price}</span>
          </div>
          <div>
            <span className="text-gray-500">Capacity:</span>
            <span className="ml-2 font-bold text-lg text-blue-600">{confirmedBookings.length}/{event.maxCapacity}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full shadow-sm ${isFullyBooked ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {isFullyBooked ? 'Fully Booked' : `${availableSpots} spots available`}
            </span>
          </div>
          
          <div className="text-sm font-medium text-gray-600">
            {confirmedBookings.length} confirmed booking{confirmedBookings.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200/50 pt-4">
        <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(event)}
            className="text-green-600 hover:bg-green-100/80 rounded-full p-2 hover:scale-110"
            title="Duplicate Event"
          >
            <Copy size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(event)}
            className="text-blue-600 hover:bg-blue-100/80 rounded-full p-2 hover:scale-110"
            title="Edit Event"
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(event.id)}
            className="text-red-600 hover:bg-red-100/80 rounded-full p-2 hover:scale-110"
            title="Delete Event"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
