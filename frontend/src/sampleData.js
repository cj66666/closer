/* ===== data.jsx ===== */
/* ============ 样例数据：Sunpath Outdoor（户外家具工贸卖家）============ */

const SELLER = {
  brand:'Closer', company:'Sunpath Outdoor Mfg.', name:'陈航 · Hank',
  category:'户外家具 / 家居用品', plan:'Pro · 月度', initials:'H',
};

/* 渠道元数据 */
const CHANNELS = {
  email:    {name:'邮件', icon:'mail',     color:'#5b6b7a'},
  whatsapp: {name:'WhatsApp', icon:'whatsapp', color:'#25933a'},
  website:  {name:'独立站表单', icon:'store',  color:'#1F5C8C'},
  alibaba:  {name:'阿里国际站', icon:'alibaba', color:'#e35b00'},
};

/* 询盘 / 会话列表 */
const INQUIRIES = [
  {
    id:'inq-1', grade:'A', channel:'whatsapp', pinned:true,
    company:'Garden Living BV', contact:'Sanne de Vries', country:'荷兰', flag:'🇳🇱',
    title:'PE 藤编转角沙发 · 200 套 · 鹿特丹', status:'guardrail',
    snippet:'我内部签批需要 $158/套，另外要 60 天账期…',
    value:36400, time:'2 分钟前', unread:true,
    tags:['真实采购','企业域名','明确规格'],
  },
  {
    id:'inq-2', grade:'A', channel:'email',
    company:'Coastal Home Group', contact:'Marco Bianchi', country:'意大利', flag:'🇮🇹',
    title:'户外餐桌椅 7 件套 · 询价 + 认证', status:'ai',
    snippet:'AI 正在核对 FSC 认证与海运报价…', value:28800, time:'14 分钟前', unread:false,
    tags:['真实采购','认证问询'],
  },
  {
    id:'inq-3', grade:'B', channel:'website',
    company:'Maple & Co.', contact:'Olivia Bennett', country:'英国', flag:'🇬🇧',
    title:'遮阳伞 · 数量待定', status:'followup', snippet:'AI 已发送第 2 轮跟进，等待回复',
    value:0, time:'1 小时前', unread:false, tags:['潜在','数量未明'],
  },
  {
    id:'inq-4', grade:'A', channel:'website',
    company:'Nordic Patio AS', contact:'Erik Lund', country:'挪威', flag:'🇳🇴',
    title:'躺椅 + 边几组合 · 120 套', status:'deal',
    snippet:'✅ PI 已确认，客户接受报价', value:21600, time:'3 小时前', unread:false,
    tags:['已成交'],
  },
  {
    id:'inq-5', grade:'B', channel:'email',
    company:'Sunrise Living', contact:'Aisha Karim', country:'阿联酋', flag:'🇦🇪',
    title:'藤编沙发 · 样品咨询', status:'ai',
    snippet:'AI 已回复样品政策，等待客户确认规格', value:0, time:'5 小时前', unread:false,
    tags:['潜在','样品'],
  },
  {
    id:'inq-6', grade:'C', channel:'alibaba',
    company:'(未注明)', contact:'tradexz88', country:'未知', flag:'🏳️',
    title:'“all products best price” 群发', status:'screened',
    snippet:'C 级：疑似同行套价 · 通用群发 · 无具体规格', value:0, time:'6 小时前', unread:false,
    tags:['疑似同行','已降级'],
  },
  {
    id:'inq-7', grade:'A', channel:'whatsapp',
    company:'Aussie Backyard Co.', contact:'Liam Hunter', country:'澳大利亚', flag:'🇦🇺',
    title:'户外沙发 + 茶几 · 80 套 · 复购', status:'human',
    snippet:'人工接管中 · 老客户返单，谈年度框架协议', value:15200, time:'昨天', unread:false,
    tags:['老客户','复购'],
  },
  {
    id:'inq-8', grade:'B', channel:'email',
    company:'Jardin Vert SARL', contact:'Camille Roux', country:'法国', flag:'🇫🇷',
    title:'花园家具 · 目录索取', status:'followup',
    snippet:'AI 已发送目录，安排第 1 轮跟进', value:0, time:'昨天', unread:false,
    tags:['潜在'],
  },
];

