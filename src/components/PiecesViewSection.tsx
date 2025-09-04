import React from 'react';
import { Palette } from 'lucide-react';
import { Piece, Customer } from '../types';
import { PIECE_STATUSES } from '../constants';
import { PieceCard } from './PieceCard';
import { Button } from './ui/Button';
import { useBulkSelection } from '../hooks/useBulkSelection';

type PieceSortMode = 'status' | 'event' | 'customer' | 'date';

interface PiecesViewSectionProps {
  pieces: Piece[];
  customers: Customer[];
  searchTerm: string;
  sortMode: PieceSortMode;
  onSortChange: (mode: PieceSortMode) => void;
  onEdit: (piece: Piece) => void;
  onDelete: (pieceId: string) => void;
  onNotify: (piece: Piece) => void;
  onMarkPickedUp: (pieceId: string) => void;
  onView: (piece: Piece) => void;
  onStatusChange: (pieceId: string, status: Piece['status']) => void;
  onCubicInchesChange: (pieceId: string, cubicInches: number) => void;
  onPaymentUpdate: (pieceId: string, field: 'paidGlaze', value: boolean) => void;
  onBulkStatusUpdate: (pieceIds: string[], status: Piece['status']) => void;
  onBulkPaymentUpdate: (pieceIds: string[], paid: boolean) => void;
  onBulkDelete: (pieceIds: string[]) => void;
  onAddPiece: () => void;
  getCustomerById: (id: string) => Customer | undefined;
}

export const PiecesViewSection: React.FC<PiecesViewSectionProps> = ({
  pieces,
  customers,
  searchTerm,
  sortMode,
  onSortChange,
  onEdit,
  onDelete,
  onNotify,
  onMarkPickedUp,
  onView,
  onStatusChange,
  onCubicInchesChange,
  onPaymentUpdate,
  onBulkStatusUpdate,
  onBulkPaymentUpdate,
  onBulkDelete,
  onAddPiece,
  getCustomerById
}) => {
  const bulkSelection = useBulkSelection({
    items: pieces,
    getId: (piece) => piece.id
  });

  // Group pieces by sort mode
  const groupedPieces = React.useMemo(() => {
    const groups: Array<{ key: string; title: string; pieces: Piece[] }> = [];
    
    if (sortMode === 'status') {
      PIECE_STATUSES.forEach(status => {
        const statusPieces = pieces.filter(p => p.status === status.value);
        if (statusPieces.length > 0) {
          groups.push({
            key: status.value,
            title: status.label,
            pieces: statusPieces.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          });
        }
      });
    } else {
      groups.push({ key: 'all', title: 'All Pieces', pieces });
    }
    
    return groups;
  }, [pieces, sortMode]);

  const sortOptions = [
    { value: 'status' as PieceSortMode, label: 'By Status' },
    { value: 'customer' as PieceSortMode, label: 'By Customer' },
    { value: 'event' as PieceSortMode, label: 'By Event' },
    { value: 'date' as PieceSortMode, label: 'By Date' }
  ];

  if (pieces.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Palette size={48} />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No pieces found
        </h3>
        <p className="text-gray-600 mb-4">
          {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first piece'}
        </p>
        <Button onClick={onAddPiece}>
          Add Piece
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Sort and Bulk Actions Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {sortOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  sortMode === option.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={bulkSelection.toggleBulkActions}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                bulkSelection.showBulkActions
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {bulkSelection.showBulkActions ? 'Cancel Selection' : 'Bulk Select'}
            </button>
            {bulkSelection.showBulkActions && (
              <div className="text-sm text-gray-600">
                {bulkSelection.selectedCount} selected
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {bulkSelection.showBulkActions && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={bulkSelection.selectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {bulkSelection.isAllSelected ? 'Deselect All' : 'Select All'}
                </button>
                {bulkSelection.selectedCount > 0 && (
                  <span className="text-sm text-gray-500">
                    ({bulkSelection.selectedCount} of {pieces.length})
                  </span>
                )}
              </div>
              {bulkSelection.selectedCount > 0 && (
                <div className="flex items-center space-x-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        onBulkStatusUpdate(bulkSelection.selectedIds, e.target.value as Piece['status']);
                        e.target.value = '';
                      }
                    }}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    defaultValue=""
                  >
                    <option value="">Update Status...</option>
                    {PIECE_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => onBulkPaymentUpdate(bulkSelection.selectedIds, true)}
                    className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => onBulkPaymentUpdate(bulkSelection.selectedIds, false)}
                    className="text-sm px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  >
                    Mark Unpaid
                  </button>
                  <button
                    onClick={() => onBulkDelete(bulkSelection.selectedIds)}
                    className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grouped Pieces */}
      {groupedPieces.map(group => (
        <div key={group.key} className="mb-8">
          <h2 className="text-lg font-semibold capitalize mb-4">{group.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.pieces.map(piece => {
              const customer = getCustomerById(piece.customerId);
              return customer ? (
                <div key={piece.id} className="relative">
                  {bulkSelection.showBulkActions && (
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(piece)}
                        onChange={() => bulkSelection.toggleSelection(piece)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  <PieceCard
                    piece={piece}
                    customer={customer}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onNotify={onNotify}
                    onMarkPickedUp={onMarkPickedUp}
                    onView={onView}
                    onStatusChange={onStatusChange}
                    onCubicInchesChange={onCubicInchesChange}
                    onPaymentUpdate={onPaymentUpdate}
                  />
                </div>
              ) : null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
};