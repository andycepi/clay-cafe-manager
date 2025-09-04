import { format } from 'date-fns';

export function ensureDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }
  
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  if (typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  return undefined;
}

export function ensureDateRequired(value: any): Date {
  const date = ensureDate(value);
  if (!date) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return date;
}

export const formatEventDate = (date: any): string => {
  return format(ensureDate(date) || new Date(), 'EEEE, MMMM dd, yyyy');
};

export const formatShortDate = (date: any): string => {
  return format(ensureDate(date) || new Date(), 'MMM dd, yyyy');
};

export const formatTime = (time: string): string => {
  return time; // Pass through for now, could enhance with time parsing/formatting
};