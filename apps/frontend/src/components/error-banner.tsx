import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { ApiErrorResponse } from '@socialpilot/shared-types';

interface ErrorBannerProps {
  error: ApiErrorResponse | null;
  onDismiss?: () => void;
}

export default function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [error]);

  if (!error || !isVisible) return null;

  // Format message as string or list if it is an array
  const renderMessage = () => {
    if (Array.isArray(error.message)) {
      return (
        <ul className="list-disc pl-5 mt-1 space-y-0.5 text-xs text-rose-200">
          {error.message.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      );
    }
    if (typeof error.message === 'object') {
      return <span className="text-xs">{JSON.stringify(error.message)}</span>;
    }
    return <span className="text-sm font-medium">{error.message}</span>;
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className="my-4 relative flex items-start gap-3 p-4 bg-red-950/80 border border-red-500/30 text-rose-100 rounded-card shadow-soft backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-bold text-red-300">
          Request Failed (Status {error.statusCode})
        </h4>
        <div className="mt-1 text-sm text-rose-200/90">{renderMessage()}</div>
        {error.path && (
          <p className="mt-1.5 text-[10px] font-mono text-rose-300/50">
            Path: {error.path}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-rose-300/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 cursor-pointer"
        aria-label="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
export type { ErrorBannerProps };
