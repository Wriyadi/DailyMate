/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider } from './hooks/useAuth';
import MobileLayout from './components/Layout';

export default function App() {
  return (
    <AuthProvider>
      <MobileLayout />
    </AuthProvider>
  );
}
