import { Analytics } from '@vercel/analytics/react';
import { DossierForm } from '@/components/features/DossierForm';
import { ToastContextProvider } from '@/contexts/ToastContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TestErrorButton } from '@/components/TestErrorButton';

function App() {
  return (
    <ErrorBoundary>
      <ToastContextProvider>
        <div className="min-h-screen bg-gray-50">
          <DossierForm />
        </div>
        <TestErrorButton />
        <Analytics />
      </ToastContextProvider>
    </ErrorBoundary>
  )
}

export default App
