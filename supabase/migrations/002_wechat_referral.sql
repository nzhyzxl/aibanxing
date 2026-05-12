-- 爱伴行 第二期迁移：微信登录 + 引荐体系
-- 在 Supabase SQL Editor 中执行

-- ── 1. users 表新增微信字段 ──
alter table users
  add column if not exists wechat_openid    text unique,
  add column if not exists wechat_nickname  text,
  add column if not exists wechat_avatar    text;

-- role 新增 visitor 角色
alter table users
  drop constraint if exists users_role_check;
alter table users
  add constraint users_role_check
  check (role in ('admin', 'artisan', 'visitor'));

-- ── 2. ref_logs 表（访问追踪）──
create table if not exists ref_logs (
  id              uuid primary key default gen_random_uuid(),
  ref_user_id     uuid references users(id) on delete set null,
  product_id      uuid references products(id) on delete cascade,
  visitor_user_id uuid references users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ── 3. referral_relationships 表（引荐关系，永久绑定）──
create table if not exists referral_relationships (
  id                uuid primary key default gen_random_uuid(),
  referrer_id       uuid references users(id) on delete set null,
  buyer_user_id     uuid references users(id) on delete set null,
  artisan_id        uuid not null references users(id) on delete cascade,
  source_product_id uuid references products(id) on delete set null,
  created_at        timestamptz not null default now(),
  unique (buyer_user_id, artisan_id)
);

-- ── 4. transactions 表（成交记录）──
create table if not exists transactions (
  id                uuid primary key default gen_random_uuid(),
  artisan_id        uuid not null references users(id) on delete cascade,
  product_id        uuid references products(id) on delete set null,
  buyer_name        text,
  buyer_user_id     uuid references users(id) on delete set null,
  referrer_id       uuid references users(id) on delete set null,
  amount            numeric(10,2),
  thank_you_amount  numeric(10,2),
  is_settled        boolean not null default false,
  note              text,
  created_at        timestamptz not null default now()
);

-- ── 5. RLS ──
alter table ref_logs enable row level security;
alter table referral_relationships enable row level security;
alter table transactions enable row level security;

create policy "anyone can insert ref_logs"
  on ref_logs for insert with check (true);

create policy "referrer can view own ref_logs"
  on ref_logs for select using (auth.uid() = ref_user_id);

create policy "artisan can view own referral_relationships"
  on referral_relationships for select using (auth.uid() = artisan_id);

create policy "artisan can manage own transactions"
  on transactions for all using (auth.uid() = artisan_id);

-- ── 6. 索引 ──
create index if not exists idx_ref_logs_ref_user on ref_logs(ref_user_id);
create index if not exists idx_ref_logs_product on ref_logs(product_id);
create index if not exists idx_transactions_artisan on transactions(artisan_id);
create index if not exists idx_transactions_referrer on transactions(referrer_id);
create index if not exists idx_users_openid on users(wechat_openid);
