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
    title:'遮阳伞 · 数量待定', status:'followup', snippet:'已安排第 2 轮跟进，等待回复',
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
    snippet:'已发送目录并安排第 1 轮跟进', value:0, time:'昨天', unread:false,
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
  {flag:'🇬🇧', company:'Maple & Co.', act:'第 2 轮跟进提醒已生成', status:'followup', time:'昨天 22:05'},
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

const DATA_QUALITY = [
  {label:'来源字段完整率', value:'92%', status:'good', detail:'Email / WhatsApp / Facebook / 表单已标准化'},
  {label:'关键需求完整率', value:'71%', status:'warn', detail:'数量、目的港、产品方向缺失会阻塞报价准备'},
  {label:'疑似重复线索', value:'8', status:'warn', detail:'同公司 + 电话 / 邮箱相似，需合并到客户档案'},
  {label:'未归属负责人', value:'3', status:'bad', detail:'没有 owner 的线索会进入兜底队列并升级提醒'},
];

const SOURCE_ATTRIBUTION = [
  {source:'WhatsApp', leads:89, qualified:64, won:12, pipeline:128400, sla:'91%', quality:'高', action:'保持高意向人工接管边界'},
  {source:'独立站表单', leads:12, qualified:7, won:2, pipeline:31600, sla:'83%', quality:'中', action:'补齐目的港和数量字段'},
  {source:'Facebook', leads:3, qualified:1, won:0, pipeline:8600, sla:'67%', quality:'待验证', action:'CSV 导入后立即去重并首次联系'},
  {source:'Email', leads:0, qualified:0, won:0, pipeline:0, sla:'0%', quality:'断流', action:'修复 IMAP 授权，避免直客邮件漏单'},
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
   buyingGroup:{
     coverage:'3/5 已识别', decisionMakerKnown:true, consensus:'采购支持合作，但价格和账期需要财务与老板共同拍板',
     missingRoles:['财务审批人','门店运营负责人'], nextQuestion:'除了你之外，最终确认价格和 60 天账期的人是谁？',
     stakeholders:[
       {name:'Sanne de Vries', role:'Champion / 采购', influence:'高', stance:'支持', engagement:'WhatsApp 高频', risk:'愿意透露竞品价，但强压 $158'},
       {name:'Jeroen Vos', role:'财务审批', influence:'高', stance:'未知', engagement:'未接触', risk:'60 天账期需要其确认'},
       {name:'Store Ops', role:'使用部门', influence:'中', stance:'待确认', engagement:'未接触', risk:'门店陈列和售后诉求未知'},
     ],
   },
   nextAction:{priority:'今日必跟', when:'护栏待确认 · 2 分钟前', script:'守住 $168 软底价，给「发货前结清 70%」替代账期，换取签单'}},
  {id:'c7', company:'Aussie Backyard Co.', contact:'Liam Hunter', flag:'🇦🇺', country:'澳大利亚', grade:'A',
   tag:'老客户', deals:4, inquiries:9, value:182000, last:'昨天', domain:'aussiebackyard.com.au',
   lifecycle_stage:'strong_intent', intent_level:'high', tags:['老客户','复购','强意向'],
   note:'连续 2 年返单，谈年度框架协议。',
   vtier:'核心客户',
   prefs:{price:'中（复购稳定）', terms:'Net-45', category:'户外家具组合', cert:'AS/NZS', lang:'英语 · 悉尼时区'},
   buyingGroup:{
     coverage:'4/5 已识别', decisionMakerKnown:true, consensus:'采购和运营认可复购，年度框架还缺财务确认返点与账期',
     missingRoles:['财务审批人'], nextQuestion:'年度框架价确认前，财务更关注现金折扣还是账期？',
     stakeholders:[
       {name:'Liam Hunter', role:'Champion / 老客户采购', influence:'高', stance:'支持', engagement:'邮件 + WhatsApp', risk:'希望锁定全年折扣'},
       {name:'Mia Brooks', role:'运营负责人', influence:'中', stance:'支持', engagement:'历史交付沟通', risk:'关注旺季库存稳定'},
       {name:'Finance Team', role:'财务审批', influence:'高', stance:'未知', engagement:'未接触', risk:'年度框架需审批'},
     ],
   },
   nextAction:{priority:'本周跟进', when:'年度框架协议', script:'推年度阶梯价锁单，给复购 3% 专属折扣维系长期合作'}},
  {id:'c4', company:'Nordic Patio AS', contact:'Erik Lund', flag:'🇳🇴', country:'挪威', grade:'A',
   tag:'已成交', deals:1, inquiries:2, value:21600, last:'3 小时前', domain:'nordicpatio.no',
   lifecycle_stage:'won', intent_level:'high', tags:['真实买家','已成交','交付跟踪'],
   note:'首单 120 套躺椅组合，已确认 PI。',
   vtier:'成长客户',
   prefs:{price:'中', terms:'30% 定金', category:'躺椅 / 庭院', cert:'CE', lang:'英语 · 奥斯陆时区'},
   buyingGroup:{
     coverage:'3/3 已识别', decisionMakerKnown:true, consensus:'采购、财务和仓储已对首单达成一致',
     missingRoles:[], nextQuestion:'交付后确认复购品类和第二联系人，避免只依赖单一采购人。',
     stakeholders:[
       {name:'Erik Lund', role:'决策人 / 采购', influence:'高', stance:'支持', engagement:'表单 + 邮件', risk:'首单体验决定复购'},
       {name:'Ingrid Holm', role:'财务', influence:'中', stance:'支持', engagement:'PI 确认', risk:'付款节点需持续提醒'},
       {name:'Warehouse Team', role:'收货 / 使用', influence:'中', stance:'支持', engagement:'待交付', risk:'海运时效敏感'},
     ],
   },
   nextAction:{priority:'交付跟踪', when:'PI 已确认', script:'跟进生产排期与海运时效，铺垫二次复购'}},
  {id:'c2', company:'Coastal Home Group', contact:'Marco Bianchi', flag:'🇮🇹', country:'意大利', grade:'A',
   tag:'报价中', deals:0, inquiries:1, value:28800, last:'14 分钟前', domain:'coastalhome.it',
   lifecycle_stage:'needs_discovery', intent_level:'medium', tags:['真实买家','认证问询','待补需求'],
   note:'关注 FSC 认证与海运时效。',
   vtier:'高潜新客',
   prefs:{price:'中', terms:'待定', category:'户外餐桌椅', cert:'FSC', lang:'意大利语 / 英语 · 罗马时区'},
   buyingGroup:{
     coverage:'1/4 已识别', decisionMakerKnown:false, consensus:'只确认了询盘联系人，采购角色和认证审批人未明确',
     missingRoles:['采购负责人','认证/质量负责人','财务审批人'], nextQuestion:'这次选供应商还会由谁一起评估 FSC、交期和付款条件？',
     stakeholders:[
       {name:'Marco Bianchi', role:'询盘联系人', influence:'中', stance:'中立', engagement:'Email 询盘', risk:'可能只是资料收集人'},
       {name:'Quality Team', role:'认证/质量', influence:'高', stance:'未知', engagement:'未接触', risk:'FSC 要求未确认'},
       {name:'Buyer Manager', role:'采购负责人', influence:'高', stance:'未知', engagement:'未接触', risk:'未确认是否有采购窗口'},
     ],
   },
   nextAction:{priority:'今日跟进', when:'需求待补 · 14 分钟前', script:'强调 FSC 认证与海运时效，催确认规格与数量'}},
  {id:'c5', company:'Sunrise Living', contact:'Aisha Karim', flag:'🇦🇪', country:'阿联酋', grade:'B',
   tag:'样品阶段', deals:0, inquiries:1, value:0, last:'5 小时前', domain:'sunriseliving.ae',
   lifecycle_stage:'needs_discovery', intent_level:'medium', tags:['样品','待补需求'],
   note:'索样中，规格待定。',
   vtier:'潜力客户',
   prefs:{price:'未知', terms:'待定', category:'藤编沙发', cert:'—', lang:'英语 · 迪拜时区'},
   buyingGroup:{
     coverage:'1/3 已识别', decisionMakerKnown:false, consensus:'处于样品阶段，采购预算和最终使用方都未确认',
     missingRoles:['采购负责人','门店/项目使用方'], nextQuestion:'样品确认后，谁会决定首单数量和采购预算？',
     stakeholders:[
       {name:'Aisha Karim', role:'样品联系人', influence:'中', stance:'待确认', engagement:'Email', risk:'可能只负责收样'},
       {name:'Project Owner', role:'项目使用方', influence:'高', stance:'未知', engagement:'未接触', risk:'规格未定'},
     ],
   },
   nextAction:{priority:'低优先', when:'索样中', script:'确认样品规格与目的港，推进打样'}},
  {id:'c3', company:'Maple & Co.', contact:'Olivia Bennett', flag:'🇬🇧', country:'英国', grade:'B',
   tag:'跟进中', deals:0, inquiries:1, value:0, last:'1 小时前', domain:'mapleco.co.uk',
   lifecycle_stage:'followup', intent_level:'medium', tags:['潜在','数量未明','跟进中'],
   note:'遮阳伞询盘，数量未明。',
   vtier:'潜力客户',
   prefs:{price:'未知', terms:'待定', category:'遮阳伞', cert:'—', lang:'英语 · 伦敦时区'},
   buyingGroup:{
     coverage:'1/3 已识别', decisionMakerKnown:false, consensus:'仅知道联系人和品类，缺少采购窗口、数量和审批人',
     missingRoles:['采购负责人','预算审批人'], nextQuestion:'这批遮阳伞是门店补货、项目采购，还是先看目录？',
     stakeholders:[
       {name:'Olivia Bennett', role:'联系人', influence:'中', stance:'中立', engagement:'表单跟进', risk:'数量未明'},
       {name:'Buying Lead', role:'采购负责人', influence:'高', stance:'未知', engagement:'未接触', risk:'是否真实采购待验证'},
     ],
   },
   nextAction:{priority:'低优先', when:'数量未明', script:'追问目标数量与使用场景，判断是否真实采购'}},
];

