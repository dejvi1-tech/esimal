import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initPerformanceMonitoring } from './utils/performance';

// Initialize performance monitoring in development
if (import.meta.env.DEV) {
  initPerformanceMonitoring();
}

createRoot(document.getElementById("root")!).render(<App data-id="apodnwg0m" data-path="src/main.tsx" />);