import { Navigate, Route, Routes } from 'react-router-dom'
import { PatientDetailsPage } from '../features/patients/PatientDetailsPage'
import { PatientsPage } from '../features/patients/PatientsPage'

export function App() {
  return (
    <Routes>
      <Route path="/patients" element={<PatientsPage />} />
      <Route path="/patients/:patientId" element={<PatientDetailsPage />} />
      <Route path="*" element={<Navigate to="/patients" replace />} />
    </Routes>
  )
}
