import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Building, 
  Clock, 
  DollarSign, 
  Mail, 
  MessageSquare, 
  Bell, 
  Globe,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Modal } from './ui/Modal';
import { StudioSettings, EmailTemplate, SMSTemplate } from '../types';
import { SettingsService } from '../services/settingsService';

type SettingsTab = 'studio' | 'pricing' | 'hours' | 'email' | 'sms' | 'notifications' | 'templates';

interface TemplateFormData {
  templateName: string;
  templateType: 'ready_for_pickup' | 'glazing_reminder' | 'custom';
  subjectTemplate?: string;
  messageTemplate: string;
  isActive: boolean;
}

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('studio');
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsTemplates, setSMSTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // Modal states
  const [showEmailTemplateModal, setShowEmailTemplateModal] = useState(false);
  const [showSMSTemplateModal, setShowSMSTemplateModal] = useState(false);
  const [editingEmailTemplate, setEditingEmailTemplate] = useState<EmailTemplate | null>(null);
  const [editingSMSTemplate, setSMSTemplate] = useState<SMSTemplate | null>(null);

  const [formData, setFormData] = useState<Partial<StudioSettings>>({});
  const [emailTemplateForm, setEmailTemplateForm] = useState<TemplateFormData>({
    templateName: '',
    templateType: 'ready_for_pickup',
    subjectTemplate: '',
    messageTemplate: '',
    isActive: true,
  });
  const [smsTemplateForm, setSMSTemplateForm] = useState<TemplateFormData>({
    templateName: '',
    templateType: 'ready_for_pickup',
    messageTemplate: '',
    isActive: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [studioSettings, emailTemplateData, smsTemplateData] = await Promise.all([
        SettingsService.getStudioSettings(),
        SettingsService.getEmailTemplates(),
        SettingsService.getSMSTemplates(),
      ]);

      if (studioSettings) {
        setSettings(studioSettings);
        setFormData(studioSettings);
      }
      setEmailTemplates(emailTemplateData);
      setSMSTemplates(smsTemplateData);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof StudioSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const updatedSettings = await SettingsService.updateStudioSettings(formData);
      if (updatedSettings) {
        setSettings(updatedSettings);
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailTemplateSubmit = async () => {
    try {
      if (editingEmailTemplate) {
        const updated = await SettingsService.updateEmailTemplate(editingEmailTemplate.id, {
          ...emailTemplateForm,
          bodyTemplate: emailTemplateForm.messageTemplate,
        });
        if (updated) {
          setEmailTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
        }
      } else {
        const created = await SettingsService.createEmailTemplate({
          ...emailTemplateForm,
          subjectTemplate: emailTemplateForm.subjectTemplate || '',
          bodyTemplate: emailTemplateForm.messageTemplate,
          availableVariables: [
            '{{customer_name}}',
            '{{studio_name}}',
            '{{studio_phone}}',
            '{{studio_address}}',
            '{{piece_count}}',
            '{{status}}',
            '{{total_amount}}',
            '{{custom_message}}'
          ],
          isDefault: false,
        });
        if (created) {
          setEmailTemplates(prev => [...prev, created]);
        }
      }
      setShowEmailTemplateModal(false);
      setEditingEmailTemplate(null);
      resetEmailTemplateForm();
    } catch (error) {
      console.error('Error saving email template:', error);
      alert('Error saving template. Please try again.');
    }
  };

  const handleSMSTemplateSubmit = async () => {
    try {
      if (editingSMSTemplate) {
        const updated = await SettingsService.updateSMSTemplate(editingSMSTemplate.id, smsTemplateForm);
        if (updated) {
          setSMSTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
        }
      } else {
        const created = await SettingsService.createSMSTemplate({
          ...smsTemplateForm,
          availableVariables: [
            '{{customer_name}}',
            '{{studio_name}}',
            '{{studio_phone}}',
            '{{piece_count}}',
            '{{status}}',
            '{{total_amount}}',
            '{{custom_message}}'
          ],
          isDefault: false,
        });
        if (created) {
          setSMSTemplates(prev => [...prev, created]);
        }
      }
      setShowSMSTemplateModal(false);
      setSMSTemplate(null);
      resetSMSTemplateForm();
    } catch (error) {
      console.error('Error saving SMS template:', error);
      alert('Error saving template. Please try again.');
    }
  };

  const resetEmailTemplateForm = () => {
    setEmailTemplateForm({
      templateName: '',
      templateType: 'ready_for_pickup',
      subjectTemplate: '',
      messageTemplate: '',
      isActive: true,
    });
  };

  const resetSMSTemplateForm = () => {
    setSMSTemplateForm({
      templateName: '',
      templateType: 'ready_for_pickup',
      messageTemplate: '',
      isActive: true,
    });
  };

  const deleteEmailTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await SettingsService.deleteEmailTemplate(id);
      setEmailTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting email template:', error);
      alert('Error deleting template.');
    }
  };

  const deleteSMSTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await SettingsService.deleteSMSTemplate(id);
      setSMSTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting SMS template:', error);
      alert('Error deleting template.');
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'studio', label: 'Studio Info', icon: <Building size={18} /> },
    { id: 'hours', label: 'Business Hours', icon: <Clock size={18} /> },
    { id: 'pricing', label: 'Pricing', icon: <DollarSign size={18} /> },
    { id: 'email', label: 'Email Setup', icon: <Mail size={18} /> },
    { id: 'sms', label: 'SMS Setup', icon: <MessageSquare size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'templates', label: 'Templates', icon: <Globe size={18} /> },
  ];

  const daysOfWeek = [
    { field: 'mondayHours' as keyof StudioSettings, label: 'Monday' },
    { field: 'tuesdayHours' as keyof StudioSettings, label: 'Tuesday' },
    { field: 'wednesdayHours' as keyof StudioSettings, label: 'Wednesday' },
    { field: 'thursdayHours' as keyof StudioSettings, label: 'Thursday' },
    { field: 'fridayHours' as keyof StudioSettings, label: 'Friday' },
    { field: 'saturdayHours' as keyof StudioSettings, label: 'Saturday' },
    { field: 'sundayHours' as keyof StudioSettings, label: 'Sunday' },
  ];

  const templateTypeOptions = [
    { value: 'ready_for_pickup', label: 'Ready for Pickup' },
    { value: 'glazing_reminder', label: 'Glazing Reminder' },
    { value: 'custom', label: 'Custom' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Studio Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Configure your Clay Cafe studio preferences and templates</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
            <nav className="flex overflow-x-auto scrollbar-hide px-2 sm:px-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 min-w-0 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-blue-500 bg-blue-50/50'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span className="truncate text-center sm:text-left">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-8">
            {activeTab === 'studio' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Studio Information</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Input
                    label="Studio Name"
                    value={formData.studioName || ''}
                    onChange={(e) => handleInputChange('studioName', e.target.value)}
                    placeholder="Enter studio name"
                  />
                  <Input
                    label="Phone Number"
                    value={formData.studioPhone || ''}
                    onChange={(e) => handleInputChange('studioPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.studioEmail || ''}
                    onChange={(e) => handleInputChange('studioEmail', e.target.value)}
                    placeholder="studio@claycafe.com"
                  />
                  <Input
                    label="Website"
                    value={formData.studioWebsite || ''}
                    onChange={(e) => handleInputChange('studioWebsite', e.target.value)}
                    placeholder="https://claycafe.com"
                  />
                  <Input
                    label="Instagram Handle"
                    value={formData.studioInstagram || ''}
                    onChange={(e) => handleInputChange('studioInstagram', e.target.value)}
                    placeholder="claycafe"
                  />
                </div>
                <div className="lg:col-span-2">
                  <Input
                    label="Studio Address"
                    value={formData.studioAddress || ''}
                    onChange={(e) => handleInputChange('studioAddress', e.target.value)}
                    placeholder="123 Clay Street, Art District, City, State 12345"
                  />
                </div>
              </div>
            )}

            {activeTab === 'hours' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Business Hours</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {daysOfWeek.map((day) => (
                    <Input
                      key={day.field}
                      label={day.label}
                      value={formData[day.field] as string || ''}
                      onChange={(e) => handleInputChange(day.field, e.target.value)}
                      placeholder="9:00 AM - 5:00 PM"
                    />
                  ))}
                </div>
                <div className="bg-blue-50/80 border border-blue-200/50 rounded-xl p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Tip:</p>
                      <p>Use "Closed" for days when the studio is not open. Format: "9:00 AM - 5:00 PM"</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Pricing Settings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <Input
                    label="Base Glaze Rate (per cubic inch)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.baseGlazeRate || ''}
                    onChange={(e) => handleInputChange('baseGlazeRate', parseFloat(e.target.value) || 0)}
                    placeholder="0.50"
                  />
                  <Input
                    label="Firing Fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.firingFee || ''}
                    onChange={(e) => handleInputChange('firingFee', parseFloat(e.target.value) || 0)}
                    placeholder="5.00"
                  />
                  <Input
                    label="Studio Fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.studioFee || ''}
                    onChange={(e) => handleInputChange('studioFee', parseFloat(e.target.value) || 0)}
                    placeholder="8.00"
                  />
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Email Configuration</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="emailEnabled"
                      checked={formData.emailServiceEnabled || false}
                      onChange={(e) => handleInputChange('emailServiceEnabled', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="emailEnabled" className="text-sm font-medium text-gray-700">
                      Enable Email Notifications
                    </label>
                  </div>
                  
                  {formData.emailServiceEnabled && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
                      <Input
                        label="EmailJS Service ID"
                        value={formData.emailjsServiceId || ''}
                        onChange={(e) => handleInputChange('emailjsServiceId', e.target.value)}
                        placeholder="service_xxxxxxx"
                      />
                      <Input
                        label="EmailJS Template ID"
                        value={formData.emailjsTemplateId || ''}
                        onChange={(e) => handleInputChange('emailjsTemplateId', e.target.value)}
                        placeholder="template_xxxxxxx"
                      />
                      <Input
                        label="EmailJS Public Key"
                        type={showPasswordFields ? 'text' : 'password'}
                        value={formData.emailjsPublicKey || ''}
                        onChange={(e) => handleInputChange('emailjsPublicKey', e.target.value)}
                        placeholder="••••••••••••••••"
                      />
                      <Input
                        label="From Name"
                        value={formData.emailFromName || ''}
                        onChange={(e) => handleInputChange('emailFromName', e.target.value)}
                        placeholder="Clay Cafe"
                      />
                      <Input
                        label="Reply-To Email"
                        type="email"
                        value={formData.emailReplyTo || ''}
                        onChange={(e) => handleInputChange('emailReplyTo', e.target.value)}
                        placeholder="replies@claycafe.com"
                      />
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          onClick={() => setShowPasswordFields(!showPasswordFields)}
                          className="flex items-center space-x-2"
                        >
                          {showPasswordFields ? <EyeOff size={16} /> : <Eye size={16} />}
                          <span>{showPasswordFields ? 'Hide' : 'Show'} Keys</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'sms' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">SMS Configuration</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="smsEnabled"
                      checked={formData.smsServiceEnabled || false}
                      onChange={(e) => handleInputChange('smsServiceEnabled', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="smsEnabled" className="text-sm font-medium text-gray-700">
                      Enable SMS Notifications
                    </label>
                  </div>
                  
                  {formData.smsServiceEnabled && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
                      <Input
                        label="Twilio Account SID"
                        value={formData.twilioAccountSid || ''}
                        onChange={(e) => handleInputChange('twilioAccountSid', e.target.value)}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                      <Input
                        label="Twilio Auth Token"
                        type={showPasswordFields ? 'text' : 'password'}
                        value={formData.twilioAuthToken || ''}
                        onChange={(e) => handleInputChange('twilioAuthToken', e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                      />
                      <Input
                        label="Twilio Phone Number"
                        value={formData.twilioPhoneNumber || ''}
                        onChange={(e) => handleInputChange('twilioPhoneNumber', e.target.value)}
                        placeholder="+1234567890"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="autoNotify"
                      checked={formData.autoNotifyReadyPieces || false}
                      onChange={(e) => handleInputChange('autoNotifyReadyPieces', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="autoNotify" className="text-sm font-medium text-gray-700">
                      Automatically notify customers when pieces are ready for pickup
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
                    <Input
                      label="Auto-notification delay (hours)"
                      type="number"
                      min="0"
                      value={formData.autoNotifyHoursDelay || ''}
                      onChange={(e) => handleInputChange('autoNotifyHoursDelay', parseInt(e.target.value) || 0)}
                      placeholder="24"
                    />
                    <Input
                      label="Reminder frequency (days)"
                      type="number"
                      min="1"
                      value={formData.reminderFrequencyDays || ''}
                      onChange={(e) => handleInputChange('reminderFrequencyDays', parseInt(e.target.value) || 7)}
                      placeholder="7"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-6 sm:space-y-8">
                {/* Email Templates */}
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Email Templates</h3>
                    <Button
                      variant="primary"
                      onClick={() => {
                        resetEmailTemplateForm();
                        setShowEmailTemplateModal(true);
                      }}
                      className="flex items-center space-x-2 w-full sm:w-auto text-sm"
                      size="sm"
                    >
                      <Plus size={14} />
                      <span className="hidden sm:inline">Add Email Template</span>
                      <span className="sm:hidden">Add Email</span>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {emailTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="group bg-gradient-to-br from-white to-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-200/50 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{template.templateName}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 capitalize">{template.templateType.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {template.isActive ? 'Active' : 'Inactive'} • {template.isDefault ? 'Default' : 'Custom'}
                            </p>
                          </div>
                          <div className="flex space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingEmailTemplate(template);
                                setEmailTemplateForm({
                                  templateName: template.templateName,
                                  templateType: template.templateType,
                                  subjectTemplate: template.subjectTemplate,
                                  messageTemplate: template.bodyTemplate,
                                  isActive: template.isActive,
                                });
                                setShowEmailTemplateModal(true);
                              }}
                              className="text-blue-600 hover:bg-blue-100/80 rounded-full p-1"
                            >
                              <Edit size={12} />
                            </Button>
                            {!template.isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteEmailTemplate(template.id)}
                                className="text-red-600 hover:bg-red-100/80 rounded-full p-1"
                              >
                                <Trash2 size={12} />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SMS Templates */}
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">SMS Templates</h3>
                    <Button
                      variant="primary"
                      onClick={() => {
                        resetSMSTemplateForm();
                        setShowSMSTemplateModal(true);
                      }}
                      className="flex items-center space-x-2 w-full sm:w-auto text-sm"
                      size="sm"
                    >
                      <Plus size={14} />
                      <span className="hidden sm:inline">Add SMS Template</span>
                      <span className="sm:hidden">Add SMS</span>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {smsTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="group bg-gradient-to-br from-white to-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-200/50 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{template.templateName}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 capitalize">{template.templateType.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {template.isActive ? 'Active' : 'Inactive'} • {template.isDefault ? 'Default' : 'Custom'}
                            </p>
                          </div>
                          <div className="flex space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSMSTemplate(template);
                                setSMSTemplateForm({
                                  templateName: template.templateName,
                                  templateType: template.templateType,
                                  messageTemplate: template.messageTemplate,
                                  isActive: template.isActive,
                                });
                                setShowSMSTemplateModal(true);
                              }}
                              className="text-blue-600 hover:bg-blue-100/80 rounded-full p-1"
                            >
                              <Edit size={12} />
                            </Button>
                            {!template.isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSMSTemplate(template.id)}
                                className="text-red-600 hover:bg-red-100/80 rounded-full p-1"
                              >
                                <Trash2 size={12} />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4 sm:pt-6 border-t border-gray-200/50 mt-6 sm:mt-8">
              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
                className="flex items-center space-x-2 w-full sm:w-auto"
              >
                <Save size={16} />
                <span>Save Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Template Modal */}
      <Modal
        isOpen={showEmailTemplateModal}
        onClose={() => {
          setShowEmailTemplateModal(false);
          setEditingEmailTemplate(null);
        }}
        title={editingEmailTemplate ? 'Edit Email Template' : 'Create Email Template'}
        size="lg"
        className="mx-2 sm:mx-0"
      >
        <div className="space-y-3 sm:space-y-4">
          <Input
            label="Template Name"
            value={emailTemplateForm.templateName}
            onChange={(e) => setEmailTemplateForm(prev => ({ ...prev, templateName: e.target.value }))}
            placeholder="e.g., Ready for Pickup - Holiday"
          />
          
          <Select
            label="Template Type"
            options={templateTypeOptions}
            value={emailTemplateForm.templateType}
            onChange={(e) => setEmailTemplateForm(prev => ({ 
              ...prev, 
              templateType: e.target.value as 'ready_for_pickup' | 'glazing_reminder' | 'custom'
            }))}
          />

          <Input
            label="Email Subject"
            value={emailTemplateForm.subjectTemplate || ''}
            onChange={(e) => setEmailTemplateForm(prev => ({ ...prev, subjectTemplate: e.target.value }))}
            placeholder="Your pottery is ready at {{studio_name}}!"
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Body</label>
            <textarea
              value={emailTemplateForm.messageTemplate}
              onChange={(e) => setEmailTemplateForm(prev => ({ ...prev, messageTemplate: e.target.value }))}
              rows={8}
              className="block w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
              placeholder="Hi {{customer_name}}, your pottery is ready for pickup..."
            />
            <p className="text-xs text-gray-500 mt-1 break-words">
              Available variables: {`{{customer_name}}, {{studio_name}}, {{studio_phone}}, {{piece_count}}, {{status}}, {{total_amount}}`}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="emailTemplateActive"
              checked={emailTemplateForm.isActive}
              onChange={(e) => setEmailTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="emailTemplateActive" className="text-sm font-medium text-gray-700">
              Active Template
            </label>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEmailTemplateModal(false);
                setEditingEmailTemplate(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEmailTemplateSubmit}
              className="flex-1"
            >
              {editingEmailTemplate ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </div>
      </Modal>

      {/* SMS Template Modal */}
      <Modal
        isOpen={showSMSTemplateModal}
        onClose={() => {
          setShowSMSTemplateModal(false);
          setSMSTemplate(null);
        }}
        title={editingSMSTemplate ? 'Edit SMS Template' : 'Create SMS Template'}
        size="lg"
        className="mx-2 sm:mx-0"
      >
        <div className="space-y-3 sm:space-y-4">
          <Input
            label="Template Name"
            value={smsTemplateForm.templateName}
            onChange={(e) => setSMSTemplateForm(prev => ({ ...prev, templateName: e.target.value }))}
            placeholder="e.g., Ready for Pickup - Short"
          />
          
          <Select
            label="Template Type"
            options={templateTypeOptions}
            value={smsTemplateForm.templateType}
            onChange={(e) => setSMSTemplateForm(prev => ({ 
              ...prev, 
              templateType: e.target.value as 'ready_for_pickup' | 'glazing_reminder' | 'custom'
            }))}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">SMS Message</label>
            <textarea
              value={smsTemplateForm.messageTemplate}
              onChange={(e) => setSMSTemplateForm(prev => ({ ...prev, messageTemplate: e.target.value }))}
              rows={4}
              maxLength={160}
              className="block w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
              placeholder="Hi {{customer_name}}! Your pottery is ready for pickup at {{studio_name}}..."
            />
            <p className="text-xs text-gray-500 mt-1 break-words">
              {smsTemplateForm.messageTemplate.length}/160 characters • 
              Available variables: {`{{customer_name}}, {{studio_name}}, {{studio_phone}}, {{piece_count}}, {{status}}`}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="smsTemplateActive"
              checked={smsTemplateForm.isActive}
              onChange={(e) => setSMSTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="smsTemplateActive" className="text-sm font-medium text-gray-700">
              Active Template
            </label>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowSMSTemplateModal(false);
                setSMSTemplate(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSMSTemplateSubmit}
              className="flex-1"
            >
              {editingSMSTemplate ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};