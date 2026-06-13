-- Ayadajo Milestone 3 RLS policies.
-- Tenant isolation is enforced through active clinic membership.

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = (select auth.uid())
    and u.deleted_at is null
  limit 1
$$;

create or replace function public.is_platform_admin(required_role text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.auth_user_id = (select auth.uid())
      and u.deleted_at is null
      and u.is_platform_admin = true
      and (required_role is null or u.platform_role = required_role)
  )
$$;

create or replace function public.is_clinic_member(target_clinic_id uuid)
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
    where cm.clinic_id = target_clinic_id
      and cm.status = 'active'
      and u.deleted_at is null
      and u.auth_user_id = (select auth.uid())
  )
$$;

revoke all on function public.current_app_user_id() from public;
revoke all on function public.is_platform_admin(text) from public;
revoke all on function public.is_clinic_member(uuid) from public;

grant execute on function public.current_app_user_id() to authenticated;
grant execute on function public.is_platform_admin(text) to authenticated;
grant execute on function public.is_clinic_member(uuid) to authenticated;

alter table public.sessions enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_settings enable row level security;
alter table public.clinic_members enable row level security;
alter table public.member_invites enable row level security;
alter table public.working_hours enable row level security;
alter table public.services enable row level security;
alter table public.doctors_availability enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_status_history enable row level security;
alter table public.treatment_notes enable row level security;
alter table public.treatment_plans enable row level security;
alter table public.treatment_plan_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.message_templates enable row level security;
alter table public.reminders enable row level security;
alter table public.reminder_events enable row level security;
alter table public.messages enable row level security;
alter table public.public_booking_requests enable row level security;
alter table public.files enable row level security;
alter table public.audit_logs enable row level security;
alter table public.support_access_grants enable row level security;
alter table public.notifications enable row level security;

create policy sessions_user_select
on public.sessions
for select
to authenticated
using (user_id = public.current_app_user_id());

create policy sessions_user_insert
on public.sessions
for insert
to authenticated
with check (user_id = public.current_app_user_id());

create policy sessions_user_update
on public.sessions
for update
to authenticated
using (user_id = public.current_app_user_id())
with check (user_id = public.current_app_user_id());

create policy sessions_user_delete
on public.sessions
for delete
to authenticated
using (user_id = public.current_app_user_id());

create policy roles_authenticated_select
on public.roles
for select
to authenticated
using ((select auth.uid()) is not null);

create policy permissions_authenticated_select
on public.permissions
for select
to authenticated
using ((select auth.uid()) is not null);

create policy role_permissions_authenticated_select
on public.role_permissions
for select
to authenticated
using ((select auth.uid()) is not null);

create policy clinics_member_select
on public.clinics
for select
to authenticated
using (public.is_clinic_member(id));

create policy clinics_member_update
on public.clinics
for update
to authenticated
using (public.is_clinic_member(id))
with check (public.is_clinic_member(id));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clinic_settings',
    'clinic_members',
    'member_invites',
    'working_hours',
    'services',
    'doctors_availability',
    'patients',
    'appointments',
    'treatment_notes',
    'treatment_plans',
    'treatment_plan_items',
    'invoices',
    'invoice_items',
    'payments',
    'reminders',
    'reminder_events',
    'messages',
    'public_booking_requests',
    'files',
    'notifications'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_clinic_member(clinic_id))',
      table_name || '_tenant_select',
      table_name
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_clinic_member(clinic_id))',
      table_name || '_tenant_insert',
      table_name
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_clinic_member(clinic_id)) with check (public.is_clinic_member(clinic_id))',
      table_name || '_tenant_update',
      table_name
    );
  end loop;
end $$;

create policy appointment_status_history_tenant_select
on public.appointment_status_history
for select
to authenticated
using (public.is_clinic_member(clinic_id));

create policy appointment_status_history_tenant_insert
on public.appointment_status_history
for insert
to authenticated
with check (public.is_clinic_member(clinic_id));

create policy subscriptions_tenant_select
on public.subscriptions
for select
to authenticated
using (public.is_clinic_member(clinic_id));

create policy subscription_payments_tenant_select
on public.subscription_payments
for select
to authenticated
using (public.is_clinic_member(clinic_id));

create policy message_templates_tenant_select
on public.message_templates
for select
to authenticated
using (
  clinic_id is null
  or public.is_clinic_member(clinic_id)
);

create policy message_templates_tenant_insert
on public.message_templates
for insert
to authenticated
with check (
  clinic_id is not null
  and public.is_clinic_member(clinic_id)
);

create policy message_templates_tenant_update
on public.message_templates
for update
to authenticated
using (
  clinic_id is not null
  and public.is_clinic_member(clinic_id)
)
with check (
  clinic_id is not null
  and public.is_clinic_member(clinic_id)
);

create policy audit_logs_tenant_select
on public.audit_logs
for select
to authenticated
using (
  clinic_id is not null
  and public.is_clinic_member(clinic_id)
);

create policy audit_logs_tenant_insert
on public.audit_logs
for insert
to authenticated
with check (
  clinic_id is not null
  and public.is_clinic_member(clinic_id)
);

create policy support_access_grants_tenant_select
on public.support_access_grants
for select
to authenticated
using (public.is_clinic_member(clinic_id));

-- password_reset_tokens intentionally has RLS enabled with no normal-user policies.
-- Auth/reset flows are implemented later and must use narrow server-only paths.
-- Tenant-table hard deletes are intentionally blocked by absent DELETE policies unless
-- a later milestone adds an explicit app authorization path and matching policy.