/* 客户档案时间线（Garden Living BV） */
const TIMELINE = [
  {time:'今天 09:34', type:'guard', text:'触发底价护栏 + 账期红线，转人工待拍板'},
  {time:'今天 09:21', type:'ai',   text:'系统标记 300 套阶梯价参考 $172/套，待业务员确认'},
  {time:'今天 09:03', type:'quote',text:'AI 整理报价准备材料：200 套 · CIF 鹿特丹 · 需人工确认'},
  {time:'今天 09:02', type:'ai',   text:'AI 母语回复，说明 UV 耐候与 3 年质保'},
  {time:'今天 09:02', type:'screen',text:'甄别为 A 级（评分 92），自动置顶'},
  {time:'今天 09:02', type:'in',   text:'WhatsApp 收到询盘：200 套 PE 藤编转角沙发'},
];

const DEAL_CLOSE_PLANS = [
  {
    customerId:'c1', title:'Garden Living BV · 300 套沙发签单计划', value:51600, owner:'Hank',
    targetClose:'2026-07-10', forecast:'Best case', health:'risk', buyerJob:'供应商选择 / 商务拍板',
    nextAction:'先让 Sanne 确认财务审批人和可接受账期，再发送 $168 替代方案。',
    risks:['目标价低于软底价','60 天账期未审批','财务审批人未接触'],
    milestones:[
      {label:'确认财务审批人', owner:'客户', due:'今天', status:'blocked', note:'Sanne 需引荐 Jeroen 或老板'},
      {label:'输出替代账期方案', owner:'Hank', due:'今天', status:'active', note:'$168 + 到港后 30 天尾款'},
      {label:'客户内部拍板', owner:'客户', due:'7 月 8 日', status:'pending', note:'采购、财务、老板三方确认'},
      {label:'PI / 定金', owner:'双方', due:'7 月 10 日', status:'pending', note:'仅业务员确认后发送'},
    ],
    exitCriteria:[
      {label:'决策人明确', status:'gap'},
      {label:'底价守住', status:'gap'},
      {label:'账期方案确认', status:'gap'},
    ],
  },
  {
    customerId:'c7', title:'Aussie Backyard Co. · 年度框架协议', value:96000, owner:'Hank',
    targetClose:'2026-07-22', forecast:'Commit', health:'good', buyerJob:'需求确认 / 预算锁定',
    nextAction:'发年度阶梯价和旺季排产窗口，要求客户确认首批 SKU 和季度数量。',
    risks:['财务返点规则待定','旺季产能需提前锁定'],
    milestones:[
      {label:'确认年度 SKU 清单', owner:'客户', due:'7 月 8 日', status:'active', note:'复购品类和新品方向'},
      {label:'年度阶梯价草案', owner:'Hank', due:'7 月 9 日', status:'pending', note:'人工报价准备，不自动承诺'},
      {label:'框架协议条款', owner:'双方', due:'7 月 16 日', status:'pending', note:'账期、排产、售后边界'},
      {label:'首批 PO', owner:'客户', due:'7 月 22 日', status:'pending', note:'旺季前锁单'},
    ],
    exitCriteria:[
      {label:'复购联系人确认', status:'done'},
      {label:'季度数量明确', status:'gap'},
      {label:'财务条款确认', status:'gap'},
    ],
  },
  {
    customerId:'c4', title:'Nordic Patio AS · 交付到复购计划', value:21600, owner:'Hank',
    targetClose:'2026-08-15', forecast:'Expansion', health:'good', buyerJob:'价值验证 / 复购准备',
    nextAction:'同步生产排期和海运节点，交付后 30 天收集门店反馈并询问补货窗口。',
    risks:['首单交付体验影响复购','海运节点需持续同步'],
    milestones:[
      {label:'生产排期确认', owner:'Hank', due:'7 月 7 日', status:'active', note:'同步预计出货日'},
      {label:'订舱与 ETA', owner:'Hank', due:'7 月 18 日', status:'pending', note:'给客户清晰到港预期'},
      {label:'到货满意度回访', owner:'客户负责人', due:'8 月 8 日', status:'pending', note:'记录质量反馈'},
      {label:'复购品类确认', owner:'双方', due:'8 月 15 日', status:'pending', note:'转入复购唤醒'},
    ],
    exitCriteria:[
      {label:'PI 已确认', status:'done'},
      {label:'交付节点明确', status:'gap'},
      {label:'复购窗口记录', status:'gap'},
    ],
  },
  {
    customerId:'c2', title:'Coastal Home Group · FSC 餐桌椅需求确认', value:28800, owner:'Mia',
    targetClose:'2026-07-18', forecast:'Pipeline', health:'watch', buyerJob:'需求构建',
    nextAction:'补数量、目的港和认证审批角色；未确认前不要进入报价。',
    risks:['数量缺失','认证审批人未知','采购窗口未确认'],
    milestones:[
      {label:'补齐数量和目的港', owner:'客户', due:'今天', status:'active', note:'Email 追问 3 个字段'},
      {label:'确认 FSC 审批角色', owner:'客户', due:'7 月 8 日', status:'pending', note:'找质量/认证负责人'},
      {label:'整理规格和证书材料', owner:'Mia', due:'7 月 10 日', status:'pending', note:'先资料包，后报价准备'},
      {label:'是否进入人工报价', owner:'Mia', due:'7 月 12 日', status:'pending', note:'字段完整后判断'},
    ],
    exitCriteria:[
      {label:'产品规格明确', status:'gap'},
      {label:'数量 / 目的港明确', status:'gap'},
      {label:'认证要求确认', status:'gap'},
    ],
  },
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

const LEAD_IMPORT_BATCH = {
  source:'Facebook Lead Ads CSV',
  filename:'facebook_leads_2026-07-05.csv',
  importedAt:'刚刚',
  rows:6,
  createCount:3,
  mergeCount:2,
  reviewCount:1,
  metrics:[
    {label:'可直接建档', value:3, status:'good'},
    {label:'疑似重复', value:2, status:'warn'},
    {label:'字段缺失', value:4, status:'warn'},
    {label:'需人工复核', value:1, status:'bad'},
  ],
  rules:[
    '邮箱 / 电话精确命中时合并到现有客户档案',
    '公司名相似 + 国家一致时进入人工复核，不自动覆盖',
    '缺产品、数量、目的港时进入待首次联系或需求确认中',
    '没有负责人时按区域和值班表自动分配，并生成 SLA 任务',
  ],
  rowsPreview:[
    {id:'imp-1', company:'Westfield Retail Group', contact:'Daniel Carter', source:'facebook', country:'英国', status:'merge', action:'合并到 Westfield 档案', owner:'Hank', stage:'first_contact_due', issue:'电话相同，已有 Facebook 留资记录', missing:['采购品类','数量','目的港']},
    {id:'imp-2', company:'Maple & Co.', contact:'Olivia Bennett', source:'facebook', country:'英国', status:'merge', action:'合并到现有客户', owner:'Mia', stage:'followup', issue:'公司名 + 邮箱域名匹配', missing:['数量']},
    {id:'imp-3', company:'Patio Nova GmbH', contact:'Klara Weiss', source:'facebook', country:'德国', status:'create', action:'新建客户与首联任务', owner:'Hank', stage:'first_contact_due', issue:'联系方式完整，需求缺失', missing:['产品方向','数量','目的港']},
    {id:'imp-4', company:'Seaside Living LLC', contact:'Omar Khalid', source:'facebook', country:'阿联酋', status:'create', action:'新建需求确认任务', owner:'Mia', stage:'needs_discovery', issue:'备注提到 outdoor sofa，但数量缺失', missing:['数量','预算']},
    {id:'imp-5', company:'-', contact:'+44 7000 000000', source:'facebook', country:'未知', status:'review', action:'人工复核后再建档', owner:'未分配', stage:'new_lead', issue:'公司和需求为空，电话归属地不确定', missing:['公司','产品','数量','国家']},
  ],
};

const OWNER_WORKLOAD = {
  summary:[
    {label:'有负责人线索', value:4, status:'good'},
    {label:'未归属兜底', value:1, status:'bad'},
    {label:'负责人超负荷', value:1, status:'warn'},
  ],
  owners:[
    {
      id:'hank', name:'Hank', role:'欧洲重点客户 / 强意向', status:'overload', statusLabel:'超负荷',
      availability:'在线', openLeads:3, capacity:4, overdue:2, dueSoon:1, takeover:3,
      channels:['whatsapp','facebook','website'], backup:'Mia', nextAction:'先处理 Garden 议价和 Nordic 报价准备',
      escalation:'A 级超时 30 分钟未处理，升级给销售负责人',
    },
    {
      id:'mia', name:'Mia', role:'中东/意大利需求确认', status:'available', statusLabel:'可接单',
      availability:'在线', openLeads:2, capacity:5, overdue:1, dueSoon:1, takeover:0,
      channels:['email','facebook'], backup:'Hank', nextAction:'接手 Facebook 留资首联与 Coastal 补需求',
      escalation:'Hank 超负荷时，B 级首联自动转给 Mia',
    },
    {
      id:'queue', name:'兜底队列', role:'未分配 / 低置信线索', status:'risk', statusLabel:'需分配',
      availability:'系统队列', openLeads:1, capacity:1, overdue:0, dueSoon:1, takeover:0,
      channels:['email'], backup:'值班负责人', nextAction:'给 tradexz88 补公司身份与采购字段',
      escalation:'任何线索不得停留未分配超过 10 分钟',
    },
  ],
  escalations:[
    {time:'SLA 80%', owner:'当前负责人', action:'站内 + 手机提醒，要求确认是否接单'},
    {time:'超过 5 分钟', owner:'备用负责人', action:'允许一键接手，原负责人仍保留记录'},
    {time:'超过 30 分钟 / A 级', owner:'销售负责人', action:'强制升级并要求填写处理结果'},
  ],
};

const QUALIFICATION_CRITERIA = [
  {key:'fit', label:'客户匹配', desc:'地区、品类、公司身份与目标客户相符'},
  {key:'need', label:'明确需求', desc:'产品方向、数量、目的港、认证或场景清楚'},
  {key:'authority', label:'采购角色', desc:'联系人能影响采购、报价或供应商筛选'},
  {key:'timing', label:'采购时机', desc:'有上架、到货、补货或项目时间窗口'},
  {key:'commercial', label:'商务边界', desc:'预算、账期、交期、定制或合同风险可判断'},
];

const LEAD_DISPOSITION_PLAYBOOK = [
  {key:'sql', label:'推进 SQL', nextStage:'quote_ready', tone:'good', trigger:'真实客户 + 需求字段基本完整 + 有近期采购窗口', action:'转入强意向或待人工报价'},
  {key:'discover', label:'继续补需求', nextStage:'needs_discovery', tone:'warn', trigger:'客户真实但产品、数量、目的港或时间缺失', action:'AI 起草追问，业务员确认后发送'},
  {key:'nurture', label:'回收培育', nextStage:'followup', tone:'neutral', trigger:'未来可能采购但近期意向弱或响应慢', action:'进入 3/7/14 天低频跟进'},
  {key:'disqualify', label:'判无效', nextStage:'lost', tone:'bad', trigger:'同行套价、身份缺失、无采购主体或长期无关键字段', action:'必须记录原因，避免继续占用销售时间'},
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
    qualificationScore:54,
    qualification:[
      {key:'fit', status:'pass', evidence:'Lead Ads 留资，电话和公司名完整'},
      {key:'need', status:'gap', evidence:'只知道户外家具目录'},
      {key:'authority', status:'unknown', evidence:'采购角色待确认'},
      {key:'timing', status:'gap', evidence:'采购窗口未说明'},
      {key:'commercial', status:'unknown', evidence:'预算和贸易条款未知'},
    ],
    disposition:{key:'discover', label:'继续补需求', route:'待首次联系', reason:'先确认真实采购和基础字段，再判断是否转 SQL'},
    consent:{
      basis:'Facebook Lead Ads 表单留资', privacy:'表单已展示隐私政策', lastChecked:'刚刚',
      nextAction:'首次联系先说明来源；转 WhatsApp 前必须确认客户同意。',
      channels:[
        {key:'phone', label:'电话', status:'allowed', evidence:'客户在 Lead Ads 留电话'},
        {key:'facebook', label:'Facebook', status:'allowed', evidence:'来自 Facebook 表单'},
        {key:'whatsapp', label:'WhatsApp', status:'pending', evidence:'未确认可切到 WhatsApp'},
        {key:'email', label:'Email', status:'pending', evidence:'未留邮箱'},
      ],
    },
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
    qualificationScore:88,
    qualification:[
      {key:'fit', status:'pass', evidence:'荷兰零售商，目标品类匹配'},
      {key:'need', status:'pass', evidence:'PE 藤编沙发 300 套，目的港 Rotterdam'},
      {key:'authority', status:'pass', evidence:'参与内部签批并反馈目标价'},
      {key:'timing', status:'pass', evidence:'2026 春季系列选品'},
      {key:'commercial', status:'risk', evidence:'压价至 $158 并要求 60 天账期'},
    ],
    disposition:{key:'sql', label:'推进 SQL', route:'人工接管 / 待报价', reason:'需求完整且有明确议价动作，但商务风险必须人工处理'},
    consent:{
      basis:'客户主动 WhatsApp 发起会话', privacy:'原渠道业务咨询', lastChecked:'09:34',
      nextAction:'可在当前 WhatsApp 会话内回复；营销类群发需另行确认偏好。',
      channels:[
        {key:'whatsapp', label:'WhatsApp', status:'allowed', evidence:'客户主动发起会话'},
        {key:'email', label:'Email', status:'allowed', evidence:'企业邮箱已用于业务沟通'},
        {key:'phone', label:'电话', status:'pending', evidence:'未确认电话联系偏好'},
      ],
    },
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
    qualificationScore:61,
    qualification:[
      {key:'fit', status:'pass', evidence:'企业邮箱与户外家居业务匹配'},
      {key:'need', status:'gap', evidence:'关心 FSC 和交期，数量未确认'},
      {key:'authority', status:'unknown', evidence:'采购角色未说明'},
      {key:'timing', status:'gap', evidence:'目标上架时间待补'},
      {key:'commercial', status:'unknown', evidence:'预算、贸易条款和目的港未知'},
    ],
    disposition:{key:'discover', label:'继续补需求', route:'需求确认中', reason:'真实度较高，但关键报价字段不够'},
    consent:{
      basis:'客户主动邮件询盘', privacy:'B2B 业务回复', lastChecked:'09:18',
      nextAction:'可围绕本次询盘邮件回复；切换 WhatsApp 或营销订阅前先确认同意。',
      channels:[
        {key:'email', label:'Email', status:'allowed', evidence:'客户主动发送询盘邮件'},
        {key:'whatsapp', label:'WhatsApp', status:'pending', evidence:'未提供 WhatsApp 同意'},
        {key:'phone', label:'电话', status:'pending', evidence:'未提供电话偏好'},
      ],
    },
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
    qualificationScore:82,
    qualification:[
      {key:'fit', status:'pass', evidence:'挪威户外家具客户，品类匹配'},
      {key:'need', status:'pass', evidence:'躺椅 + 边几 120 套'},
      {key:'authority', status:'unknown', evidence:'采购角色待确认'},
      {key:'timing', status:'pass', evidence:'完整表单询盘，适合立即推进'},
      {key:'commercial', status:'gap', evidence:'付款偏好和贸易条款待确认'},
    ],
    disposition:{key:'sql', label:'推进 SQL', route:'待人工报价', reason:'需求完整，应整理规格、交期和风险点给业务员'},
    consent:{
      basis:'独立站表单提交', privacy:'表单隐私政策已记录', lastChecked:'06:40',
      nextAction:'优先邮件回复表单需求；新增 WhatsApp/电话触达前确认客户偏好。',
      channels:[
        {key:'email', label:'Email', status:'allowed', evidence:'表单邮箱可用于本次询盘回复'},
        {key:'website', label:'表单', status:'allowed', evidence:'独立站表单来源'},
        {key:'whatsapp', label:'WhatsApp', status:'pending', evidence:'未确认跨渠道触达'},
        {key:'phone', label:'电话', status:'pending', evidence:'未确认电话偏好'},
      ],
    },
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
    qualificationScore:18,
    qualification:[
      {key:'fit', status:'fail', evidence:'无公司身份，gmail 通用账号'},
      {key:'need', status:'fail', evidence:'all products best price 群发'},
      {key:'authority', status:'unknown', evidence:'采购角色不明'},
      {key:'timing', status:'unknown', evidence:'没有项目时间'},
      {key:'commercial', status:'fail', evidence:'只索要最低价，缺少任何有效条件'},
    ],
    disposition:{key:'disqualify', label:'判无效', route:'低优先级 / 丢单', reason:'无采购主体和需求字段，疑似套价或群发'},
    consent:{
      basis:'未知群发邮件', privacy:'无明确订阅或表单记录', lastChecked:'6 小时前',
      nextAction:'仅允许一次性索取公司和采购信息，不进入营销触达。',
      channels:[
        {key:'email', label:'Email', status:'limited', evidence:'只做一次性业务核验回复'},
        {key:'whatsapp', label:'WhatsApp', status:'blocked', evidence:'无同意、无号码'},
        {key:'phone', label:'电话', status:'blocked', evidence:'无同意、无号码'},
      ],
    },
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
  {id:'fu-1', leadId:'lead-fb-1', company:'Westfield Retail Group', contact:'Daniel Carter', stage:'first_contact_due', due:'今天 16:00', status:'overdue', action:'首次联系', channel:'facebook', priority:'高', owner:'Hank', rule:'Facebook 留资 5 分钟内首响', reason:'只留联系方式的线索最容易漏跟，且公司名完整，需要先验证是否真实采购。', script:'Hi Daniel, this is Hank from Sunpath Outdoor. I saw your Facebook inquiry. May I confirm which outdoor furniture category and approximate quantity you are sourcing?'},
  {id:'fu-2', leadId:'lead-wa-1', company:'Garden Living BV', contact:'Sanne de Vries', stage:'human_takeover', due:'现在', status:'due', action:'人工接管议价', channel:'whatsapp', priority:'高', owner:'Hank', rule:'强意向 + 价格/账期立刻转人工', reason:'客户已确认数量和目的港，正在压价并提出 60 天账期，属于高风险承诺。', script:'Sanne, Hank here. I will confirm the final price and payment-term option personally before sending the PI.'},
  {id:'fu-3', leadId:'lead-email-1', company:'Coastal Home Group', contact:'Marco Bianchi', stage:'needs_discovery', due:'今天 18:30', status:'today', action:'补需求', channel:'email', priority:'中', owner:'Mia', rule:'需求确认中 1 天内补齐关键字段', reason:'客户关注 FSC 与海运时效，但数量和目的港还没确认，不适合进入报价。', script:'Marco, before we prepare the quote material, may I confirm the target quantity, destination port, and expected delivery window?'},
  {id:'fu-4', leadId:'lead-web-1', company:'Nordic Patio AS', contact:'Erik Lund', stage:'quote_ready', due:'明天 10:00', status:'upcoming', action:'准备人工报价资料', channel:'website', priority:'中', owner:'Hank', rule:'强意向客户报价后 1/3/7 天跟进', reason:'完整询盘已确认，下一步是整理规格、交期和风险点给业务员人工报价。', script:'Prepare product spec, lead time, payment note, and margin guardrail before Hank confirms the quote.'},
];

const CADENCE_PLAYBOOKS = [
  {
    id:'cad-fb-first', title:'Facebook 留资首联', stage:'first_contact_due', channel:'facebook', owner:'业务员', status:'启用',
    goal:'5 分钟内确认是否真实采购，并补齐品类、数量、目的港和时间要求。',
    stop:'客户回复、明确拒绝，或被判定为无效线索即停止后续触达。',
    compliance:'Facebook 表单只代表留资意向；切到 WhatsApp 前需确认同意或使用已审批模板。',
    tags:['仅留联系方式','首响 SLA','防漏跟'],
    steps:[
      {time:'T+0 · 5 分钟内', channel:'电话 / Facebook', action:'首次联系', detail:'确认客户身份、采购角色和是否正在找户外家具供应商。'},
      {time:'T+1 小时', channel:'Email', action:'补一封简短邮件', detail:'附 1 页目录入口，只问 3 个字段：品类、数量、目的港。'},
      {time:'T+1 天', channel:'电话', action:'二次拨打', detail:'仍未回复则标记为低响应，保留在 3 天观察队列。'},
      {time:'T+3 天', channel:'Facebook', action:'最后确认', detail:'询问是否仍需要供应商；无响应则转入低优先级。'},
    ],
  },
  {
    id:'cad-discovery', title:'需求确认补字段', stage:'needs_discovery', channel:'email', owner:'AI 起草 + 业务员确认', status:'启用',
    goal:'在 24 小时内补齐报价准备所需字段，避免业务员直接进入无效报价。',
    stop:'产品、数量、目的港、交期、认证要求补齐后进入人工报价准备。',
    compliance:'AI 只追问事实信息，不承诺价格、交期、付款条款或定制方案。',
    tags:['待补需求','报价前置','AI 低风险'],
    steps:[
      {time:'T+0', channel:'Email / WhatsApp', action:'发送补字段问题', detail:'围绕产品规格、数量、目的港、目标到货时间和认证要求追问。'},
      {time:'T+1 天', channel:'Email', action:'提醒补齐关键字段', detail:'若缺数量或目的港，继续停留在需求确认中，不进入报价。'},
      {time:'T+3 天', channel:'电话', action:'人工确认采购真实性', detail:'业务员判断是否真实项目、是否值得继续投入。'},
      {time:'T+7 天', channel:'系统', action:'降级或归档', detail:'仍无关键字段则标记低意向，保留历史档案。'},
    ],
  },
  {
    id:'cad-quote', title:'人工报价后跟进', stage:'quoted', channel:'whatsapp', owner:'业务员', status:'启用',
    goal:'报价后用 1 / 3 / 7 天节奏推动反馈，同时保留人工议价边界。',
    stop:'客户确认、还价、要求账期/合同，或触发底价红线时立即转人工处理。',
    compliance:'报价、交期、账期和合同条款必须由业务员确认，AI 只能整理材料和提醒。',
    tags:['已报价','强意向','人工边界'],
    steps:[
      {time:'T+1 天', channel:'WhatsApp / Email', action:'确认是否收到报价', detail:'确认报价文件、规格和贸易条款是否打开/收到。'},
      {time:'T+3 天', channel:'电话', action:'问采购反馈', detail:'询问价格、样品、认证或交期是否卡点。'},
      {time:'T+7 天', channel:'Email', action:'给替代选项', detail:'提供不同配置或付款节奏建议，但不自动承诺。'},
      {time:'T+14 天', channel:'系统', action:'复盘机会', detail:'标记赢单/丢单原因，回写渠道和产品反馈。'},
    ],
  },
  {
    id:'cad-reorder', title:'老客户复购唤醒', stage:'won', channel:'whatsapp', owner:'客户负责人', status:'待配置',
    goal:'围绕历史采购周期、旺季和补货窗口提醒负责人主动维护。',
    stop:'客户提出复购计划、年度框架协议或明确本季度无需求。',
    compliance:'营销类触达需要保留退订选择；跨渠道发送前检查客户偏好。',
    tags:['老客户','复购','生命周期'],
    steps:[
      {time:'成交后 30 天', channel:'Email', action:'交付满意度回访', detail:'确认到货、陈列和售后情况，记录质量反馈。'},
      {time:'旺季前 90 天', channel:'WhatsApp', action:'补货窗口提醒', detail:'根据历史采购品类推荐备货时间，不主动报最终价。'},
      {time:'旺季前 60 天', channel:'电话', action:'复购需求确认', detail:'确认年度预算、预计数量和新品方向。'},
      {time:'旺季前 30 天', channel:'系统', action:'升级老板关注', detail:'核心客户未回复则提醒负责人介入。'},
    ],
  },
];

export { SELLER, CHANNELS, INQUIRIES, STATUS_META, THREAD, QUOTES, KPIS, TODO_QUEUE, STREAM, TREND, FUNNEL, METRICS, DATA_QUALITY, SOURCE_ATTRIBUTION, PRODUCTS, CUSTOMERS, TIMELINE, DEAL_CLOSE_PLANS, CONNECTIONS, TRIAGE_PENDING, ARCHIVED_ITEMS, OLD_CUSTOMERS, QUOTE_WORKBENCH, QUOTE_RECORDS, LIFECYCLE_STAGES, CHANNEL_READINESS, LEAD_IMPORT_BATCH, OWNER_WORKLOAD, QUALIFICATION_CRITERIA, LEAD_DISPOSITION_PLAYBOOK, LEAD_QUEUE, FOLLOWUP_TASKS, CADENCE_PLAYBOOKS };
