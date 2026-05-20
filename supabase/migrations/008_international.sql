-- 国际化支持迁移
-- products 表新增 markets 字段（数组，支持 'cn' 和 'intl' 两个值）
-- 默认值 '{cn}' 表示现有产品仅国内可见
ALTER TABLE products ADD COLUMN IF NOT EXISTS markets text[] DEFAULT '{cn}';

-- users 表新增 contact_email 字段（国际询价专用邮箱，不同于登录邮箱）
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email text;

-- inquiries 表：存储海外用户的询价记录
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  visitor_name text NOT NULL,
  visitor_email text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 匠人可查看自己收到的询价；管理员可查看全部
CREATE POLICY "artisan_read_own_inquiries" ON inquiries
  FOR SELECT USING (
    artisan_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 任何人都可以提交询价（匿名用户也可以）
CREATE POLICY "anyone_can_inquire" ON inquiries
  FOR INSERT WITH CHECK (true);

-- 产品国际定价（美元）
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_usd numeric;
