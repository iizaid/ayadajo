-- Ayadajo Milestone 3 seed data.
-- Run only against local/staging databases. Do not store real secrets here.

insert into public.plans (code, name, price, interval, max_staff, max_messages_month, storage_mb, is_active)
values
  ('starter', 'Starter', 29.00, 'month', 5, 500, 1024, true),
  ('pro', 'Pro', 59.00, 'month', 15, 2000, 5120, true),
  ('plus', 'Plus', 99.00, 'month', null, 5000, 20480, true),
  ('pilot', 'Pilot', 0.00, 'custom', 10, 1000, 2048, true)
on conflict (code) do update set
  name = excluded.name,
  price = excluded.price,
  interval = excluded.interval,
  max_staff = excluded.max_staff,
  max_messages_month = excluded.max_messages_month,
  storage_mb = excluded.storage_mb,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.roles (code, name, is_system)
values
  ('owner', 'Clinic Owner', true),
  ('manager', 'Clinic Manager', true),
  ('doctor', 'Doctor', true),
  ('receptionist', 'Receptionist', true),
  ('accountant', 'Accountant', true),
  ('assistant', 'Assistant', true)
on conflict (code) do update set
  name = excluded.name,
  is_system = excluded.is_system,
  updated_at = now();

insert into public.permissions (code, description)
values
  ('dashboard.view', 'View operational dashboard'),
  ('dashboard.financial.view', 'View financial dashboard cards'),
  ('patient.create', 'Create patient records'),
  ('patient.update', 'Update patient records'),
  ('patient.archive', 'Archive patient records'),
  ('patient.medical_alerts.view', 'View patient medical alerts'),
  ('appointment.manage', 'Manage appointments'),
  ('appointment.manage_own', 'Manage own doctor appointments'),
  ('appointment.mark_arrived', 'Mark appointment arrived'),
  ('treatment_note.write', 'Write treatment notes'),
  ('treatment_note.view_full', 'View full treatment notes'),
  ('treatment_note.view_summary', 'View treatment note summaries'),
  ('treatment_plan.write', 'Write treatment plans'),
  ('payment.record', 'Record payments'),
  ('payment.reverse', 'Reverse payments'),
  ('invoice.create', 'Create and issue invoices'),
  ('invoice.void', 'Void invoices'),
  ('report.export', 'Export reports'),
  ('settings.manage', 'Manage clinic settings'),
  ('message_template.manage', 'Manage message templates'),
  ('reminder.send', 'Send reminders'),
  ('booking_request.approve', 'Approve booking requests'),
  ('staff.manage', 'Manage clinic staff'),
  ('staff.manage_limited', 'Manage non-owner staff'),
  ('audit_log.view', 'View audit logs')
on conflict (code) do update set
  description = excluded.description,
  updated_at = now();

drop table if exists public.role_permission_seed;

with role_permission_seed(role_code, permission_code) as (
values
  ('owner', 'dashboard.view'),
  ('owner', 'dashboard.financial.view'),
  ('owner', 'patient.create'),
  ('owner', 'patient.update'),
  ('owner', 'patient.archive'),
  ('owner', 'patient.medical_alerts.view'),
  ('owner', 'appointment.manage'),
  ('owner', 'treatment_note.write'),
  ('owner', 'treatment_note.view_full'),
  ('owner', 'treatment_plan.write'),
  ('owner', 'payment.record'),
  ('owner', 'payment.reverse'),
  ('owner', 'invoice.create'),
  ('owner', 'invoice.void'),
  ('owner', 'report.export'),
  ('owner', 'settings.manage'),
  ('owner', 'message_template.manage'),
  ('owner', 'reminder.send'),
  ('owner', 'booking_request.approve'),
  ('owner', 'staff.manage'),
  ('owner', 'audit_log.view'),
  ('manager', 'dashboard.view'),
  ('manager', 'dashboard.financial.view'),
  ('manager', 'patient.create'),
  ('manager', 'patient.update'),
  ('manager', 'patient.archive'),
  ('manager', 'patient.medical_alerts.view'),
  ('manager', 'appointment.manage'),
  ('manager', 'treatment_note.write'),
  ('manager', 'treatment_note.view_full'),
  ('manager', 'treatment_plan.write'),
  ('manager', 'payment.record'),
  ('manager', 'payment.reverse'),
  ('manager', 'invoice.create'),
  ('manager', 'invoice.void'),
  ('manager', 'report.export'),
  ('manager', 'settings.manage'),
  ('manager', 'message_template.manage'),
  ('manager', 'reminder.send'),
  ('manager', 'booking_request.approve'),
  ('manager', 'staff.manage_limited'),
  ('manager', 'audit_log.view'),
  ('doctor', 'dashboard.view'),
  ('doctor', 'patient.medical_alerts.view'),
  ('doctor', 'appointment.manage_own'),
  ('doctor', 'treatment_note.write'),
  ('doctor', 'treatment_note.view_full'),
  ('doctor', 'treatment_plan.write'),
  ('doctor', 'reminder.send'),
  ('receptionist', 'dashboard.view'),
  ('receptionist', 'patient.create'),
  ('receptionist', 'patient.update'),
  ('receptionist', 'patient.medical_alerts.view'),
  ('receptionist', 'appointment.manage'),
  ('receptionist', 'treatment_note.view_summary'),
  ('receptionist', 'payment.record'),
  ('receptionist', 'invoice.create'),
  ('receptionist', 'reminder.send'),
  ('receptionist', 'booking_request.approve'),
  ('accountant', 'dashboard.view'),
  ('accountant', 'dashboard.financial.view'),
  ('accountant', 'payment.record'),
  ('accountant', 'payment.reverse'),
  ('accountant', 'invoice.create'),
  ('accountant', 'invoice.void'),
  ('accountant', 'report.export'),
  ('assistant', 'dashboard.view'),
  ('assistant', 'appointment.mark_arrived')
)
delete from public.role_permissions rp
using public.roles r, public.permissions p
where rp.role_id = r.id
  and rp.permission_id = p.id
  and r.code in ('owner', 'manager', 'doctor', 'receptionist', 'accountant', 'assistant')
  and not exists (
    select 1
    from role_permission_seed seed
    where seed.role_code = r.code
      and seed.permission_code = p.code
  );

