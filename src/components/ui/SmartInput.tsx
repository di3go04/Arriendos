import { AnimatePresence,motion } from 'framer-motion';
import { AlertCircle,CheckCircle2 } from 'lucide-react';
import React,{ useEffect,useState } from 'react';

interface SmartInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (val: string) => void;
  formatType?: 'currency' | 'id';
  label: string;
  required?: boolean;
}

export function SmartInput({ value, onChange, formatType = 'currency', label, required, className = '', ...props }: SmartInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (value === undefined || value === null) return;
    
    if (formatType === 'currency') {
      const num = Number(value.toString().replace(/\D/g, ''));
      if (num > 0) {
        setDisplayValue(`$ ${num.toLocaleString('es-CO')}`);
        setIsValid(true);
      } else {
        setDisplayValue('');
        setIsValid(false);
      }
    } else if (formatType === 'id') {
      setDisplayValue(value);
      setIsValid(value.length >= 6);
    } else {
      setDisplayValue(value);
      setIsValid(value.length > 0);
    }
  }, [value, formatType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    
    if (formatType === 'currency') {
      rawValue = rawValue.replace(/\D/g, '');
      onChange(rawValue);
    } else {
      onChange(rawValue);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label} {required && '*'}
      </label>
      <div className="relative flex items-center">
        <input
          {...props}
          value={displayValue}
          onChange={handleChange}
          required={required}
          className={`w-full bg-muted border-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 block p-3 pr-10 outline-none transition-all placeholder:text-ink-muted font-bold tabular-nums ${className} ${!isValid && value ? 'focus:ring-destructive/20 ring-1 ring-destructive/20' : ''}`}
        />
        <AnimatePresence>
          {isValid && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute right-3 text-success"
            >
              <CheckCircle2 className="w-4 h-4" />
            </motion.div>
          )}
          {!isValid && value && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-3 text-destructive"
            >
              <AlertCircle className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
