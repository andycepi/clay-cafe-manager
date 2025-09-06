import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
  variant?: 'default' | 'floating';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  hint,
  variant = 'default',
  className = '',
  id,
  onFocus,
  onBlur,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    onBlur?.(e);
  };

  if (variant === 'floating') {
    return (
      <div className="relative">
        <input
          id={inputId}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`peer w-full px-4 py-3 border-2 rounded-xl bg-white/50 backdrop-blur-sm placeholder-transparent focus:outline-none focus:border-blue-500 transition-all duration-200 ${
            error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
          } ${className}`}
          placeholder={label}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className={`absolute left-4 transition-all duration-200 pointer-events-none ${
              isFocused || hasValue || value
                ? 'top-1 text-xs text-blue-600 font-medium'
                : 'top-3 text-gray-500'
            }`}
          >
            {label}
          </label>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <span className="w-4 h-4 mr-1">⚠️</span>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1 text-sm text-gray-500">{hint}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{icon}</div>
          </div>
        )}
        <input
          id={inputId}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`block w-full rounded-xl border-2 bg-white/50 backdrop-blur-sm shadow-sm placeholder-gray-400 focus:outline-none transition-all duration-200 ${
            icon ? 'pl-10 pr-4 py-3' : 'px-4 py-3'
          } ${
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
              : isFocused
                ? 'border-blue-500 focus:ring-4 focus:ring-blue-100'
                : 'border-gray-200 hover:border-gray-300'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center animate-in slide-in-from-top-1 duration-200">
          <span className="w-4 h-4 mr-1">⚠️</span>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
};