/* 状态 → 显示 */
const STATUS_META = {
  ai:        {label:'AI 自主处理中', pill:'pill-ai',      icon:'bot',  dot:'var(--primary)'},
  followup:  {label:'自动跟进中',    pill:'pill-pending', icon:'refresh', dot:'var(--orange)'},
  screened:  {label:'已甄别降级',    pill:'pill-human',   icon:'shield', dot:'var(--c-grey)'},
  guardrail: {label:'护栏触发 · 待确认', pill:'pill-guard', icon:'shield', dot:'var(--red)'},
  human:     {label:'人工接管中',    pill:'pill-human',   icon:'user', dot:'#4a5560'},
  deal:      {label:'已成交',        pill:'pill-deal',    icon:'checkCircle', dot:'var(--green)'},
};

/* ============ 核心会话脚本（Garden Living BV）============ */
const THREAD = [
  { id:'m1', role:'customer', lang:'EN', time:'09:02',
    text:`Hi, we are a garden furniture retailer in the Netherlands. We're interested in your PE rattan corner sofa sets for our 2026 spring collection. Could you send pricing for 200 sets delivered to Rotterdam? Also, how is the UV resistance and what warranty do you offer?`,
    zh:`你好，我们是荷兰的一家花园家具零售商。我们对贵司的 PE 藤编转角沙发套装很感兴趣，计划用于 2026 春季系列。能否提供 200 套发往鹿特丹的报价？另外，UV 耐候性如何、提供什么质保？` },
  { id:'m2', role:'screening', grade:'A', time:'09:02',
    signals:[
      {label:'企业邮箱域名 gardenliving.nl', ok:true},
      {label:'公司背调：荷兰注册零售商，12 家门店', ok:true},
      {label:'含明确规格 + 数量（200 套）', ok:true},
      {label:'行为信号：3 次访问产品页', ok:true},
    ],
    note:'综合评分 92/100 → 判定 A 级高价值真实采购，已置顶并提醒。' },
  { id:'m3', role:'understanding', time:'09:02',
    product:'Aspen 5-Seater PE Rattan Corner Sofa Set', sku:'OF-RT-205',
    parse:[['产品','PE 藤编转角沙发'],['数量','200 套'],['目的港','鹿特丹 Rotterdam'],['关注','UV 耐候 · 质保']],
    note:'已关联产品库 1 条、价格表 1 条（RAG）。' },
  { id:'m4', role:'ai', lang:'EN', time:'09:02',
    text:`Hi Sanne, thanks for reaching out! Our Aspen PE rattan uses UV-stabilized resin rated for 2000+ hours of sun exposure — no fading or cracking — backed by a 3-year frame warranty. Please find our pricing below for 200 sets, CIF Rotterdam 👇`,
    zh:`Sanne 你好，感谢联系！我们的 Aspen PE 藤编采用抗 UV 稳定树脂，耐晒 2000+ 小时不褪色、不开裂，并提供 3 年框架质保。以下是 200 套 CIF 鹿特丹的报价 👇` },
  { id:'m5', role:'quote', time:'09:03', quote:'Q1' },
  { id:'m6', role:'customer', lang:'EN', time:'09:21',
    text:`Thanks, looks good. But a competitor quoted us $165/set for a similar item. If we increase to 300 sets, can you do $160?`,
    zh:`谢谢，看起来不错。不过有同行给我们报了类似产品 $165/套。如果我们把数量加到 300 套，能做到 $160 吗？` },
  { id:'m7', role:'ai', lang:'EN', time:'09:21',
    text:`I appreciate you sharing that. At 300 sets you unlock our next price tier. I can offer $172/set CIF Rotterdam — and unlike many suppliers, that includes aluminium-reinforced frames and a 3-year warranty. Shall I update the PI to 300 sets?`,
    zh:`感谢告知。300 套可进入我们的下一档阶梯价。我可以给到 $172/套 CIF 鹿特丹——而且不同于多数供应商，这含铝合金加固框架与 3 年质保。需要我把 PI 更新为 300 套吗？` },
  { id:'m8', role:'customer', lang:'EN', time:'09:34',
    text:`We're close. I need $158/set to sign off internally, and we'd want 60-day payment terms after delivery.`,
    zh:`我们快谈拢了。我内部签批需要 $158/套，另外希望交货后给 60 天账期。` },
  { id:'m9', role:'guardrail', time:'09:34',
    hits:[
      {type:'底价红线', desc:'客户目标价 $158 < 你设定的底价 $168/套', level:'red'},
      {type:'敏感操作', desc:'要求 60 天账期（默认 30% 定金 + 发货前结清）', level:'red'},
    ],
    summary:'客户为 A 级真实采购（荷兰 12 家门店零售商），意向强、卡在价格与账期。AI 已在授权区间内让步至 $172/套（300 套），客户坚持 $158 + 60 天账期，已触及底价红线与账期红线，自动发送已暂停。',
    suggestion:'建议：可考虑 $168/套（守住底价）+ 赠运费保险，账期让步至「发货前结清 70%、到港后 30 天付尾款」，既守红线又给台阶。' },
];

