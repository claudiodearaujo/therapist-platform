-- Application JWTs/tenant membership are enforced by Express, not Supabase Auth.
-- Deny direct Data API access. Prisma connects as the table owner; no FORCE RLS.
-- Role checks keep this migration compatible with plain PostgreSQL.
DO $security$
DECLARE
  table_name text;
  api_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['tenants', 'tenant_memberships', 'saas_subscriptions', 'stripe_webhook_events', 'users', 'auth_sessions', 'privacy_requests', 'audit_events', 'data_retention_policies', 'security_incidents', 'product_categories', 'products', 'product_attachments', 'orders', 'order_items', 'cigano_cards', 'readings', 'reading_cards', 'schedule_settings', 'appointments', 'blocked_slots', 'testimonials', 'coupons', 'site_settings', 'notifications', '_prisma_migrations']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
    FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, api_role);
      END IF;
    END LOOP;
  END LOOP;
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', api_role);
    END IF;
  END LOOP;
END
$security$;
