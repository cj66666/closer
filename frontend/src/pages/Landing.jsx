import React, { useState, useEffect, useRef } from 'react';

/* ============ 成交官 · 产品落地页 v2 (紫色主题) ============ */

/* ---- Logo (同 app 侧栏，但用紫色渐变) ---- */
function LogoIcon({ size = 34 }) {
  const r = Math.round(size * 0.33);
  return (
    <span style={{
      width: size, height: size, borderRadius: r,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      background: 'radial-gradient(circle at 30% 22%,rgba(255,255,255,.34),transparent 34%),linear-gradient(145deg,#8E85F5,#5B4FE0 60%,#372BA0)',
      boxShadow: `0 8px 20px -10px rgba(91,79,224,.7),inset 0 1px 0 rgba(255,255,255,.3)`,
    }}>
      <svg width={size * 0.64} height={size * 0.64} viewBox="0 0 24 24" fill="none">
        <path d="M16.9 6.1A7.2 7.2 0 1 0 17 17.8" stroke="#fff" strokeWidth="2.45" strokeLinecap="round" />
        <path d="M10 12h10" stroke="#fff" strokeWidth="2.45" strokeLinecap="round" />
        <path d="M17 9l3 3-3 3" stroke="#fff" strokeWidth="2.45" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/* ---- 滚动显现 hook ---- */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); ob.disconnect(); } }, { threshold });
    ob.observe(el);
    return () => ob.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ---- Count-up hook ---- */
function useCountUp(target, active, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return val;
}

/* ---- Tilt 卡片 ---- */
function TiltCard({ children, style }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.01)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ''; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transition: 'transform .4s ease', ...style }}>
      {children}
    </div>
  );
}

