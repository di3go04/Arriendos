'use client';

import { useState } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  rows?: number;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  helpText,
  error,
  required,
  options,
  rows = 3,
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);

  const hasValue = value.length > 0;
  const showFloating = focused || hasValue;

  const baseInputClasses =
    'w-full bg-white border border-[#CBD5E1] rounded-[10px] pt-5 pb-2 px-3 text-sm text-[#1A202C] outline-none transition-all duration-150 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 peer';

  const errorClasses = error ? '!border-[#ef4444] !focus:ring-[#ef4444]/20' : '';

  return (
    <div className="relative w-full">
      {/* Label flotante */}
      <label
        htmlFor={name}
        className={`absolute left-3 transition-all duration-150 pointer-events-none z-10 ${
          showFloating
            ? 'top-1.5 text-[10px] font-semibold text-[#2563EB]'
            : 'top-3 text-sm text-[#94A3B8]'
        }`}
      >
        {label}
        {required && <span className="text-[#ef4444] ml-0.5">*</span>}
      </label>

      {/* Input */}
      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`${baseInputClasses} ${errorClasses} appearance-none`}
        >
          <option value="" disabled></option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={showFloating ? placeholder : ''}
          rows={rows}
          className={`${baseInputClasses} ${errorClasses} resize-none`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={showFloating ? placeholder : ''}
          className={`${baseInputClasses} ${errorClasses}`}
        />
      )}

      {/* Help / Error */}
      {error && <p className="mt-1 text-xs text-[#ef4444] flex items-center gap-1">⚠ {error}</p>}
      {helpText && !error && <p className="mt-1 text-xs text-[#94A3B8]">{helpText}</p>}
    </div>
  );
}
