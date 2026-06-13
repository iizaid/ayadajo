-- Ayadajo Milestone 3 RLS hardening patch.
-- Keep tenant reads through active membership, but narrow writes before M4 app authorization exists.

create or replace function public.has_clinic_permission(
  target_clinic_id uuid,
  required_permission text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_members cm
    join public.users u on u.id = cm.user_id
    join public.roles r on r.code = cm.role
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where cm.clinic_id = target_clinic_id
      and cm.status = 'active'
      and u.deleted_at is null
      and u.auth_user_id = (select auth.uid())
      and p.code = required_permission
  )
$$;

revoke all on function public.has_clinic_permission(uuid, text) from public;
grant execute on function public.has_clinic_permission(uuid, text) to authenticated;

drop policy if exists clinics_member_update on public.clinics;

drop policy if exists clinic_settings_tenant_insert on public.clinic_settings;
drop policy if exists clinic_settings_tenant_update on public.clinic_settings;
drop policy if exists clinic_members_tenant_insert on public.clinic_members;
drop policy if exists clinic_members_tenant_update on public.clinic_members;
drop policy if exists member_invites_tenant_insert on public.member_invites;
drop policy if exists member_invites_tenant_update on public.member_invites;
drop policy if exists working_hours_tenant_insert on public.working_hours;
drop policy if exists working_hours_tenant_update on public.working_hours;
drop policy if exists services_tenant_insert on public.services;
drop policy if exists services_tenant_update on public.services;
drop policy if exists doctors_availability_tenant_insert on public.doctors_availability;
drop policy if exists doctors_availability_tenant_update on public.doctors_availability;
drop policy if exists patients_tenant_insert on public.patients;
drop policy if exists patients_tenant_update on public.patients;
drop policy if exists appointments_tenant_insert on public.appointments;
drop policy if exists appointments_tenant_update on public.appointments;
drop policy if exists appointment_status_history_tenant_insert on public.appointment_status_history;
drop policy if exists treatment_notes_tenant_insert on public.treatment_notes;
drop policy if exists treatment_notes_tenant_update on public.treatment_notes;
drop policy if exists treatment_plans_tenant_insert on public.treatment_plans;
drop policy if exists treatment_plans_tenant_update on public.treatment_plans;
drop policy if exists treatment_plan_items_tenant_insert on public.treatment_plan_items;
drop policy if exists treatment_plan_items_tenant_update on public.treatment_plan_items;
drop policy if exists invoices_tenant_insert on public.invoices;
drop policy if exists invoices_tenant_update on public.invoices;
drop policy if exists invoice_items_tenant_insert on public.invoice_items;
drop policy if exists invoice_items_tenant_update on public.invoice_items;
drop policy if exists payments_tenant_insert on public.payments;
drop policy if exists payments_tenant_update on public.payments;
drop policy if exists reminders_tenant_insert on public.reminders;
drop policy if exists reminders_tenant_update on public.reminders;
drop policy if exists reminder_events_tenant_insert on public.reminder_events;
drop policy if exists reminder_events_tenant_update on public.reminder_events;
drop policy if exists messages_tenant_insert on public.messages;
drop policy if exists messages_tenant_update on public.messages;
drop policy if exists public_booking_requests_tenant_insert on public.public_booking_requests;
drop policy if exists public_booking_requests_tenant_update on public.public_booking_requests;
drop policy if exists files_tenant_insert on public.files;
drop policy if exists files_tenant_update on public.files;
drop policy if exists notifications_tenant_insert on public.notifications;
drop policy if exists notifications_tenant_update on public.notifications;
drop policy if exists message_templates_tenant_insert on public.message_templates;
drop policy if exists message_templates_tenant_update on public.message_templates;
drop policy if exists audit_logs_tenant_insert on public.audit_logs;

create policy clinics_permission_update
on public.clinics
for update
to authenticated
using (public.has_clinic_permission(id, 'settings.manage'))
with check (public.has_clinic_permission(id, 'settings.manage'));

create policy clinic_settings_permission_insert
on public.clinic_settings
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'settings.manage'));

create policy clinic_settings_permission_update
on public.clinic_settings
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'settings.manage'))
with check (public.has_clinic_permission(clinic_id, 'settings.manage'));

create policy working_hours_permission_insert
on public.working_hours
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'settings.manage'));

create policy working_hours_permission_update
on public.working_hours
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'settings.manage'))
with check (public.has_clinic_permission(clinic_id, 'settings.manage'));

create policy services_permission_insert
on public.services
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'settings.manage'));