/* 报价卡数据 */
const QUOTES = {
  Q1:{
    product:'Aspen 5-Seater PE Rattan Corner Sofa Set', sku:'OF-RT-205',
    incoterm:'CIF Rotterdam', currency:'USD',
    qty:200, unit:182, moq:50, validDays:14, validUntil:'2026-06-16',
    lines:[
      ['产品成本 / 套', 128],
      ['海运分摊 / 套（CIF 鹿特丹）', 21],
      ['目标利润 (18%)', 33],
    ],
    tiers:[
      {min:50,  max:99,  price:198},
      {min:100, max:199, price:189},
      {min:200, max:299, price:182, active:true},
      {min:300, max:null, price:172},
    ],
    floor:168,
    total:200*182,
    leadTime:'35–40 天', warranty:'3 年框架质保',
  },
};

/* ============ 工作台指标 ============ */
const KPIS = [
  {key:'today',  label:'今日新询盘', value:14, delta:'+3', up:true,  icon:'inbox',   accent:'var(--primary)', spark:[7,9,6,11,8,12,14]},
  {key:'todo',   label:'待我处理',   value:2,  delta:'转人工', up:null, icon:'hand',  accent:'var(--orange)', alert:true, spark:[1,3,2,4,2,1,2]},
  {key:'auto',   label:'自动处理率', value:'86%', delta:'+4pt', up:true, icon:'bot',  accent:'var(--green)', spark:[78,80,79,82,83,82,86]},
  {key:'conv',   label:'本月成交转化', value:'23%', delta:'+2pt', up:true, icon:'target', accent:'var(--green)', spark:[18,19,20,21,21,22,23]},
];

/* 待我处理队列（转人工） */
const TODO_QUEUE = [
  {id:'inq-1', grade:'A', flag:'🇳🇱', company:'Garden Living BV', reason:'底价红线 + 60 天账期', value:36400, time:'2 分钟前', tag:'底价'},
  {id:'inq-7', grade:'A', flag:'🇦🇺', company:'Aussie Backyard Co.', reason:'客户提出年度框架协议', value:15200, time:'昨天', tag:'合同'},
];

/* 实时询盘流 */
const STREAM = [
  {flag:'🇳🇱', company:'Garden Living BV', act:'触发底价护栏，已转人工', status:'guardrail', time:'09:34'},
  {flag:'🇮🇹', company:'Coastal Home Group', act:'AI 已发送 FSC 认证说明 + 报价', status:'ai', time:'09:18'},
  {flag:'🇳🇴', company:'Nordic Patio AS', act:'客户确认 PI，标记为已成交', status:'deal', time:'06:40'},
  {flag:'🇦🇪', company:'Sunrise Living', act:'AI 回复样品政策', status:'ai', time:'04:12'},
  {flag:'🇬🇧', company:'Maple & Co.', act:'自动第 2 轮跟进已发送', status:'followup', time:'昨天 22:05'},
];

