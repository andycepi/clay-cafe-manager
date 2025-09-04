import React from 'react';
import { Mail, Phone, Instagram, Edit, Trash2, Plus } from 'lucide-react';
import { Customer, Piece } from '../types';
import { Button } from './ui/Button';

interface CustomerCardProps {
  customer: Customer;
  pieces: Piece[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onAddPiece: (customerId: string) => void;
  onViewPieces: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  pieces,
  onEdit,
  onDelete,
  onAddPiece,
  onViewPieces
}) => {
  const customerPieces = pieces.filter(p => p.customerId === customer.id);
  const readyForPickup = customerPieces.filter(p => p.status === 'ready-for-pickup').length;
  const totalValue = customerPieces.reduce((sum, piece) => sum + (piece.glazeTotal || 0), 0);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onViewPieces(customer);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(customer)}
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddPiece(customer.id)}
          >
            <Plus size={14} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(customer.id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail size={14} />
          <span>{customer.email}</span>
        </div>
        {customer.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone size={14} />
            <span>{customer.phone}</span>
          </div>
        )}
        {customer.instagram && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Instagram size={14} />
            <span>@{customer.instagram}</span>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Pieces:</span>
            <span className="ml-2 font-medium">{customerPieces.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Ready for Pickup:</span>
            <span className={`ml-2 font-medium ${readyForPickup > 0 ? 'text-green-600' : 'text-gray-600'}`}>
              {readyForPickup}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Total Value:</span>
            <span className="ml-2 font-medium text-amber-600">${totalValue.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
