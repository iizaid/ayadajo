-- Ayadajo Milestone 3 tenant schema.
-- Scope: schema only for V1 tables. RLS policies are added in 0003_rls.sql.
-- Do not add app feature access paths in this migration.

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext unique not null,
  clinic_type text not null default 'dental',
  timezone text not null default 'Asia/Amman',
  language text not null default 'ar',
  status text not null default 'trial',
  phone text,
  address text,
  logo_file_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint clinics_status_check check (
    status in ('trial', 'active', 'past_due', 'read_only', 'suspended', 'cancelled')
  ),
  constraint clinics_language_check check (language in ('ar')),
  constraint clinics_timezone_check check (timezone = 'Asia/Amman'),
  constraint clinics_slug_check check (
    slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'
    and slug not in ('admin', 'api', 'app', 'auth', 'book', 'dashboard', 'login', 'www')
  )
);

create unique index clinics_id_tenant_key on public.clinics (id);
create index clinics_status_idx on public.clinics (status);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  active_clinic_id uuid references public.clinics(id) on delete set null,
  expires_at timestamptz not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index sessions_user_id_idx on public.sessions (user_id);
create index sessions_expires_at_idx on public.sessions (expires_at);

create table public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index password_reset_tokens_user_id_idx on public.password_reset_tokens (user_id);

create table public.clinic_settings (
  clinic_id uuid primary key references public.clinics(id) on delete cascade,
  booking_enabled boolean not null default false,
  booking_mode text not null default 'request',
  quiet_hours_start time,
  quiet_hours_end time,
  reminder_default_hours int not null default 24,
  default_appointment_minutes int not null default 30,
  currency char(3) not null default 'JOD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinic_settings_booking_mode_check check (booking_mode in ('request', 'instant')),
  constraint clinic_settings_reminder_default_hours_check check (reminder_default_hours between 1 and 168),
  constraint clinic_settings_default_appointment_minutes_check check (default_appointment_minutes between 5 and 480),
  constraint clinic_settings_currency_check check (currency = 'JOD')
);

create table public.clinic_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  is_clinical boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinic_members_role_check check (
    role in ('owner', 'manager', 'doctor', 'receptionist', 'accountant', 'assistant')
  ),
  constraint clinic_members_status_check check (status in ('active', 'invited', 'suspended', 'removed')),
  constraint clinic_members_clinical_role_check check (
    (is_clinical = true and role = 'doctor') or is_clinical = false
  ),
  constraint clinic_members_clinic_id_id_key unique (clinic_id, id),
  constraint clinic_members_clinic_user_key unique (clinic_id, user_id)
);

create index clinic_members_clinic_status_idx on public.clinic_members (clinic_id, status);
create index clinic_members_user_id_idx on public.clinic_members (user_id);

create table public.member_invites (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  email citext not null,
  role text not null,
  token_hash text not null unique,
  invited_by uuid references public.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint member_invites_role_check check (
    role in ('owner', 'manager', 'doctor', 'receptionist', 'accountant', 'assistant')
  ),
  constraint member_invites_clinic_id_id_key unique (clinic_id, id)
);

create unique index member_invites_pending_email_idx
on public.member_invites (clinic_id, email)
where accepted_at is null;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  weekday int not null,
  open_time time,
  close_time time,
  break_start time,
  break_end time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint working_hours_weekday_check check (weekday between 0 and 6),
  constraint working_hours_time_check check (
    is_closed = true
    or (open_time is not null and close_time is not null and open_time < close_time)
  ),
  constraint working_hours_break_check check (
    break_start is null
    or break_end is null
    or (break_start < break_end and open_time <= break_start and break_end <= close_time)
  ),
  constraint working_hours_clinic_weekday_key unique (clinic_id, weekday),
  constraint working_hours_clinic_id_id_key unique (clinic_id, id)
);

create index working_hours_clinic_idx on public.working_hours (clinic_id, weekday);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  default_minutes int not null default 30,
  default_price numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_default_minutes_check check (default_minutes between 5 and 480),
  constraint services_default_price_check check (default_price >= 0),
  constraint services_clinic_id_id_key unique (clinic_id, id)
);

create index services_clinic_active_idx on public.services (clinic_id, is_active);

create table public.doctors_availability (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  doctor_member_id uuid not null,
  weekday int not null,
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctors_availability_doctor_member_fkey foreign key (clinic_id, doctor_member_id)
    references public.clinic_members (clinic_id, id) on delete cascade,
  constraint doctors_availability_weekday_check check (weekday between 0 and 6),
  constraint doctors_availability_time_check check (start_time < end_time),
  constraint doctors_availability_clinic_id_id_key unique (clinic_id, id)
);