/* 7 日趋势（询盘 / 成交） */
const TREND = [
  {d:'周一', inq:9,  deal:2},{d:'周二', inq:12, deal:3},{d:'周三', inq:8, deal:2},
  {d:'周四', inq:15, deal:4},{d:'周五', inq:11, deal:3},{d:'周六', inq:6, deal:1},{d:'今日', inq:14, deal:4},
];

/* 转化漏斗（数据看板） */
const FUNNEL = [
  {stage:'收到询盘', value:312, pct:100, color:'var(--primary)'},
  {stage:'甄别为真实(A/B)', value:198, pct:63, color:'#3a78a8'},
  {stage:'AI 自主报价', value:171, pct:55, color:'#4f93b8'},
  {stage:'进入议价/跟进', value:104, pct:33, color:'var(--orange)'},
  {stage:'成交 / 待拍板', value:72, pct:23, color:'var(--green)'},
];

const METRICS = [
  {label:'首次响应时长', value:'8', unit:'秒', sub:'目标：秒级', icon:'zap', good:true},
  {label:'询盘自动处理率', value:'86', unit:'%', sub:'+4pt 环比', icon:'bot', good:true},
  {label:'甄别准确率', value:'94', unit:'%', sub:'A/B/C 吻合度', icon:'target', good:true},
  {label:'报价采纳率', value:'41', unit:'%', sub:'+3pt 环比', icon:'doc', good:true},
  {label:'人工接管率', value:'14', unit:'%', sub:'越低越自主', icon:'hand', good:true},
  {label:'节省工时 / 周', value:'31', unit:'h', sub:'约等于 0.8 人', icon:'clock', good:true},
];

/* ============ 产品库 ============ */
const PRODUCTS = [
  {sku:'OF-RT-205', name:'Aspen 5-Seater PE Rattan Corner Sofa Set', cat:'藤编沙发', cost:128, moq:50, tier:'$172–198', stock:'现货', img:'#cfe0d6'},
  {sku:'OF-RT-118', name:'Bondi 4-Seater Rattan Lounge Set', cat:'藤编沙发', cost:96, moq:50, tier:'$132–155', stock:'现货', img:'#d8e3ec'},
  {sku:'OF-DN-330', name:'Verona 7-Piece Aluminium Dining Set', cat:'餐桌椅', cost:144, moq:30, tier:'$196–228', stock:'排产', img:'#e7e0d2'},
  {sku:'OF-LG-072', name:'Capri Reclining Sun Lounger', cat:'躺椅', cost:54, moq:80, tier:'$78–96', stock:'现货', img:'#e3dce8'},
  {sku:'OF-UM-014', name:'Sirocco 3m Cantilever Parasol', cat:'遮阳伞', cost:62, moq:60, tier:'$88–112', stock:'现货', img:'#dde7da'},
  {sku:'OF-RT-260', name:'Malibu Modular Sectional Sofa', cat:'藤编沙发', cost:176, moq:40, tier:'$236–278', stock:'排产', img:'#cfe0d6'},
];

