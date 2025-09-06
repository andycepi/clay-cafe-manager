import React, { useState, useEffect } from 'react';
import { Piece, Customer, Event, StudioSettings } from '../types';
import { PIECE_STATUSES } from '../constants';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { ImageUpload } from './ui/ImageUpload';
import { calculateGlazeCost } from '../utils/glazeCalculations';
import { database } from '../data/database';

interface PieceModalProps {
  mode: 'create' | 'edit';
  piece?: Piece;
  customers: Customer[];
  events: Event[];
  studioSettings?: StudioSettings;
  customerId?: string;
  eventId?: string;
  onSave: (piece: any) => void;
  onClose: () => void;
}

export const PieceModal: React.FC<PieceModalProps> = ({
  mode,
  piece,
  customers,
  events,
  studioSettings,
  customerId,
  eventId,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState(() => {
    if (mode === 'edit' && piece) {
      return { ...piece };
    }
    // For create mode, use pre-selected customer or first available customer
    const defaultCustomerId = customerId || (customers.length > 0 ? customers[0].id : '');
    return {
      customerId: defaultCustomerId,
      eventId: eventId || '',
      status: 'in-progress' as Piece['status'],
      cubicInches: 0,
      paidGlaze: false,
      glazeTotal: 0,
      imageUrl: undefined,
      notes: ''
    };
  });

  const [glazeRate, setGlazeRate] = useState(0.20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPieceId, setCreatedPieceId] = useState<string | null>(null);

  useEffect(() => {
    if (studioSettings) {
      setGlazeRate(studioSettings.glazeRatePerCubicInch);
    } else {
      const loadGlazeRate = async () => {
        try {
          const settings = await database.getStudioSettings();
          setGlazeRate(settings.glazeRatePerCubicInch);
        } catch (error) {
          console.error('Error loading studio settings:', error);
        }
      };
      loadGlazeRate();
    }
  }, [studioSettings]);

  useEffect(() => {
    if (formData.cubicInches && formData.cubicInches > 0) {
      const glazeTotal = calculateGlazeCost(formData.cubicInches, glazeRate);
      setFormData(prev => ({ ...prev, glazeTotal }));
    } else {
      setFormData(prev => ({ ...prev, glazeTotal: 0 }));
    }
  }, [formData.cubicInches, glazeRate]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'edit' && piece) {
        const updatedPiece = await database.updatePiece(piece.id, {
          ...formData,
          updatedAt: new Date()
        });
        onSave(updatedPiece);
      } else {
        if (!createdPieceId) {
          const newPiece = await database.addPiece(formData);
          setCreatedPieceId(newPiece.id);
          onSave(formData);
        } else {
          await database.updatePiece(createdPieceId, formData);
          onClose();
        }
      }
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} piece:`, error);
      alert(`Failed to ${mode === 'edit' ? 'update' : 'create'} piece. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCreate = mode === 'create';
  const title = isCreate ? 'Add New Piece' : 'Edit Piece';
  const submitText = isSubmitting 
    ? 'Saving...' 
    : isCreate && createdPieceId 
      ? 'Save Changes' 
      : isCreate 
        ? 'Create Piece' 
        : 'Save Changes';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={title}
      size="md"
      zIndex="overlay"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Selection */}
        <Select
          label="Customer *"
          value={formData.customerId}
          onChange={(e) => handleInputChange('customerId', e.target.value)}
          options={customers.map(customer => ({
            value: customer.id,
            label: customer.name
          }))}
        />

        {/* Event Selection */}
        <Select
          label="Event"
          value={formData.eventId || ''}
          onChange={(e) => handleInputChange('eventId', e.target.value)}
          options={[
            { value: '', label: 'No Event' },
            ...events.map(event => ({
              value: event.id,
              label: `${event.name} (${new Date(event.date).toLocaleDateString()})`
            }))
          ]}
        />

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
          >
            {PIECE_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Piece Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Piece Photo
          </label>
          <ImageUpload
            currentImageUrl={formData.imageUrl}
            onImageChange={(imageUrl) => handleInputChange('imageUrl', imageUrl)}
            pieceId={piece?.id || createdPieceId || undefined}
          />
        </div>

        {/* Volume */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Volume (Cubic Inches)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.cubicInches || ''}
            onChange={(e) => handleInputChange('cubicInches', parseFloat(e.target.value) || 0)}
            placeholder="Enter volume in cubic inches"
          />
          <p className="text-xs text-gray-500 mt-1">
            Glaze rate: ${glazeRate.toFixed(2)} per cubic inch
          </p>
        </div>

        {/* Payment Status */}
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="paidGlaze"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.paidGlaze}
              onChange={(e) => handleInputChange('paidGlaze', e.target.checked)}
            />
            <label htmlFor="paidGlaze" className="ml-2 block text-sm text-gray-900">
              Glaze payment received
            </label>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between font-semibold">
            <span>Glaze ({formData.cubicInches || 0} in³):</span>
            <span>${(formData.glazeTotal || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any additional notes about this piece..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};