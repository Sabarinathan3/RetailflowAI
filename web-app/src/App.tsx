import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './routes';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          },
        }}
        richColors
        closeButton
      />
    </>
  );
}
