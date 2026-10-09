# Auran Clinic MVP 1 — UAT Checklist

This checklist validates the production vertical slice from authentication through clinic operations, clinical work, follow-up, administration, reporting, and audit.

## 1. Authentication & tenant boundary

- [ ] Valid clinic user can sign in.
- [ ] Invalid credentials return a safe error.
- [ ] Expired access token refreshes once and retries the request.
- [ ] Failed refresh clears the session and returns the user to login.
- [ ] Deactivated user can no longer use an existing session.
- [ ] User cannot access data from another clinic by changing IDs in URLs or requests.

## 2. Patients

- [ ] Patient list loads only current-clinic patients.
- [ ] Search works by patient number, name, and phone.
- [ ] New patient can be created.
- [ ] Duplicate phone/name + DOB warnings or conflicts behave as expected.
- [ ] Patient profile loads and basic data can be edited with permission.
- [ ] User without patient edit permission cannot mutate patient data.

## 3. Dynamic patient profile

- [ ] Enabled patient-profile sections render in configured order.
- [ ] Text, long text, number, boolean, date, single-select, and multi-select fields save correctly.
- [ ] Required profile fields block incomplete saves.
- [ ] Read-only users can inspect values but cannot edit them.
- [ ] File/Image profile fields remain attachment-managed.
- [ ] Admin can create/edit/enable/disable patient profile sections and fields.
- [ ] Field type becomes locked after patient values exist.
- [ ] Select option values/delete become locked after patient values exist.

## 4. Check-in, visit & queue

- [ ] Patient can be checked in with an assigned doctor.
- [ ] Visit and queue entry are created together.
- [ ] Live queue shows the new patient.
- [ ] Queue stage transitions follow clinic workflow configuration only.
- [ ] Transition history is recorded.
- [ ] Final workflow stage closes the queue entry and completes the visit.

## 5. Clinical session

- [ ] Assigned doctor can start a clinical session.
- [ ] Non-assigned normal user is forbidden.
- [ ] Only one active session exists per visit.
- [ ] Chief complaint, examination, diagnosis, treatment plan, and notes can be saved.
- [ ] Ending a populated session completes documentation.
- [ ] Ending an empty session leaves documentation pending.

## 6. Clinical measurements

- [ ] Enabled configured clinical fields appear in the doctor workspace.
- [ ] Number, boolean, text, date, single-select, and multi-select measurements record correctly.
- [ ] Numeric zero and boolean false persist as real values.
- [ ] Measurement history is append-only and displays newest-first.
- [ ] Closed visits reject new measurements.
- [ ] Non-assigned normal users cannot record measurements.
- [ ] Admin can create/edit/enable/disable clinical fields.
- [ ] Field type and select option values are protected after measurement history exists.

## 7. Clinical orders / prescription

- [ ] Enabled clinic order sections load dynamically.
- [ ] Text sections accept free-form content.
- [ ] Structured sections persist one item per line.
- [ ] Disabled or unknown section definitions are rejected.
- [ ] Existing order reloads into the editor.

## 8. Clinical order files & images

- [ ] Image/File order sections load from clinic configuration.
- [ ] Existing patient uploads can be linked to an order section.
- [ ] Image sections reject non-image files.
- [ ] Duplicate links are rejected.
- [ ] Unlink removes only the order link and preserves the patient attachment.
- [ ] Closed visits reject link/unlink.
- [ ] Admin can create/reorder/rename/enable/disable clinical order sections.
- [ ] Section type becomes locked after order data exists.

## 9. Attachments

- [ ] JPEG, PNG, WebP, and PDF files up to 10 MB upload successfully.
- [ ] Unsupported type or oversized file is rejected.
- [ ] Attachments list on the patient profile.
- [ ] Authenticated download returns the original file.
- [ ] Delete removes the patient link and unshared stored file.
- [ ] Cross-clinic file IDs cannot be downloaded.

## 10. Pending documentation

- [ ] Doctor sees their Draft/Pending notes.
- [ ] Clinic Super User can inspect all doctors' pending documentation.
- [ ] Existing clinical fields are pre-populated.
- [ ] Completion requires at least one documentation field.
- [ ] Completed note disappears from the pending worklist.

## 11. Follow-ups

- [ ] Doctor can create a follow-up using an explicit date.
- [ ] Doctor can create a follow-up using a relative number of days.
- [ ] Today / Upcoming / Overdue / Completed buckets are correct.
- [ ] Open follow-up can be completed.
- [ ] Open follow-up can be cancelled.
- [ ] Closed follow-up cannot be changed again.

## 12. Employees & RBAC

- [ ] Employee list is visible only with the proper permission.
- [ ] Authorized manager can create an employee.
- [ ] Normal employee receives at least one protected role.
- [ ] Role assignment updates effective permissions after re-authentication/session refresh.
- [ ] Employee can be activated/deactivated.
- [ ] Protected Super User safeguards are enforced.
- [ ] Protected role matrix is read-only.

## 13. Clinic settings & workflow

- [ ] Clinic branding/contact/localization values load and save.
- [ ] Timezone and locale lookups populate correctly.
- [ ] Patient number prefix saves in normalized form.
- [ ] Documentation reminder hours validation is enforced.
- [ ] Workflow stages can be created and edited.
- [ ] Final stage cannot be removed directly.
- [ ] In-use/final stages cannot be deleted.
- [ ] Transition matrix controls allowed queue moves.

## 14. Dashboard, reports & audit

- [ ] Dashboard KPIs reflect current-clinic data.
- [ ] "Today" follows the clinic timezone.
- [ ] Visit report filters compose correctly.
- [ ] CSV export downloads when Reports_Export is allowed.
- [ ] Audit page filters by action, entity, actor, and time range.
- [ ] Audit metadata is displayed as text, not executed.
- [ ] Cross-clinic audit events remain invisible.

## 15. Localization, accessibility & recovery

- [ ] English renders LTR.
- [ ] Arabic renders RTL.
- [ ] Language selection persists after reload.
- [ ] IDs, dates, numeric values, and technical fields remain readable in RTL.
- [ ] Keyboard focus is visibly identifiable.
- [ ] Reduced-motion preference is respected.
- [ ] Unknown authenticated route renders the 404 recovery page.
- [ ] Global render failure shows the reload fallback rather than a blank screen.

## 16. Release gate

- [ ] Frontend CI is green.
- [ ] Backend CI is green.
- [ ] Database migrations apply successfully on a clean SQL Server.
- [ ] EF model matches committed migrations.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] API publishes successfully.
- [ ] /health/live returns 200.
- [ ] /health/ready returns 200 with the target database available.
- [ ] Staging completes this checklist before production promotion.
