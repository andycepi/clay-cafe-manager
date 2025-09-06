import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Phone, User, Mail } from 'lucide-react';
import { Customer, Piece } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { smsService, SMSNotificationOptions } from '../services/smsService';
import { emailService, EmailNotificationOptions } from '../services/emailService';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  piece: Piece;
  onSent?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  customer,
  piece,
  onSent
}) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [messageType, setMessageType] = useState<'ready-for-pickup' | 'ready-to-glaze'>('ready-for-pickup');
  const [notificationType, setNotificationType] = useState<'sms' | 'email'>('sms');
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

  // Generate default message when modal opens or settings change
  useEffect(() => {
    if (isOpen) {
      if (notificationType === 'sms') {
        const options: SMSNotificationOptions = {
          customer,
          piece,
          messageType
        };
        const defaultMessage = smsService.generateDefaultMessage(options);
        setMessage(defaultMessage);
      } else {
        const options: EmailNotificationOptions = {
          customer,
          piece,
          messageType
        };
        const defaultMessage = emailService.generateDefaultMessage(options);
        const defaultSubject = emailService.generateDefaultSubject(options);
        setMessage(defaultMessage);
        setSubject(defaultSubject);
      }
      setSendResult(null);
    }
  }, [isOpen, customer, piece, messageType, notificationType]);

  const handleSendSMS = async () => {
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
        error: error instanceof Error ? error.message : 'Failed to send SMS'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendEmail = async () => {
    if (!message.trim()) {
      setSendResult({ success: false, error: 'Message cannot be empty' });
      return;
    }

    if (!subject.trim()) {
      setSendResult({ success: false, error: 'Subject cannot be empty' });
      return;
    }

    if (!customer.email) {
      setSendResult({ success: false, error: 'Customer does not have an email address' });
      return;
    }

    if (!emailService.validateEmail(customer.email)) {
      setSendResult({ success: false, error: 'Invalid email address format' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const options: EmailNotificationOptions & { finalMessage: string; finalSubject: string } = {
        customer,
        piece,
        messageType,
        finalMessage: message.trim(),
        finalSubject: subject.trim()
      };

      const result = await emailService.sendEmail(options);
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
        error: error instanceof Error ? error.message : 'Failed to send email'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMessageTypeChange = (type: 'ready-for-pickup' | 'ready-to-glaze') => {
    setMessageType(type);
    
    if (notificationType === 'sms') {
      const options: SMSNotificationOptions = {
        customer,
        piece,
        messageType: type
      };
      const defaultMessage = smsService.generateDefaultMessage(options);
      setMessage(defaultMessage);
    } else {
      const options: EmailNotificationOptions = {
        customer,
        piece,
        messageType: type
      };
      const defaultMessage = emailService.generateDefaultMessage(options);
      const defaultSubject = emailService.generateDefaultSubject(options);
      setMessage(defaultMessage);
      setSubject(defaultSubject);
    }
  };

  const handleNotificationTypeChange = (type: 'sms' | 'email') => {
    setNotificationType(type);
    setSendResult(null);
  };

  const characterCount = message.length;
  const maxCharacters = notificationType === 'sms' ? 160 : 1000;
  const isOverLimit = characterCount > maxCharacters;

  const canSendSMS = customer.phone && message.trim();
  const canSendEmail = customer.email && message.trim() && subject.trim();
  const canSend = notificationType === 'sms' ? canSendSMS : canSendEmail;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Customer Notification"
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
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Phone size={14} />
                  <span>
                    {customer.phone ? 
                      smsService.formatPhoneNumber(customer.phone) : 
                      'No phone number'
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Mail size={14} />
                  <span>{customer.email || 'No email address'}</span>
                </div>
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

        {/* Notification Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notification Method
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="sms"
                checked={notificationType === 'sms'}
                onChange={(e) => handleNotificationTypeChange(e.target.value as 'sms')}
                className="mr-2"
                disabled={!customer.phone}
              />
              <Phone size={16} className="mr-1" />
              <span className="text-sm">SMS Text</span>
              {!customer.phone && <span className="text-xs text-gray-500 ml-1">(No phone)</span>}
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="email"
                checked={notificationType === 'email'}
                onChange={(e) => handleNotificationTypeChange(e.target.value as 'email')}
                className="mr-2"
                disabled={!customer.email}
              />
              <Mail size={16} className="mr-1" />
              <span className="text-sm">Email</span>
              {!customer.email && <span className="text-xs text-gray-500 ml-1">(No email)</span>}
            </label>
          </div>
        </div>

        {/* Cannot send notification warning */}
        {((notificationType === 'sms' && !customer.phone) || (notificationType === 'email' && !customer.email)) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-red-800">
              <X size={16} />
              <span className="text-sm font-medium">
                Cannot send {notificationType.toUpperCase()}: Customer has no {notificationType === 'sms' ? 'phone number' : 'email address'}
              </span>
            </div>
          </div>
        )}

        {canSend && (
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

            {/* Email Subject (only for email) */}
            {notificationType === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email subject..."
                />
              </div>
            )}

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
                rows={notificationType === 'email' ? 8 : 4}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  isOverLimit ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your message..."
              />
              {isOverLimit && notificationType === 'sms' && (
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
                      {notificationType === 'sms' ? <MessageSquare size={16} /> : <Mail size={16} />}
                      <span className="text-sm font-medium">
                        {notificationType === 'sms' ? 'SMS' : 'Email'} sent successfully!
                      </span>
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
                onClick={notificationType === 'sms' ? handleSendSMS : handleSendEmail}
                disabled={isSending || !canSend}
                className="flex items-center space-x-2"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    {notificationType === 'sms' ? <MessageSquare size={16} /> : <Mail size={16} />}
                    <span>Send {notificationType === 'sms' ? 'SMS' : 'Email'}</span>
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