create policy services_permission_update
on public.services
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'settings.manage'))
with check (public.has_clinic_permission(clinic_id, 'settings.manage'));

create policy doctors_availability_permission_insert
on public.doctors_availability
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'settings.manage'));

create policy doctors_availability_permission_update
on public.doctors_availability
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'settings.manage'))
with check (public.has_clinic_permission(clinic_id, 'settings.manage'));

create policy clinic_members_permission_insert
on public.clinic_members
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'staff.manage'));

create policy clinic_members_permission_update
on public.clinic_members
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'staff.manage'))
with check (public.has_clinic_permission(clinic_id, 'staff.manage'));

create policy member_invites_permission_insert
on public.member_invites
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'staff.manage'));

create policy member_invites_permission_update
on public.member_invites
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'staff.manage'))
with check (public.has_clinic_permission(clinic_id, 'staff.manage'));

create policy patients_permission_insert
on public.patients
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'patient.create'));

create policy patients_permission_update
on public.patients
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'patient.update'))
with check (public.has_clinic_permission(clinic_id, 'patient.update'));

create policy appointments_permission_insert
on public.appointments
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'appointment.manage'));

create policy appointments_permission_update
on public.appointments
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'appointment.manage'))
with check (public.has_clinic_permission(clinic_id, 'appointment.manage'));

create policy appointment_status_history_permission_insert
on public.appointment_status_history
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'appointment.manage'));

create policy treatment_notes_permission_insert
on public.treatment_notes
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'treatment_note.write'));

create policy treatment_notes_permission_update
on public.treatment_notes
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'treatment_note.write'))
with check (public.has_clinic_permission(clinic_id, 'treatment_note.write'));

create policy treatment_plans_permission_insert
on public.treatment_plans
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'treatment_plan.write'));

create policy treatment_plans_permission_update
on public.treatment_plans
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'treatment_plan.write'))
with check (public.has_clinic_permission(clinic_id, 'treatment_plan.write'));

create policy treatment_plan_items_permission_insert
on public.treatment_plan_items
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'treatment_plan.write'));

create policy treatment_plan_items_permission_update
on public.treatment_plan_items
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'treatment_plan.write'))
with check (public.has_clinic_permission(clinic_id, 'treatment_plan.write'));

create policy invoices_permission_insert
on public.invoices
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'invoice.create'));

create policy invoices_permission_update
on public.invoices
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'invoice.create'))
with check (public.has_clinic_permission(clinic_id, 'invoice.create'));

create policy invoice_items_permission_insert
on public.invoice_items
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'invoice.create'));

create policy invoice_items_permission_update
on public.invoice_items
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'invoice.create'))
with check (public.has_clinic_permission(clinic_id, 'invoice.create'));

create policy payments_permission_insert
on public.payments
for insert
to authenticated
with check (
  public.has_clinic_permission(clinic_id, 'payment.record')
  or public.has_clinic_permission(clinic_id, 'payment.reverse')
);

create policy message_templates_permission_insert
on public.message_templates
for insert
to authenticated
with check (
  clinic_id is not null
  and public.has_clinic_permission(clinic_id, 'message_template.manage')
);

create policy message_templates_permission_update
on public.message_templates
for update
to authenticated
using (
  clinic_id is not null
  and public.has_clinic_permission(clinic_id, 'message_template.manage')
)
with check (
  clinic_id is not null
  and public.has_clinic_permission(clinic_id, 'message_template.manage')
);

create policy reminders_permission_insert
on public.reminders
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'reminder.send'));

create policy reminders_permission_update
on public.reminders
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'reminder.send'))
with check (public.has_clinic_permission(clinic_id, 'reminder.send'));

create policy reminder_events_permission_insert
on public.reminder_events
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'reminder.send'));

create policy reminder_events_permission_update
on public.reminder_events
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'reminder.send'))
with check (public.has_clinic_permission(clinic_id, 'reminder.send'));

create policy messages_permission_insert
on public.messages
for insert
to authenticated
with check (public.has_clinic_permission(clinic_id, 'reminder.send'));

create policy messages_permission_update
on public.messages
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'reminder.send'))
with check (public.has_clinic_permission(clinic_id, 'reminder.send'));

create policy public_booking_requests_permission_update
on public.public_booking_requests
for update
to authenticated
using (public.has_clinic_permission(clinic_id, 'booking_request.approve'))
with check (public.has_clinic_permission(clinic_id, 'booking_request.approve'));

-- Intentionally no normal-user write policies for:
-- files, notifications, audit_logs, subscriptions, subscription_payments, support_access_grants.
-- Public anonymous booking insert remains deferred to M10.
