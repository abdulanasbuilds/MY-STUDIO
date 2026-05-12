# Skill: my-studio-supabase-rls

## Triggers
- "database", "table", "migration", "RLS", "policy", "Supabase query"

## Purpose
Ensures every database table has proper Row Level Security and follows migration patterns.

---

## Rules

### Every Table MUST Have RLS Enabled

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

No exceptions. Even if a table has no policies yet, RLS must be enabled.

---

## Standard Policy Template

### User-Owned Data (most tables)

```sql
-- Users can only see their own rows
CREATE POLICY "users_select_own_[table]" ON [table]
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own rows
CREATE POLICY "users_insert_own_[table]" ON [table]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own rows
CREATE POLICY "users_update_own_[table]" ON [table]
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own rows
CREATE POLICY "users_delete_own_[table]" ON [table]
  FOR DELETE USING (auth.uid() = user_id);
```

Or combined (simpler):

```sql
CREATE POLICY "users_own_[table]" ON [table]
  FOR ALL USING (auth.uid() = user_id);
```

### Shared Data (viral_content table)

```sql
-- All authenticated users can read
CREATE POLICY "authenticated_select_viral" ON viral_content
  FOR SELECT TO authenticated USING (true);

-- Only service role can insert/update (workers use service role key)
-- No INSERT/UPDATE policy for authenticated = blocked by default
```

---

## Migration Naming

```
001_core_schema.sql
002_avatar_schema.sql
003_clipper_schema.sql
004_rival_schema.sql
005_viral_db_schema.sql
006_notifications_schema.sql
007_[next_feature].sql    ← NEVER skip a number
```

### Every Migration File Ends With

```sql
-- Record migration
INSERT INTO schema_migrations (version, name, applied_at)
VALUES (N, 'description', NOW())
ON CONFLICT (version) DO NOTHING;
```

---

## Required Indexes

Every table should have indexes on:

```sql
-- Always index user_id (most queries filter by user)
CREATE INDEX idx_[table]_user_id ON [table](user_id);

-- Always index created_at (sorting)
CREATE INDEX idx_[table]_created_at ON [table](created_at DESC);

-- Index status columns (filtering)
CREATE INDEX idx_[table]_status ON [table](status);

-- Index any column used in WHERE clauses
CREATE INDEX idx_[table]_[column] ON [table]([column]);
```

---

## Foreign Key Pattern

```sql
-- Reference auth.users
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

-- Reference another table
source_job_id UUID REFERENCES content_jobs(id) ON DELETE SET NULL,
rival_id UUID NOT NULL REFERENCES rival_profiles(id) ON DELETE CASCADE,
```

---

## Default Values

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
is_read BOOLEAN NOT NULL DEFAULT FALSE,
status TEXT NOT NULL DEFAULT 'queued',
progress_percent INTEGER NOT NULL DEFAULT 0,
```

---

## Service Role Access

- **Frontend (anon key):** Subject to RLS policies — users see only their data
- **Workers (service role key):** Bypasses RLS — can read/write all data
- **Modal backend (service role key):** Bypasses RLS — updates job status for any user

**NEVER expose the service role key to the browser.**

---

## Supabase Client Pattern

### Frontend (browser)
```typescript
import { createBrowserClient } from '@supabase/ssr';
// Uses NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
// Subject to RLS
```

### API Routes (server)
```typescript
import { createServerClient } from '@supabase/ssr';
// Uses cookies for auth context
// Subject to RLS (user-scoped)
```

### Backend/Workers (admin)
```python
from supabase import create_client
# Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
# Bypasses RLS
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgot RLS on new table | Add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` |
| Skipped migration number | Renumber — never skip |
| No user_id column | Add it — every user-owned table needs it |
| Used TEXT where JSONB better | Use JSONB for nested/variable data |
| No index on filtered column | Add index on frequently queried columns |
| Service role key in browser | Move to server-side only |
