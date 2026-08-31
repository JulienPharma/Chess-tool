import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { ThemeProvider } from '@/state/theme'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { AuthGate } from '@/features/auth/AuthGate'
import { DebugPage } from '@/pages/DebugPage'

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthGate>
            <Routes>
              <Route path="/debug" element={<DebugPage />} />
              <Route path="*" element={<Navigate to="/debug" replace />} />
            </Routes>
          </AuthGate>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
