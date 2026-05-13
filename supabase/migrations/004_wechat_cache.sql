-- 微信 access_token 和 jsapi_ticket 缓存表
-- 解决 Vercel 多实例不共享内存的问题
create table if not exists wechat_cache (
  key         text primary key,
  value       text not null,
  expires_at  timestamptz not null,
  updated_at  timestamptz not null default now()
);

-- 只允许服务端读写，不暴露给前端
alter table wechat_cache enable row level security;
-- 不创建任何 RLS policy，只有 service_role 可以访问
