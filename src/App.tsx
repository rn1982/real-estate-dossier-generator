import { Analytics } from '@vercel/analytics/react';
import { DossierForm } from '@/components/features/DossierForm';
import { ToastContextProvider } from '@/contexts/ToastContext';

function App() {
  return (
    <ToastContextProvider>
      <div className="min-h-screen bg-gray-50">
        <DossierForm />
      </div>
      <Analytics />
    </ToastContextProvider>
  )
}

export default App
