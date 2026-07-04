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
  facebook: {name:'Facebook', icon:'message', color:'#1877F2'},
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
    snippet:'AI 正在核对 FSC 认证并补齐报价前信息…', value:28800, time:'14 分钟前', unread:false,
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
    snippet:'✅ 客户已确认，进入交付跟踪', value:21600, time:'3 小时前', unread:false,
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
  ai:        {label:'AI 协助沟通中', pill:'pill-ai',      icon:'bot',  dot:'var(--primary)'},
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
    text:`Hi Sanne, thanks for reaching out! Our Aspen PE rattan uses UV-stabilized resin rated for 2000+ hours of sun exposure and comes with a 3-year frame warranty. I will prepare the key details for Hank to confirm pricing and lead time. Before that, may I confirm whether 200 sets is the first shipment quantity?`,
    zh:`Sanne 你好，感谢联系！我们的 Aspen PE 藤编采用抗 UV 稳定树脂，耐晒 2000+ 小时，并提供 3 年框架质保。我会先整理关键信息给 Hank 确认价格和交期。在此之前，想确认 200 套是否为首批数量？` },
  { id:'m5', role:'quote', time:'09:03', quote:'Q1' },
  { id:'m6', role:'customer', lang:'EN', time:'09:21',
    text:`Thanks, looks good. But a competitor quoted us $165/set for a similar item. If we increase to 300 sets, can you do $160?`,
    zh:`谢谢，看起来不错。不过有同行给我们报了类似产品 $165/套。如果我们把数量加到 300 套，能做到 $160 吗？` },
  { id:'m7', role:'ai', lang:'EN', time:'09:21',
    text:`I appreciate you sharing that. At 300 sets you may qualify for the next price tier, but final pricing and payment terms need Hank's confirmation. I have flagged the request and included the aluminium-reinforced frame and 3-year warranty details for his quote review.`,
    zh:`感谢告知。300 套可能进入下一档阶梯价，但最终价格和账期需要 Hank 确认。我已标记该需求，并把铝合金加固框架与 3 年质保信息整理进报价复核材料。` },
  { id:'m8', role:'customer', lang:'EN', time:'09:34',
    text:`We're close. I need $158/set to sign off internally, and we'd want 60-day payment terms after delivery.`,
    zh:`我们快谈拢了。我内部签批需要 $158/套，另外希望交货后给 60 天账期。` },
  { id:'m9', role:'guardrail', time:'09:34',
    hits:[
      {type:'底价红线', desc:'客户目标价 $158 < 你设定的底价 $168/套', level:'red'},
      {type:'敏感操作', desc:'要求 60 天账期（默认 30% 定金 + 发货前结清）', level:'red'},
    ],
    summary:'客户为 A 级真实采购（荷兰 12 家门店零售商），意向强、卡在价格与账期。系统已整理 300 套阶梯价参考与风险点，客户坚持 $158 + 60 天账期，已触及底价红线与账期红线，自动发送已暂停。',
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
  {key:'auto',   label:'5 分钟接住率', value:'86%', delta:'+4pt', up:true, icon:'bot',  accent:'var(--green)', spark:[78,80,79,82,83,82,86]},
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
  {flag:'🇮🇹', company:'Coastal Home Group', act:'AI 已发送 FSC 认证说明，等待补数量', status:'ai', time:'09:18'},
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
  {stage:'需求确认 / 报价准备', value:171, pct:55, color:'#4f93b8'},
  {stage:'进入议价/跟进', value:104, pct:33, color:'var(--orange)'},
  {stage:'成交 / 待拍板', value:72, pct:23, color:'var(--green)'},
];

const METRICS = [
  {label:'首次响应时长', value:'8', unit:'秒', sub:'目标：秒级', icon:'zap', good:true},
  {label:'5 分钟接住率', value:'86', unit:'%', sub:'+4pt 环比', icon:'bot', good:true},
  {label:'甄别准确率', value:'94', unit:'%', sub:'A/B/C 吻合度', icon:'target', good:true},
  {label:'接管后报价推进率', value:'41', unit:'%', sub:'+3pt 环比', icon:'doc', good:true},
  {label:'人工接管率', value:'14', unit:'%', sub:'清晰识别需人工节点', icon:'hand', good:true},
  {label:'节省工时 / 周', value:'31', unit:'h', sub:'约等于 0.8 人', icon:'clock', good:true},
];

