-- Ayadajo Milestone 3 tenant safety constraints.
-- Appointment overlap prevention is a launch-blocker prerequisite for M9 race tests.

create extension if not exists btree_gist with schema extensions;

alter table public.appointments
add constraint appointments_no_active_doctor_overlap
exclude using gist (
  clinic_id with =,
  doctor_member_id with =,
  tstzrange(starts_at, ends_at, '[)') with &&
)
where (
  deleted_at is null
  and status not in ('cancelled', 'no_show')
);
