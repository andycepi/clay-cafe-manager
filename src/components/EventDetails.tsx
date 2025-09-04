import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  DollarSign, 
  X, 
  User, 
  Palette, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit,
  Copy,
  Square,
  CheckSquare
} from 'lucide-react';
import { Event, Customer, EventBooking, Piece } from '../types';
import { STATUS_COLORS, EVENT_TYPE_COLORS, PIECE_STATUSES, getStatusColor, getPieceStatusInfo } from '../constants';
import { Button } from './ui/Button';
import { format } from 'date-fns';
import { ensureDate } from '../utils/dateUtils';

interface EventDetailsProps {
  event: Event;
  customers: Customer[];
  bookings: EventBooking[];
  pieces: Piece[];
  onClose: () => void;
  onRemoveBooking: (bookingId: string) => void;
  onCheckIn: (customerId: string, checkedIn: boolean) => void;
  onUpdatePayment: (pieceId: string, field: 'paidGlaze', value: boolean) => void;
  onAddPiece: (customerId: string) => void;
  onEditPiece: (piece: Piece) => void;
  onDuplicateEvent: (event: Event) => void;
  onBulkStatusUpdate: (pieceIds: string[], status: Piece['status']) => void;
}

const bookingStatusColors = {
  'confirmed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
  'no-show': 'bg-yellow-100 text-yellow-800'
};

export const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  customers,
  bookings,
  pieces,
  onClose,
  onRemoveBooking,
  onCheckIn,
  onUpdatePayment,
  onAddPiece,
  onEditPiece,
  onDuplicateEvent,
  onBulkStatusUpdate
}) => {
  const [selectedPieces, setSelectedPieces] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const eventBookings = bookings.filter(b => b.eventId === event.id);
  const confirmedBookings = eventBookings.filter(b => b.status === 'confirmed');
  const eventPieces = pieces.filter(p => p.eventId === event.id);

  const getCustomerById = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  const getCustomerPieces = (customerId: string) => {
    return eventPieces.filter(p => p.customerId === customerId);
  };

  const getCustomerPaymentStatus = (customerId: string) => {
    const customerPieces = getCustomerPieces(customerId);
    const totalGlaze = customerPieces.reduce((sum, p) => sum + (p.paidGlaze ? 0 : (p.glazeTotal || 0)), 0);
    return { totalGlaze, pieces: customerPieces };
  };

  const togglePieceSelection = (pieceId: string) => {
    setSelectedPieces(prev => 
      prev.includes(pieceId) 
        ? prev.filter(id => id !== pieceId)
        : [...prev, pieceId]
    );
  };


  const handleBulkStatusUpdate = (status: Piece['status']) => {
    if (selectedPieces.length > 0) {
      onBulkStatusUpdate(selectedPieces, status);
      setSelectedPieces([]);
      setShowBulkActions(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{event.name}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${EVENT_TYPE_COLORS[event.type] || 'bg-gray-100 text-gray-800'}`}>
              {event.type.replace('-', ' ')}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor('event', event.status)}`}>
              {event.status.replace('-', ' ')}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
            <div className="flex items-center space-x-1">
              <Calendar size={16} />
              <span>{format(ensureDate(event.date) || new Date(), 'EEEE, MMMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={16} />
              <span>{event.startTime} - {event.endTime}</span>
            </div>
            {event.location && (
              <div className="flex items-center space-x-1">
                <MapPin size={16} />
                <span>{event.location}</span>
              </div>
            )}
          </div>
          
          {event.description && (
            <p className="text-gray-600 mt-3">{event.description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicateEvent(event)}
            className="flex items-center space-x-1"
          >
            <Copy size={16} />
            <span>Duplicate</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Event Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Capacity</div>
          <div className="text-lg font-semibold">{confirmedBookings.length}/{event.maxCapacity}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Checked In</div>
          <div className="text-lg font-semibold text-green-600">
            {confirmedBookings.filter(b => {
              const customer = customers.find(c => c.id === b.customerId);
              return customer?.checkedIn;
            }).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Price</div>
          <div className="text-lg font-semibold">${event.price}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Pieces</div>
          <div className="text-lg font-semibold">{eventPieces.length}</div>
        </div>
      </div>

      {/* Bulk Actions for Pieces */}
      {selectedPieces.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-blue-900">
                {selectedPieces.length} piece{selectedPieces.length > 1 ? 's' : ''} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(!showBulkActions)}
              >
                Bulk Actions
              </Button>
              {showBulkActions && (
                <select
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusUpdate(e.target.value as Piece['status']);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Change Status...</option>
                  {PIECE_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPieces([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Bookings */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Bookings ({eventBookings.length})</h3>
        {eventBookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No bookings yet</p>
        ) : (
          <div className="space-y-3">
            {eventBookings.map(booking => {
              const customer = getCustomerById(booking.customerId);
              const customerPieces = getCustomerPieces(booking.customerId);
              
              return (
                <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {customer ? customer.name : 'Unknown Customer'}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bookingStatusColors[booking.status]}`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      {customer && (
                        <div className="text-sm text-gray-600 mb-2">
                          <p>Email: {customer.email}</p>
                          {customer.phone && <p>Phone: {customer.phone}</p>}
                        </div>
                      )}
                      
                      {booking.notes && (
                        <p className="text-sm text-gray-600 italic">"{booking.notes}"</p>
                      )}
                      
                      {customerPieces.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                            <Palette size={14} />
                            <span>Pieces created: {customerPieces.length}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {customerPieces.map(piece => (
                              <span key={piece.id} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
                                ${piece.glazeTotal?.toFixed(2) || '0.00'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {booking.status === 'confirmed' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onRemoveBooking(booking.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes */}
      {event.notes && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Event Notes</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700">{event.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};
