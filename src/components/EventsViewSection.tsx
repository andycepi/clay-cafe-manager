import React from 'react';
import { Calendar } from 'lucide-react';
import { Event, Customer, EventBooking } from '../types';
import { EventCard } from './EventCard';
import { Button } from './ui/Button';

interface EventsViewSectionProps {
  events: Event[];
  customers: Customer[];
  eventBookings: EventBooking[];
  searchTerm: string;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onViewRoster: (event: Event) => void;
  onDuplicate: (event: Event) => void;
  onAddEvent: () => void;
}

export const EventsViewSection: React.FC<EventsViewSectionProps> = ({
  events,
  customers,
  eventBookings,
  searchTerm,
  onEdit,
  onDelete,
  onViewRoster,
  onDuplicate,
  onAddEvent
}) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Calendar size={48} />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No events found
        </h3>
        <p className="text-gray-600 mb-4">
          {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first event'}
        </p>
        <Button onClick={onAddEvent}>
          Add Event
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map(event => (
        <EventCard
          key={event.id}
          event={event}
          customers={customers}
          bookings={eventBookings}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewRoster={onViewRoster}
          onDuplicate={onDuplicate}
        />
      ))}
    </div>
  );
};