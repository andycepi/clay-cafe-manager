import React, { useState, useEffect, useRef } from 'react';
import { Edit, Trash2, Bell, CheckCircle, Check } from 'lucide-react';
import { Piece, Customer } from '../types';
import { PIECE_STATUSES, getPieceStatusInfo } from '../constants';
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
  viewMode?: 'large' | 'small';
}



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
  onPaymentUpdate,
  viewMode = 'large'
}) => {
  const isReadyForPickup = piece.status === 'ready-for-pickup';
  const isPickedUp = piece.status === 'picked-up';
  const [localCubicInches, setLocalCubicInches] = useState(piece.cubicInches || 0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleCubicInchesInputChange = (value: number) => {
    setLocalCubicInches(value);
    setHasUnsavedChanges(value !== (piece.cubicInches || 0));

    // Auto-save with debouncing (after 1.5 seconds of inactivity)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (value !== (piece.cubicInches || 0)) {
        handleUpdateCubicInches(value);
      }
    }, 1500);
  };

  const handleUpdateCubicInches = async (value?: number) => {
    const cubicInches = value ?? localCubicInches;
    setIsUpdating(true);
    try {
      await onCubicInchesChange(piece.id, cubicInches);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to update cubic inches:', error);
      // Revert to original value on error
      setLocalCubicInches(piece.cubicInches || 0);
      setHasUnsavedChanges(false);
    } finally {
      setIsUpdating(false);
    }
  };

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

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

  if (viewMode === 'small') {
    return (
      <div 
        className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm"
        onClick={handleCardClick}
      >
        {piece.imageUrl && (
          <div className="aspect-square overflow-hidden relative">
            <img 
              src={piece.imageUrl} 
              alt="Piece" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}
        <div className="p-3">
          <h5 className="font-semibold text-sm text-gray-900 truncate">{customer.name}</h5>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-block w-2 h-2 rounded-full ${
              piece.status === 'ready-for-pickup' ? 'bg-green-400' :
              piece.status === 'picked-up' ? 'bg-gray-400' :
              piece.status === 'bisque-fired' ? 'bg-blue-400' :
              piece.status === 'glazed' ? 'bg-purple-400' :
              'bg-yellow-400'
            }`} />
            <p className="text-xs text-gray-600 capitalize truncate">{piece.status.replace('-', ' ')}</p>
          </div>
          {(piece.cubicInches || piece.glazeTotal) && (
            <div className="text-xs text-gray-500 mt-2 bg-gray-100/80 rounded-lg px-2 py-1">
              {piece.cubicInches && `${piece.cubicInches} in³`}
              {piece.glazeTotal && ` • $${piece.glazeTotal.toFixed(2)}`}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group bg-gradient-to-br from-white via-white to-gray-50/80 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer backdrop-blur-sm overflow-hidden"
      onClick={handleCardClick}
    >
      <div className="p-6">
        {piece.imageUrl && (
          <div className="mb-6 aspect-[4/5] overflow-hidden rounded-xl relative">
            <img 
              src={piece.imageUrl} 
              alt="Piece" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <h4 className="font-bold text-lg text-gray-900">{customer.name}</h4>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${
                piece.status === 'ready-for-pickup' ? 'bg-green-400 animate-pulse' :
                piece.status === 'picked-up' ? 'bg-gray-400' :
                piece.status === 'bisque-fired' ? 'bg-blue-400' :
                piece.status === 'glazed' ? 'bg-purple-400' :
                'bg-yellow-400'
              }`} />
              <p className="text-sm text-gray-600 capitalize font-medium">{piece.status.replace('-', ' ')}</p>
            </div>
          </div>
          
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isReadyForPickup && !isPickedUp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNotify(piece)}
                className="text-green-600 hover:bg-green-100 rounded-full p-2"
              >
                <Bell size={16} />
              </Button>
            )}
            {isReadyForPickup && !isPickedUp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkPickedUp(piece.id)}
                className="text-green-600 hover:bg-green-100 rounded-full p-2"
              >
                <CheckCircle size={16} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(piece)}
              className="text-blue-600 hover:bg-blue-100 rounded-full p-2"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(piece.id)}
              className="text-red-600 hover:bg-red-100 rounded-full p-2"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Status:</span>
              <select
                value={piece.status}
                onChange={(e) => onStatusChange(piece.id, e.target.value as Piece['status'])}
                className={`px-3 py-2 rounded-lg text-sm font-medium border-2 bg-white/80 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${getPieceStatusInfo(piece.status).color} border-gray-200 hover:border-gray-300`}
              >
                {PIECE_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Cubic Inches:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={localCubicInches || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    handleCubicInchesInputChange(value);
                  }}
                  className={`w-20 px-3 py-2 text-sm font-medium border-2 rounded-lg text-right focus:outline-none transition-all duration-200 ${
                    isUpdating 
                      ? 'border-blue-300 bg-blue-50/80 backdrop-blur-sm' 
                      : hasUnsavedChanges 
                        ? 'border-yellow-300 bg-yellow-50/80 backdrop-blur-sm animate-pulse' 
                        : 'border-gray-200 bg-white/80 backdrop-blur-sm hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                  placeholder="0"
                  disabled={isUpdating}
                />
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : hasUnsavedChanges ? (
                  <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse shadow-sm" title="Auto-saving..." />
                ) : (
                  <div className="w-4 h-4 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                )}
              </div>
            </div>

            {piece.glazeTotal && piece.glazeTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Glaze Cost:</span>
                <span className="font-bold text-lg text-green-600">${piece.glazeTotal.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Payment:</span>
              <label className="relative flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={piece.paidGlaze || false}
                  onChange={(e) => onPaymentUpdate(piece.id, 'paidGlaze', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                  piece.paidGlaze 
                    ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-500 shadow-lg scale-110' 
                    : 'bg-white/80 border-gray-300 group-hover:border-green-400 group-hover:bg-green-50/50'
                }`}>
                  {piece.paidGlaze && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-600">
                  {piece.paidGlaze ? 'Paid' : 'Unpaid'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {piece.notes && (
          <div className="mt-4 p-4 bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50">
            <p className="text-sm text-gray-700 italic leading-relaxed">"{piece.notes}"</p>
          </div>
        )}

        {piece.readyForPickupDate && (() => {
          const date = ensureDate(piece.readyForPickupDate);
          return date ? (
            <div className="mt-4 p-3 bg-green-50/80 backdrop-blur-sm rounded-xl border border-green-200/50">
              <p className="text-xs font-medium text-green-700 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Ready since: {format(date, 'MMM dd, yyyy')}
              </p>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
};
