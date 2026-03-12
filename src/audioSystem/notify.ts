import { toast, type Id, type ToastOptions } from 'react-toastify';
import { playSfx } from './sound-engine';

const withSound = (
  eventId: 'toast.success' | 'toast.info' | 'toast.warning' | 'toast.error',
  fn: (content: string, options?: ToastOptions) => Id
) => {
  return (content: string, options?: ToastOptions) => {
    playSfx(eventId);
    return fn(content, options);
  };
};

export const notify = {
  success: withSound('toast.success', (content, options) => toast.success(content, options)),
  info: withSound('toast.info', (content, options) => toast.info(content, options)),
  warning: withSound('toast.warning', (content, options) => toast.warning(content, options)),
  error: withSound('toast.error', (content, options) => toast.error(content, options))
};
