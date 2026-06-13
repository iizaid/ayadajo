-- Ayadajo Milestone 4 membership lifecycle RLS completion.
-- Scope: allow manager-level staff.manage_limited only for non-owner/non-manager staff rows.
-- App-layer membership rules still enforce self-offboarding and last-owner protections.

drop policy if exists clinic_members_permission_insert on public.clinic_members;
drop policy if exists clinic_members_permission_update on public.clinic_members;
drop policy if exists member_invites_permission_insert on public.member_invites;
drop policy if exists member_invites_permission_update on public.member_invites;

create policy clinic_members_permission_insert
on public.clinic_members
for insert
to authenticated
with check (
  public.has_clinic_permission(clinic_id, 'staff.manage')
  or (
    public.has_clinic_permission(clinic_id, 'staff.manage_limited')
    and role not in ('owner', 'manager')
  )
);

create policy clinic_members_permission_update
on public.clinic_members
for update
to authenticated
using (
  public.has_clinic_permission(clinic_id, 'staff.manage')
  or (
    public.has_clinic_permission(clinic_id, 'staff.manage_limited')
    and role not in ('owner', 'manager')
  )
)
with check (
  public.has_clinic_permission(clinic_id, 'staff.manage')
  or (
    public.has_clinic_permission(clinic_id, 'staff.manage_limited')
    and role not in ('owner', 'manager')
  )
);

create policy member_invites_permission_insert
on public.member_invites
for insert
to authenticated
with check (
  public.has_clinic_permission(clinic_id, 'staff.manage')
  or (
    public.has_clinic_permission(clinic_id, 'staff.manage_limited')
    and role not in ('owner', 'manager')
  )
);

create policy member_invites_permission_update
on public.member_invites
for update
to authenticated
using (
  public.has_clinic_permission(clinic_id, 'staff.manage')
  or (
    public.has_clinic_permission(clinic_id, 'staff.manage_limited')
    and role not in ('owner', 'manager')
  )
)
with check (
  public.has_clinic_permission(clinic_id, 'staff.manage')
  or (
    public.has_clinic_permission(clinic_id, 'staff.manage_limited')
    and role not in ('owner', 'manager')
  )
);
