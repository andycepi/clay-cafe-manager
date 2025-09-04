import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X, Phone, User } from 'lucide-react';
import { Customer, Piece } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { smsService, SMSNotificationOptions } from '../services/smsService';

interface SMSNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  piece: Piece;
  onSent?: () => void;
}

export const SMSNotificationModal: React.FC<SMSNotificationModalProps> = ({
  isOpen,
  onClose,
  customer,
  piece,
  onSent
}) => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'ready-for-pickup' | 'ready-to-glaze'>('ready-for-pickup');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Determine appropriate message type based on piece status
  useEffect(() => {
    if (piece.status === 'ready-for-pickup') {
      setMessageType('ready-for-pickup');
    } else if (piece.status === 'bisque-fired' || piece.status === 'glazed') {
      setMessageType('ready-to-glaze');
    } else {
      setMessageType('ready-for-pickup'); // Default
    }
  }, [piece.status]);

  // Generate default message when modal opens or message type changes
  useEffect(() => {
    if (isOpen) {
      const options: SMSNotificationOptions = {
        customer,
        piece,
        messageType
      };
      const defaultMessage = smsService.generateDefaultMessage(options);
      setMessage(defaultMessage);
      setSendResult(null);
    }
  }, [isOpen, customer, piece, messageType]);

  const handleSend = async () => {
    if (!message.trim()) {
      setSendResult({ success: false, error: 'Message cannot be empty' });
      return;
    }

    if (!customer.phone) {
      setSendResult({ success: false, error: 'Customer does not have a phone number' });
      return;
    }

    if (!smsService.validatePhoneNumber(customer.phone)) {
      setSendResult({ success: false, error: 'Invalid phone number format' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const options: SMSNotificationOptions & { finalMessage: string } = {
        customer,
        piece,
        messageType,
        finalMessage: message.trim()
      };

      const result = await smsService.sendSMS(options);
      setSendResult(result);

      if (result.success) {
        setTimeout(() => {
          onSent?.();
          onClose();
        }, 2000);
      }
    } catch (error) {
      setSendResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMessageTypeChange = (type: 'ready-for-pickup' | 'ready-to-glaze') => {
    setMessageType(type);
    const options: SMSNotificationOptions = {
      customer,
      piece,
      messageType: type
    };
    const defaultMessage = smsService.generateDefaultMessage(options);
    setMessage(defaultMessage);
  };

  const characterCount = message.length;
  const maxCharacters = 160; // Standard SMS length
  const isOverLimit = characterCount > maxCharacters;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send SMS Notification"
      size="lg"
      zIndex="elevated"
    >
      <div className="space-y-6">
        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{customer.name}</h3>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Phone size={14} />
                <span>
                  {customer.phone ? 
                    smsService.formatPhoneNumber(customer.phone) : 
                    'No phone number'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Piece Info */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Piece Status:</span>
            <span className="ml-1 capitalize">{piece.status.replace('-', ' ')}</span>
            {piece.cubicInches && (
              <>
                <span className="mx-2">•</span>
                <span>{piece.cubicInches} in³</span>
              </>
            )}
          </div>
        </div>

        {!customer.phone && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-red-800">
              <X size={16} />
              <span className="text-sm font-medium">Cannot send SMS: Customer has no phone number</span>
            </div>
          </div>
        )}

        {customer.phone && (
          <>
            {/* Message Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="ready-for-pickup"
                    checked={messageType === 'ready-for-pickup'}
                    onChange={(e) => handleMessageTypeChange(e.target.value as 'ready-for-pickup')}
                    className="mr-2"
                  />
                  <span className="text-sm">Ready for Pickup</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="ready-to-glaze"
                    checked={messageType === 'ready-to-glaze'}
                    onChange={(e) => handleMessageTypeChange(e.target.value as 'ready-to-glaze')}
                    className="mr-2"
                  />
                  <span className="text-sm">Ready to Glaze</span>
                </label>
              </div>
            </div>

            {/* Message Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
                <span className={`ml-2 text-xs ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
                  {characterCount}/{maxCharacters} characters
                </span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  isOverLimit ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your message..."
              />
              {isOverLimit && (
                <p className="text-xs text-red-600 mt-1">
                  Messages over 160 characters may be split into multiple SMS messages
                </p>
              )}
            </div>

            {/* Send Result */}
            {sendResult && (
              <div className={`rounded-lg p-3 ${
                sendResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className={`flex items-center space-x-2 ${
                  sendResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {sendResult.success ? (
                    <>
                      <MessageSquare size={16} />
                      <span className="text-sm font-medium">Message sent successfully!</span>
                    </>
                  ) : (
                    <>
                      <X size={16} />
                      <span className="text-sm font-medium">
                        Failed to send: {sendResult.error}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={isSending || !message.trim() || !customer.phone}
                className="flex items-center space-x-2"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send SMS</span>
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};