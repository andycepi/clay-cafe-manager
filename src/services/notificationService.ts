import { Customer, Piece } from '../types';

export interface NotificationResult {
  success: boolean;
  message: string;
  method: 'email' | 'sms';
}

class NotificationService {
  private emailTemplate = 'Hi {{customerName}}, your ceramic piece is ready for pickup at Clay Cafe! Please come by during our business hours.';
  private smsTemplate = 'Your ceramic piece is ready for pickup at Clay Cafe!';

  // In a real application, these would integrate with actual email/SMS services
  // For now, we'll simulate the notifications
  async sendEmailNotification(customer: Customer, piece: Piece): Promise<NotificationResult> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const message = this.emailTemplate.replace('{{customerName}}', customer.name);
      
      // In a real app, you would call an email service like SendGrid, AWS SES, etc.
      console.log('Email notification sent:', {
        to: customer.email,
        subject: 'Your Ceramic Piece is Ready for Pickup!',
        message
      });
      
      return {
        success: true,
        message: 'Email notification sent successfully',
        method: 'email'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send email notification',
        method: 'email'
      };
    }
  }

  async sendSMSNotification(customer: Customer, piece: Piece): Promise<NotificationResult> {
    try {
      if (!customer.phone) {
        return {
          success: false,
          message: 'No phone number available for customer',
          method: 'sms'
        };
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would call an SMS service like Twilio, AWS SNS, etc.
      console.log('SMS notification sent:', {
        to: customer.phone,
        message: this.smsTemplate
      });
      
      return {
        success: true,
        message: 'SMS notification sent successfully',
        method: 'sms'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send SMS notification',
        method: 'sms'
      };
    }
  }

  async sendNotification(customer: Customer, piece: Piece, methods: ('email' | 'sms')[] = ['email', 'sms']): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const method of methods) {
      if (method === 'email') {
        const result = await this.sendEmailNotification(customer, piece);
        results.push(result);
      } else if (method === 'sms' && customer.phone) {
        const result = await this.sendSMSNotification(customer, piece);
        results.push(result);
      }
    }

    return results;
  }

  // Template management
  updateEmailTemplate(template: string): void {
    this.emailTemplate = template;
  }

  updateSMSTemplate(template: string): void {
    this.smsTemplate = template;
  }

  getEmailTemplate(): string {
    return this.emailTemplate;
  }

  getSMSTemplate(): string {
    return this.smsTemplate;
  }
}

export const notificationService = new NotificationService();
