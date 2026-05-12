-- 爱伴行 数据库初始化
-- 在 Supabase SQL Editor 中执行此文件

-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- ── users 表 ──
create table if not exists users (
  id                uuid primary key default gen_random_uuid(),
  email             text unique not null,
  role              text not null default 'artisan' check (role in ('admin', 'artisan')),
  name              text not null,
  name_en           text,
  avatar_url        text,
  bio               text,
  bio_en            text,
  city              text,
  city_en           text,
  category          text check (category in ('ceramics','leather','textile','food','handcraft','service')),
  wechat_qr_url     text,
  shipping_address  text,
  status            text not null default 'active' check (status in ('active','suspended')),
  invited_by        uuid references users(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- ── endorsements 表（信任链背书）──
create table if not exists endorsements (
  id            uuid primary key default gen_random_uuid(),
  artisan_id    uuid not null references users(id) on delete cascade,
  endorser_id   uuid not null references users(id) on delete cascade,
  content       text not null,
  content_en    text,
  relationship  text,
  created_at    timestamptz not null default now(),
  constraint no_self_endorse check (artisan_id != endorser_id)
);

-- ── products 表 ──
create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  artisan_id      uuid not null references users(id) on delete cascade,
  name            text not null,
  name_en         text,
  description     text,
  description_en  text,
  price           numeric(10,2),
  images          text[] not null default '{}',
  category        text,
  is_published    boolean not null default false,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- products 自动更新 updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- ── invitations 表 ──
create table if not exists invitations (
  id              uuid primary key default gen_random_uuid(),
  inviter_id      uuid not null references users(id) on delete cascade,
  invitee_name    text not null,
  invitee_email   text not null,
  endorsement     text not null,
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by     uuid references users(id),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- ── Row Level Security ──
alter table users enable row level security;
alter table endorsements enable row level security;
alter table products enable row level security;
alter table invitations enable row level security;

-- users: 公开读取 active 用户
create policy "public can read active users"
  on users for select using (status = 'active');

-- users: 自己可以更新自己的资料
create policy "artisan can update own profile"
  on users for update using (auth.uid() = id);

-- endorsements: 公开读取
create policy "public can read endorsements"
  on endorsements for select using (true);

-- products: 公开读取已发布且匠人未被禁用的产品
create policy "public can read published products"
  on products for select using (
    is_published = true and
    exists (select 1 from users where id = products.artisan_id and status = 'active')
  );

-- products: 匠人可以管理自己的产品
create policy "artisan can manage own products"
  on products for all using (auth.uid() = artisan_id);

-- invitations: 匠人可以查看自己发起的邀请
create policy "artisan can view own invitations"
  on invitations for select using (auth.uid() = inviter_id);

-- invitations: 匠人可以创建邀请
create policy "artisan can create invitations"
  on invitations for insert with check (auth.uid() = inviter_id);

-- ── 索引 ──
create index if not exists idx_products_artisan on products(artisan_id);
create index if not exists idx_products_published on products(is_published, sort_order desc);
create index if not exists idx_products_category on products(category);
create index if not exists idx_endorsements_artisan on endorsements(artisan_id);
create index if not exists idx_users_category on users(category);
create index if not exists idx_users_status on users(status);