/* ============ 客户 / CRM ============ */
const CUSTOMERS = [
  {id:'c1', company:'Garden Living BV', contact:'Sanne de Vries', flag:'🇳🇱', country:'荷兰', grade:'A',
   tag:'谈判中', deals:0, inquiries:3, value:36400, last:'2 分钟前', domain:'gardenliving.nl',
   note:'12 家线下门店 + 独立站；2026 春季选品，价格敏感但意向强。'},
  {id:'c7', company:'Aussie Backyard Co.', contact:'Liam Hunter', flag:'🇦🇺', country:'澳大利亚', grade:'A',
   tag:'老客户', deals:4, inquiries:9, value:182000, last:'昨天', domain:'aussiebackyard.com.au',
   note:'连续 2 年返单，谈年度框架协议。'},
  {id:'c4', company:'Nordic Patio AS', contact:'Erik Lund', flag:'🇳🇴', country:'挪威', grade:'A',
   tag:'已成交', deals:1, inquiries:2, value:21600, last:'3 小时前', domain:'nordicpatio.no',
   note:'首单 120 套躺椅组合，已确认 PI。'},
  {id:'c2', company:'Coastal Home Group', contact:'Marco Bianchi', flag:'🇮🇹', country:'意大利', grade:'A',
   tag:'报价中', deals:0, inquiries:1, value:28800, last:'14 分钟前', domain:'coastalhome.it',
   note:'关注 FSC 认证与海运时效。'},
  {id:'c5', company:'Sunrise Living', contact:'Aisha Karim', flag:'🇦🇪', country:'阿联酋', grade:'B',
   tag:'样品阶段', deals:0, inquiries:1, value:0, last:'5 小时前', domain:'sunriseliving.ae',
   note:'索样中，规格待定。'},
  {id:'c3', company:'Maple & Co.', contact:'Olivia Bennett', flag:'🇬🇧', country:'英国', grade:'B',
   tag:'跟进中', deals:0, inquiries:1, value:0, last:'1 小时前', domain:'mapleco.co.uk',
   note:'遮阳伞询盘，数量未明。'},
];

/* 客户档案时间线（Garden Living BV） */
const TIMELINE = [
  {time:'今天 09:34', type:'guard', text:'触发底价护栏 + 账期红线，转人工待拍板'},
  {time:'今天 09:21', type:'ai',   text:'AI 让步至 $172/套（300 套阶梯价）'},
  {time:'今天 09:03', type:'quote',text:'AI 自动生成报价 Q1：200 套 · $182/套 · CIF 鹿特丹'},
  {time:'今天 09:02', type:'ai',   text:'AI 母语回复，说明 UV 耐候与 3 年质保'},
  {time:'今天 09:02', type:'screen',text:'甄别为 A 级（评分 92），自动置顶'},
  {time:'今天 09:02', type:'in',   text:'WhatsApp 收到询盘：200 套 PE 藤编转角沙发'},
];

/* 渠道连接（设置页） */
const CONNECTIONS = [
  {key:'website',  connected:true,  detail:'sunpath-outdoor.com/contact', meta:'本月 47 条'},
  {key:'email',    connected:true,  detail:'sales@sunpath-outdoor.com', meta:'IMAP/SMTP 已验证'},
  {key:'whatsapp', connected:true,  detail:'WhatsApp Business · +86 138••••', meta:'官方 API'},
  {key:'alibaba',  connected:false, detail:'阿里国际站站内信', meta:'未连接'},
];

/* ── 待确认条目（分诊低置信，需人工一键判定） ── */
const TRIAGE_PENDING = [
  {
    id:'tp-1', from:'reorder@coastal-home.com', subject:'Re: 户外餐桌椅——需再询价',
    snippet:'Hi again, sorry to bother — we actually need another 80 sets for our new store opening...',
    channel:'email', time:'刚刚', flag:'🇮🇹', country:'意大利',
    triage:{
      category:'可能询盘', confidence:61,
      signals:[
        {label:'"Re:" 回复标题，疑似跟进',ok:false},
        {label:'已知联系人 (Marco Bianchi)',ok:true},
        {label:'正文含数量"80 sets"',ok:true},
        {label:'无附件，无目的港',ok:false},
      ],
      reason:'含明确数量但来自已有往来，无法确认是新询盘还是内部转发，置信度 61%，进待确认。',
    },
  },
  {
    id:'tp-2', from:'jack.liu@storeplus-ca.com', subject:'Looking for outdoor furniture supplier',
    snippet:"Hi, I'm Jack, running a small garden center in Toronto. Can you quote me on some chairs?",
    channel:'email', time:'9 分钟前', flag:'🇨🇦', country:'加拿大',
    triage:{
      category:'可能询盘', confidence:54,
      signals:[
        {label:'免费邮箱域名（storeplus-ca.com 未知域）',ok:false},
        {label:'无规格 / 数量 / 认证要求',ok:false},
        {label:'提及"outdoor furniture"相关词',ok:true},
        {label:'首次来信，无背调记录',ok:false},
      ],
      reason:'模糊咨询，缺乏规格与数量，置信度 54%。建议人工快速判断是否值得跟进。',
    },
  },
  {
    id:'tp-3', from:'procurement@buildrex.ae', subject:'Tender RFQ — Outdoor Seating Q3 2026',
    snippet:'Dear Supplier, please find our RFQ attached. We require 400 units for a hospitality project...',
    channel:'email', time:'26 分钟前', flag:'🇦🇪', country:'阿联酋',
    triage:{
      category:'高概率询盘', confidence:88,
      signals:[
        {label:'企业域名 buildrex.ae，背调：迪拜建筑承包商',ok:true},
        {label:'标题含 RFQ，正式采购术语',ok:true},
        {label:'提及 400 套，含附件（PDF 未解析）',ok:true},
        {label:'附件未解析完成，规格未提取',ok:false},
      ],
      reason:'极高置信但含未解析附件，建议确认后进收件箱，AI 将读取 RFQ 完成理解卡。',
    },
  },
];

