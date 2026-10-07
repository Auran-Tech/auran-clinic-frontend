import { Route, Routes } from 'react-router-dom'
import { NotFoundPage } from './NotFoundPage'
import { LoginPage } from '../features/auth/LoginPage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { PatientDetailsPage } from '../features/patients/PatientDetailsPage'
import { PatientsPage } from '../features/patients/PatientsPage'
import { QueuePage } from '../features/queue/QueuePage'
import { PendingDocumentationPage } from '../features/pendingDocumentation/PendingDocumentationPage'
import { FollowUpsPage } from '../features/followUps/FollowUpsPage'
import { EmployeesPage } from '../features/employees/EmployeesPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { ReportingPage } from '../features/reporting/ReportingPage'
import { AuditPage } from '../features/audit/AuditPage'
import { SystemGuidePage } from '../features/guide/SystemGuidePage'

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
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AuditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guide"
        element={
          <ProtectedRoute>
            <SystemGuidePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <NotFoundPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
