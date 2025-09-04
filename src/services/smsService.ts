import { Customer, Piece } from '../types';

export interface SMSMessage {
  to: string;
  message: string;
}

export interface SMSNotificationOptions {
  customer: Customer;
  piece: Piece;
  messageType: 'ready-for-pickup' | 'ready-to-glaze';
  customMessage?: string;
}

class SMSService {
  private accountSid: string | null = null;
  private authToken: string | null = null;
  private phoneNumber: string | null = null;

  constructor() {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    this.accountSid = process.env.REACT_APP_TWILIO_ACCOUNT_SID || null;
    this.authToken = process.env.REACT_APP_TWILIO_AUTH_TOKEN || null;
    this.phoneNumber = process.env.REACT_APP_TWILIO_PHONE_NUMBER || null;
    
    if (this.accountSid && this.authToken && this.phoneNumber && 
        this.accountSid !== 'your_twilio_account_sid') {
      console.log('Twilio credentials configured successfully');
    } else {
      console.log('Twilio credentials not configured - using mock mode');
    }
  }

  private isConfigured(): boolean {
    return !!(this.accountSid && this.authToken && this.phoneNumber && 
              this.accountSid !== 'your_twilio_account_sid');
  }

  generateDefaultMessage(options: SMSNotificationOptions): string {
    const { customer, messageType } = options;
    const customerName = customer.name.split(' ')[0]; // Use first name

    if (messageType === 'ready-for-pickup') {
      return `Hi ${customerName}! Your ceramic piece is ready for pickup at Clay Cafe. Please come by during our business hours to collect it. Thank you!`;
    } else if (messageType === 'ready-to-glaze') {
      return `Hi ${customerName}! Your ceramic piece has been bisque fired and is ready for glazing at Clay Cafe. Please come by to select your glazes and complete your piece. Thank you!`;
    }

    return `Hi ${customerName}! We have an update about your ceramic piece at Clay Cafe. Please contact us for more details.`;
  }

  async sendSMS(options: SMSNotificationOptions & { finalMessage: string }): Promise<{ success: boolean; error?: string; messageId?: string }> {
    const { customer, finalMessage } = options;
    
    if (!customer.phone) {
      return {
        success: false,
        error: 'Customer does not have a phone number'
      };
    }

    // Clean phone number (remove non-digits except +)
    const cleanPhone = customer.phone.replace(/[^\d+]/g, '');
    
    // Add US country code if not present
    const phoneNumber = cleanPhone.startsWith('+') ? cleanPhone : `+1${cleanPhone}`;

    try {
      if (this.isConfigured()) {
        // Real Twilio REST API call using fetch
        console.log('Sending SMS via Twilio REST API...');
        
        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
        
        // Create the request body
        const formData = new URLSearchParams();
        formData.append('To', phoneNumber);
        formData.append('From', this.phoneNumber!);
        formData.append('Body', finalMessage);
        
        // Create basic auth header
        const auth = btoa(`${this.accountSid}:${this.authToken}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          
          console.error('Twilio API error:', errorData);
          return {
            success: false,
            error: this.translateTwilioError(errorMessage)
          };
        }

        const result = await response.json();
        console.log(`SMS sent successfully! Message SID: ${result.sid}`);
        
        return {
          success: true,
          messageId: result.sid
        };
      } else {
        // Mock implementation when credentials are not configured
        console.log('Twilio credentials not configured - using mock mode:');
        console.log(`To: ${phoneNumber}`);
        console.log(`Message: ${finalMessage}`);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: true,
          messageId: `mock_${Date.now()}`
        };
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = this.translateTwilioError(error.message);
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private translateTwilioError(errorMessage: string): string {
    if (errorMessage.includes('not a valid phone number')) {
      return 'Invalid phone number format';
    } else if (errorMessage.includes('Permission denied') || errorMessage.includes('not authorized')) {
      return 'Twilio account does not have permission to send to this number';
    } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('balance')) {
      return 'Insufficient Twilio account balance';
    } else if (errorMessage.includes('Authentication failed') || errorMessage.includes('20003')) {
      return 'Invalid Twilio credentials';
    } else if (errorMessage.includes('21211')) {
      return 'Invalid phone number format';
    } else if (errorMessage.includes('21610')) {
      return 'Phone number is not verified for trial account';
    } else {
      return errorMessage;
    }
  }

  validatePhoneNumber(phone: string): boolean {
    // Basic US phone number validation
    const cleanPhone = phone.replace(/[^\d]/g, '');
    return cleanPhone.length === 10 || cleanPhone.length === 11;
  }

  formatPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.length === 10) {
      return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      return `+1 (${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7)}`;
    }
    return phone; // Return original if not standard format
  }
}

export const smsService = new SMSService();