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
      className="group bg-gradient-to-br from-white via-white to-gray-50/80 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer backdrop-blur-sm p-6"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
        </div>
        
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(customer)}
            className="text-blue-600 hover:bg-blue-100/80 rounded-full p-2 hover:scale-110"
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddPiece(customer.id)}
            className="text-green-600 hover:bg-green-100/80 rounded-full p-2 hover:scale-110"
          >
            <Plus size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(customer.id)}
            className="text-red-600 hover:bg-red-100/80 rounded-full p-2 hover:scale-110"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-3 text-sm text-gray-700">
          <div className="p-1.5 bg-blue-100/80 rounded-lg">
            <Mail size={16} className="text-blue-600" />
          </div>
          <span>{customer.email}</span>
        </div>
        {customer.phone && (
          <div className="flex items-center space-x-3 text-sm text-gray-700">
            <div className="p-1.5 bg-green-100/80 rounded-lg">
              <Phone size={16} className="text-green-600" />
            </div>
            <span>{customer.phone}</span>
          </div>
        )}
        {customer.instagram && (
          <div className="flex items-center space-x-3 text-sm text-gray-700">
            <div className="p-1.5 bg-pink-100/80 rounded-lg">
              <Instagram size={16} className="text-pink-600" />
            </div>
            <span>@{customer.instagram}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200/50 pt-4">
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-gray-500">Total Pieces:</span>
            <span className="ml-2 font-bold text-lg text-blue-600">{customerPieces.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Ready for Pickup:</span>
            <span className={`ml-2 font-bold text-lg ${readyForPickup > 0 ? 'text-green-600' : 'text-gray-600'}`}>
              {readyForPickup}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Total Value:</span>
            <span className="ml-2 font-bold text-lg text-green-600">${totalValue.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