with role_permission_seed(role_code, permission_code) as (
values
  ('owner', 'dashboard.view'),
  ('owner', 'dashboard.financial.view'),
  ('owner', 'patient.create'),
  ('owner', 'patient.update'),
  ('owner', 'patient.archive'),
  ('owner', 'patient.medical_alerts.view'),
  ('owner', 'appointment.manage'),
  ('owner', 'treatment_note.write'),
  ('owner', 'treatment_note.view_full'),
  ('owner', 'treatment_plan.write'),
  ('owner', 'payment.record'),
  ('owner', 'payment.reverse'),
  ('owner', 'invoice.create'),
  ('owner', 'invoice.void'),
  ('owner', 'report.export'),
  ('owner', 'settings.manage'),
  ('owner', 'message_template.manage'),
  ('owner', 'reminder.send'),
  ('owner', 'booking_request.approve'),
  ('owner', 'staff.manage'),
  ('owner', 'audit_log.view'),
  ('manager', 'dashboard.view'),
  ('manager', 'dashboard.financial.view'),
  ('manager', 'patient.create'),
  ('manager', 'patient.update'),
  ('manager', 'patient.archive'),
  ('manager', 'patient.medical_alerts.view'),
  ('manager', 'appointment.manage'),
  ('manager', 'treatment_note.write'),
  ('manager', 'treatment_note.view_full'),
  ('manager', 'treatment_plan.write'),
  ('manager', 'payment.record'),
  ('manager', 'payment.reverse'),
  ('manager', 'invoice.create'),
  ('manager', 'invoice.void'),
  ('manager', 'report.export'),
  ('manager', 'settings.manage'),
  ('manager', 'message_template.manage'),
  ('manager', 'reminder.send'),
  ('manager', 'booking_request.approve'),
  ('manager', 'staff.manage_limited'),
  ('manager', 'audit_log.view'),
  ('doctor', 'dashboard.view'),
  ('doctor', 'patient.medical_alerts.view'),
  ('doctor', 'appointment.manage_own'),
  ('doctor', 'treatment_note.write'),
  ('doctor', 'treatment_note.view_full'),
  ('doctor', 'treatment_plan.write'),
  ('doctor', 'reminder.send'),
  ('receptionist', 'dashboard.view'),
  ('receptionist', 'patient.create'),
  ('receptionist', 'patient.update'),
  ('receptionist', 'patient.medical_alerts.view'),
  ('receptionist', 'appointment.manage'),
  ('receptionist', 'treatment_note.view_summary'),
  ('receptionist', 'payment.record'),
  ('receptionist', 'invoice.create'),
  ('receptionist', 'reminder.send'),
  ('receptionist', 'booking_request.approve'),
  ('accountant', 'dashboard.view'),
  ('accountant', 'dashboard.financial.view'),
  ('accountant', 'payment.record'),
  ('accountant', 'payment.reverse'),
  ('accountant', 'invoice.create'),
  ('accountant', 'invoice.void'),
  ('accountant', 'report.export'),
  ('assistant', 'dashboard.view'),
  ('assistant', 'appointment.mark_arrived')
)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from role_permission_seed seed
join public.roles r on r.code = seed.role_code
join public.permissions p on p.code = seed.permission_code
on conflict (role_id, permission_id) do nothing;

drop table if exists public.role_permission_seed;

do $$
declare
  bootstrap_auth_user_id_setting text := nullif(current_setting('app.super_admin_auth_user_id', true), '');
  bootstrap_email text := nullif(current_setting('app.super_admin_email', true), '');
  bootstrap_full_name text := coalesce(nullif(current_setting('app.super_admin_full_name', true), ''), 'AtlasJo Super Admin');
  bootstrap_auth_user_id uuid;
begin
  if bootstrap_auth_user_id_setting is null or bootstrap_email is null then
    raise notice 'Skipping Super Admin profile seed. Set app.super_admin_auth_user_id and app.super_admin_email for local/staging bootstrap.';
    return;
  end if;

  bootstrap_auth_user_id := bootstrap_auth_user_id_setting::uuid;

  insert into public.users (
    auth_user_id,
    email,
    full_name,
    is_platform_admin,
    platform_role,
    mfa_enabled
  )
  values (
    bootstrap_auth_user_id,
    bootstrap_email,
    bootstrap_full_name,
    true,
    'super_admin',
    false
  )
  on conflict (auth_user_id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    is_platform_admin = true,
    platform_role = 'super_admin',
    updated_at = now();
end $$;
