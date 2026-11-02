import { createRoot } from 'react-dom/client';
import '@/i18n';
import '@/index.css';
import { SplashExperience } from '@/components/native/SplashExperience';

createRoot(document.getElementById('root')!).render(<SplashExperience onComplete={() => {}} />);