create index doctors_availability_clinic_doctor_weekday_idx
on public.doctors_availability (clinic_id, doctor_member_id, weekday);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email citext,
  gender text,
  date_of_birth date,
  medical_alerts text,
  notes text,
  messaging_consent_status text not null default 'unknown',
  messaging_consent_source text,
  messaging_consent_at timestamptz,
  import_id uuid,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint patients_gender_check check (gender in ('male', 'female', 'other') or gender is null),
  constraint patients_messaging_consent_status_check check (
    messaging_consent_status in ('unknown', 'consented', 'opted_out')
  ),
  constraint patients_consent_timestamp_check check (
    (messaging_consent_status = 'unknown' and messaging_consent_at is null)
    or messaging_consent_status in ('consented', 'opted_out')
  ),
  constraint patients_phone_check check (phone ~ '^\+9627[789][0-9]{7}$'),
  constraint patients_clinic_id_id_key unique (clinic_id, id)
);

create index patients_clinic_phone_idx on public.patients (clinic_id, phone);
create index patients_clinic_name_idx on public.patients (clinic_id, full_name);
create index patients_clinic_created_idx on public.patients (clinic_id, created_at);
create index patients_clinic_import_idx on public.patients (clinic_id, import_id) where import_id is not null;

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  doctor_member_id uuid not null,
  service_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'booked',
  source text not null default 'staff',
  cancel_reason text,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint appointments_patient_fkey foreign key (clinic_id, patient_id)
    references public.patients (clinic_id, id) on delete restrict,
  constraint appointments_doctor_member_fkey foreign key (clinic_id, doctor_member_id)
    references public.clinic_members (clinic_id, id) on delete restrict,
  constraint appointments_service_fkey foreign key (clinic_id, service_id)
    references public.services (clinic_id, id) on delete restrict,
  constraint appointments_status_check check (
    status in ('booked', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show')
  ),
  constraint appointments_source_check check (source in ('staff', 'public_booking', 'walk_in')),
  constraint appointments_time_check check (starts_at < ends_at),
  constraint appointments_clinic_id_id_key unique (clinic_id, id)
);

create index appointments_clinic_starts_idx on public.appointments (clinic_id, starts_at);
create index appointments_clinic_doctor_starts_idx on public.appointments (clinic_id, doctor_member_id, starts_at);
create index appointments_clinic_patient_idx on public.appointments (clinic_id, patient_id);
create index appointments_clinic_status_starts_idx on public.appointments (clinic_id, status, starts_at);

create table public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by uuid references public.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  constraint appointment_status_history_appointment_fkey foreign key (clinic_id, appointment_id)
    references public.appointments (clinic_id, id) on delete cascade,
  constraint appointment_status_history_from_status_check check (
    from_status in ('booked', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show')
    or from_status is null
  ),
  constraint appointment_status_history_to_status_check check (
    to_status in ('booked', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show')
  ),
  constraint appointment_status_history_clinic_id_id_key unique (clinic_id, id)
);

create index appointment_status_history_clinic_appointment_created_idx
on public.appointment_status_history (clinic_id, appointment_id, created_at);

create table public.treatment_notes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  appointment_id uuid,
  doctor_member_id uuid,
  tooth_area text,
  note text not null,
  follow_up_instruction text,
  created_by uuid references public.users(id) on delete set null,
  edited_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint treatment_notes_patient_fkey foreign key (clinic_id, patient_id)
    references public.patients (clinic_id, id) on delete restrict,
  constraint treatment_notes_appointment_fkey foreign key (clinic_id, appointment_id)
    references public.appointments (clinic_id, id) on delete restrict,
  constraint treatment_notes_doctor_member_fkey foreign key (clinic_id, doctor_member_id)
    references public.clinic_members (clinic_id, id) on delete restrict,
  constraint treatment_notes_clinic_id_id_key unique (clinic_id, id)
);

create index treatment_notes_clinic_patient_created_idx
on public.treatment_notes (clinic_id, patient_id, created_at);

create table public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  title text not null,
  status text not null default 'active',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint treatment_plans_patient_fkey foreign key (clinic_id, patient_id)
    references public.patients (clinic_id, id) on delete restrict,
  constraint treatment_plans_status_check check (status in ('draft', 'active', 'completed', 'cancelled')),
  constraint treatment_plans_clinic_id_id_key unique (clinic_id, id)
);

