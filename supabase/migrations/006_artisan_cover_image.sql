-- 爱伴行 第六期迁移：匠人主页封面图
alter table users
  add column if not exists cover_image_url text;
