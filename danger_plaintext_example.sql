-- ============================================================
-- DANGER_DO_NOT_DEPLOY
-- This file is for educational illustration ONLY.
-- Storing plaintext passwords is a critical security vulnerability.
-- Reference: OWASP A07:2021 – Identification and Authentication Failures
-- https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/
--
-- THIS IS NEVER WIRED INTO THE APPLICATION.
-- The real auth flow uses Argon2id (lib/auth.ts).
-- ============================================================

-- DO NOT use this in any real system:
-- CREATE TABLE dangerous_plaintext_users (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   email TEXT UNIQUE NOT NULL,
--   password TEXT NOT NULL -- ⚠️ NEVER store passwords in plaintext
-- );

-- Correct approach (already used in 001_create_users.sql):
-- password_hash TEXT NOT NULL  -- Argon2id hash stored here
