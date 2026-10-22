import commonEn from './common/en.json'
import commonAr from './common/ar.json'
import languageEn from './language/en.json'
import languageAr from './language/ar.json'
import shellEn from './shell/en.json'
import shellAr from './shell/ar.json'
import connectivityEn from './connectivity/en.json'
import connectivityAr from './connectivity/ar.json'
import authEn from './auth/en.json'
import authAr from './auth/ar.json'
import dashboardEn from './dashboard/en.json'
import dashboardAr from './dashboard/ar.json'
import patientsEn from './patients/en.json'
import patientsAr from './patients/ar.json'
import queueEn from './queue/en.json'
import queueAr from './queue/ar.json'
import followUpsEn from './followUps/en.json'
import followUpsAr from './followUps/ar.json'
import visitsEn from './visits/en.json'
import visitsAr from './visits/ar.json'
import platformEn from './platform/en.json'
import platformAr from './platform/ar.json'
import auditEn from './audit/en.json'
import auditAr from './audit/ar.json'
import pendingDocumentationEn from './pendingDocumentation/en.json'
import pendingDocumentationAr from './pendingDocumentation/ar.json'
import attachmentsEn from './attachments/en.json'
import attachmentsAr from './attachments/ar.json'
import clinicalOrderAttachmentsEn from './clinicalOrderAttachments/en.json'
import clinicalOrderAttachmentsAr from './clinicalOrderAttachments/ar.json'
import clinicalOrdersEn from './clinicalOrders/en.json'
import clinicalOrdersAr from './clinicalOrders/ar.json'
import documentationPoliciesEn from './documentationPolicies/en.json'
import documentationPoliciesAr from './documentationPolicies/ar.json'
import workflowEn from './workflow/en.json'
import workflowAr from './workflow/ar.json'
import settingsEn from './settings/en.json'
import settingsAr from './settings/ar.json'
import employeesEn from './employees/en.json'
import employeesAr from './employees/ar.json'
import clinicalSessionsEn from './clinicalSessions/en.json'
import clinicalSessionsAr from './clinicalSessions/ar.json'
import patientMedicalHistoryEn from './patientMedicalHistory/en.json'
import patientMedicalHistoryAr from './patientMedicalHistory/ar.json'
import clinicalMeasurementsEn from './clinicalMeasurements/en.json'
import clinicalMeasurementsAr from './clinicalMeasurements/ar.json'
import reportingEn from './reporting/en.json'
import reportingAr from './reporting/ar.json'
import clinicalOrderConfigEn from './clinicalOrderConfig/en.json'
import clinicalOrderConfigAr from './clinicalOrderConfig/ar.json'
import patientProfileEn from './patientProfile/en.json'
import patientProfileAr from './patientProfile/ar.json'
import clinicalFieldAdminEn from './clinicalFieldAdmin/en.json'
import clinicalFieldAdminAr from './clinicalFieldAdmin/ar.json'
import patientProfileAdminEn from './patientProfileAdmin/en.json'
import patientProfileAdminAr from './patientProfileAdmin/ar.json'

export const resources = {
  en: {
    common: commonEn,
    language: languageEn,
    shell: shellEn,
    connectivity: connectivityEn,
    auth: authEn,
    dashboard: dashboardEn,
    patients: patientsEn,
    queue: queueEn,
    followUps: followUpsEn,
    visits: visitsEn,
    platform: platformEn,
    audit: auditEn,
    pendingDocumentation: pendingDocumentationEn,
    attachments: attachmentsEn,
    clinicalOrderAttachments: clinicalOrderAttachmentsEn,
    clinicalOrders: clinicalOrdersEn,
    documentationPolicies: documentationPoliciesEn,
    workflow: workflowEn,
    settings: settingsEn,
    employees: employeesEn,
    clinicalSessions: clinicalSessionsEn,
    patientMedicalHistory: patientMedicalHistoryEn,
    clinicalMeasurements: clinicalMeasurementsEn,
    reporting: reportingEn,
    clinicalOrderConfig: clinicalOrderConfigEn,
    patientProfile: patientProfileEn,
    clinicalFieldAdmin: clinicalFieldAdminEn,
    patientProfileAdmin: patientProfileAdminEn,
  },
  ar: {
    common: commonAr,
    language: languageAr,
    shell: shellAr,
    connectivity: connectivityAr,
    auth: authAr,
    dashboard: dashboardAr,
    patients: patientsAr,
    queue: queueAr,
    followUps: followUpsAr,
    visits: visitsAr,
    platform: platformAr,
    audit: auditAr,
    pendingDocumentation: pendingDocumentationAr,
    attachments: attachmentsAr,
    clinicalOrderAttachments: clinicalOrderAttachmentsAr,
    clinicalOrders: clinicalOrdersAr,
    documentationPolicies: documentationPoliciesAr,
    workflow: workflowAr,
    settings: settingsAr,
    employees: employeesAr,
    clinicalSessions: clinicalSessionsAr,
    patientMedicalHistory: patientMedicalHistoryAr,
    clinicalMeasurements: clinicalMeasurementsAr,
    reporting: reportingAr,
    clinicalOrderConfig: clinicalOrderConfigAr,
    patientProfile: patientProfileAr,
    clinicalFieldAdmin: clinicalFieldAdminAr,
    patientProfileAdmin: patientProfileAdminAr,
  },
} as const

export const namespaces = [
  'common',
  'language',
  'shell',
  'connectivity',
  'auth',
  'dashboard',
  'patients',
  'queue',
  'followUps',
  'visits',
  'platform',
  'audit',
  'pendingDocumentation',
  'attachments',
  'clinicalOrderAttachments',
  'clinicalOrders',
  'documentationPolicies',
  'workflow',
  'settings',
  'employees',
  'clinicalSessions',
  'patientMedicalHistory',
  'clinicalMeasurements',
  'reporting',
  'clinicalOrderConfig',
  'patientProfile',
  'clinicalFieldAdmin',
  'patientProfileAdmin',
] as const