create index treatment_plans_clinic_patient_idx on public.treatment_plans (clinic_id, patient_id);

create table public.treatment_plan_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  treatment_plan_id uuid not null,
  procedure_name text not null,
  tooth_area text,
  price numeric(12, 2) not null default 0,
  status text not null default 'planned',
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint treatment_plan_items_plan_fkey foreign key (clinic_id, treatment_plan_id)
    references public.treatment_plans (clinic_id, id) on delete cascade,
  constraint treatment_plan_items_price_check check (price >= 0),
  constraint treatment_plan_items_status_check check (status in ('planned', 'in_progress', 'done', 'cancelled')),
  constraint treatment_plan_items_done_at_check check (
    (status = 'done' and done_at is not null) or (status <> 'done')
  ),
  constraint treatment_plan_items_clinic_id_id_key unique (clinic_id, id)
);

create index treatment_plan_items_clinic_plan_idx
on public.treatment_plan_items (clinic_id, treatment_plan_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  number text not null,
  status text not null default 'draft',
  subtotal numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  balance numeric(12, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  issued_at timestamptz,
  voided_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint invoices_patient_fkey foreign key (clinic_id, patient_id)
    references public.patients (clinic_id, id) on delete restrict,
  constraint invoices_status_check check (status in ('draft', 'issued', 'partial', 'paid', 'void')),
  constraint invoices_amounts_check check (
    subtotal >= 0 and total >= 0 and paid_amount >= 0 and balance >= 0 and tax_amount >= 0
  ),
  constraint invoices_voided_at_check check ((status = 'void' and voided_at is not null) or status <> 'void'),
  constraint invoices_clinic_number_key unique (clinic_id, number),
  constraint invoices_clinic_id_id_key unique (clinic_id, id)
);

create index invoices_clinic_patient_idx on public.invoices (clinic_id, patient_id);
create index invoices_clinic_status_idx on public.invoices (clinic_id, status);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  invoice_id uuid not null,
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0,
  treatment_plan_item_id uuid,
  created_at timestamptz not null default now(),
  constraint invoice_items_invoice_fkey foreign key (clinic_id, invoice_id)
    references public.invoices (clinic_id, id) on delete cascade,
  constraint invoice_items_treatment_plan_item_fkey foreign key (clinic_id, treatment_plan_item_id)
    references public.treatment_plan_items (clinic_id, id) on delete restrict,
  constraint invoice_items_amounts_check check (quantity > 0 and unit_price >= 0 and line_total >= 0),
  constraint invoice_items_clinic_id_id_key unique (clinic_id, id)
);

create index invoice_items_clinic_invoice_idx on public.invoice_items (clinic_id, invoice_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  amount numeric(12, 2) not null,
  method text not null,
  paid_at timestamptz not null default now(),
  invoice_id uuid,
  treatment_plan_id uuid,
  reverses_payment_id uuid,
  note text,
  recorded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint payments_patient_fkey foreign key (clinic_id, patient_id)
    references public.patients (clinic_id, id) on delete restrict,
  constraint payments_invoice_fkey foreign key (clinic_id, invoice_id)
    references public.invoices (clinic_id, id) on delete restrict,
  constraint payments_treatment_plan_fkey foreign key (clinic_id, treatment_plan_id)
    references public.treatment_plans (clinic_id, id) on delete restrict,
  constraint payments_reverses_payment_fkey foreign key (clinic_id, reverses_payment_id)
    references public.payments (clinic_id, id) on delete restrict,
  constraint payments_method_check check (method in ('cash', 'cliq', 'bank_transfer', 'card_manual', 'other')),
  constraint payments_amount_check check (amount <> 0),
  constraint payments_clinic_id_id_key unique (clinic_id, id)
);

create index payments_clinic_patient_paid_idx on public.payments (clinic_id, patient_id, paid_at);
create index payments_clinic_paid_idx on public.payments (clinic_id, paid_at);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  status text not null,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_until timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_status_check check (
    status in ('trial', 'active', 'past_due', 'read_only', 'suspended', 'cancelled')
  ),
  constraint subscriptions_period_check check (
    current_period_start is null
    or current_period_end is null
    or current_period_start < current_period_end
  ),
  constraint subscriptions_clinic_key unique (clinic_id),
  constraint subscriptions_clinic_id_id_key unique (clinic_id, id)
);

