-- 线索生命周期字段:把 Closer 从报价中心改为线索初筛、客户阶段和人工接管工作台。
ALTER TABLE customer
  ADD COLUMN IF NOT EXISTS lifecycle_stage varchar(32) NOT NULL DEFAULT 'new_lead',
  ADD COLUMN IF NOT EXISTS intent_level varchar(16) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS takeover_status varchar(24) NOT NULL DEFAULT 'ai_assist';

ALTER TABLE inquiry
  ADD COLUMN IF NOT EXISTS lead_type varchar(24) NOT NULL DEFAULT 'message',
  ADD COLUMN IF NOT EXISTS contact_source varchar(40),
  ADD COLUMN IF NOT EXISTS lifecycle_stage varchar(32) NOT NULL DEFAULT 'new_lead',
  ADD COLUMN IF NOT EXISTS intent_level varchar(16) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS takeover_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS takeover_reason varchar(80);

CREATE INDEX IF NOT EXISTS ix_customer_seller_lifecycle ON customer(seller_id, lifecycle_stage);
CREATE INDEX IF NOT EXISTS ix_inquiry_seller_lifecycle ON inquiry(seller_id, lifecycle_stage);