/* ============ 产品库 ============ */
const PRODUCTS = [
  {sku:'OF-RT-205', name:'Aspen 5-Seater PE Rattan Corner Sofa Set', cat:'藤编沙发', cost:128, moq:50, tier:'$172–198', stock:'现货', img:'#cfe0d6', image:'/products/4.jpg', priced:true},
  {sku:'OF-RT-118', name:'Bondi 4-Seater Rattan Lounge Set', cat:'藤编沙发', cost:96, moq:50, tier:'$132–155', stock:'现货', img:'#d8e3ec', image:'/products/3.jpg', priced:true},
  {sku:'OF-DN-330', name:'Verona 7-Piece Aluminium Dining Set', cat:'餐桌椅', cost:144, moq:30, tier:'$196–228', stock:'排产', img:'#e7e0d2', image:'/products/1.jpg', priced:false},
  {sku:'OF-LG-072', name:'Capri Reclining Sun Lounger', cat:'躺椅', cost:54, moq:80, tier:'$78–96', stock:'现货', img:'#e3dce8', image:'/products/2.jpg', priced:true},
  {sku:'OF-UM-014', name:'Sirocco 3m Cantilever Parasol', cat:'遮阳伞', cost:62, moq:60, tier:'$88–112', stock:'现货', img:'#dde7da', image:'/products/6.jpg', priced:false},
  {sku:'OF-RT-260', name:'Malibu Modular Sectional Sofa', cat:'藤编沙发', cost:176, moq:40, tier:'$236–278', stock:'排产', img:'#cfe0d6', image:'/products/5.jpg', priced:true},
];

/* ============ 客户 / CRM ============ */
const CUSTOMERS = [
  {id:'c1', company:'Garden Living BV', contact:'Sanne de Vries', flag:'🇳🇱', country:'荷兰', grade:'A',
   tag:'谈判中', deals:0, inquiries:3, value:36400, last:'2 分钟前', domain:'gardenliving.nl',
   lifecycle_stage:'human_takeover', intent_level:'high', tags:['真实买家','高意向','需人工报价'],
   note:'12 家线下门店 + 独立站；2026 春季选品，价格敏感但意向强。',
   vtier:'高潜新客',
   prefs:{price:'高（压价强）', terms:'倾向 60 天账期', category:'PE 藤编 / 户外沙发', cert:'REACH · FSC', lang:'英语 · 欧洲中部时区'},
   nextAction:{priority:'今日必跟', when:'护栏待确认 · 2 分钟前', script:'守住 $168 软底价，给「发货前结清 70%」替代账期，换取签单'}},
  {id:'c7', company:'Aussie Backyard Co.', contact:'Liam Hunter', flag:'🇦🇺', country:'澳大利亚', grade:'A',
   tag:'老客户', deals:4, inquiries:9, value:182000, last:'昨天', domain:'aussiebackyard.com.au',
   lifecycle_stage:'strong_intent', intent_level:'high', tags:['老客户','复购','强意向'],
   note:'连续 2 年返单，谈年度框架协议。',
   vtier:'核心客户',
   prefs:{price:'中（复购稳定）', terms:'Net-45', category:'户外家具组合', cert:'AS/NZS', lang:'英语 · 悉尼时区'},
   nextAction:{priority:'本周跟进', when:'年度框架协议', script:'推年度阶梯价锁单，给复购 3% 专属折扣维系长期合作'}},
  {id:'c4', company:'Nordic Patio AS', contact:'Erik Lund', flag:'🇳🇴', country:'挪威', grade:'A',
   tag:'已成交', deals:1, inquiries:2, value:21600, last:'3 小时前', domain:'nordicpatio.no',
   lifecycle_stage:'won', intent_level:'high', tags:['真实买家','已成交','交付跟踪'],
   note:'首单 120 套躺椅组合，已确认 PI。',
   vtier:'成长客户',
   prefs:{price:'中', terms:'30% 定金', category:'躺椅 / 庭院', cert:'CE', lang:'英语 · 奥斯陆时区'},
   nextAction:{priority:'交付跟踪', when:'PI 已确认', script:'跟进生产排期与海运时效，铺垫二次复购'}},
  {id:'c2', company:'Coastal Home Group', contact:'Marco Bianchi', flag:'🇮🇹', country:'意大利', grade:'A',
   tag:'报价中', deals:0, inquiries:1, value:28800, last:'14 分钟前', domain:'coastalhome.it',
   lifecycle_stage:'needs_discovery', intent_level:'medium', tags:['真实买家','认证问询','待补需求'],
   note:'关注 FSC 认证与海运时效。',
   vtier:'高潜新客',
   prefs:{price:'中', terms:'待定', category:'户外餐桌椅', cert:'FSC', lang:'意大利语 / 英语 · 罗马时区'},
   nextAction:{priority:'今日跟进', when:'报价已发 · 14 分钟前', script:'强调 FSC 认证与海运时效，催确认规格与数量'}},
  {id:'c5', company:'Sunrise Living', contact:'Aisha Karim', flag:'🇦🇪', country:'阿联酋', grade:'B',
   tag:'样品阶段', deals:0, inquiries:1, value:0, last:'5 小时前', domain:'sunriseliving.ae',
   lifecycle_stage:'needs_discovery', intent_level:'medium', tags:['样品','待补需求'],
   note:'索样中，规格待定。',
   vtier:'潜力客户',
   prefs:{price:'未知', terms:'待定', category:'藤编沙发', cert:'—', lang:'英语 · 迪拜时区'},
   nextAction:{priority:'低优先', when:'索样中', script:'确认样品规格与目的港，推进打样'}},
  {id:'c3', company:'Maple & Co.', contact:'Olivia Bennett', flag:'🇬🇧', country:'英国', grade:'B',
   tag:'跟进中', deals:0, inquiries:1, value:0, last:'1 小时前', domain:'mapleco.co.uk',
   lifecycle_stage:'followup', intent_level:'medium', tags:['潜在','数量未明','跟进中'],
   note:'遮阳伞询盘，数量未明。',
   vtier:'潜力客户',
   prefs:{price:'未知', terms:'待定', category:'遮阳伞', cert:'—', lang:'英语 · 伦敦时区'},
   nextAction:{priority:'低优先', when:'数量未明', script:'追问目标数量与使用场景，判断是否真实采购'}},
];