create index subscriptions_status_period_idx on public.subscriptions (status, current_period_end);

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  subscription_id uuid not null,
  amount numeric(12, 2) not null,
  currency char(3) not null default 'JOD',
  method text not null,
  received_at timestamptz not null default now(),
  recorded_by uuid references public.users(id) on delete set null,
  reference text,
  note text,
  created_at timestamptz not null default now(),
  constraint subscription_payments_subscription_fkey foreign key (clinic_id, subscription_id)
    references public.subscriptions (clinic_id, id) on delete restrict,
  constraint subscription_payments_amount_check check (amount > 0),
  constraint subscription_payments_currency_check check (currency = 'JOD'),
  constraint subscription_payments_method_check check (method in ('cliq', 'bank_transfer', 'cash', 'paypal', 'other')),
  constraint subscription_payments_clinic_id_id_key unique (clinic_id, id)
);

create index subscription_payments_clinic_received_idx
on public.subscription_payments (clinic_id, received_at);

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete cascade,
  code text not null,
  channel text not null,
  language text not null default 'ar',
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_templates_channel_check check (channel in ('whatsapp', 'email', 'sms')),
  constraint message_templates_language_check check (language = 'ar'),
  constraint message_templates_clinic_id_id_key unique (clinic_id, id)
);

create index message_templates_clinic_code_channel_idx
on public.message_templates (clinic_id, code, channel);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null,
  type text not null,
  channel text not null,
  created_at timestamptz not null default now(),
  constraint reminders_appointment_fkey foreign key (clinic_id, appointment_id)
    references public.appointments (clinic_id, id) on delete cascade,
  constraint reminders_type_check check (
    type in ('reminder_24h', 'reminder_2h', 'followup', 'noshow', 'confirmation')
  ),
  constraint reminders_channel_check check (channel in ('whatsapp_link', 'email')),
  constraint reminders_clinic_appointment_type_channel_key unique (clinic_id, appointment_id, type, channel),
  constraint reminders_clinic_id_id_key unique (clinic_id, id)
);

create table public.reminder_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  reminder_id uuid not null,
  appointment_id uuid not null,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled',
  attempts int not null default 0,
  last_error text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminder_events_reminder_fkey foreign key (clinic_id, reminder_id)
    references public.reminders (clinic_id, id) on delete cascade,
  constraint reminder_events_appointment_fkey foreign key (clinic_id, appointment_id)
    references public.appointments (clinic_id, id) on delete cascade,
  constraint reminder_events_status_check check (
    status in ('pending', 'scheduled', 'sent', 'failed', 'cancelled', 'skipped')
  ),
  constraint reminder_events_attempts_check check (attempts >= 0),
  constraint reminder_events_clinic_id_id_key unique (clinic_id, id)
);

create index reminder_events_status_scheduled_idx on public.reminder_events (status, scheduled_for);
create index reminder_events_clinic_appointment_idx on public.reminder_events (clinic_id, appointment_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid,
  patient_id uuid,
  reminder_event_id uuid,
  channel text not null,
  direction text not null default 'outbound',
  to_phone text,
  to_email citext,
  template_code text,
  body_snapshot text,
  status text not null default 'prepared',
  marked_sent_by uuid references public.users(id) on delete set null,
  marked_sent_at timestamptz,
  provider text,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  constraint messages_appointment_fkey foreign key (clinic_id, appointment_id)
    references public.appointments (clinic_id, id) on delete restrict,
  constraint messages_patient_fkey foreign key (clinic_id, patient_id)
    references public.patients (clinic_id, id) on delete restrict,
  constraint messages_reminder_event_fkey foreign key (clinic_id, reminder_event_id)
    references public.reminder_events (clinic_id, id) on delete restrict,
  constraint messages_channel_check check (channel in ('whatsapp_link', 'email', 'whatsapp_api', 'sms')),
  constraint messages_direction_check check (direction in ('outbound', 'inbound')),
  constraint messages_status_check check (
    status in ('prepared', 'opened', 'marked_sent', 'sent', 'delivered', 'failed', 'cancelled')
  ),
  constraint messages_marked_sent_check check (
    (status = 'marked_sent' and marked_sent_by is not null and marked_sent_at is not null)
    or status <> 'marked_sent'
  ),
  constraint messages_clinic_id_id_key unique (clinic_id, id)
);

create index messages_clinic_created_idx on public.messages (clinic_id, created_at);
create index messages_clinic_patient_idx on public.messages (clinic_id, patient_id);
create index messages_clinic_status_idx on public.messages (clinic_id, status);

