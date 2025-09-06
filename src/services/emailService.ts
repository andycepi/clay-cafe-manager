import { Customer, Piece } from '../types';

export interface EmailMessage {
  to: string;
  subject: string;
  message: string;
}

export interface EmailNotificationOptions {
  customer: Customer;
  piece: Piece;
  messageType: 'ready-for-pickup' | 'ready-to-glaze';
  customMessage?: string;
  customSubject?: string;
}

class EmailService {
  private apiKey: string | null = null;
  private fromEmail: string | null = null;

  constructor() {
    this.initializeEmailJS();
  }

  private initializeEmailJS() {
    this.apiKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || null;
    this.fromEmail = process.env.REACT_APP_STUDIO_EMAIL || 'clay.cafe.studio@example.com';
    
    if (this.apiKey && this.apiKey !== 'your_emailjs_public_key') {
      console.log('EmailJS credentials configured successfully');
    } else {
      console.log('EmailJS credentials not configured - using mock mode');
    }
  }

  private isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey !== 'your_emailjs_public_key');
  }

  generateDefaultSubject(options: EmailNotificationOptions): string {
    const { messageType } = options;
    
    if (messageType === 'ready-for-pickup') {
      return 'Your Clay Cafe piece is ready for pickup!';
    } else if (messageType === 'ready-to-glaze') {
      return 'Your Clay Cafe piece is ready for glazing!';
    }
    
    return 'Update from house mouse about your ceramic piece';
  }

  generateDefaultMessage(options: EmailNotificationOptions): string {
    const { customer, piece, messageType } = options;
    const customerName = customer.name.split(' ')[0]; // Use first name

    if (messageType === 'ready-for-pickup') {
      return `Dear ${customerName},

Great news! Your ceramic piece is now ready for pickup at house mouse.

Please come by during our business hours to collect your piece.

Shop hours: 12-6pm, Monday-Friday

If you have any questions or need to arrange a different pickup time, please don't hesitate to contact us.

Best regards,

Andy & Jamiee
house mouse`;
    } else if (messageType === 'ready-to-glaze') {
      return `Dear ${customerName},

Your ceramic piece has been bisque fired and is ready for glazing!

Please visit us at Clay Cafe to glaze your piece, or schedule a glazing appointment here:

https://calendar.app.google/DJxTrJxLgkXerJH26

If you have any questions or need to arrange a different glazing time, please don't hesitate to contact us.

Best regards,

Andy & Jamiee
house mouse`;
    }
    
    return `Dear ${customerName},

We have an update about your ceramic piece at Clay Cafe.

Please feel free to contact us if you have any questions.

Best regards,

Andy & Jamiee
house mouse`;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getStatusForTemplate(messageType: 'ready-for-pickup' | 'ready-to-glaze'): string {
    return messageType === 'ready-for-pickup' ? 'Pickup' : 'Glazing';
  }

  async sendEmail(options: EmailNotificationOptions & { finalMessage: string; finalSubject?: string }): Promise<{ success: boolean; error?: string }> {
    const { customer, piece, messageType, finalMessage, finalSubject } = options;

    if (!customer.email) {
      return {
        success: false,
        error: 'Customer does not have an email address'
      };
    }

    if (!this.validateEmail(customer.email)) {
      return {
        success: false,
        error: 'Invalid email address format'
      };
    }

    const subject = finalSubject || this.generateDefaultSubject(options);
    const status = this.getStatusForTemplate(messageType);

    // If EmailJS is configured, use it
    if (this.isConfigured()) {
      try {
        const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
        const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
        
        if (!serviceId || !templateId) {
          throw new Error('EmailJS service ID or template ID not configured');
        }

        // Dynamic import of EmailJS to avoid bundling if not used
        const emailjs = await import('@emailjs/browser');
        
        await emailjs.send(serviceId, templateId, {
          to_email: customer.email,
          to_name: customer.name,
          user_email: customer.email, // Alternative email field name
          recipient_email: customer.email, // Another common field name
          subject: subject,
          message: finalMessage,
          customer_name: customer.name,
          status: status,
          piece_volume: piece.cubicInches?.toString() || '',
          glaze_total: piece.glazeTotal?.toFixed(2) || '',
          from_email: this.fromEmail,
          from_name: 'Clay Cafe Studio'
        }, this.apiKey!);
        
        console.log(`Email sent to ${customer.email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Status: ${status}`);
        
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send email'
        };
      }
    } else {
      // Mock mode - simulate success
      console.log('MOCK EMAIL SEND:');
      console.log(`To: ${customer.email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${finalMessage}`);
      console.log(`Status: ${status}`);
      
      await this.simulateEmailSend();
      return { success: true };
    }
  }

  private async simulateEmailSend(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 1500); // Simulate network delay
    });
  }
}

export const emailService = new EmailService();