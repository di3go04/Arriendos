import { motion } from 'framer-motion';
import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="py-16 text-center bg-muted/30 border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-3xl max-w-xl mx-auto space-y-6"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
        className="mx-auto w-32 h-32 flex items-center justify-center text-primary/80"
      >
        {icon}
      </motion.div>
      <div className="space-y-2">
        <h3 className="font-extrabold text-lg text-foreground">{title}</h3>
        <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>
      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-2"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
