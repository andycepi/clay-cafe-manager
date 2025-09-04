import React from 'react';
import { Palette, Edit, Trash2, Bell, CheckCircle } from 'lucide-react';
import { Piece, Customer } from '../types';
import { Button } from './ui/Button';
import { format } from 'date-fns';
import { ensureDate } from '../utils/dateUtils';

interface PieceCardProps {
  piece: Piece;
  customer: Customer;
  onEdit: (piece: Piece) => void;
  onDelete: (pieceId: string) => void;
  onNotify: (piece: Piece) => void;
  onMarkPickedUp: (pieceId: string) => void;
  onView: (piece: Piece) => void;
  onStatusChange: (pieceId: string, status: Piece['status']) => void;
}

const statusColors = {
  'in-progress': 'bg-blue-100 text-blue-800',
  'bisque-fired': 'bg-orange-100 text-orange-800',
  'glazed': 'bg-purple-100 text-purple-800',
  'glaze-fired': 'bg-indigo-100 text-indigo-800',
  'ready-for-pickup': 'bg-green-100 text-green-800',
  'picked-up': 'bg-gray-100 text-gray-800'
};

const pieceStatuses: Array<{ value: Piece['status']; label: string }> = [
  { value: 'in-progress', label: 'In Progress' },
  { value: 'bisque-fired', label: 'Bisque Fired' },
  { value: 'glazed', label: 'Glazed' },
  { value: 'glaze-fired', label: 'Glaze Fired' },
  { value: 'ready-for-pickup', label: 'Ready for Pickup' },
  { value: 'picked-up', label: 'Picked Up' }
];

const typeIcons = {
  'handbuilding': '🏺',
  'painting': '🎨',
  'glaze': '✨',
  'wheel-throwing': '⚱️'
};

export const PieceCard: React.FC<PieceCardProps> = ({
  piece,
  customer,
  onEdit,
  onDelete,
  onNotify,
  onMarkPickedUp,
  onView,
  onStatusChange
}) => {
  const isReadyForPickup = piece.status === 'ready-for-pickup';
  const isPickedUp = piece.status === 'picked-up';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons or select elements
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select')) {
      return;
    }
    onView(piece);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {piece.imageUrl && (
        <div className="mb-3">
          <img 
            src={piece.imageUrl} 
            alt="Piece" 
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{customer.name}</h4>
          <p className="text-sm text-gray-500 capitalize">{piece.status.replace('-', ' ')}</p>
        </div>
        
        <div className="flex space-x-1">
          {isReadyForPickup && !isPickedUp && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNotify(piece)}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <Bell size={14} />
            </Button>
          )}
          {isReadyForPickup && !isPickedUp && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkPickedUp(piece.id)}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <CheckCircle size={14} />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(piece)}
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(piece.id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Status:</span>
          <select
            value={piece.status}
            onChange={(e) => onStatusChange(piece.id, e.target.value as Piece['status'])}
            className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${statusColors[piece.status]}`}
          >
            {pieceStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        
        {piece.cubicInches && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Cubic Inches:</span>
            <span className="font-medium">{piece.cubicInches}</span>
          </div>
        )}

        {piece.glazeTotal && piece.glazeTotal > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Glaze Cost:</span>
            <span className="font-medium">${piece.glazeTotal.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Paid Glaze:</span>
          <span className={`font-medium ${piece.paidGlaze ? 'text-green-600' : 'text-red-600'}`}>
            {piece.paidGlaze ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {piece.notes && (
        <div className="border-t pt-2">
          <p className="text-sm text-gray-600 italic">"{piece.notes}"</p>
        </div>
      )}

      {piece.readyForPickupDate && (() => {
        const date = ensureDate(piece.readyForPickupDate);
        return date ? (
          <div className="border-t pt-2 mt-2">
            <p className="text-xs text-gray-500">
              Ready since: {format(date, 'MMM dd, yyyy')}
            </p>
          </div>
        ) : null;
      })()}
    </div>
  );
};
