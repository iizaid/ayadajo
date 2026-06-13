-- Ayadajo Milestone 5 API grants.
-- PostgREST roles need table privileges before RLS policies can be evaluated.
-- These grants do not bypass RLS; tenant isolation remains enforced by policies.

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
