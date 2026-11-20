import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import {AdminAuthProvider} from './context/AdminAuthContext.tsx';
import {LanguageProvider} from './context/LanguageContext.tsx';
import './index.css';

registerSW({immediate: true});

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <AdminAuthProvider>
      <App />
    </AdminAuthProvider>
  </LanguageProvider>,
);