/* ── 已归档噪音条目 ── */
const ARCHIVED_ITEMS = [
  {id:'ar-1', from:'noreply@alibaba.com',         subject:'你的店铺本月访客增加了 12%',               channel:'email', time:'今天 10:12', type:'平台通知'},
  {id:'ar-2', from:'promo@shopify-partners.com',  subject:'Black Friday: 3 months free on Shopify!',  channel:'email', time:'今天 09:27', type:'推销'},
  {id:'ar-3', from:'leads@trade-network.net',     subject:'500+ verified buyers looking for furniture',channel:'email', time:'昨天 16:44', type:'垃圾邮件'},
  {id:'ar-4', from:'auto-reply@coastal-home.com', subject:'Out of office: back Jul 14',               channel:'email', time:'昨天 08:03', type:'自动回复'},
  {id:'ar-5', from:'newsletter@furniworld.eu',    subject:'Furni World June Trends 2026',             channel:'email', time:'前天',       type:'Newsletter'},
];

/* ── 老客户往来 ── */
const OLD_CUSTOMERS = [
  {
    id:'oc-1', company:'Aussie Backyard Co.', contact:'Liam Hunter', flag:'🇦🇺', country:'澳大利亚',
    channel:'whatsapp', time:'昨天 15:40', unread:true,
    lastMsg:'Hi Hank, we wanna do another round — same products but maybe 100 sets this time. Got a better rate?',
    lastMsgZh:'嗨 Hank，我们想再来一轮——同款产品，可能是 100 套。有更好的价格吗？',
    note:'复购询价 · 年度框架协议商谈中', orderHistory:[{date:'2025-03',value:15200,desc:'户外沙发 80 套'}],
  },
];

