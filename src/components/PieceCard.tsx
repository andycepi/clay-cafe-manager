import React, { useState } from 'react';
import { Palette, Edit, Trash2, Bell, CheckCircle, Check } from 'lucide-react';
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
  onCubicInchesChange: (pieceId: string, cubicInches: number) => void;
  onPaymentUpdate: (pieceId: string, field: 'paidGlaze', value: boolean) => void;
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
  onStatusChange,
  onCubicInchesChange,
  onPaymentUpdate
}) => {
  const isReadyForPickup = piece.status === 'ready-for-pickup';
  const isPickedUp = piece.status === 'picked-up';
  const [localCubicInches, setLocalCubicInches] = useState(piece.cubicInches || 0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleCubicInchesInputChange = (value: number) => {
    setLocalCubicInches(value);
    setHasUnsavedChanges(value !== (piece.cubicInches || 0));
  };

  const handleUpdateCubicInches = () => {
    onCubicInchesChange(piece.id, localCubicInches);
    setHasUnsavedChanges(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons, select elements, input elements, or labels
    if ((e.target as HTMLElement).closest('button') || 
        (e.target as HTMLElement).closest('select') || 
        (e.target as HTMLElement).closest('input') ||
        (e.target as HTMLElement).closest('label')) {
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
        <div className="mb-3 aspect-[4/5] overflow-hidden rounded-lg">
          <img 
            src={piece.imageUrl} 
            alt="Piece" 
            className="w-full h-full object-cover"
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
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Cubic Inches:</span>
          <div className="flex items-center space-x-1">
            <input
              type="number"
              min="0"
              step="0.1"
              value={localCubicInches || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                handleCubicInchesInputChange(value);
              }}
              className="w-16 px-2 py-1 text-sm font-medium border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
            {hasUnsavedChanges && (
              <button
                onClick={handleUpdateCubicInches}
                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                title="Update cubic inches"
              >
                <Check size={14} />
              </button>
            )}
          </div>
        </div>

        {piece.glazeTotal && piece.glazeTotal > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Glaze Cost:</span>
            <span className="font-medium">${piece.glazeTotal.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Paid Glaze:</span>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={piece.paidGlaze || false}
              onChange={(e) => onPaymentUpdate(piece.id, 'paidGlaze', e.target.checked)}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              piece.paidGlaze 
                ? 'bg-green-500 border-green-500' 
                : 'bg-white border-gray-300'
            }`}>
              {piece.paidGlaze && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </label>
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
