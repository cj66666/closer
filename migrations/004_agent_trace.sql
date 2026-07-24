-- Agent 决策回放:记录一次 AI 运行及其可解释事件流。
CREATE TABLE IF NOT EXISTS agent_run (
  id BIGSERIAL PRIMARY KEY,
  seller_id bigint NOT NULL REFERENCES seller(id),
  inquiry_id bigint REFERENCES inquiry(id),
  conversation_id bigint REFERENCES conversation(id),
  run_uid varchar(36) NOT NULL,
  source varchar(32) NOT NULL DEFAULT 'graph',
  model varchar(160),
  user_prompt text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'running',
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  run_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_agent_run_run_uid UNIQUE (run_uid)
);

CREATE TABLE IF NOT EXISTS agent_trace_event (
  id BIGSERIAL PRIMARY KEY,
  seller_id bigint NOT NULL REFERENCES seller(id),
  agent_run_id bigint NOT NULL REFERENCES agent_run(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  event_type varchar(40) NOT NULL,
  node varchar(80),
  tool_name varchar(80),
  status varchar(20) NOT NULL DEFAULT 'ok',
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_agent_trace_event_run_sequence UNIQUE (agent_run_id, sequence)
);

CREATE INDEX IF NOT EXISTS ix_agent_run_seller_created_at ON agent_run(seller_id, created_at);
CREATE INDEX IF NOT EXISTS ix_agent_run_inquiry_created_at ON agent_run(inquiry_id, created_at);
CREATE INDEX IF NOT EXISTS ix_agent_run_conversation_created_at ON agent_run(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS ix_agent_trace_event_run_sequence ON agent_trace_event(agent_run_id, sequence);
CREATE INDEX IF NOT EXISTS ix_agent_trace_event_seller_created_at ON agent_trace_event(seller_id, created_at);
