import { useState, useCallback } from 'react';

type ValidationRule<T> = {
  required?: boolean;
  custom?: (value: any, formData: T) => string | undefined;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>;
};

interface UseFormOptions<T> {
  initialData: T;
  validationRules?: ValidationRules<T>;
  onSubmit: (data: T) => void | Promise<void>;
  onCancel?: () => void;
}

export const useForm = <T extends Record<string, any>>({
  initialData,
  validationRules = {},
  onSubmit,
  onCancel
}: UseFormOptions<T>) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    Object.keys(validationRules).forEach(field => {
      const rule = validationRules[field as keyof T];
      const value = formData[field as keyof T];

      if (rule?.required && (!value || (typeof value === 'string' && !value.trim()))) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }

      if (rule?.custom && value) {
        const customError = rule.custom(value, formData);
        if (customError) {
          newErrors[field] = customError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validationRules]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit]);

  const handleCancel = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    onCancel?.();
  }, [initialData, onCancel]);

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    handleCancel,
    setFormData,
    setErrors
  };
};