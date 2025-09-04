import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit, 
  Copy, 
  Calendar,
  Clock,
  MapPin,
  User,
  UserPlus,
  Square,
  CheckSquare
} from 'lucide-react';
import { Event, Customer, EventBooking, Piece } from '../types';
import { PIECE_STATUSES } from '../constants';
import { calculateCustomerPaymentStatus } from '../utils/paymentUtils';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { formatEventDate } from '../utils/dateUtils';

interface EventRosterProps {
  event: Event;
  bookings: EventBooking[];
  customers: Customer[];
  pieces: Piece[];
  onClose: () => void;
  onCheckIn: (customerId: string, checkedIn: boolean) => void;
  onUpdatePayment: (pieceId: string, field: 'paidGlaze', value: boolean) => void;
  onAddPiece: (customerId: string) => void;
  onEditPiece: (piece: Piece) => void;
  onDuplicateEvent: (event: Event) => void;
  onBookCustomer: (eventId: string) => void;
  onBulkStatusUpdate: (pieceIds: string[], status: Piece['status']) => void;
}


export const EventRoster: React.FC<EventRosterProps> = ({
  event,
  bookings,
  customers,
  pieces,
  onClose,
  onCheckIn,
  onUpdatePayment,
  onAddPiece,
  onEditPiece,
  onDuplicateEvent,
  onBookCustomer,
  onBulkStatusUpdate
}) => {
  const [showAllPieces, setShowAllPieces] = useState(false);

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const eventPieces = pieces.filter(p => p.eventId === event.id);
  
  const bulkSelection = useBulkSelection({
    items: eventPieces,
    getId: (piece) => piece.id
  });
  
  const getCustomerPieces = (customerId: string) => {
    return eventPieces.filter(p => p.customerId === customerId);
  };

  const getCustomerPaymentStatus = (customerId: string) => {
    const customerPieces = getCustomerPieces(customerId);
    return calculateCustomerPaymentStatus(customerPieces);
  };



  const handleBulkStatusUpdate = (status: Piece['status']) => {
    if (bulkSelection.selectedCount > 0) {
      onBulkStatusUpdate(bulkSelection.selectedIds, status);
      bulkSelection.clearSelection();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={event.name}
      size="xl"
      zIndex="elevated"
    >
      <div className="max-w-6xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>{formatEventDate(event.date)}</span>
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
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllPieces(!showAllPieces)}
                className="flex items-center space-x-1"
              >
                <Users size={16} />
                <span>{showAllPieces ? 'Show Roster' : 'Show All Pieces'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBookCustomer(event.id)}
                className="flex items-center space-x-1"
              >
                <UserPlus size={16} />
                <span>Book Customer</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicateEvent(event)}
                className="flex items-center space-x-1"
              >
                <Copy size={16} />
                <span>Duplicate</span>
              </Button>
            </div>
          </div>
          
          {/* Event Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg">
              <div className="text-sm text-gray-500">Capacity</div>
              <div className="text-lg font-semibold">{confirmedBookings.length}/{event.maxCapacity}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-sm text-gray-500">Checked In</div>
              <div className="text-lg font-semibold text-green-600">
                {confirmedBookings.filter(b => {
                  const customer = customers.find(c => c.id === b.customerId);
                  return customer?.checkedIn;
                }).length}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-sm text-gray-500">Price</div>
              <div className="text-lg font-semibold">${event.price}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-sm text-gray-500">Total Pieces</div>
              <div className="text-lg font-semibold">{eventPieces.length}</div>
            </div>
          </div>
        </div>

        {/* Bulk Actions for All Pieces View */}
        {showAllPieces && bulkSelection.selectedCount > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-blue-900">
                  {bulkSelection.selectedCount} piece{bulkSelection.selectedCount > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bulkSelection.toggleBulkActions}
                >
                  Bulk Actions
                </Button>
                {bulkSelection.showBulkActions && (
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
                onClick={bulkSelection.clearSelection}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {showAllPieces ? (
            /* All Pieces View */
            <div className="space-y-4">
              {/* Select All Toggle */}
              <div className="flex items-center space-x-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bulkSelection.selectAll}
                  className="flex items-center space-x-1"
                >
                  {bulkSelection.isAllSelected ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                  <span>
                    {bulkSelection.isAllSelected ? 'Deselect All' : 'Select All'}
                  </span>
                </Button>
                <span className="text-sm text-gray-600">
                  {eventPieces.length} total pieces
                </span>
              </div>

              {/* All Pieces Grid */}
              <div className="grid grid-cols-1 gap-3">
                {eventPieces.map(piece => {
                  const customer = customers.find(c => c.id === piece.customerId);
                  const isSelected = bulkSelection.isSelected(piece);
                  
                  return (
                    <div
                      key={piece.id}
                      className={`border rounded-lg p-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} hover:bg-gray-50 transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => bulkSelection.toggleSelection(piece)}
                            className={`p-1 ${isSelected ? 'bg-blue-100 border-blue-500' : ''}`}
                          >
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </Button>
                          
                          {piece.imageUrl && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                              <img 
                                src={piece.imageUrl} 
                                alt="Piece" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <User size={16} className="text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {customer?.name || 'Unknown Customer'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {customer?.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {/* Volume */}
                          <div className="text-sm">
                            <span className="text-gray-500">Volume:</span>
                            <span className="ml-1 font-medium">{piece.cubicInches || 0} in³</span>
                          </div>

                          {/* Glaze */}
                          <div className="text-sm">
                            <span className="text-gray-500">Glaze:</span>
                            <span className="ml-1 font-medium">${piece.glazeTotal?.toFixed(2) || '0.00'}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onUpdatePayment(piece.id, 'paidGlaze', !piece.paidGlaze)}
                              className={`ml-1 p-1 ${piece.paidGlaze ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {piece.paidGlaze ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            </Button>
                          </div>

                          {/* Status */}
                          <div className="text-sm">
                            <span className="text-gray-500">Status:</span>
                            <span className="ml-1 capitalize text-xs bg-gray-100 px-2 py-1 rounded">
                              {piece.status.replace('-', ' ')}
                            </span>
                          </div>

                          {/* Edit Actions */}
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditPiece(piece)}
                              className="p-1"
                            >
                              <Edit size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {piece.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-sm text-gray-600 italic">"{piece.notes}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Roster View */
            <div className="space-y-4">
              {confirmedBookings.map(booking => {
                const customer = customers.find(c => c.id === booking.customerId);
                if (!customer) return null;
                
                const paymentStatus = getCustomerPaymentStatus(customer.id);
                const customerPieces = paymentStatus.pieces;

                return (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    {/* Customer Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <User size={20} className="text-gray-400" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                        
                        {/* Check-in Toggle */}
                        <Button
                          variant={customer.checkedIn ? "primary" : "outline"}
                          size="sm"
                          onClick={() => onCheckIn(customer.id, !customer.checkedIn)}
                          className={`flex items-center space-x-1 ${
                            customer.checkedIn 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'border-green-600 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          <CheckCircle size={14} />
                          <span>{customer.checkedIn ? 'Checked In' : 'Check In'}</span>
                        </Button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAddPiece(customer.id)}
                          className="flex items-center space-x-1"
                        >
                          <Plus size={14} />
                          <span>Add Piece</span>
                        </Button>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Glaze Owed</div>
                        <div className={`font-semibold ${paymentStatus.totalGlaze > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${paymentStatus.totalGlaze.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Total Pieces</div>
                        <div className="font-semibold">{customerPieces.length}</div>
                      </div>
                    </div>

                    {/* Pieces */}
                    {customerPieces.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Pieces:</h5>
                        {customerPieces.map(piece => (
                          <div
                            key={piece.id}
                            className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-white"
                          >
                            <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">Volume:</span>
                                <div>{piece.cubicInches || 0} in³</div>
                              </div>
                              
                              <div>
                                <span className="text-gray-500">Glaze:</span>
                                <div className="flex items-center space-x-1">
                                  <span>${piece.glazeTotal?.toFixed(2) || '0.00'}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onUpdatePayment(piece.id, 'paidGlaze', !piece.paidGlaze)}
                                    className={`p-1 ${piece.paidGlaze ? 'text-green-600' : 'text-red-600'}`}
                                  >
                                    {piece.paidGlaze ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                  </Button>
                                </div>
                              </div>
                              
                              <div>
                                <span className="text-gray-500">Status:</span>
                                <div className="capitalize text-xs">
                                  {piece.status.replace('-', ' ')}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onEditPiece(piece)}
                                  className="p-1"
                                >
                                  <Edit size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};