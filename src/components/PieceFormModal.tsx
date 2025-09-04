import React, { useState, useEffect } from 'react';
import { Piece } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { ImageUpload } from './ui/ImageUpload';
import { database } from '../data/database';

interface PieceFormModalProps {
  customerId: string;
  eventId?: string;
  onSave: (piece: Omit<Piece, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

export const PieceFormModal: React.FC<PieceFormModalProps> = ({
  customerId,
  eventId,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<Omit<Piece, 'id' | 'createdAt' | 'updatedAt'>>({
    customerId,
    eventId,
    status: 'in-progress',
    cubicInches: 0,
    paidGlaze: false,
    glazeTotal: 0,
    imageUrl: undefined
  });
  
  const [createdPieceId, setCreatedPieceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [glazeRate, setGlazeRate] = useState(0.20);

  useEffect(() => {
    // Load the current glaze rate
    const loadGlazeRate = async () => {
      try {
        const settings = await database.getStudioSettings();
        setGlazeRate(settings.glazeRatePerCubicInch);
        // Studio settings loaded, glaze rate set
      } catch (error) {
        console.error('Error loading studio settings:', error);
      }
    };
    loadGlazeRate();
  }, []);

  useEffect(() => {
    // Automatically calculate glaze total when volume changes
    if (formData.cubicInches && formData.cubicInches > 0) {
      const glazeTotal = Math.round(formData.cubicInches * glazeRate * 100) / 100;
      setFormData(prev => ({
        ...prev,
        glazeTotal
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        glazeTotal: 0
      }));
    }
  }, [formData.cubicInches, glazeRate]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createdPieceId) {
      // First submission - create the piece
      setIsSubmitting(true);
      try {
        const newPiece = await database.addPiece(formData);
        setCreatedPieceId(newPiece.id);
        onSave(formData);
      } catch (error) {
        console.error('Error creating piece:', error);
        alert('Failed to create piece. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Second submission - save with image if updated
      setIsSubmitting(true);
      try {
        await database.updatePiece(createdPieceId, formData);
        onClose();
      } catch (error) {
        console.error('Error updating piece with image:', error);
        alert('Failed to update piece. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Add New Piece"
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
              pieceId={createdPieceId || undefined}
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
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Saving...' 
                : createdPieceId 
                  ? 'Save Changes' 
                  : 'Create Piece'
              }
            </Button>
          </div>
        </form>
    </Modal>
  );
};