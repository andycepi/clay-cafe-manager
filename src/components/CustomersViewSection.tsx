import React, { useRef } from 'react';
import { Users } from 'lucide-react';
import { Customer, Piece } from '../types';
import { CustomerCard } from './CustomerCard';
import { Button } from './ui/Button';

interface CustomersViewSectionProps {
  customers: Customer[];
  pieces: Piece[];
  searchTerm: string;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onAddPiece: (customerId?: string) => void;
  onViewPieces: (customer: Customer) => void;
  onAddCustomer: () => void;
  onCSVUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CustomersViewSection: React.FC<CustomersViewSectionProps> = ({
  customers,
  pieces,
  searchTerm,
  onEdit,
  onDelete,
  onAddPiece,
  onViewPieces,
  onAddCustomer,
  onCSVUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Users size={48} />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No customers found
        </h3>
        <p className="text-gray-600 mb-4">
          {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first customer'}
        </p>
        <Button onClick={onAddCustomer}>
          Add Customer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-start">
        <Button type="button" onClick={() => fileInputRef.current?.click()}>
          Import Customers (CSV)
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={onCSVUpload}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(customer => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            pieces={pieces.filter(p => p.customerId === customer.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddPiece={onAddPiece}
            onViewPieces={onViewPieces}
          />
        ))}
      </div>
    </div>
  );
};