create table public.public_booking_requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_name text not null,
  patient_phone text not null,
  patient_email citext,
  service_id uuid,
  preferred_doctor_member_id uuid,
  requested_at timestamptz not null,
  notes text,
  status text not null default 'pending',
  created_appointment_id uuid,
  ip text,
  created_at timestamptz not null default now(),
  handled_by uuid references public.users(id) on delete set null,
  handled_at timestamptz,
  constraint public_booking_requests_service_fkey foreign key (clinic_id, service_id)
    references public.services (clinic_id, id) on delete restrict,
  constraint public_booking_requests_doctor_member_fkey foreign key (clinic_id, preferred_doctor_member_id)
    references public.clinic_members (clinic_id, id) on delete restrict,
  constraint public_booking_requests_created_appointment_fkey foreign key (clinic_id, created_appointment_id)
    references public.appointments (clinic_id, id) on delete restrict,
  constraint public_booking_requests_status_check check (
    status in ('pending', 'approved', 'rejected', 'converted', 'spam')
  ),
  constraint public_booking_requests_phone_check check (patient_phone ~ '^\+9627[789][0-9]{7}$'),
  constraint public_booking_requests_clinic_id_id_key unique (clinic_id, id)
);

create index public_booking_requests_clinic_status_created_idx
on public.public_booking_requests (clinic_id, status, created_at);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid,
  uploaded_by uuid references public.users(id) on delete set null,
  storage_key text not null,
  file_type text,
  mime text,
  size_bytes bigint,
  original_name text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint files_patient_fkey foreign key (clinic_id, patient_id)
    references public.patients (clinic_id, id) on delete restrict,
  constraint files_size_bytes_check check (size_bytes is null or size_bytes > 0),
  constraint files_storage_key_check check (storage_key like 'clinics/%'),
  constraint files_no_public_url_check check (storage_key not like 'http%'),
  constraint files_clinic_id_id_key unique (clinic_id, id)
);

create index files_clinic_patient_idx on public.files (clinic_id, patient_id);
create unique index files_storage_key_idx on public.files (storage_key);

alter table public.clinics
add constraint clinics_logo_file_fkey foreign key (logo_file_id)
references public.files (id) on delete set null;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  summary text,
  ip text,
  created_at timestamptz not null default now(),
  constraint audit_logs_clinic_id_id_key unique (clinic_id, id)
);

create index audit_logs_clinic_created_idx on public.audit_logs (clinic_id, created_at);
create index audit_logs_action_created_idx on public.audit_logs (action, created_at);

create table public.support_access_grants (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  granted_to uuid not null references public.users(id) on delete cascade,
  reason text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint support_access_grants_expiry_check check (expires_at > created_at),
  constraint support_access_grants_clinic_id_id_key unique (clinic_id, id)
);

create index support_access_grants_clinic_granted_to_idx
on public.support_access_grants (clinic_id, granted_to);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  recipient_member_id uuid not null,
  type text not null,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_recipient_member_fkey foreign key (clinic_id, recipient_member_id)
    references public.clinic_members (clinic_id, id) on delete cascade,
  constraint notifications_clinic_id_id_key unique (clinic_id, id)
);

create index notifications_clinic_recipient_read_idx
on public.notifications (clinic_id, recipient_member_id, read_at);

create trigger clinics_set_updated_at
before update on public.clinics
for each row execute function public.set_updated_at();

create trigger clinic_settings_set_updated_at
before update on public.clinic_settings
for each row execute function public.set_updated_at();

create trigger clinic_members_set_updated_at
before update on public.clinic_members
for each row execute function public.set_updated_at();

create trigger roles_set_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

create trigger permissions_set_updated_at
before update on public.permissions
for each row execute function public.set_updated_at();

create trigger working_hours_set_updated_at
before update on public.working_hours
for each row execute function public.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger doctors_availability_set_updated_at
before update on public.doctors_availability
for each row execute function public.set_updated_at();

create trigger patients_set_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create trigger treatment_notes_set_updated_at
before update on public.treatment_notes
for each row execute function public.set_updated_at();

create trigger treatment_plans_set_updated_at
before update on public.treatment_plans
for each row execute function public.set_updated_at();

create trigger treatment_plan_items_set_updated_at
before update on public.treatment_plan_items
for each row execute function public.set_updated_at();

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger message_templates_set_updated_at
before update on public.message_templates
for each row execute function public.set_updated_at();

create trigger reminder_events_set_updated_at
before update on public.reminder_events
for each row execute function public.set_updated_at();