/* 客户档案时间线（Garden Living BV） */
const TIMELINE = [
  {time:'今天 09:34', type:'guard', text:'触发底价护栏 + 账期红线，转人工待拍板'},
  {time:'今天 09:21', type:'ai',   text:'AI 让步至 $172/套（300 套阶梯价）'},
  {time:'今天 09:03', type:'quote',text:'AI 整理报价准备材料：200 套 · CIF 鹿特丹 · 需人工确认'},
  {time:'今天 09:02', type:'ai',   text:'AI 母语回复，说明 UV 耐候与 3 年质保'},
  {time:'今天 09:02', type:'screen',text:'甄别为 A 级（评分 92），自动置顶'},
  {time:'今天 09:02', type:'in',   text:'WhatsApp 收到询盘：200 套 PE 藤编转角沙发'},
];

/* 渠道连接（设置页） */
const CONNECTIONS = [
  {key:'website',  connected:true,  detail:'sunpath-outdoor.com/contact', meta:'本月 47 条'},
  {key:'email',    connected:true,  detail:'sales@sunpath-outdoor.com', meta:'IMAP/SMTP 已验证'},
  {key:'whatsapp', connected:true,  detail:'WhatsApp Business · +86 138••••', meta:'官方 API'},
  {key:'facebook', connected:false, detail:'Facebook Lead Ads · 手动录入', meta:'API 后置'},
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

/* ============ 报价准备 / 人工报价 ============ */
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
  {
    id:'rfq-1', kind:'rfq', company:'Westfield Retail Group', contact:'Daniel Carter', flag:'🇬🇧', country:'英国',
    grade:'A', channel:'email', status:'ai', currency:'USD', incoterm:'CIF Felixstowe',
    source:'Westfield_RFQ_2026SS.xlsx', rfqNo:'RFQ-2026-0412', parsedAt:'14 分钟前',
    lines:[
      {sku:'OF-RT-205', product:'Aspen 5-Seater PE Rattan Corner Sofa Set', qty:200, target:176, cost:128, logistics:21, floor:168, hardMin:155, aiPrice:182},
      {sku:'OF-RT-118', product:'Bondi 4-Seater Rattan Lounge Set',          qty:150, target:150, cost:96,  logistics:18, floor:128, hardMin:118, aiPrice:138},
      {sku:'OF-LG-072', product:'Capri Reclining Sun Lounger',               qty:400, target:84,  cost:54,  logistics:9,  floor:82,  hardMin:74,  aiPrice:88},
      {sku:'OF-DN-330', product:'Verona 7-Piece Aluminium Dining Set',       qty:60,  target:198, cost:144, logistics:34, floor:210, hardMin:188, aiPrice:228},
      {sku:'OF-UM-014', product:'Sirocco 3m Cantilever Parasol',             qty:120, target:95,  cost:62,  logistics:11, floor:92,  hardMin:80,  aiPrice:108},
    ],
  },
];

