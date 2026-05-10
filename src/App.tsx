/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider } from './hooks/useAuth';
import { LanguageProvider } from './contexts/LanguageContext';
import MobileLayout from './components/Layout';

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MobileLayout />
      </LanguageProvider>
    </AuthProvider>
  );
}
