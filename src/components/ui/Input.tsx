import React, { InputHTMLAttributes, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  isPassword = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const type = isPassword && !showPassword ? 'password' : props.type || 'text';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="font-label-sm text-label-sm text-ink-secondary font-medium pl-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center bg-surface-parchment rounded-lg shadow-sm">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 text-ink-secondary text-[20px]">
            {icon}
          </span>
        )}
        <input
          {...props}
          type={type}
          className={`w-full h-11 bg-transparent font-body-md text-body-md text-ink-primary placeholder:text-ink-quaternary focus:outline-none focus:bg-surface-card rounded-lg transition-colors ${icon ? 'pl-10' : 'pl-3.5'} ${isPassword ? 'pr-10' : 'pr-3.5'}`}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-2.5 p-1 text-ink-secondary hover:text-ink-primary transition-colors flex items-center justify-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
