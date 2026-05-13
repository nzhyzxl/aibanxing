-- 爱伴行 第五期迁移：网站系统设置表
-- 在 Supabase SQL Editor 中执行

create table if not exists site_settings (
  key         text primary key,
  value       text,
  label       text,         -- 后台显示的名称
  type        text not null default 'text',  -- text | image | textarea
  updated_at  timestamptz not null default now()
);

-- 插入初始数据
insert into site_settings (key, value, label, type) values
  ('about_workspace_image',
   'https://aibanxing.oss-cn-hangzhou.aliyuncs.com/uploads/fba0222feb668fe38436162b4434816a.jpg',
   '关于页·工作场景图', 'image'),
  ('about_wechat_qr',
   'https://aibanxing.oss-cn-hangzhou.aliyuncs.com/uploads/64ef9df45b9fcd94ef7ab892b63343e2.jpg',
   '关于页·微信二维码', 'image'),
  ('og_image',
   'https://www.aibanxing.top/og-image.jpg',
   '分享封面图（OG Image）', 'image'),
  ('site_slogan_zh',
   '用爱与善意，陪伴美好流传',
   '网站标语（中文）', 'text'),
  ('site_slogan_en',
   'Carrying love and goodwill, letting beautiful things pass on.',
   '网站标语（英文）', 'text'),
  ('about_story_zh',
   '离职以后，我一直在想一件事：身边有很多真诚且有手艺的朋友，产品非常好，却因为不懂营销和销售而没有销路。',
   '关于页·创始人故事（中文）', 'textarea'),
  ('about_story_en',
   'After leaving my job, I kept thinking about one thing: so many of my friends are talented and genuine artisans — their work is beautiful — yet they struggle to find buyers simply because they don''t know how to market themselves.',
   '关于页·创始人故事（英文）', 'textarea')
on conflict (key) do nothing;

-- RLS：只允许 service_role 访问，前台通过 API 读取
alter table site_settings enable row level security;

-- 允许所有人读取（前台需要）
create policy "anyone can read site_settings"
  on site_settings for select using (true);