/* ============ 智能报价 ============ */
const QUOTE_WORKBENCH = [
  {
    id:'inq-1', company:'Garden Living BV', contact:'Sanne de Vries', flag:'🇳🇱', country:'荷兰',
    grade:'A', channel:'whatsapp', status:'guardrail',
    product:'Aspen 5-Seater PE Rattan Corner Sofa Set', sku:'OF-RT-205',
    qty:300, incoterm:'CIF Rotterdam', currency:'USD',
    cost:128, logistics:21, base:149, floor:168, hardMin:155,
    options:[
      {key:'conservative', label:'保守', price:185, margin:19.5, winRate:72, expectedMargin:14.0},
      {key:'recommended',  label:'推荐', price:172, margin:13.4, winRate:85, expectedMargin:11.4, recommended:true},
      {key:'aggressive',   label:'进取', price:162, margin:8.7,  winRate:93, expectedMargin:8.1},
    ],
    reasoning:'买家 Sanne（荷兰 B2B 零售商，12 家门店，A 级），首次采购 300 套，对价格中度敏感。欧洲区域均价 $175–$185，买家已透露竞对报 $165。推荐 $172：毛利 13.4%，历史同类买家赢率 85%，期望毛利最优（11.4%）。保守档 $185 赢率低（72%）；进取档 $162 毛利仅 8.7%，性价比不高。',
    buyerSignals:[
      '竞对参考价 $165（买家主动透露）',
      '数量从 200 套升至 300 套，意向升级',
      '欧洲春季旺季备货，时间有压力',
      '内部签批需 $158，但底价不可破',
    ],
    concessions:[
      {rank:1, type:'运费险',  value:'免费附加',    desc:'货运保险价值约 $2/套，增值不降价，客户感知价值高',  maxGive:'$2/套当量', safe:true},
      {rank:2, type:'账期',   value:'Net-30',      desc:'发货前付 70%，到港后 30 天结清（拒绝 60 天）',   maxGive:'30 天账期', safe:true},
      {rank:3, type:'赠品',   value:'展厅样品×1',  desc:'随货附赠 1 套用于展厅陈列，增加黏性',             maxGive:'1 套', safe:true},
      {rank:4, type:'交期',   value:'提前 5 天',   desc:'插队排产，交货从 40 天缩至 35 天',                maxGive:'5 天', safe:true},
      {rank:5, type:'价格',   value:'最多 $168',   desc:'最多让至软底价 $168；触及即自动转人工，AI 不发送', maxGive:'$4/套', safe:false},
    ],
  },
  {
    id:'inq-2', company:'Coastal Home Group', contact:'Marco Bianchi', flag:'🇮🇹', country:'意大利',
    grade:'A', channel:'email', status:'ai',
    product:'Aspen 5-Seater PE Rattan Corner Sofa Set', sku:'OF-RT-205',
    qty:150, incoterm:'CIF Genoa', currency:'USD',
    cost:128, logistics:19, base:147, floor:168, hardMin:155,
    options:[
      {key:'conservative', label:'保守', price:192, margin:23.4, winRate:65, expectedMargin:15.2},
      {key:'recommended',  label:'推荐', price:182, margin:19.2, winRate:80, expectedMargin:15.4, recommended:true},
      {key:'aggressive',   label:'进取', price:175, margin:16.0, winRate:88, expectedMargin:14.1},
    ],
    reasoning:'买家 Marco（意大利，A 级，首次来信），询价 150 套 CIF Genoa，重点关注 FSC 认证与海运时效。无历史价格锚点，适度保守。推荐 $182 在高赢率（80%）与目标毛利（19.2%）之间取得最优平衡，附认证文件可进一步拉开差异化。',
    buyerSignals:[
      'FSC 认证是采购门槛（欧盟合规型买家）',
      '150 套处于 100–199 档',
      '首次来信，无历史价格锚点可供参考',
      '明确询问海运时效，看重供应链稳定',
    ],
    concessions:[
      {rank:1, type:'认证包',  value:'FSC+SGS',   desc:'提供 FSC 认证 + SGS 检测报告（已有，增加信任度）', maxGive:'无额外成本', safe:true},
      {rank:2, type:'样品',   value:'验厂样品',   desc:'先寄 1 套验货，运费到付',                          maxGive:'$182 样品价', safe:true},
      {rank:3, type:'交期',   value:'书面承诺',   desc:'提供正式交期承诺函，最长 40 天',                    maxGive:'无额外成本', safe:true},
      {rank:4, type:'价格',   value:'最多 $168',  desc:'最多让至软底价 $168',                             maxGive:'$14/套', safe:false},
    ],
  },
  {
    id:'inq-7', company:'Aussie Backyard Co.', contact:'Liam Hunter', flag:'🇦🇺', country:'澳大利亚',
    grade:'A', channel:'whatsapp', status:'human',
    product:'Aspen 5-Seater PE Rattan Corner Sofa Set', sku:'OF-RT-205',
    qty:100, incoterm:'FOB Ningbo', currency:'USD',
    cost:128, logistics:15, base:143, floor:168, hardMin:155,
    options:[
      {key:'conservative', label:'保守', price:198, margin:27.8, winRate:60, expectedMargin:16.7},
      {key:'recommended',  label:'推荐', price:186, margin:23.1, winRate:82, expectedMargin:18.9, recommended:true},
      {key:'aggressive',   label:'进取', price:176, margin:18.8, winRate:91, expectedMargin:17.1},
    ],
    reasoning:'老客户 Liam（澳大利亚，复购 4 次，历史总值 $182K）。本次 100 套 FOB，谈年度框架协议。复购老客价格弹性高，推荐 $186 期望毛利最优（18.9%）。若确认年度协议量 ≥500 套，可另议年度阶梯价，维系长期合作。',
    buyerSignals:[
      '老客户 · 复购 4 次 · 历史合作金额 $182K',
      '主动提出年度框架协议意向',
      '100 套 FOB，物流成本比 CIF 低 $6/套',
      '关系维系优先于最大化单次利润',
    ],
    concessions:[
      {rank:1, type:'老客专属', value:'复购折扣 3%', desc:'老客户专属复购折扣体现长期合作价值',            maxGive:'约 $6/套', safe:true},
      {rank:2, type:'账期',    value:'Net-45',       desc:'老客户延长至 45 天账期（比新客多 15 天）',       maxGive:'账期延长', safe:true},
      {rank:3, type:'年度协议', value:'量价联动',    desc:'若年度总量 ≥500 套，另行谈判年度阶梯（需管理员批准）', maxGive:'管理员审批', safe:true},
      {rank:4, type:'价格',   value:'最多 $168',     desc:'最多让至软底价 $168',                          maxGive:'$18/套', safe:false},
    ],
  },
];

