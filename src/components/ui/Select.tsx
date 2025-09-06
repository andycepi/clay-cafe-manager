import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  placeholder,
  icon,
  id,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <div className="text-gray-400">{icon}</div>
          </div>
        )}
        <select
          id={selectId}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`block w-full rounded-xl border-2 bg-white/80 backdrop-blur-sm shadow-sm text-gray-900 focus:outline-none transition-all duration-200 appearance-none cursor-pointer ${
            icon ? 'pl-10 pr-12 py-3' : 'px-4 pr-12 py-3'
          } ${
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
              : isFocused
                ? 'border-blue-500 focus:ring-4 focus:ring-blue-100'
                : 'border-gray-200 hover:border-gray-300'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-gray-400">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-gray-900 bg-white">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown 
            size={18} 
            className={`transition-all duration-200 ${
              isFocused ? 'text-blue-500 rotate-180' : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center animate-in slide-in-from-top-1 duration-200">
          <span className="w-4 h-4 mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
};
