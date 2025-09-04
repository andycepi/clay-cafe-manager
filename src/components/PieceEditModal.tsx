import React, { useState, useEffect } from 'react';
import { Piece } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { ImageUpload } from './ui/ImageUpload';
import { calculateGlazeCost } from '../utils/glazeCalculations';
import { database } from '../data/database';

interface PieceEditModalProps {
  piece: Piece;
  onSave: (updatedPiece: Piece) => void;
  onClose: () => void;
}

export const PieceEditModal: React.FC<PieceEditModalProps> = ({
  piece,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<Piece>({ ...piece });
  const [glazeRate, setGlazeRate] = useState(0.20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadGlazeRate = async () => {
      try {
        const settings = await database.getStudioSettings();
        setGlazeRate(settings.glazeRatePerCubicInch);
      } catch (error) {
        console.error('Error loading studio settings:', error);
      }
    };
    loadGlazeRate();
  }, []);

  useEffect(() => {
    // Automatically calculate glaze total when volume changes
    if (formData.cubicInches && formData.cubicInches > 0) {
      const glazeTotal = calculateGlazeCost(formData.cubicInches, glazeRate);
      setFormData(prev => ({ ...prev, glazeTotal }));
    } else {
      setFormData(prev => ({ ...prev, glazeTotal: 0 }));
    }
  }, [formData.cubicInches, glazeRate]);

  const handleInputChange = (field: keyof Piece, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedPiece = await database.updatePiece(piece.id, {
        ...formData,
        updatedAt: new Date()
      });

      if (updatedPiece) {
        onSave(updatedPiece);
      }
    } catch (error) {
      console.error('Error updating piece:', error);
      alert('Failed to update piece. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Piece"
      size="md"
      zIndex="overlay"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value as Piece['status'])}
          >
            <option value="in-progress">In Progress</option>
            <option value="bisque-fired">Bisque Fired</option>
            <option value="glazed">Glazed</option>
            <option value="glaze-fired">Glaze Fired</option>
            <option value="ready-for-pickup">Ready for Pickup</option>
            <option value="picked-up">Picked Up</option>
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
            pieceId={piece.id}
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

        {/* Form Actions */}
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};