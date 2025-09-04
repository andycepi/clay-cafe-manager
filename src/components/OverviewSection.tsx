import React from 'react';
import { Piece, Customer } from '../types';
import { PieceCard } from './PieceCard';
import { CustomerCard } from './CustomerCard';

interface OverviewSectionProps {
  customers: Customer[];
  pieces: Piece[];
  stats: {
    readyForPickup: number;
  };
  getPiecesReadyForPickup: () => Piece[];
  getCustomerById: (id: string) => Customer | undefined;
  onEditPiece: (piece: Piece) => void;
  onDeletePiece: (pieceId: string) => void;
  onNotifyCustomer: (piece: Piece) => void;
  onMarkPickedUp: (pieceId: string) => void;
  onViewPiece: (piece: Piece) => void;
  onUpdatePieceStatus: (pieceId: string, status: Piece['status']) => void;
  onUpdateCubicInches: (pieceId: string, cubicInches: number) => void;
  onUpdatePiecePayment: (pieceId: string, field: 'paidGlaze', value: boolean) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onAddPiece: (customerId?: string) => void;
  onViewCustomerPieces: (customer: Customer) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  customers,
  pieces,
  stats,
  getPiecesReadyForPickup,
  getCustomerById,
  onEditPiece,
  onDeletePiece,
  onNotifyCustomer,
  onMarkPickedUp,
  onViewPiece,
  onUpdatePieceStatus,
  onUpdateCubicInches,
  onUpdatePiecePayment,
  onEditCustomer,
  onDeleteCustomer,
  onAddPiece,
  onViewCustomerPieces
}) => {
  return (
    <div className="space-y-6">
      {/* Ready for Pickup */}
      {stats.readyForPickup > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ready for Pickup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getPiecesReadyForPickup().map(piece => {
              const customer = getCustomerById(piece.customerId);
              return customer ? (
                <PieceCard
                  key={piece.id}
                  piece={piece}
                  customer={customer}
                  onEdit={onEditPiece}
                  onDelete={onDeletePiece}
                  onNotify={onNotifyCustomer}
                  onMarkPickedUp={onMarkPickedUp}
                  onView={onViewPiece}
                  onStatusChange={onUpdatePieceStatus}
                  onCubicInchesChange={onUpdateCubicInches}
                  onPaymentUpdate={onUpdatePiecePayment}
                />
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Recent Customers */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Customers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.slice(0, 6).map(customer => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              pieces={pieces.filter(p => p.customerId === customer.id)}
              onEdit={onEditCustomer}
              onDelete={onDeleteCustomer}
              onAddPiece={onAddPiece}
              onViewPieces={onViewCustomerPieces}
            />
          ))}
        </div>
      </div>
    </div>
  );
};