/* ---- 单个 stat 项（带 count-up） ---- */
function StatItem({ value, label, parentVisible, border = true }) {
  // value 可能是 "8秒"、"94%"、"86%"、"31h"
  const match = String(value).match(/^(\d+)(.*)/);
  const num = match ? parseInt(match[1]) : 0;
  const suffix = match ? match[2] : value;
  const counted = useCountUp(num, parentVisible);
  return (
    <div style={{ textAlign: 'center', padding: '34px 16px', borderRight: border ? '1px solid #E7E4F2' : 'none' }}>
      <div style={{ fontSize: 46, fontWeight: 800, color: '#5B4FE0', lineHeight: 1, letterSpacing: '-.04em' }}>
        {parentVisible ? counted : 0}{suffix}
      </div>
      <div style={{ fontSize: 15, color: '#5C5878', marginTop: 10, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

/* ---- Marquee ---- */
const CHANNELS = ['Facebook Lead Ads', 'WhatsApp Business', 'Email 邮件', '网站表单', '独立站询盘', 'CSV 批量导入'];

/* ---- 数据 ---- */
const STATS = [
  { value: '8秒', label: '平均响应新询盘' },
  { value: '94%', label: '线索甄别准确率' },
  { value: '86%', label: '5 分钟接住率' },
  { value: '31h', label: '每周节省人工工时' },
];

const FEATURES = [
  {
    icon: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#5B4FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
      </svg>
    ),
    title: '线索池：先甄别，再分配',
    desc: 'AI 对完整询盘和「仅留联系方式」线索做导入前体检、去重、字段标准化与 A/B/C 评分，把「值不值得跟」和「谁来跟」拆开，避免黑箱评分和人工派发延迟。',
    tags: ['导入前体检', '身份去重', '分配透明度'],
    tagColor: '#5B4FE0', tagBg: '#F2F0FE',
    screen: '/screenshot-leads.png', screenAlt: '线索池',
    rev: false,
  },
  {
    icon: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#5B4FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    title: '跟进提醒：每天只看下一步',
    desc: '把首次联系、补需求、报价后跟进和老客户复购拆成固定节奏，逾期线索即时高亮，关键节点自动生成话术。销售不再靠记忆跟单，永不漏单。',
    tags: ['触达节奏', '逾期高亮', '话术自动生成'],
    tagColor: '#5B4FE0', tagBg: '#F2F0FE',
    screen: '/screenshot-followups.png', screenAlt: '跟进提醒',
    rev: true,
  },
  {
    icon: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#5B4FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: '客户生命周期：一人一档',
    desc: 'Facebook 留资、表单、Email 和 WhatsApp 很容易把同一买家拆成多个客户。系统先做身份去重与合并复核，按阶段、意向、标签和下次跟进管理客户，人工交接零信息损失。',
    tags: ['身份合并复核', '阶段管理', '冲突字段提示'],
    tagColor: '#2E9E8F', tagBg: '#E2F1EE',
    screen: '/screenshot-crm.png', screenAlt: '客户生命周期',
    rev: false,
  },
  {
    icon: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#5B4FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/>
        <path d="M7 16l4-5 3 3 5-7"/>
      </svg>
    ),
    title: '数据看板：看价值，不只看数量',
    desc: '按来源、数据质量和成交结果闭环看线索价值，把老板关心的目标达成、加权预测和缺口放在同一面板，响应时长、接住率、甄别准确率一目了然。',
    tags: ['销售预测', '价值度量', '目标缺口'],
    tagColor: '#5B4FE0', tagBg: '#F2F0FE',
    screen: '/screenshot-analytics.png', screenAlt: '数据看板',
    rev: true,
  },
];

const STEPS = [
  { num: '01', title: '接入询盘渠道', desc: 'Facebook、WhatsApp、Email、表单统一收口，CSV 也能批量导入。' },
  { num: '02', title: 'AI 初筛评分', desc: '去重、补字段、A/B/C 评分并分配负责人，超时线索自动升级。' },
  { num: '03', title: '按节奏跟进', desc: '首联、补需求、报价后跟进自动排期，话术随手可用，逾期高亮。' },
  { num: '04', title: '业务员成交', desc: '把精力留给真正值得谈的客户，数据看板闭环复盘每一分投入。' },
];

const PRICING = [
  {
    name: '免费版', price: '¥0', period: '/月',
    desc: '适合刚起步的个人出口卖家',
    features: ['每月 50 条线索', 'AI 基础评分', '手动跟进提醒', '1 个邮件渠道'],
    cta: '免费开始', ctaStyle: 'outline', featured: false,
  },
  {
    name: '专业版', price: '¥299', period: '/月',
    desc: '适合有稳定外贸订单的团队',
    badge: '最受欢迎',
    features: ['无限线索', 'AI 深度意图分析', 'AI 报价草稿生成', '全渠道（Email + WhatsApp）', '自动跟进 + 数据看板', '优先邮件支持'],
    cta: '14 天免费试用', ctaStyle: 'primary', featured: true,
  },
  {
    name: '企业版', price: '定制', period: '',
    desc: '适合大型外贸工厂 / 贸易公司',
    features: ['专业版全部功能', '私有化部署', '多账号团队协作', '自定义 AI 模型接入', '专属客户成功经理'],
    cta: '联系我们', ctaStyle: 'outline-green', featured: false,
  },
];

/* ============ NavBar ============ */
function NavBar({ onLogin }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #EFEDF7',
      boxShadow: scrolled ? '0 4px 20px -8px rgba(91,79,224,.15)' : 'none',
      transition: 'box-shadow .25s',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', height: 68, display: 'flex', alignItems: 'center', gap: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoIcon size={36} />
          <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-.03em', color: '#1B1830' }}>成交官</span>
          <span style={{ fontSize: 12, color: '#948FB0', fontWeight: 600, letterSpacing: '.06em' }}>Closer</span>
        </div>
        <nav style={{ display: 'flex', gap: 30, marginLeft: 'auto' }}>
          {[['#features','功能'],['#flow','工作流'],['#pricing','定价']].map(([href, label]) => (
            <a key={href} href={href} style={{ color: '#5C5878', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>{label}</a>
          ))}
        </nav>
        <button onClick={onLogin} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#5B4FE0', color: '#fff', fontWeight: 700, fontSize: 14,
          padding: '11px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
          transition: 'all .18s',
        }}>立即体验 →</button>
      </div>
    </header>
  );
}

/* ============ Hero ============ */
function Hero({ onLogin }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: '#161036', padding: '96px 0 120px' }}>
      {/* 背景图 */}
      <img src="https://images.unsplash.com/photo-1759216373394-91146ca977c7?q=75&w=2400&auto=format&fit=crop"
        alt="" aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 1 }} />
      {/* 渐变蒙版 */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(125deg,rgba(13,14,38,.82) 0%,rgba(22,22,64,.7) 48%,rgba(64,54,170,.52) 128%)', pointerEvents: 'none' }} />
      {/* 光晕 */}
      <div style={{ position: 'absolute', top: -60, left: '50%', width: 1000, height: 680, background: 'radial-gradient(circle,rgba(142,133,245,.5),transparent 62%)', pointerEvents: 'none', transform: 'translateX(-50%)', animation: 'lp-orb 11s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: -120, left: '8%', width: 420, height: 420, background: 'radial-gradient(circle,rgba(180,120,245,.32),transparent 65%)', pointerEvents: 'none', animation: 'lp-glow 8s ease-in-out infinite' }} />
      {/* 点阵 */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)', backgroundSize: '26px 26px', pointerEvents: 'none', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%,#000,transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%,#000,transparent 75%)' }} />

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.92)', border: '1px solid rgba(255,255,255,.22)', borderRadius: 99, padding: '7px 18px', fontSize: 13, fontWeight: 600, marginBottom: 28, animation: 'lp-fadeup .7s .05s both' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#b6a9ff', display: 'inline-block' }} />
          专为外贸出口商打造的 AI 销售助手
        </div>
        <h1 style={{ fontSize: 'clamp(40px,5.6vw,68px)', fontWeight: 800, color: '#fff', lineHeight: 1.12, letterSpacing: '-.035em', marginBottom: 24, animation: 'lp-fadeup .7s .12s both' }}>
          让 AI 接住每一条询盘<br />
          <span style={{ background: 'linear-gradient(135deg,#c9bcff,#efe9ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>你只专注把单谈成</span>
        </h1>
        <p style={{ fontSize: 'clamp(16px,2vw,20px)', color: 'rgba(255,255,255,.74)', lineHeight: 1.75, maxWidth: 620, margin: '0 auto 40px', animation: 'lp-fadeup .7s .19s both' }}>
          成交官统一承接 Facebook、WhatsApp、Email 与表单线索，自动初筛、补需求、排跟进、起草报价，把销售的精力从「处理消息」解放到「拿下订单」。
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16, animation: 'lp-fadeup .7s .26s both' }}>
          <button onClick={onLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', color: '#5B4FE0', fontWeight: 700, fontSize: 16, padding: '15px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .18s' }}>
            免费开始使用
          </button>
          <button onClick={onLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 700, fontSize: 16, padding: '15px 30px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,.3)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .18s' }}>
            查看产品演示 ▶
          </button>
        </div>
        <p style={{ color: 'rgba(255,255,255,.46)', fontSize: 13, marginBottom: 60, animation: 'lp-fadeup .7s .33s both' }}>无需信用卡 · 5 分钟完成接入 · 随时取消</p>
      </div>

      {/* 产品截图窗口 */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1040, margin: '0 auto', padding: '0 28px', animation: 'lp-fadeup .9s .4s both' }}>
        <div style={{ position: 'relative', padding: 14, borderRadius: 26, background: 'linear-gradient(155deg,rgba(160,146,250,.34),rgba(91,79,224,.1) 55%,rgba(160,146,250,.2))', border: '1px solid rgba(178,164,252,.42)', boxShadow: '0 50px 120px -34px rgba(91,79,224,.75),inset 0 1px 0 rgba(255,255,255,.45)', backdropFilter: 'blur(10px)' }}>
          <div style={{ borderRadius: 15, overflow: 'hidden', boxShadow: '0 20px 50px -18px rgba(15,8,45,.6)' }}>
            <div style={{ height: 40, background: '#211A48', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
              <span style={{ marginLeft: 14, fontSize: 12, color: 'rgba(255,255,255,.42)', fontWeight: 600 }}>app.closer.ai / 工作台</span>
            </div>
            <img src="/screenshot-dashboard.png" alt="成交官工作台" style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'cover', objectPosition: 'top', maxHeight: 540 }} />
          </div>
        </div>
        {/* 浮动数据卡 */}
        <div style={{ position: 'absolute', left: 6, top: 120, background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 18px 40px -14px rgba(15,8,45,.5)', border: '1px solid #EFEDF7', animation: 'lp-floatA 6s ease-in-out infinite' }}>
          <div style={{ fontSize: 11, color: '#948FB0', fontWeight: 700, letterSpacing: '.04em' }}>平均响应时长</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#5B4FE0', letterSpacing: '-.03em' }}>8<span style={{ fontSize: 14, color: '#5C5878', marginLeft: 2 }}>秒</span></div>
        </div>
        <div style={{ position: 'absolute', right: 6, top: 210, background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 18px 40px -14px rgba(15,8,45,.5)', border: '1px solid #EFEDF7', animation: 'lp-floatB 7s ease-in-out infinite' }}>
          <div style={{ fontSize: 11, color: '#948FB0', fontWeight: 700, letterSpacing: '.04em' }}>线索甄别准确率</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#2E9E8F', letterSpacing: '-.03em' }}>94<span style={{ fontSize: 14, color: '#5C5878', marginLeft: 2 }}>%</span></div>
        </div>
      </div>
    </section>
  );
}

/* ============ Marquee ============ */
function Marquee() {
  const items = [...CHANNELS, ...CHANNELS];
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #EFEDF7', padding: '26px 0', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#948FB0', textTransform: 'uppercase', marginBottom: 18 }}>
        统一承接所有询盘渠道
      </div>
      <div style={{ position: 'relative', maskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)' }}>
        <div style={{ display: 'flex', gap: 56, width: 'max-content', animation: 'lp-marquee 26s linear infinite', fontSize: 17, fontWeight: 700, color: '#5C5878', whiteSpace: 'nowrap' }}>
          {items.map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ============ Stats ============ */
function Stats() {
  const [ref, visible] = useReveal();
  return (
    <section style={{ padding: '64px 0', background: '#fff', borderBottom: '1px solid #EFEDF7' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px' }}>
        <div ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg,#F6F5FC,#F2F0FE)', border: '1px solid #E7E4F2' }}>
          {STATS.map((s, i) => (
            <StatItem key={i} value={s.value} label={s.label} parentVisible={visible} border={i < STATS.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ Feature Row ============ */
function FeatureRow({ f, rev }) {
  const [textRef, textVis] = useReveal(0.1);
  const [screenRef, screenVis] = useReveal(0.1);
  const delay = rev ? 120 : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 64, alignItems: 'center', ...(rev ? { direction: 'rtl' } : {}) }}>
      <div ref={textRef} style={{ direction: 'ltr', opacity: textVis ? 1 : 0, transform: textVis ? 'none' : 'translateY(24px)', transition: 'opacity .6s, transform .6s' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F2F0FE', border: '1px solid #E4E0FB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          {f.icon}
        </div>
        <h3 style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 14, lineHeight: 1.2, color: '#1B1830' }}>{f.title}</h3>
        <p style={{ fontSize: 17, color: '#5C5878', lineHeight: 1.75, marginBottom: 22 }}>{f.desc}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
          {f.tags.map(t => (
            <span key={t} style={{ background: f.tagBg, color: f.tagColor, fontSize: 13, fontWeight: 700, padding: '6px 13px', borderRadius: 8 }}>{t}</span>
          ))}
        </div>
      </div>
      <div ref={screenRef} style={{ direction: 'ltr', opacity: screenVis ? 1 : 0, transform: screenVis ? 'none' : 'translateY(24px)', transition: `opacity .6s ${delay}ms, transform .6s ${delay}ms` }}>
        <TiltCard style={{ padding: 10, borderRadius: 20, background: 'linear-gradient(155deg,rgba(142,133,245,.18),rgba(91,79,224,.05))', border: '1px solid rgba(178,164,252,.32)', boxShadow: '0 30px 66px -22px rgba(91,79,224,.4)' }}>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E7E4F2' }}>
            <div style={{ height: 30, background: '#F1EFFA', borderBottom: '1px solid #EFEDF7', display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
            </div>
            <img src={f.screen} alt={f.screenAlt} style={{ display: 'block', width: '100%', height: 'auto', maxHeight: 380, objectFit: 'cover', objectPosition: 'top' }} />
          </div>
        </TiltCard>
      </div>
    </div>
  );
}

/* ============ Features ============ */
function Features() {
  return (
    <section id="features" style={{ position: 'relative', overflow: 'hidden', padding: '104px 0', background: '#fff', scrollMarginTop: 68 }}>
      <div style={{ position: 'absolute', top: '6%', right: '-6%', width: 520, height: 520, background: 'radial-gradient(circle,rgba(142,133,245,.14),transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '2%', left: '-8%', width: 480, height: 480, background: 'radial-gradient(circle,rgba(142,133,245,.1),transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative' }}>
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#5B4FE0', marginBottom: 14 }}>核心功能</div>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(30px,3.8vw,46px)', fontWeight: 800, letterSpacing: '-.03em', marginBottom: 16, color: '#1B1830' }}>从询盘到成交，全程 AI 提速</h2>
        <p style={{ textAlign: 'center', fontSize: 18, color: '#5C5878', maxWidth: 560, margin: '0 auto 76px' }}>一套系统替代散落的表格、邮箱和提醒便签，把线索价值真正闭环。</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 96 }}>
          {FEATURES.map((f, i) => <FeatureRow key={i} f={f} rev={i % 2 === 1} />)}
        </div>
      </div>
    </section>
  );
}

/* ============ Flow ============ */
function Flow({ onLogin }) {
  const [ref, vis] = useReveal();
  return (
    <section id="flow" style={{ position: 'relative', overflow: 'hidden', padding: '104px 0', background: 'linear-gradient(125deg,#161036,#2A1F63 55%,#5B4FE0 132%)', scrollMarginTop: 68 }}>
      <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 640, height: 640, background: 'radial-gradient(circle,rgba(142,133,245,.34),transparent 65%)', pointerEvents: 'none', animation: 'lp-glow 7s ease-in-out infinite' }} />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative' }}>
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#b6a9ff', marginBottom: 14 }}>端到端工作流</div>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(30px,3.8vw,46px)', fontWeight: 800, color: '#fff', letterSpacing: '-.03em', marginBottom: 16 }}>四步接住线索，当天见效</h2>
        <p style={{ textAlign: 'center', fontSize: 18, color: 'rgba(255,255,255,.7)', maxWidth: 560, margin: '0 auto 64px' }}>AI 负责初筛、补需求和提醒；方案设计、价格和合同由业务员接管。</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 22 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ position: 'relative', padding: '30px 26px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-.06em', color: 'rgba(182,169,255,.5)', marginBottom: 16 }}>{s.num}</div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.66)', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
        {/* 底部截图 */}
        <div ref={ref} style={{ maxWidth: 940, margin: '56px auto 0', padding: 16, borderRadius: 26, background: 'linear-gradient(155deg,rgba(255,255,255,.16),rgba(255,255,255,.04))', border: '1px solid rgba(255,255,255,.24)', boxShadow: '0 50px 120px -34px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.35)', backdropFilter: 'blur(12px)', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(24px)', transition: 'opacity .7s .2s, transform .7s .2s' }}>
          <div style={{ borderRadius: 15, overflow: 'hidden', boxShadow: '0 20px 50px -18px rgba(0,0,0,.55)' }}>
            <div style={{ height: 36, background: '#211A48', display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            </div>
            <img src="/screenshot-crm.png" alt="工作流演示" style={{ display: 'block', width: '100%', height: 'auto', maxHeight: 440, objectFit: 'cover', objectPosition: 'top' }} />
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <button onClick={onLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', color: '#5B4FE0', fontWeight: 700, fontSize: 16, padding: '15px 34px', borderRadius: 12, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .18s' }}>
            现在开始，免费使用
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============ Pricing ============ */
function Pricing({ onLogin }) {
  const CHECK = (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
  return (
    <section id="pricing" style={{ position: 'relative', overflow: 'hidden', padding: '104px 0', background: '#F6F5FC', scrollMarginTop: 68 }}>
      <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 520, background: 'radial-gradient(circle,rgba(142,133,245,.16),transparent 62%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative' }}>
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#5B4FE0', marginBottom: 14 }}>价格方案</div>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(30px,3.8vw,46px)', fontWeight: 800, letterSpacing: '-.03em', marginBottom: 16, color: '#1B1830' }}>透明定价，按需选择</h2>
        <p style={{ textAlign: 'center', fontSize: 18, color: '#5C5878', maxWidth: 560, margin: '0 auto 68px' }}>专业版提供 14 天完整免费试用，到期前随时取消。</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, alignItems: 'start' }}>
          {PRICING.map((p, i) => {
            const checkColor = p.featured ? '#5B4FE0' : '#2E9E8F';
            return (
              <div key={i} style={{
                padding: p.featured ? '40px 34px' : '38px 34px',
                borderRadius: 20,
                border: p.featured ? '1.5px solid #5B4FE0' : '1.5px solid #E7E4F2',
                background: '#fff',
                position: 'relative',
                boxShadow: p.featured ? '0 0 0 1px #5B4FE0,0 24px 56px -18px rgba(91,79,224,.34)' : 'none',
                transform: p.featured ? 'translateY(-8px)' : 'none',
                transition: 'transform .25s, box-shadow .25s',
              }}>
                {p.badge && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#5B4FE0', color: '#fff', padding: '5px 18px', borderRadius: 99, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {p.badge}
                  </div>
                )}
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, color: '#1B1830' }}>{p.name}</div>
                <div style={{ fontSize: 14, color: '#5C5878', marginBottom: 24, lineHeight: 1.5 }}>{p.desc}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
                  <span style={{ fontSize: p.price === '定制' ? 42 : 50, fontWeight: 800, letterSpacing: '-.05em', lineHeight: 1, color: '#1B1830' }}>{p.price}</span>
                  {p.period && <span style={{ fontSize: 18, color: '#5C5878' }}>{p.period}</span>}
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 30 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 10, fontSize: 15, color: '#5C5878' }}>
                      {CHECK(checkColor)}{f}
                    </li>
                  ))}
                </ul>
                <button onClick={onLogin} style={{
                  display: 'flex', justifyContent: 'center', width: '100%',
                  background: p.ctaStyle === 'primary' ? '#5B4FE0' : 'transparent',
                  color: p.ctaStyle === 'primary' ? '#fff' : p.ctaStyle === 'outline-green' ? '#2E9E8F' : '#5C5878',
                  fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 12,
                  border: p.ctaStyle === 'primary' ? 'none' : p.ctaStyle === 'outline-green' ? '1.5px solid #2E9E8F' : '1.5px solid #E7E4F2',
                  cursor: 'pointer', transition: 'all .18s',
                }}>{p.cta}</button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============ CTA Banner ============ */
function CtaBanner({ onLogin }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '104px 0', background: '#161036' }}>
      <img src="https://images.unsplash.com/photo-1759216373394-91146ca977c7?q=75&w=2400&auto=format&fit=crop"
        alt="" aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 1 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(125deg,rgba(13,14,38,.86) 0%,rgba(22,22,64,.78) 48%,rgba(64,54,170,.6) 128%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 820, height: 520, background: 'radial-gradient(circle,rgba(142,133,245,.36),transparent 62%)', pointerEvents: 'none', animation: 'lp-glow 6s ease-in-out infinite' }} />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: 'clamp(28px,3.6vw,44px)', fontWeight: 800, letterSpacing: '-.03em', marginBottom: 18 }}>
          准备好让 AI 帮你做外贸了吗？
        </h2>
        <p style={{ color: 'rgba(255,255,255,.74)', fontSize: 18, marginBottom: 40, lineHeight: 1.6 }}>
          加入正在用成交官的外贸团队，今天就把询盘转化率提上去。
        </p>
        <button onClick={onLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', color: '#5B4FE0', fontWeight: 700, fontSize: 17, padding: '17px 40px', borderRadius: 14, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .18s' }}>
          免费开始 — 无需信用卡
        </button>
      </div>
    </section>
  );
}

/* ============ Footer ============ */
function Footer() {
  return (
    <footer style={{ background: '#fff', borderTop: '1px solid #EFEDF7', padding: '36px 0' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <LogoIcon size={28} />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.03em', color: '#1B1830' }}>成交官</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['#features','功能'],['#flow','工作流'],['#pricing','定价']].map(([href, label]) => (
            <a key={href} href={href} style={{ color: '#948FB0', fontSize: 14, textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#948FB0' }}>© 2026 成交官 · 保留所有权利</div>
      </div>
    </footer>
  );
}

/* ============ 主导出 ============ */
export function Landing({ onEnter }) {
  return (
    <div className="lp-root" style={{ fontFamily: '"Manrope","PingFang SC","Microsoft YaHei","Source Han Sans SC",sans-serif', color: '#1B1830' }}>
      <NavBar onLogin={onEnter} />
      <Hero onLogin={onEnter} />
      <Marquee />
      <Stats />
      <Features />
      <Flow onLogin={onEnter} />
      <Pricing onLogin={onEnter} />
      <CtaBanner onLogin={onEnter} />
      <Footer />
    </div>
  );
}
