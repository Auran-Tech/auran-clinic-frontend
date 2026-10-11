import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../features/auth/LoginPage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { PatientDetailsPage } from '../features/patients/PatientDetailsPage'
import { PatientsPage } from '../features/patients/PatientsPage'
import { QueuePage } from '../features/queue/QueuePage'
import { PendingDocumentationPage } from '../features/pendingDocumentation/PendingDocumentationPage'
import { FollowUpsPage } from '../features/followUps/FollowUpsPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <PatientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:patientId"
        element={
          <ProtectedRoute>
            <PatientDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/queue"
        element={
          <ProtectedRoute>
            <QueuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pending-documentation"
        element={
          <ProtectedRoute>
            <PendingDocumentationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/follow-ups"
        element={
          <ProtectedRoute>
            <FollowUpsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/patients" replace />} />
    </Routes>
  )
}