const QUOTE_RECORDS = [
  {id:'qr-1', company:'Garden Living BV',   contact:'Sanne de Vries', flag:'🇳🇱',
   sku:'OF-RT-205', qty:300, price:172, currency:'USD', incoterm:'CIF Rotterdam',
   status:'negotiating', createdAt:'今天 09:36', channel:'whatsapp', grade:'A',
   history:[
     {at:'09:36', action:'AI 整理初始报价准备 $182/套（200 套），待人工确认', by:'ai'},
     {at:'09:21', action:'AI 标记可参考 $172/套（300 套阶梯），不可自动承诺', by:'ai'},
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

const LIFECYCLE_STAGES = [
  {key:'new_lead', label:'新线索', color:'var(--text-2)'},
  {key:'first_contact_due', label:'待首次联系', color:'#1877F2'},
  {key:'contacted', label:'已联系', color:'var(--primary)'},
  {key:'needs_discovery', label:'需求确认中', color:'#CA8A04'},
  {key:'strong_intent', label:'强意向', color:'var(--green)'},
  {key:'quote_ready', label:'待人工报价', color:'var(--orange)'},
  {key:'quoted', label:'已报价', color:'var(--primary)'},
  {key:'followup', label:'跟进中', color:'var(--tech-deep)'},
  {key:'human_takeover', label:'人工接管', color:'var(--red)'},
  {key:'won', label:'成交', color:'var(--green)'},
  {key:'lost', label:'丢单', color:'var(--c-grey)'},
];

const CHANNEL_READINESS = [
  {key:'email', label:'Email', status:'degraded', statusLabel:'授权异常', detail:'IMAP 授权码过期，新邮件暂停同步', next:'更新授权码'},
  {key:'whatsapp', label:'WhatsApp', status:'ready', statusLabel:'正常', detail:'Cloud API 已接入，3 分钟前同步', next:'模板检查'},
  {key:'facebook', label:'Facebook', status:'manual', statusLabel:'手动入口', detail:'Lead Ads 支持手动录入 / CSV，Graph API 后置', next:'导入留资'},
  {key:'website', label:'独立站表单', status:'ready', statusLabel:'正常', detail:'Webhook 实时推送，刚刚同步', next:'查看表单'},
];

const LEAD_QUEUE = [
  {
    id:'lead-fb-1', source:'facebook', leadType:'contact_only', stage:'first_contact_due', intent:'medium', grade:'B',
    company:'Westfield Retail Group', contact:'Daniel Carter', country:'英国', flag:'🇬🇧',
    contactValue:'+44 20 0000 0000', title:'Facebook Lead Ads 留资 · 户外家具目录',
    summary:'客户只留下电话和公司名，需要业务员主动首次联系，确认采购品类、数量、目的地和时间要求。',
    nextStep:'今天 16:00 前首次联系，开场先确认是否在找 2026 春季户外家具供应商。',
    due:'今天 16:00', age:'18 分钟前', probability:'B', takeover:true,
    tags:['Facebook 来源','仅留联系方式','待补需求'], missing:['采购品类','目标数量','目的港','预算区间'],
    assessment:{authenticity:'likely_real', validity:'needs_more_info', deal_probability:'B'},
    sla:{target:'5 分钟', elapsed:'18 分钟', pct:100, status:'overdue', label:'已超 SLA'},
    owner:'Hank', lastTouch:'未联系',
    priorityReason:'仅留联系方式最容易漏跟，且公司名完整、来源为 Lead Ads，应先验证是否真实采购。',
    matchedFields:[
      {label:'联系方式', value:'电话已留', ok:true},
      {label:'公司身份', value:'公司名已留', ok:true},
      {label:'采购需求', value:'只知道户外家具目录', ok:false},
    ],
    clarificationQuestions:['贵司主要采购哪类户外家具？','预计数量和目标到货时间？','目的港或交付国家是哪里？'],
    handoffReasons:['首次联系由业务员主动发起','客户未表达完整需求，AI 不应直接报价'],
    replyDraft:'Hi Daniel, this is Hank from Sunpath Outdoor. I saw your Facebook inquiry about outdoor furniture. May I confirm which category you are sourcing for and the approximate quantity?',
  },
  {
    id:'lead-wa-1', source:'whatsapp', leadType:'message', stage:'human_takeover', intent:'high', grade:'A',
    company:'Garden Living BV', contact:'Sanne de Vries', country:'荷兰', flag:'🇳🇱',
    contactValue:'sanne@gardenliving.nl', title:'PE 藤编转角沙发 · 300 套 · 鹿特丹',
    summary:'意向强，已确认数量和目的港；客户开始压价并提出账期，需要人工做方案和报价判断。',
    nextStep:'人工接管：先确认可接受账期和替代让利，再由业务员报价。',
    due:'现在', age:'2 分钟前', probability:'A', takeover:true,
    tags:['真实买家','高意向','需人工报价'], missing:['可接受账期','最终配置'],
    assessment:{authenticity:'likely_real', validity:'valid', deal_probability:'A'},
    sla:{target:'5 分钟', elapsed:'2 分钟', pct:40, status:'ok', label:'SLA 内'},
    owner:'Hank', lastTouch:'WhatsApp 09:34',
    priorityReason:'客户已确认数量和目的港，并开始讨论价格与账期，属于强意向但高风险环节。',
    matchedFields:[
      {label:'产品', value:'PE 藤编转角沙发', ok:true},
      {label:'数量', value:'300 套', ok:true},
      {label:'目的港', value:'Rotterdam', ok:true},
      {label:'付款条款', value:'60 天账期待确认', ok:false},
    ],
    clarificationQuestions:['最终配置是否与 OF-RT-205 完全一致？','可接受的账期底线是什么？'],
    handoffReasons:['价格谈判','账期承诺','强意向客户','需人工报价'],
    replyDraft:'Sanne, thanks for the update. I will check the final configuration and payment-term options with our sales manager before confirming any price or terms.',
  },
  {
    id:'lead-email-1', source:'email', leadType:'message', stage:'needs_discovery', intent:'medium', grade:'B',
    company:'Coastal Home Group', contact:'Marco Bianchi', country:'意大利', flag:'🇮🇹',
    contactValue:'marco@coastalhome.it', title:'户外餐桌椅 7 件套 · 认证和交期咨询',
    summary:'客户询问 FSC 认证和海运时效，但数量区间未确认。AI 可继续追问基础需求。',
    nextStep:'补齐数量、目的港和目标上架时间，确认是否进入人工报价准备。',
    due:'今天 18:30', age:'14 分钟前', probability:'B', takeover:false,
    tags:['真实买家','待补需求','认证问询'], missing:['数量','目的港','目标交期'],
    assessment:{authenticity:'likely_real', validity:'needs_more_info', deal_probability:'B'},
    sla:{target:'5 分钟', elapsed:'14 分钟', pct:100, status:'overdue', label:'已超 SLA'},
    owner:'Mia', lastTouch:'Email 09:18',
    priorityReason:'客户关注认证和交期，采购意图真实，但数量与目的港缺失，暂不适合报价。',
    matchedFields:[
      {label:'产品方向', value:'户外餐桌椅', ok:true},
      {label:'认证要求', value:'FSC', ok:true},
      {label:'数量', value:'未确认', ok:false},
      {label:'目的港', value:'未确认', ok:false},
    ],
    clarificationQuestions:['请确认预计采购数量或数量区间。','目标目的港是 Genoa、La Spezia 还是其他港口？','期望上架或到港时间是什么？'],
    handoffReasons:[],
    replyDraft:'Hi Marco, thanks for your inquiry. We can support FSC documentation. To prepare the right solution, may I confirm the target quantity, destination port, and expected delivery window?',
  },
  {
    id:'lead-web-1', source:'website', leadType:'message', stage:'strong_intent', intent:'high', grade:'A',
    company:'Nordic Patio AS', contact:'Erik Lund', country:'挪威', flag:'🇳🇴',
    contactValue:'erik@nordicpatio.no', title:'躺椅 + 边几组合 · 120 套',
    summary:'完整询盘，数量和品类明确，适合进入人工报价准备。',
    nextStep:'整理产品规格、交期和历史价格，推给业务员人工报价。',
    due:'今天 17:00', age:'3 小时前', probability:'A', takeover:true,
    tags:['真实买家','高意向','需人工报价'], missing:['付款偏好'],
    assessment:{authenticity:'likely_real', validity:'valid', deal_probability:'A'},
    sla:{target:'5 分钟', elapsed:'3 小时', pct:100, status:'overdue', label:'严重超时'},
    owner:'Hank', lastTouch:'表单 06:40',
    priorityReason:'完整询盘且数量明确，已经适合进入人工报价准备，需要尽快避免冷掉。',
    matchedFields:[
      {label:'产品组合', value:'躺椅 + 边几', ok:true},
      {label:'数量', value:'120 套', ok:true},
      {label:'国家', value:'挪威', ok:true},
      {label:'付款偏好', value:'未确认', ok:false},
    ],
    clarificationQuestions:['是否需要 CE 或其他认证文件？','希望使用 FOB、CIF 还是其他贸易条款？','付款方式是否有固定要求？'],
    handoffReasons:['强意向客户','已具备人工报价条件'],
    replyDraft:'Hi Erik, thanks for the detailed inquiry. We are preparing the product specification and lead-time details. Could you also confirm your preferred trade term and payment arrangement?',
  },
  {
    id:'lead-email-2', source:'email', leadType:'message', stage:'new_lead', intent:'low', grade:'C',
    company:'(未注明)', contact:'tradexz88', country:'未知', flag:'🏳️',
    contactValue:'tradexz88@gmail.com', title:'all products best price',
    summary:'通用群发，缺少产品、数量、公司身份和目的地。建议低优先级保留。',
    nextStep:'不主动报价；如需处理，先要求对方补全公司和采购信息。',
    due:'明天', age:'6 小时前', probability:'C', takeover:false,
    tags:['待补需求','低优先级'], missing:['公司身份','产品','数量','目的地'],
    assessment:{authenticity:'unknown', validity:'needs_more_info', deal_probability:'C'},
    sla:{target:'5 分钟', elapsed:'6 小时', pct:100, status:'low', label:'低优先级'},
    owner:'未分配', lastTouch:'未联系',
    priorityReason:'群发特征明显，缺少采购主体和具体需求，暂不占用业务员黄金时间。',
    matchedFields:[
      {label:'公司身份', value:'未注明', ok:false},
      {label:'产品', value:'未注明', ok:false},
      {label:'数量', value:'未注明', ok:false},
    ],
    clarificationQuestions:['请提供公司名称和官网。','请说明具体产品、数量和目的地。'],
    handoffReasons:[],
    replyDraft:'Thanks for reaching out. Please share your company name, target product, quantity, and destination so we can check whether we can support your request.',
  },
];

const FOLLOWUP_TASKS = [
  {id:'fu-1', leadId:'lead-fb-1', company:'Westfield Retail Group', contact:'Daniel Carter', stage:'first_contact_due', due:'今天 16:00', status:'overdue', action:'首次联系', channel:'facebook', priority:'高'},
  {id:'fu-2', leadId:'lead-wa-1', company:'Garden Living BV', contact:'Sanne de Vries', stage:'human_takeover', due:'现在', status:'due', action:'人工接管议价', channel:'whatsapp', priority:'高'},
  {id:'fu-3', leadId:'lead-email-1', company:'Coastal Home Group', contact:'Marco Bianchi', stage:'needs_discovery', due:'今天 18:30', status:'today', action:'补需求', channel:'email', priority:'中'},
  {id:'fu-4', leadId:'lead-web-1', company:'Nordic Patio AS', contact:'Erik Lund', stage:'quote_ready', due:'明天 10:00', status:'upcoming', action:'准备人工报价资料', channel:'website', priority:'中'},
];

export { SELLER, CHANNELS, INQUIRIES, STATUS_META, THREAD, QUOTES, KPIS, TODO_QUEUE, STREAM, TREND, FUNNEL, METRICS, PRODUCTS, CUSTOMERS, TIMELINE, CONNECTIONS, TRIAGE_PENDING, ARCHIVED_ITEMS, OLD_CUSTOMERS, QUOTE_WORKBENCH, QUOTE_RECORDS, LIFECYCLE_STAGES, CHANNEL_READINESS, LEAD_QUEUE, FOLLOWUP_TASKS };
