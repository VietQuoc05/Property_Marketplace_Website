'use client';

import React, { useRef } from 'react';

export function formatNumberWithDots(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  const cleanDigits = str.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!cleanDigits) return '';
  return cleanDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseNumberFromDots(val: string | undefined | null): string {
  if (!val) return '';
  return String(val).replace(/\D/g, '');
}

export function formatVNDToWords(amountStr: string | number, unitText = 'VNĐ'): string {
  const digits = String(amountStr ?? '').replace(/\D/g, '');
  if (!digits) return '';
  const num = Number(digits);
  if (!num || isNaN(num) || num <= 0) return '';

  if (num >= 1_000_000_000) {
    const ty = num / 1_000_000_000;
    const formatted = parseFloat(ty.toFixed(2)).toLocaleString('vi-VN');
    return `${formatted} tỷ ${unitText}`;
  }
  if (num >= 1_000_000) {
    const tr = num / 1_000_000;
    const formatted = parseFloat(tr.toFixed(2)).toLocaleString('vi-VN');
    return `${formatted} triệu ${unitText}`;
  }
  if (num >= 1_000) {
    const k = num / 1_000;
    const formatted = parseFloat(k.toFixed(2)).toLocaleString('vi-VN');
    return `${formatted} nghìn ${unitText}`;
  }
  return `${num.toLocaleString('vi-VN')} ${unitText}`;
}

export interface CurrencyInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: string;
  suffix?: string;
  wordsSuffix?: string;
  showWordsBadge?: boolean;
  id?: string;
  name?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  icon,
  suffix = '₫',
  wordsSuffix = 'VNĐ',
  showWordsBadge = true,
  id,
  name,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = formatNumberWithDots(value);
  const wordsValue = showWordsBadge ? formatVNDToWords(displayValue, wordsSuffix) : '';

  const calculateNewCursor = (formatted: string, digitsBefore: number) => {
    if (digitsBefore <= 0) return 0;
    let digitCount = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++;
      }
      if (digitCount === digitsBefore) {
        return i + 1;
      }
    }
    return formatted.length;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    const selectionStart = input.selectionStart ?? rawValue.length;

    // Count how many numeric digits were before the cursor
    const digitsBeforeCursor = rawValue.slice(0, selectionStart).replace(/\D/g, '').length;

    // Clean and format
    const formatted = formatNumberWithDots(rawValue);

    onChange(formatted);

    // Restore cursor position accurately
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      const newCursor = calculateNewCursor(formatted, digitsBeforeCursor);
      inputRef.current.setSelectionRange(newCursor, newCursor);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const { selectionStart, selectionEnd, value: currentVal } = input;

    // Allow standard navigation and shortcuts
    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      [
        'Backspace',
        'Delete',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Tab',
        'Enter',
        'Home',
        'End',
        'Escape',
      ].includes(e.key)
    ) {
      if (selectionStart === selectionEnd && selectionStart !== null) {
        // Smart Backspace: when cursor is right after a dot, delete the digit preceding the dot
        if (e.key === 'Backspace' && selectionStart > 1 && currentVal[selectionStart - 1] === '.') {
          e.preventDefault();
          const nextVal = currentVal.slice(0, selectionStart - 2) + currentVal.slice(selectionStart);
          const digitsBefore = Math.max(
            0,
            currentVal.slice(0, selectionStart).replace(/\D/g, '').length - 1
          );
          const formatted = formatNumberWithDots(nextVal);
          onChange(formatted);

          requestAnimationFrame(() => {
            if (!inputRef.current) return;
            const newCursor = calculateNewCursor(formatted, digitsBefore);
            inputRef.current.setSelectionRange(newCursor, newCursor);
          });
          return;
        }

        // Smart Delete: when cursor is right before a dot, delete the digit following the dot
        if (e.key === 'Delete' && selectionStart < currentVal.length && currentVal[selectionStart] === '.') {
          e.preventDefault();
          const nextVal = currentVal.slice(0, selectionStart) + currentVal.slice(selectionStart + 2);
          const digitsBefore = currentVal.slice(0, selectionStart).replace(/\D/g, '').length;
          const formatted = formatNumberWithDots(nextVal);
          onChange(formatted);

          requestAnimationFrame(() => {
            if (!inputRef.current) return;
            const newCursor = calculateNewCursor(formatted, digitsBefore);
            inputRef.current.setSelectionRange(newCursor, newCursor);
          });
          return;
        }
      }
      return;
    }

    // Only allow numeric digits 0-9
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="font-label-sm text-label-sm text-ink-secondary font-medium pl-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center bg-surface-parchment rounded-lg shadow-sm border border-transparent focus-within:border-ink-primary/20 transition-all">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 text-ink-secondary text-[20px] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full h-11 bg-transparent font-body-md text-body-md text-ink-primary placeholder:text-ink-quaternary focus:outline-none focus:bg-surface-card rounded-lg transition-colors ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${suffix ? 'pr-9' : 'pr-3.5'}`}
        />
        {suffix && (
          <span className="absolute right-3 text-ink-secondary/70 font-medium text-sm pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>

      {wordsValue && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 mt-0.5 rounded-lg bg-accent-warm/10 text-accent-warm font-label-sm text-[12px] font-medium border border-accent-warm/15 transition-all">
          <span className="material-symbols-outlined text-[15px]">payments</span>
          <span>≈ {wordsValue}</span>
        </div>
      )}
    </div>
  );
};
