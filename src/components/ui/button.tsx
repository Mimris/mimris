import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', children, style, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    const styles = variant === 'outline'
      ? 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
      : 'bg-gray-900 text-white hover:bg-gray-800';
    const softStyle: React.CSSProperties = {
      borderRadius: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      paddingLeft: 14,
      paddingRight: 14,
      paddingTop: 8,
      paddingBottom: 8,
      ...style
    };
    return (
      <button ref={ref} className={`${base} ${styles} ${className}`} style={softStyle} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
