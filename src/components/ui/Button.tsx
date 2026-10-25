import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'social';
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  icon,
  iconPosition = 'right',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'h-11 rounded-lg font-label-md text-label-md font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.99]';
  const widthStyle = fullWidth ? 'w-full' : '';
  
  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-ink-primary text-surface hover:opacity-95 shadow-sm';
      break;
    case 'secondary':
      variantStyles = 'bg-surface-container text-ink-primary hover:bg-surface-variant';
      break;
    case 'outline':
      variantStyles = 'bg-transparent border border-outline-variant text-ink-primary hover:bg-surface-parchment';
      break;
    case 'ghost':
      variantStyles = 'bg-transparent text-ink-secondary hover:text-ink-primary';
      break;
    case 'social':
      variantStyles = 'bg-surface-parchment hover:bg-surface-card text-ink-primary shadow-sm';
      break;
  }
  
  const boxShadow = variant === 'primary' 
    ? { boxShadow: 'inset 0 0.5px 0 0 rgba(255, 255, 255, 0.2), inset 0 0 0 0.5px rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.05)' } 
    : {};

  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${widthStyle} ${className}`}
      style={boxShadow}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
    </button>
  );
};
