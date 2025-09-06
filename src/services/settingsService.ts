import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StudioSettings, EmailTemplate, SMSTemplate, NotificationHistory } from '../types';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export class SettingsService {
  // Studio Settings methods
  static async getStudioSettings(): Promise<StudioSettings | null> {
    try {
      const { data, error } = await supabase
        .from('studio_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching studio settings:', error);
        return null;
      }

      return this.transformStudioSettings(data);
    } catch (error) {
      console.error('Error in getStudioSettings:', error);
      return null;
    }
  }

  static async updateStudioSettings(updates: Partial<StudioSettings>): Promise<StudioSettings | null> {
    try {
      const transformedUpdates = this.transformStudioSettingsForDb(updates);
      
      const { data, error } = await supabase
        .from('studio_settings')
        .update(transformedUpdates)
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .select('*')
        .single();

      if (error) {
        console.error('Error updating studio settings:', error);
        throw error;
      }

      return this.transformStudioSettings(data);
    } catch (error) {
      console.error('Error in updateStudioSettings:', error);
      throw error;
    }
  }

  // Email Template methods
  static async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_type', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching email templates:', error);
        return [];
      }

      return data.map(this.transformEmailTemplate);
    } catch (error) {
      console.error('Error in getEmailTemplates:', error);
      return [];
    }
  }

  static async createEmailTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate | null> {
    try {
      const dbTemplate = this.transformEmailTemplateForDb(template);
      
      const { data, error } = await supabase
        .from('email_templates')
        .insert([dbTemplate])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating email template:', error);
        throw error;
      }

      return this.transformEmailTemplate(data);
    } catch (error) {
      console.error('Error in createEmailTemplate:', error);
      throw error;
    }
  }

  static async updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    try {
      const dbUpdates = this.transformEmailTemplateForDb(updates);
      
      const { data, error } = await supabase
        .from('email_templates')
        .update(dbUpdates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating email template:', error);
        throw error;
      }

      return this.transformEmailTemplate(data);
    } catch (error) {
      console.error('Error in updateEmailTemplate:', error);
      throw error;
    }
  }

  static async deleteEmailTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting email template:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteEmailTemplate:', error);
      throw error;
    }
  }

  // SMS Template methods
  static async getSMSTemplates(): Promise<SMSTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .order('template_type', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching SMS templates:', error);
        return [];
      }

      return data.map(this.transformSMSTemplate);
    } catch (error) {
      console.error('Error in getSMSTemplates:', error);
      return [];
    }
  }

  static async createSMSTemplate(template: Omit<SMSTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<SMSTemplate | null> {
    try {
      const dbTemplate = this.transformSMSTemplateForDb(template);
      
      const { data, error } = await supabase
        .from('sms_templates')
        .insert([dbTemplate])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating SMS template:', error);
        throw error;
      }

      return this.transformSMSTemplate(data);
    } catch (error) {
      console.error('Error in createSMSTemplate:', error);
      throw error;
    }
  }

  static async updateSMSTemplate(id: string, updates: Partial<SMSTemplate>): Promise<SMSTemplate | null> {
    try {
      const dbUpdates = this.transformSMSTemplateForDb(updates);
      
      const { data, error } = await supabase
        .from('sms_templates')
        .update(dbUpdates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating SMS template:', error);
        throw error;
      }

      return this.transformSMSTemplate(data);
    } catch (error) {
      console.error('Error in updateSMSTemplate:', error);
      throw error;
    }
  }

  static async deleteSMSTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sms_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting SMS template:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSMSTemplate:', error);
      throw error;
    }
  }

  // Notification History methods
  static async getNotificationHistory(limit = 50): Promise<NotificationHistory[]> {
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notification history:', error);
        return [];
      }

      return data.map(this.transformNotificationHistory);
    } catch (error) {
      console.error('Error in getNotificationHistory:', error);
      return [];
    }
  }

  static async addNotificationHistory(notification: Omit<NotificationHistory, 'id' | 'createdAt'>): Promise<NotificationHistory | null> {
    try {
      const dbNotification = this.transformNotificationHistoryForDb(notification);
      
      const { data, error } = await supabase
        .from('notification_history')
        .insert([dbNotification])
        .select('*')
        .single();

      if (error) {
        console.error('Error adding notification history:', error);
        throw error;
      }

      return this.transformNotificationHistory(data);
    } catch (error) {
      console.error('Error in addNotificationHistory:', error);
      throw error;
    }
  }

  // Transformation methods for database field mapping
  private static transformStudioSettings(dbSettings: any): StudioSettings {
    return {
      id: dbSettings.id,
      studioName: dbSettings.studio_name || 'Clay Cafe',
      studioAddress: dbSettings.studio_address,
      studioPhone: dbSettings.studio_phone,
      studioEmail: dbSettings.studio_email,
      studioWebsite: dbSettings.studio_website,
      studioInstagram: dbSettings.studio_instagram,
      
      mondayHours: dbSettings.monday_hours || '9:00 AM - 5:00 PM',
      tuesdayHours: dbSettings.tuesday_hours || '9:00 AM - 5:00 PM',
      wednesdayHours: dbSettings.wednesday_hours || '9:00 AM - 5:00 PM',
      thursdayHours: dbSettings.thursday_hours || '9:00 AM - 5:00 PM',
      fridayHours: dbSettings.friday_hours || '9:00 AM - 5:00 PM',
      saturdayHours: dbSettings.saturday_hours || '10:00 AM - 4:00 PM',
      sundayHours: dbSettings.sunday_hours || 'Closed',
      
      baseGlazeRate: parseFloat(dbSettings.base_glaze_rate) || 0.50,
      firingFee: parseFloat(dbSettings.firing_fee) || 5.00,
      studioFee: parseFloat(dbSettings.studio_fee) || 8.00,
      
      emailServiceEnabled: dbSettings.email_service_enabled || false,
      emailjsServiceId: dbSettings.emailjs_service_id,
      emailjsTemplateId: dbSettings.emailjs_template_id,
      emailjsPublicKey: dbSettings.emailjs_public_key,
      emailFromName: dbSettings.email_from_name || 'Clay Cafe',
      emailReplyTo: dbSettings.email_reply_to,
      
      smsServiceEnabled: dbSettings.sms_service_enabled || false,
      twilioAccountSid: dbSettings.twilio_account_sid,
      twilioAuthToken: dbSettings.twilio_auth_token,
      twilioPhoneNumber: dbSettings.twilio_phone_number,
      
      autoNotifyReadyPieces: dbSettings.auto_notify_ready_pieces ?? true,
      autoNotifyHoursDelay: dbSettings.auto_notify_hours_delay || 24,
      reminderFrequencyDays: dbSettings.reminder_frequency_days || 7,
      
      timezone: dbSettings.timezone || 'America/New_York',
      currency: dbSettings.currency || 'USD',
      dateFormat: dbSettings.date_format || 'MM/dd/yyyy',
      
      createdAt: new Date(dbSettings.created_at),
      updatedAt: new Date(dbSettings.updated_at),
      
      // Legacy compatibility
      glazeRatePerCubicInch: parseFloat(dbSettings.base_glaze_rate) || 0.50,
      defaultTicketPrice: parseFloat(dbSettings.studio_fee) || 8.00,
    };
  }

  private static transformStudioSettingsForDb(settings: Partial<StudioSettings>): any {
    const dbSettings: any = {};
    
    if (settings.studioName !== undefined) dbSettings.studio_name = settings.studioName;
    if (settings.studioAddress !== undefined) dbSettings.studio_address = settings.studioAddress;
    if (settings.studioPhone !== undefined) dbSettings.studio_phone = settings.studioPhone;
    if (settings.studioEmail !== undefined) dbSettings.studio_email = settings.studioEmail;
    if (settings.studioWebsite !== undefined) dbSettings.studio_website = settings.studioWebsite;
    if (settings.studioInstagram !== undefined) dbSettings.studio_instagram = settings.studioInstagram;
    
    if (settings.mondayHours !== undefined) dbSettings.monday_hours = settings.mondayHours;
    if (settings.tuesdayHours !== undefined) dbSettings.tuesday_hours = settings.tuesdayHours;
    if (settings.wednesdayHours !== undefined) dbSettings.wednesday_hours = settings.wednesdayHours;
    if (settings.thursdayHours !== undefined) dbSettings.thursday_hours = settings.thursdayHours;
    if (settings.fridayHours !== undefined) dbSettings.friday_hours = settings.fridayHours;
    if (settings.saturdayHours !== undefined) dbSettings.saturday_hours = settings.saturdayHours;
    if (settings.sundayHours !== undefined) dbSettings.sunday_hours = settings.sundayHours;
    
    if (settings.baseGlazeRate !== undefined) dbSettings.base_glaze_rate = settings.baseGlazeRate;
    if (settings.firingFee !== undefined) dbSettings.firing_fee = settings.firingFee;
    if (settings.studioFee !== undefined) dbSettings.studio_fee = settings.studioFee;
    
    if (settings.emailServiceEnabled !== undefined) dbSettings.email_service_enabled = settings.emailServiceEnabled;
    if (settings.emailjsServiceId !== undefined) dbSettings.emailjs_service_id = settings.emailjsServiceId;
    if (settings.emailjsTemplateId !== undefined) dbSettings.emailjs_template_id = settings.emailjsTemplateId;
    if (settings.emailjsPublicKey !== undefined) dbSettings.emailjs_public_key = settings.emailjsPublicKey;
    if (settings.emailFromName !== undefined) dbSettings.email_from_name = settings.emailFromName;
    if (settings.emailReplyTo !== undefined) dbSettings.email_reply_to = settings.emailReplyTo;
    
    if (settings.smsServiceEnabled !== undefined) dbSettings.sms_service_enabled = settings.smsServiceEnabled;
    if (settings.twilioAccountSid !== undefined) dbSettings.twilio_account_sid = settings.twilioAccountSid;
    if (settings.twilioAuthToken !== undefined) dbSettings.twilio_auth_token = settings.twilioAuthToken;
    if (settings.twilioPhoneNumber !== undefined) dbSettings.twilio_phone_number = settings.twilioPhoneNumber;
    
    if (settings.autoNotifyReadyPieces !== undefined) dbSettings.auto_notify_ready_pieces = settings.autoNotifyReadyPieces;
    if (settings.autoNotifyHoursDelay !== undefined) dbSettings.auto_notify_hours_delay = settings.autoNotifyHoursDelay;
    if (settings.reminderFrequencyDays !== undefined) dbSettings.reminder_frequency_days = settings.reminderFrequencyDays;
    
    if (settings.timezone !== undefined) dbSettings.timezone = settings.timezone;
    if (settings.currency !== undefined) dbSettings.currency = settings.currency;
    if (settings.dateFormat !== undefined) dbSettings.date_format = settings.dateFormat;
    
    return dbSettings;
  }

  private static transformEmailTemplate(dbTemplate: any): EmailTemplate {
    return {
      id: dbTemplate.id,
      templateName: dbTemplate.template_name,
      templateType: dbTemplate.template_type,
      subjectTemplate: dbTemplate.subject_template,
      bodyTemplate: dbTemplate.body_template,
      isActive: dbTemplate.is_active,
      isDefault: dbTemplate.is_default,
      availableVariables: dbTemplate.available_variables || [],
      createdAt: new Date(dbTemplate.created_at),
      updatedAt: new Date(dbTemplate.updated_at),
    };
  }

  private static transformEmailTemplateForDb(template: Partial<EmailTemplate>): any {
    const dbTemplate: any = {};
    
    if (template.templateName !== undefined) dbTemplate.template_name = template.templateName;
    if (template.templateType !== undefined) dbTemplate.template_type = template.templateType;
    if (template.subjectTemplate !== undefined) dbTemplate.subject_template = template.subjectTemplate;
    if (template.bodyTemplate !== undefined) dbTemplate.body_template = template.bodyTemplate;
    if (template.isActive !== undefined) dbTemplate.is_active = template.isActive;
    if (template.isDefault !== undefined) dbTemplate.is_default = template.isDefault;
    if (template.availableVariables !== undefined) dbTemplate.available_variables = template.availableVariables;
    
    return dbTemplate;
  }

  private static transformSMSTemplate(dbTemplate: any): SMSTemplate {
    return {
      id: dbTemplate.id,
      templateName: dbTemplate.template_name,
      templateType: dbTemplate.template_type,
      messageTemplate: dbTemplate.message_template,
      isActive: dbTemplate.is_active,
      isDefault: dbTemplate.is_default,
      availableVariables: dbTemplate.available_variables || [],
      createdAt: new Date(dbTemplate.created_at),
      updatedAt: new Date(dbTemplate.updated_at),
    };
  }

  private static transformSMSTemplateForDb(template: Partial<SMSTemplate>): any {
    const dbTemplate: any = {};
    
    if (template.templateName !== undefined) dbTemplate.template_name = template.templateName;
    if (template.templateType !== undefined) dbTemplate.template_type = template.templateType;
    if (template.messageTemplate !== undefined) dbTemplate.message_template = template.messageTemplate;
    if (template.isActive !== undefined) dbTemplate.is_active = template.isActive;
    if (template.isDefault !== undefined) dbTemplate.is_default = template.isDefault;
    if (template.availableVariables !== undefined) dbTemplate.available_variables = template.availableVariables;
    
    return dbTemplate;
  }

  private static transformNotificationHistory(dbNotification: any): NotificationHistory {
    return {
      id: dbNotification.id,
      customerId: dbNotification.customer_id,
      notificationType: dbNotification.notification_type,
      templateType: dbNotification.template_type,
      recipient: dbNotification.recipient,
      subject: dbNotification.subject,
      message: dbNotification.message,
      status: dbNotification.status,
      errorMessage: dbNotification.error_message,
      sentAt: dbNotification.sent_at ? new Date(dbNotification.sent_at) : undefined,
      createdAt: new Date(dbNotification.created_at),
    };
  }

  private static transformNotificationHistoryForDb(notification: Partial<NotificationHistory>): any {
    const dbNotification: any = {};
    
    if (notification.customerId !== undefined) dbNotification.customer_id = notification.customerId;
    if (notification.notificationType !== undefined) dbNotification.notification_type = notification.notificationType;
    if (notification.templateType !== undefined) dbNotification.template_type = notification.templateType;
    if (notification.recipient !== undefined) dbNotification.recipient = notification.recipient;
    if (notification.subject !== undefined) dbNotification.subject = notification.subject;
    if (notification.message !== undefined) dbNotification.message = notification.message;
    if (notification.status !== undefined) dbNotification.status = notification.status;
    if (notification.errorMessage !== undefined) dbNotification.error_message = notification.errorMessage;
    if (notification.sentAt !== undefined) dbNotification.sent_at = notification.sentAt?.toISOString();
    
    return dbNotification;
  }
}