const QUOTE_RECORDS = [
  {id:'qr-1', company:'Garden Living BV',   contact:'Sanne de Vries', flag:'🇳🇱',
   sku:'OF-RT-205', qty:300, price:172, currency:'USD', incoterm:'CIF Rotterdam',
   status:'negotiating', createdAt:'今天 09:36', channel:'whatsapp', grade:'A',
   history:[
     {at:'09:36', action:'AI 自动发送初始报价 $182/套（200 套）', by:'ai'},
     {at:'09:21', action:'AI 让步至 $172/套（300 套阶梯）', by:'ai'},
     {at:'09:34', action:'买家还价 $158 + 60 天账期 → 触发底价护栏', by:'buyer'},
     {at:'09:35', action:'转人工待拍板', by:'system'},
   ]},
  {id:'qr-2', company:'Coastal Home Group', contact:'Marco Bianchi',   flag:'🇮🇹',
   sku:'OF-RT-205', qty:150, price:182, currency:'USD', incoterm:'CIF Genoa',
   status:'sent', createdAt:'今天 08:45', channel:'email', grade:'A'},
  {id:'qr-3', company:'Nordic Patio AS',    contact:'Erik Lund',       flag:'🇳🇴',
   sku:'OF-RT-205', qty:120, price:189, currency:'USD', incoterm:'CIF Oslo',
   status:'pi_pending', createdAt:'今天 07:20', channel:'website', grade:'A',
   piNote:'买家已确认价格，PI 生成完毕，待管理员审批后发送'},
  {id:'qr-4', company:'Aussie Backyard Co.',contact:'Liam Hunter',     flag:'🇦🇺',
   sku:'OF-RT-205', qty:80,  price:198, currency:'USD', incoterm:'FOB Ningbo',
   status:'deal', createdAt:'2026-03-15', channel:'whatsapp', grade:'A', dealValue:15840},
  {id:'qr-5', company:'Jardin Vert SARL',  contact:'Camille Roux',    flag:'🇫🇷',
   sku:'OF-RT-205', qty:60,  price:198, currency:'USD', incoterm:'CIF Marseille',
   status:'expired', createdAt:'2026-06-12', channel:'email', grade:'B'},
];

export { SELLER, CHANNELS, INQUIRIES, STATUS_META, THREAD, QUOTES, KPIS, TODO_QUEUE, STREAM, TREND, FUNNEL, METRICS, PRODUCTS, CUSTOMERS, TIMELINE, CONNECTIONS, TRIAGE_PENDING, ARCHIVED_ITEMS, OLD_CUSTOMERS, QUOTE_WORKBENCH, QUOTE_RECORDS };
