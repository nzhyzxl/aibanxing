-- 爱伴行 第七期迁移：匠人排序权重
-- 管理员可在后台设置，首页按此排序展示匠人

alter table users
  add column if not exists sort_order integer not null default 0;

-- 索引：首页查询用
create index if not exists idx_users_sort_order
  on users(sort_order desc, created_at desc);
