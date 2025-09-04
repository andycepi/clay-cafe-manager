import React from 'react';
import { CheckCircle, XCircle, Plus, Edit, MessageSquare } from 'lucide-react';
import { Customer, Piece, Event } from '../types';
import { PIECE_STATUSES, getPieceStatusInfo } from '../constants';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { format } from 'date-fns';
import { ensureDate } from '../utils/dateUtils';

interface CustomerPiecesSummaryProps {
  customer: Customer;
  pieces: Piece[];
  events: Event[];
  onClose: () => void;
  onUpdatePieceStatus: (pieceId: string, status: Piece['status']) => void;
  onUpdatePayment: (pieceId: string, field: 'paidGlaze', value: boolean) => void;
  onAddPiece: (customerId: string) => void;
  onEditPiece: (piece: Piece) => void;
  onNotifyCustomer?: (piece: Piece) => void;
}


export const CustomerPiecesSummary: React.FC<CustomerPiecesSummaryProps> = ({
  customer,
  pieces,
  events,
  onClose,
  onUpdatePieceStatus,
  onUpdatePayment,
  onAddPiece,
  onEditPiece,
  onNotifyCustomer
}) => {
  const customerPieces = pieces.filter(p => p.customerId === customer.id);
  const totalGlazeOwed = customerPieces.reduce((sum, p) => sum + (p.paidGlaze ? 0 : (p.glazeTotal || 0)), 0);
  const readyCount = customerPieces.filter(p => p.status === 'ready-for-pickup').length;

  const getEventName = (eventId?: string) => {
    if (!eventId) return 'No Event';
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'Unknown Event';
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`${customer.name}`}
      size="lg"
      zIndex="elevated"
    >
      <div className="space-y-6">
        {/* Header with Contact & Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">{customer.email}</p>
            {customer.phone && <p className="text-gray-600 text-sm">{customer.phone}</p>}
          </div>
          <Button
            variant="primary"
            onClick={() => onAddPiece(customer.id)}
            className="flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Piece</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{customerPieces.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{readyCount}</div>
            <div className="text-sm text-gray-600">Ready</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${totalGlazeOwed > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${totalGlazeOwed.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Owed</div>
          </div>
        </div>

        {/* Pieces List */}
        <div className="max-h-96 overflow-y-auto">
          {customerPieces.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No pieces yet</p>
              <Button
                variant="primary"
                onClick={() => onAddPiece(customer.id)}
                className="flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add First Piece</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {customerPieces.map(piece => {
                const statusConfig = getPieceStatusInfo(piece.status);
                return (
                  <div key={piece.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <div className="flex items-center space-x-2">
                        {(piece.status === 'ready-for-pickup' || piece.status === 'bisque-fired') && onNotifyCustomer && customer.phone && (
                          <button
                            onClick={() => onNotifyCustomer(piece)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Send SMS notification"
                          >
                            <MessageSquare size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => onEditPiece(piece)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit piece"
                        >
                          <Edit size={16} />
                        </button>
                        <select
                          value={piece.status}
                          onChange={(e) => onUpdatePieceStatus(piece.id, e.target.value as Piece['status'])}
                          className="px-2 py-1 text-xs border rounded"
                        >
                          {PIECE_STATUSES.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => onUpdatePayment(piece.id, 'paidGlaze', !piece.paidGlaze)}
                          className={`p-1 ${piece.paidGlaze ? 'text-green-600' : 'text-red-600'}`}
                          title={piece.paidGlaze ? 'Paid' : 'Unpaid'}
                        >
                          {piece.paidGlaze ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div>
                        <span>{getEventName(piece.eventId)}</span>
                        {piece.cubicInches && <span className="ml-2">• {piece.cubicInches} in³</span>}
                      </div>
                      <div className="font-medium">${piece.glazeTotal?.toFixed(2) || '0.00'}</div>
                    </div>
                    {piece.notes && (
                      <div className="text-sm text-gray-500 italic mt-1">"{piece.notes}"</div>
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