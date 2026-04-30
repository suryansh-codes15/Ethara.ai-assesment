import { Toaster, toast as hotToast } from 'react-hot-toast';

export const toast = {
  success: (msg) => hotToast.success(msg, {
    style: {
      background: 'var(--surface-2)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      fontSize: '14px',
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
  }),
  error: (msg) => hotToast.error(msg, {
    style: {
      background: 'var(--surface-2)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      fontSize: '14px',
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  }),
  info: (msg) => hotToast(msg, {
    icon: 'ℹ️',
    style: {
      background: 'var(--surface-2)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      fontSize: '14px',
    },
  }),
};

export default function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
        }}
      />
    </>
  );
}
