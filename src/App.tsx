import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Workbench } from './components/Workbench';

export const App: React.FC = () => {
  return (
    <>
      <Workbench />
      <Analytics />
    </>
  );
};
