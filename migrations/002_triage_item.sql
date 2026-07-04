-- 入站分诊落点表:非询盘/待确认的入站先进这里,确认后才提升为询盘。
CREATE TABLE triage_item (
  id BIGSERIAL PRIMARY KEY,
  seller_id bigint NOT NULL REFERENCES seller(id),
  channel_type varchar(20),
  channel_account_id bigint REFERENCES channel_account(id),
  channel_message_id varchar(120),
  sender_email varchar(160),
  sender_name varchar(160),
  subject varchar(255),
  content text,
  category varchar(24) NOT NULL,
  route varchar(24) NOT NULL,
  bucket varchar(24) NOT NULL,
  confidence numeric(4,3),
  signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(20) NOT NULL DEFAULT 'pending',
  customer_id bigint REFERENCES customer(id),
  inquiry_id bigint REFERENCES inquiry(id),
  language varchar(12),
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_triage_item_seller_bucket_status ON triage_item (seller_id, bucket, status);
CREATE INDEX ix_triage_item_channel_message_id ON triage_item (channel_message_id);
