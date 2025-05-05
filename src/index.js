import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import awsConfig from './aws-config';

// Configure Amplify with your backend resources
Amplify.configure(awsConfig);

// Configure token signing for Cognito
cognitoUserPoolsTokenProvider.setKeyValueStorage({
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
});

// React 19 way
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you had reportWebVitals or other code here, it should be preserved
