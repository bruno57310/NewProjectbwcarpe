import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,       // Enable new transition behavior
        v7_relativeSplatPath: true      // Enable new splat path resolution
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
