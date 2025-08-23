import { Routes, Route,  Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';

function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster 
        position="top-right" 
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            zIndex: 9999,
            marginBottom: '8px',
          },
        }}
      />
    </>
  );
}

export default App;