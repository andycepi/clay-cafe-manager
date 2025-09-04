import React, { useState, useEffect } from 'react';
import { Piece, Customer, Event, StudioSettings } from '../types';
import { PIECE_STATUSES } from '../constants';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { ImageUpload } from './ui/ImageUpload';

interface PieceFormProps {
  piece?: Piece;
  customers: Customer[];
  events: Event[];
  studioSettings?: StudioSettings;
  preSelectedCustomerId?: string;
  onSubmit: (piece: Omit<Piece, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const pieceTypes = [
  { value: 'handbuilding', label: 'Handbuilding' },
  { value: 'painting', label: 'Painting' },
  { value: 'glaze', label: 'Glaze' },
  { value: 'wheel-throwing', label: 'Wheel Throwing' }
];


export const PieceForm: React.FC<PieceFormProps> = ({
  piece,
  customers,
  events,
  studioSettings,
  preSelectedCustomerId,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    customerId: '',
    eventId: '',
    status: 'in-progress' as Piece['status'],
    cubicInches: '',
    paidGlaze: false,
    glazeTotal: '',
    notes: '',
    imageUrl: '' as string | undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (piece) {
      setFormData({
        customerId: piece.customerId,
        eventId: piece.eventId || '',
        status: piece.status,
        cubicInches: piece.cubicInches?.toString() || '',
        paidGlaze: piece.paidGlaze,
        glazeTotal: piece.glazeTotal?.toString() || '',
        notes: piece.notes || '',
        imageUrl: piece.imageUrl || ''
      });
    } else if (customers.length > 0) {
      const defaultCustomerId = preSelectedCustomerId || customers[0].id;
      setFormData(prev => ({ ...prev, customerId: defaultCustomerId }));
    }
  }, [piece, customers, preSelectedCustomerId]);

  // Auto-calculate glaze total when cubic inches change
  useEffect(() => {
    if (studioSettings && formData.cubicInches && !isNaN(Number(formData.cubicInches))) {
      const volume = Number(formData.cubicInches);
      const calculatedTotal = volume * studioSettings.glazeRatePerCubicInch;
      setFormData(prev => ({ 
        ...prev, 
        glazeTotal: calculatedTotal.toFixed(2)
      }));
    }
  }, [formData.cubicInches, studioSettings]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }

    if (formData.cubicInches && isNaN(Number(formData.cubicInches))) {
      newErrors.cubicInches = 'Cubic inches must be a number';
    }

    if (formData.glazeTotal && isNaN(Number(formData.glazeTotal))) {
      newErrors.glazeTotal = 'Glaze total must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      customerId: formData.customerId,
      eventId: formData.eventId || undefined,
      status: formData.status,
      cubicInches: formData.cubicInches ? Number(formData.cubicInches) : undefined,
      paidGlaze: formData.paidGlaze,
      glazeTotal: formData.glazeTotal ? Number(formData.glazeTotal) : undefined,
      notes: formData.notes.trim() || undefined,
      imageUrl: formData.imageUrl || undefined,
      readyForPickupDate: formData.status === 'ready-for-pickup' ? new Date() : undefined,
      pickedUpDate: formData.status === 'picked-up' ? new Date() : undefined
    });
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const customerOptions = customers.map(customer => ({
    value: customer.id,
    label: customer.name
  }));

  const eventOptions = [
    { value: '', label: 'No Event' },
    ...events.map(event => ({
      value: event.id,
      label: `${event.name} (${event.date.toLocaleDateString()})`
    }))
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Customer *"
        value={formData.customerId}
        onChange={(e) => handleChange('customerId', e.target.value)}
        options={customerOptions}
        error={errors.customerId}
      />

      <Select
        label="Event"
        value={formData.eventId}
        onChange={(e) => handleChange('eventId', e.target.value)}
        options={eventOptions}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Piece Photo
        </label>
        <ImageUpload
          currentImageUrl={formData.imageUrl}
          onImageChange={(imageUrl) => handleChange('imageUrl', imageUrl || '')}
        />
      </div>

      <Select
        label="Status *"
        value={formData.status}
        onChange={(e) => handleChange('status', e.target.value)}
        options={PIECE_STATUSES}
      />


      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Cubic Inches"
          type="number"
          step="0.1"
          value={formData.cubicInches}
          onChange={(e) => handleChange('cubicInches', e.target.value)}
          error={errors.cubicInches}
          placeholder="0.0"
        />

        <div>
          <Input
            label={
              studioSettings && formData.cubicInches && !isNaN(Number(formData.cubicInches))
                ? `Glaze Total (Auto-calculated at $${studioSettings.glazeRatePerCubicInch}/in³)`
                : "Glaze Total"
            }
            type="number"
            step="0.01"
            value={formData.glazeTotal}
            onChange={(e) => handleChange('glazeTotal', e.target.value)}
            error={errors.glazeTotal}
            placeholder="0.00"
            className={
              studioSettings && formData.cubicInches && !isNaN(Number(formData.cubicInches))
                ? "bg-green-50 border-green-300"
                : ""
            }
          />
          {studioSettings && formData.cubicInches && !isNaN(Number(formData.cubicInches)) && (
            <p className="text-xs text-green-600 mt-1">
              Calculated: {formData.cubicInches} in³ × ${studioSettings.glazeRatePerCubicInch} = ${(Number(formData.cubicInches) * studioSettings.glazeRatePerCubicInch).toFixed(2)}
            </p>
          )}
        </div>
      </div>


      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="paidGlaze"
          checked={formData.paidGlaze}
          onChange={(e) => handleChange('paidGlaze', e.target.checked)}
          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
        />
        <label htmlFor="paidGlaze" className="text-sm font-medium text-gray-700">
          Paid for Glaze
        </label>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
          placeholder="Additional notes about this piece..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {piece ? 'Update Piece' : 'Add Piece'}
        </Button>
      </div>
    </form>
  );
};
