/**
 * [INPUT]: 依赖 api.js createApiClient 实例
 * [OUTPUT]: 对外提供 fetchInquiries、fetchCustomers、fetchChannels、fetchMetrics
 * [POS]: frontend/src 的 API 适配层，将后端响应映射为页面期望的 sampleData 同构形状
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */

/* ── 时间格式化 ── */
function fmtAge(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '昨天';
  return `${days} 天前`;
}

function fmtDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return null; }
}

/* ── inquiry_list_item → LEAD_QUEUE item ── */
function mapInquiry(item) {
  return {
    id: `inq-${item.id}`,
    _realId: item.id,
    source: item.source_channel,
    leadType: item.lead_type,
    stage: item.lifecycle_stage || 'new_lead',
    intent: item.intent_level || 'low',
    grade: item.grade || 'C',
    company: item.customer?.company || '(未知)',
    contact: item.customer?.name || '',
    country: item.customer?.country || '',
    flag: '',
    contactValue: item.customer?.email || item.customer?.phone || '',
    title: item.summary || '询盘',
    summary: item.summary || '',
    nextStep: null,
    due: fmtDate(item.next_followup_at),
    age: fmtAge(item.received_at),
    probability: item.grade || 'C',
    takeover: !!item.takeover_required,
    tags: item.tags || [],
    missing: [],
    assessment: null,
    qualificationScore: item.score != null ? Math.round(item.score) : 0,
    qualification: [],
    disposition: null,
    consent: null,
    sla: null,
    owner: null,
    lastTouch: fmtAge(item.received_at),
    priorityReason: null,
    matchedFields: [],
    clarificationQuestions: [],
    handoffReasons: [],
    replyDraft: '',
    conversationId: item.conversation_id,
    isHumanTakeover: item.is_human_takeover,
  };
}

/* ── customer_item → CUSTOMERS item ── */
function mapCustomer(item) {
  const emailDomain = item.email ? (item.email.split('@')[1] || '—') : '—';
  const stageTagMap = {
    human_takeover: '谈判中',
    quote_ready: '报价中',
    won: '已成交',
    followup: '跟进中',
    needs_discovery: '样品阶段',
    strong_intent: '老客户',
  };
  return {
    id: String(item.id),
    company: item.company || '',
    name: item.name || '',
    country: item.country || '',
    email: item.email || '',
    phone: item.phone || '',
    grade: item.grade || 'C',
    lifecycle_stage: item.lifecycle_stage || 'new_lead',
    intent_level: item.intent_level || 'low',
    tags: item.tags || [],
    tag: stageTagMap[item.lifecycle_stage] || '跟进中',
    inquiries: 1,
    deals: 0,
    value: 0,
    domain: emailDomain,
    note: '',
    buyingGroup: null,
    channels: item.channels || {},
    enrichment: item.enrichment || {},
    preferences: item.preferences || {},
    takeover_status: item.takeover_status,
    next_followup_at: item.next_followup_at,
    status: item.status,
  };
}

/* backend channel_type → frontend key */
const CHANNEL_TYPE_TO_KEY = { site_form: 'form', email: 'email', whatsapp: 'whatsapp', facebook: 'facebook', alibaba: 'alibaba', instagram: 'instagram' };

/* ── channel_item[] → { [frontendKey]: connectedMeta } ── */
function mapChannels(items) {
  const result = {};
  for (const ch of items) {
    /* email channels named '邮件桥接' are the email_bridge frontend key */
    let key = CHANNEL_TYPE_TO_KEY[ch.channel_type] || ch.channel_type;
    if (ch.channel_type === 'email' && ch.name === '邮件桥接') key = 'email_bridge';
    result[key] = {
      syncTime: '—',
      todayCount: 0,
      account: ch.name,
      status: ch.status === 'active' ? 'ok' : ch.status === 'error' ? 'error' : 'pending',
      credentialsConfigured: ch.credentials_configured,
      id: ch.id,
      operations: ch.operations || {},
    };
  }
  return result;
}

/* ── Public API ── */

export async function fetchInquiries(api) {
  const data = await api.get('/api/v1/inquiries?page_size=100');
  return (data.items || []).map(mapInquiry);
}

export async function fetchCustomers(api) {
  const data = await api.get('/api/v1/customers?page_size=100');
  return (data.items || []).map(mapCustomer);
}

export async function fetchChannels(api) {
  const data = await api.get('/api/v1/channels');
  return mapChannels(data.items || []);
}

export async function fetchMetrics(api) {
  return api.get('/api/v1/dashboard/metrics');
}
