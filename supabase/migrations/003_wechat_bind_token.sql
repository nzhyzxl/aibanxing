-- 爱伴行 第三期迁移：微信绑定 token 表
-- 在 Supabase SQL Editor 中执行

create table if not exists wechat_bind_tokens (
  token       text primary key,                        -- 随机生成的绑定token
  user_id     uuid not null references users(id) on delete cascade, -- 要绑定的账号
  openid      text,                                    -- 扫码后写入
  status      text not null default 'pending',         -- pending | done
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '10 minutes'
);

-- 10分钟过期，定期清理（可选，Supabase pg_cron 支持）
-- SELECT cron.schedule('clean-bind-tokens', '*/30 * * * *', 
--   'delete from wechat_bind_tokens where expires_at < now()');
