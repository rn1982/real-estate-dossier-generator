import { Analytics } from '@vercel/analytics/react';
import { DossierForm } from '@/components/features/DossierForm';

function App() {
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <DossierForm />
      </div>
      <Analytics />
    </>
  )
}

export default App
