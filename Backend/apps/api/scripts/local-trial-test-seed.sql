INSERT INTO public."User" ("id", "email", "createdAt") VALUES
  ('legacy_no_sub', 'legacy-no-sub@example.com', '2026-03-01T10:00:00Z'),
  ('legacy_free_sub', 'legacy-free-sub@example.com', '2026-03-02T10:00:00Z'),
  ('new_no_sub', 'new-no-sub@example.com', '2026-03-11T10:00:00Z'),
  ('paid_user', 'paid@example.com', '2026-03-11T12:00:00Z')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Subscription" ("id", "userId", "plan", "status", "creditsRemaining", "creditsResetAt", "legacyFree", "requiresPayment", "updatedAt") VALUES
  ('sub_legacy_free', 'legacy_free_sub', 'free', 'active', 2, '2026-04-01T00:00:00Z', false, false, NOW()),
  ('sub_paid', 'paid_user', 'pro', 'active', -1, NULL, false, false, NOW())
ON CONFLICT ("userId") DO NOTHING;
