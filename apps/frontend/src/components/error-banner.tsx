import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ApiErrorResponse } from '@socialpilot/shared-types';
import { getMappedError } from '../utils/errorMessages';

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

  const mapped = getMappedError(error.errorCode);
  const Icon = mapped.icon;

  let themeClasses = 'bg-red-950/80 border-red-500/30 text-rose-100';
  let iconClasses = 'text-red-400';
  let titleClasses = 'text-red-300';
  let titleText = error.statusCode ? `Request Failed (Status ${error.statusCode})` : 'Connection Error';

  if (mapped.tone === 'warning') {
    themeClasses = 'bg-amber-950/80 border-amber-500/30 text-amber-100';
    iconClasses = 'text-amber-400';
    titleClasses = 'text-amber-300';
    titleText = 'Warning';
  } else if (mapped.tone === 'info') {
    themeClasses = 'bg-blue-950/80 border-blue-500/30 text-blue-100';
    iconClasses = 'text-blue-400';
    titleClasses = 'text-blue-300';
    titleText = 'Information';
  }

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className={`my-4 relative flex items-start gap-3 p-4 border rounded-card shadow-soft backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 ${themeClasses}`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClasses}`} />
      <div className="flex-1">
        <h4 className={`text-sm font-bold ${titleClasses}`}>{titleText}</h4>
        <div className="mt-1 text-sm">{mapped.message}</div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="opacity-70 hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/10 cursor-pointer"
        aria-label="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
export type { ErrorBannerProps };