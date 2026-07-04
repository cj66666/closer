import React, { useState } from 'react';
import { Icon } from '../icons.jsx';
import { Drawer, SectionTitle, useToast } from '../ui.jsx';

/* ===== settings.jsx ===== */
/* ============ 渠道接入 + 系统设置 ============ */

/* ── 服务商预设 ── */
const EMAIL_PROVIDERS = [
  {key:'gmail',     name:'Gmail',            note:'需使用应用专用密码',   imap:'imap.gmail.com',          smtp:'smtp.gmail.com',            port_i:993, port_s:465},
  {key:'outlook',   name:'Outlook / M365',   note:'推荐 OAuth 方式',      imap:'outlook.office365.com',   smtp:'smtp.office365.com',        port_i:993, port_s:587},
  {key:'zoho',      name:'Zoho Mail',        note:'',                     imap:'imap.zoho.com',           smtp:'smtp.zoho.com',             port_i:993, port_s:465},
  {key:'qq_biz',    name:'腾讯企业邮',        note:'先在管理后台开 IMAP',  imap:'imap.exmail.qq.com',      smtp:'smtp.exmail.qq.com',        port_i:993, port_s:465},
  {key:'163_biz',   name:'网易企业邮',        note:'',                     imap:'imap.qiye163.com',        smtp:'smtp.qiye.163.com',         port_i:993, port_s:994},
  {key:'ali_mail',  name:'阿里云企业邮',      note:'',                     imap:'imap.mxhichina.com',      smtp:'smtp.mxhichina.com',        port_i:993, port_s:465},
  {key:'qq',        name:'QQ 邮箱',          note:'需开启 IMAP 服务',     imap:'imap.qq.com',             smtp:'smtp.qq.com',               port_i:993, port_s:465},
  {key:'yahoo',     name:'Yahoo Mail',       note:'需使用应用专用密码',   imap:'imap.mail.yahoo.com',     smtp:'smtp.mail.yahoo.com',       port_i:993, port_s:465},
  {key:'custom',    name:'自定义',           note:'手动填写服务器信息',   imap:'',                        smtp:'',                          port_i:993, port_s:465},
];

/* ── 渠道目录 ── */
const CHANNEL_CATALOG = [
  {key:'email',        name:'邮箱',          sub:'直客双向 + 平台通知兜底枢纽',  reply:'full',  method:'IMAP/SMTP · OAuth',  multi:true},
  {key:'whatsapp',     name:'WhatsApp',      sub:'Cloud API · 成交主战场',        reply:'full',  method:'Cloud API',           multi:false},
  {key:'form',         name:'独立站表单',     sub:'Webhook · 实时推送',           reply:'none',  method:'Webhook',             multi:true},
  {key:'email_bridge', name:'邮件桥接',       sub:'阿里/MIC/环球资源站内信解析',  reply:'draft', method:'转发 + 模板解析',     multi:true, isNew:true},
  {key:'alibaba',      name:'阿里国际站',    sub:'RFQ + 站内信原生 API',          reply:'full',  method:'Open Platform API',   multi:false},
  {key:'facebook',     name:'Facebook',      sub:'Lead Ads 留资 + Messenger 手动线索', reply:'draft', method:'手动录入 / CSV · API 后置', multi:false},
  {key:'csv',          name:'CSV 批量导入',  sub:'展会 / 平台后台导出',           reply:'none',  method:'文件上传',            multi:true},
  {key:'wechat',       name:'企业微信',      sub:'老客关系维护',                  reply:'full',  method:'企业微信 API',        multi:false},
  {key:'linkedin',     name:'LinkedIn',      sub:'工业品高价值线索',              reply:'draft', method:'Partner API',         multi:false},
  {key:'telegram',     name:'Telegram',      sub:'俄语区 · 部分欧洲',            reply:'full',  method:'Bot API',             multi:false},
  {key:'tiktok',       name:'TikTok',        sub:'DTC · 消费品',                 reply:'none',  method:'Lead Gen API',        multi:false},
];

const CHANNEL_GROUPS = [
  {label:'即时通讯',       keys:['whatsapp','facebook','wechat','telegram','tiktok']},
  {label:'邮件',           keys:['email','email_bridge']},
  {label:'电商平台',       keys:['alibaba','linkedin']},
  {label:'表单与数据导入', keys:['form','csv']},
];

const REPLY_META = {
  full:  {label:'双向',   color:'var(--green)',   bg:'rgba(43,166,138,.1)'},
  draft: {label:'仅草稿', color:'#CA8A04',        bg:'rgba(202,138,4,.1)'},
  none:  {label:'仅接收', color:'var(--text-3)',  bg:'var(--bg-2,#f4f5f8)'},
};

/* 已接入渠道的运行时元数据（实际产品从后端拉取） */
const CONNECTED_META = {
  email:        {syncTime:'2 小时前', todayCount:0,  account:'sales@sunpath.com',       status:'error', errorMsg:'IMAP 授权码已过期，新邮件暂停同步'},
  whatsapp:     {syncTime:'3 分钟前', todayCount:89, account:'+86 138****8821',          status:'ok'},
  form:         {syncTime:'刚刚',    todayCount:12,  account:'webhook · closer.io',      status:'ok'},
  email_bridge: {syncTime:'12 分钟前',todayCount:6,  account:'bridge@inbox.closer.io',  status:'ok'},
  facebook:     {syncTime:'手动录入', todayCount:3,  account:'Facebook Lead Ads · CSV',  status:'ok'},
};

/* ── 渠道图标 ── */
function ChanIcon({ch, size=40}){
  const colors = {
    email:'#1F5C8C', whatsapp:'#25D366', form:'#6366f1',
    email_bridge:'#CA8A04', alibaba:'#FF6900', facebook:'#1877F2',
    csv:'#374151', wechat:'#07C160', linkedin:'#0A66C2',
    telegram:'#26A5E4', tiktok:'#000',
  };
  const initials = {
    email:'Mail', whatsapp:'WA', form:'Form', email_bridge:'桥接',
    alibaba:'阿里', facebook:'FB', csv:'CSV', wechat:'微信',
    linkedin:'in', telegram:'TG', tiktok:'TK',
  };
  return (
    <div style={{width:size,height:size,borderRadius:10,background:colors[ch]||'var(--primary)',
      display:'flex',alignItems:'center',justifyContent:'center',flex:'none',
      boxShadow:'inset 0 1px 0 rgba(255,255,255,.2)'}}>
      <span style={{color:'#fff',fontSize:size*0.28,fontWeight:700,letterSpacing:'-.02em'}}>{initials[ch]||'?'}</span>
    </div>
  );
}

/* ── 回复能力 Badge ── */
function ReplyBadge({reply}){
  const m = REPLY_META[reply]||REPLY_META.none;
  return (
    <span style={{fontSize:10.5,fontWeight:600,padding:'2px 7px',borderRadius:4,
      color:m.color,background:m.bg,flex:'none',whiteSpace:'nowrap'}}>
      {m.label}
    </span>
  );
}

/* ── 状态点 ── */
function StatusDot({status}){
  const colors = {ok:'var(--green)', warn:'#CA8A04', error:'var(--red)'};
  return (
    <span style={{width:7,height:7,borderRadius:'50%',background:colors[status]||'var(--text-3)',
      flex:'none',boxShadow:`0 0 0 2px ${status==='ok'?'rgba(43,166,138,.2)':status==='error'?'rgba(224,82,82,.2)':'rgba(202,138,4,.2)'}`}}/>
  );
}

/* ── 已接入渠道 Dashboard ── */
function ConnectedSection({connectedKeys, onManage}){
  if(!connectedKeys||connectedKeys.length===0) return null;

  const errorKeys   = connectedKeys.filter(k=>(CONNECTED_META[k]||{}).status==='error');
  const totalToday  = connectedKeys.reduce((s,k)=>s+(CONNECTED_META[k]?.todayCount||0), 0);

  return (
    <div style={{marginBottom:30}}>
      {/* 错误告警横幅 */}
      {errorKeys.length>0&&(
        <div className="row gap3" onClick={()=>onManage(errorKeys[0])}
          style={{padding:'11px 16px',borderRadius:10,marginBottom:14,cursor:'pointer',
            background:'rgba(224,82,82,.06)',border:'1px solid rgba(224,82,82,.28)',
            transition:'background .14s'}}>
          <Icon name="alert" size={16} style={{color:'var(--red)',flex:'none'}}/>
          <span style={{fontSize:13,color:'var(--red)',flex:1}}>
            <b>{CHANNEL_CATALOG.find(c=>c.key===errorKeys[0])?.name}</b>{' '}
            渠道故障：{CONNECTED_META[errorKeys[0]]?.errorMsg}
          </span>
          <span style={{fontSize:12.5,fontWeight:600,color:'var(--red)',flex:'none',whiteSpace:'nowrap'}}>
            立即修复 →
          </span>
        </div>
      )}

      {/* 已接入标题行 */}
      <div className="row spread" style={{marginBottom:12,alignItems:'center'}}>
        <div className="row gap2" style={{alignItems:'center'}}>
          <span style={{fontSize:11.5,fontWeight:700,color:'var(--text-3)',letterSpacing:'.06em',textTransform:'uppercase'}}>已接入渠道</span>
          <span style={{fontSize:11.5,padding:'1px 7px',borderRadius:10,background:'var(--primary-tint)',color:'var(--primary)',fontWeight:600}}>
            {connectedKeys.length}
          </span>
        </div>
        <span style={{fontSize:12.5,color:'var(--text-3)'}}>今日合计 <b style={{color:'var(--text)',fontVariantNumeric:'tabular-nums'}}>{totalToday}</b> 条询盘</span>
      </div>

      {/* 已接入卡片行 */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:10}}>
        {connectedKeys.map(key=>{
          const ch   = CHANNEL_CATALOG.find(c=>c.key===key);
          const meta = CONNECTED_META[key]||{};
          const isErr = meta.status==='error';
          return (
            <div key={key} className="card" style={{
              padding:'14px 16px',
              border:`1px solid ${isErr?'rgba(224,82,82,.35)':'var(--border)'}`,
              background:isErr?'rgba(224,82,82,.025)':'var(--surface)',
            }}>
              <div className="row gap2" style={{marginBottom:10,alignItems:'flex-start'}}>
                <ChanIcon ch={key} size={32}/>
                <div className="col" style={{gap:2,flex:1,minWidth:0}}>
                  <div className="row gap2" style={{alignItems:'center'}}>
                    <span style={{fontWeight:700,fontSize:13.5}}>{ch?.name}</span>
                    <StatusDot status={meta.status}/>
                  </div>
                  <span style={{fontSize:11,color:'var(--text-3)'}} className="ellipsis">{meta.account}</span>
                </div>
              </div>
              <div className="row spread" style={{marginBottom:12,alignItems:'flex-end'}}>
                <div>
                  <div style={{fontSize:20,fontWeight:700,lineHeight:1,
                    color:isErr?'var(--red)':'var(--text)',fontVariantNumeric:'tabular-nums'}}>
                    {meta.todayCount||0}
                  </div>
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>今日询盘</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:12,color:isErr?'var(--red)':'var(--text-3)'}}>
                    {isErr?'已中断':meta.syncTime}
                  </div>
                  <div style={{fontSize:11,color:'var(--text-3)'}}>最近同步</div>
                </div>
              </div>
              <button onClick={()=>onManage(key)}
                className="btn btn-sm btn-sec"
                style={{width:'100%',
                  color:isErr?'var(--red)':'var(--text)',
                  borderColor:isErr?'rgba(224,82,82,.4)':'var(--border)'}}>
                {isErr?<><Icon name="alert" size={12}/>{' 修复连接'}</>:'管理配置'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── 邮件接入向导 ── */
function EmailWizard({onClose, onSave}){
  const toast = useToast();
  const [step, setStep]         = useState(1);
  const [method, setMethod]     = useState('imap');
  const [provider, setProvider] = useState('gmail');
  const [testState, setTest]    = useState(null);
  const [form, setForm]         = useState({
    email:'', password:'', from_name:'',
    imap_host:'imap.gmail.com', imap_port:'993',
    smtp_host:'smtp.gmail.com', smtp_port:'465',
    mailbox:'INBOX', start_date:'',
  });

  const pv  = EMAIL_PROVIDERS.find(p=>p.key===provider)||EMAIL_PROVIDERS[0];
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const applyProvider = (pk) => {
    setProvider(pk);
    const p = EMAIL_PROVIDERS.find(x=>x.key===pk);
    if(p && pk!=='custom') setForm(f=>({...f,
      imap_host:p.imap, imap_port:String(p.port_i),
      smtp_host:p.smtp, smtp_port:String(p.port_s),
    }));
  };

  const runTest = () => {
    if(!form.email||!form.password){ toast('请先填写邮箱和授权码','warn'); return; }
    setTest('running');
    setTimeout(()=>{ setTest('ok'); toast('连接测试通过','info'); }, 2000);
  };

  const steps = ['连接方式','服务商','账号配置','连接测试','收取设置'];
  const canNext = () => {
    if(step===2 && !provider) return false;
    if(step===3 && (!form.email||!form.password)) return false;
    if(step===4 && testState!=='ok') return false;
    return true;
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* 步骤指示 */}
      <div style={{padding:'16px 20px 0',borderBottom:'1px solid var(--border-2)'}}>
        <div className="row gap1" style={{gap:0}}>
          {steps.map((s,i)=>{
            const idx=i+1; const done=idx<step; const active=idx===step;
            return (
              <React.Fragment key={s}>
                <div className="col" style={{alignItems:'center',flex:1}}>
                  <div style={{width:24,height:24,borderRadius:'50%',
                    background:done?'var(--green)':active?'var(--primary)':'var(--border)',
                    color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:11,fontWeight:700,marginBottom:4}}>
                    {done?<Icon name="check" size={12}/>:idx}
                  </div>
                  <span style={{fontSize:10.5,color:active?'var(--primary)':done?'var(--green)':'var(--text-3)',
                    fontWeight:active||done?600:400,whiteSpace:'nowrap'}}>{s}</span>
                </div>
                {i<steps.length-1&&<div style={{height:1,flex:0.6,background:'var(--border-2)',marginTop:11,alignSelf:'flex-start'}}/>}
              </React.Fragment>
            );
          })}
        </div>
        <div style={{height:14}}/>
      </div>

      {/* 内容区 */}
      <div style={{flex:1,overflowY:'auto',padding:'20px 20px 0'}}>

        {/* Step 1: 连接方式 */}
        {step===1&&(
          <div className="col" style={{gap:12}}>
            <p className="muted" style={{fontSize:13,marginBottom:4}}>推荐使用 OAuth——无需授权码，自动处理 2FA，连接更稳定。</p>
            {[
              {key:'oauth',label:'OAuth 授权（推荐）',sub:'Gmail / Outlook 一键授权，无需手填密码',badge:'推荐',badgeColor:'var(--green)'},
              {key:'imap', label:'IMAP / SMTP + 授权码',sub:'支持任意邮箱，Gmail/Outlook 需先生成应用专用密码'},
            ].map(m=>(
              <button key={m.key} onClick={()=>setMethod(m.key)}
                style={{padding:'14px 16px',borderRadius:10,textAlign:'left',width:'100%',cursor:'pointer',
                  border:`1.5px solid ${method===m.key?'var(--primary)':'var(--border)'}`,
                  background:method===m.key?'var(--primary-tint)':'var(--surface)'}}>
                <div className="row spread">
                  <span style={{fontWeight:600,fontSize:13.5,color:'var(--text)'}}>{m.label}
                    {m.badge&&<span style={{marginLeft:8,fontSize:10.5,fontWeight:600,padding:'1px 7px',borderRadius:4,
                      background:m.badgeColor+'22',color:m.badgeColor}}>{m.badge}</span>}
                  </span>
                  <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${method===m.key?'var(--primary)':'var(--border)'}`,
                    display:'flex',alignItems:'center',justifyContent:'center',flex:'none'}}>
                    {method===m.key&&<div style={{width:8,height:8,borderRadius:'50%',background:'var(--primary)'}}/>}
                  </div>
                </div>
                <p style={{fontSize:12,color:'var(--text-3)',marginTop:4}}>{m.sub}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: 服务商 */}
        {step===2&&(
          <div className="col" style={{gap:8}}>
            <p className="muted" style={{fontSize:13,marginBottom:4}}>选择后自动填写服务器信息，只需输入邮箱和授权码。</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {EMAIL_PROVIDERS.map(p=>(
                <button key={p.key} onClick={()=>applyProvider(p.key)}
                  style={{padding:'10px 12px',borderRadius:9,textAlign:'left',cursor:'pointer',
                    border:`1.5px solid ${provider===p.key?'var(--primary)':'var(--border)'}`,
                    background:provider===p.key?'var(--primary-tint)':'var(--surface)'}}>
                  <div style={{fontWeight:600,fontSize:13,color:'var(--text)'}}>{p.name}</div>
                  {p.note&&<div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{p.note}</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: 账号配置 */}
        {step===3&&(
          <div className="col" style={{gap:14}}>
            <div className="col" style={{gap:5}}>
              <label style={{fontSize:12.5,fontWeight:600,color:'var(--text-2)'}}>发件人显示名</label>
              <input className="input" placeholder="如：Sunpath Outdoor" value={form.from_name} onChange={e=>set('from_name',e.target.value)}/>
            </div>
            <div className="col" style={{gap:5}}>
              <label style={{fontSize:12.5,fontWeight:600,color:'var(--text-2)'}}>邮箱地址</label>
              <input className="input" type="email" placeholder="sales@yourco.com" value={form.email} onChange={e=>set('email',e.target.value)}/>
            </div>
            <div className="col" style={{gap:5}}>
              <label style={{fontSize:12.5,fontWeight:600,color:'var(--text-2)'}}>
                {provider==='gmail'||provider==='outlook'?'应用专用密码 / 授权码':'密码 / 授权码'}
              </label>
              <input className="input" type="password" placeholder="非登录密码，需单独生成" value={form.password} onChange={e=>set('password',e.target.value)}/>
              {(provider==='gmail'||provider==='qq')&&(
                <span style={{fontSize:11.5,color:'var(--primary)',cursor:'pointer'}}>如何生成授权码？↗</span>
              )}
            </div>
            {provider==='custom'&&(
              <div style={{padding:'14px',borderRadius:10,border:'1px solid var(--border-2)',background:'var(--bg-2,#f9f9fb)'}}>
                <div style={{fontSize:12.5,fontWeight:600,color:'var(--text-2)',marginBottom:10}}>自定义服务器</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 80px',gap:8,marginBottom:8}}>
                  <input className="input" placeholder="IMAP 服务器" value={form.imap_host} onChange={e=>set('imap_host',e.target.value)}/>
                  <input className="input" placeholder="端口" value={form.imap_port} onChange={e=>set('imap_port',e.target.value)}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 80px',gap:8}}>
                  <input className="input" placeholder="SMTP 服务器" value={form.smtp_host} onChange={e=>set('smtp_host',e.target.value)}/>
                  <input className="input" placeholder="端口" value={form.smtp_port} onChange={e=>set('smtp_port',e.target.value)}/>
                </div>
              </div>
            )}
            {provider!=='custom'&&(
              <div style={{padding:'10px 12px',borderRadius:9,background:'var(--bg-2,#f4f5f8)',fontSize:12,color:'var(--text-3)'}}>
                IMAP: <b style={{color:'var(--text-2)'}}>{pv.imap}:{pv.port_i}</b> · SMTP: <b style={{color:'var(--text-2)'}}>{pv.smtp}:{pv.port_s}</b>
              </div>
            )}
          </div>
        )}

        {/* Step 4: 连接测试 */}
        {step===4&&(
          <div className="col" style={{gap:16}}>
            <p className="muted" style={{fontSize:13}}>保存前需通过双向连接测试（收信 + 发信）。</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[{label:'IMAP 收信',sub:'验证能否读取邮件'},{label:'SMTP 发信',sub:'向自己发送测试邮件'}].map((t)=>(
                <div key={t.label} style={{padding:'16px',borderRadius:10,
                  border:`1.5px solid ${testState==='ok'?'rgba(43,166,138,.4)':testState==='fail'?'rgba(224,82,82,.3)':'var(--border)'}`,
                  background:testState==='ok'?'rgba(43,166,138,.04)':testState==='fail'?'rgba(224,82,82,.03)':'var(--surface)'}}>
                  <div style={{fontWeight:600,fontSize:13.5,marginBottom:4}}>{t.label}</div>
                  <div style={{fontSize:12,color:'var(--text-3)',marginBottom:10}}>{t.sub}</div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {testState===null&&<span style={{fontSize:12,color:'var(--text-3)'}}>待测试</span>}
                    {testState==='running'&&<span style={{fontSize:12,color:'var(--text-3)'}}>测试中…</span>}
                    {testState==='ok'&&<><Icon name="check" size={14} style={{color:'var(--green)'}}/><span style={{fontSize:12,color:'var(--green)',fontWeight:600}}>通过</span></>}
                    {testState==='fail'&&<span style={{fontSize:12,color:'var(--red)',fontWeight:600}}>失败</span>}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-pri" onClick={runTest} disabled={testState==='running'||testState==='ok'}
              style={{alignSelf:'flex-start'}}>
              {testState==='running'?'测试中…':testState==='ok'?'✓ 测试通过':'开始测试'}
            </button>
            {testState==='fail'&&(
              <div style={{padding:'12px 14px',borderRadius:9,background:'rgba(224,82,82,.06)',border:'1px solid rgba(224,82,82,.2)',fontSize:12.5,color:'var(--red)'}}>
                认证失败 · 请确认：① 是否已开启 IMAP 服务 ② 使用的是授权码（非登录密码）
              </div>
            )}
          </div>
        )}

        {/* Step 5: 收取设置 */}
        {step===5&&(
          <div className="col" style={{gap:16}}>
            <div className="col" style={{gap:5}}>
              <label style={{fontSize:12.5,fontWeight:600,color:'var(--text-2)'}}>收取文件夹</label>
              <input className="input" placeholder="INBOX" value={form.mailbox} onChange={e=>set('mailbox',e.target.value)}/>
              <span style={{fontSize:11.5,color:'var(--text-3)'}}>多数情况保持 INBOX；如有专用询盘文件夹可单独指定</span>
            </div>
            <div className="col" style={{gap:5}}>
              <label style={{fontSize:12.5,fontWeight:600,color:'var(--text-2)'}}>起始收取日期 <span style={{fontWeight:400,color:'var(--text-3)'}}>（防止吞入历史邮件）</span></label>
              <input className="input" type="date" value={form.start_date} onChange={e=>set('start_date',e.target.value)}/>
              <span style={{fontSize:11.5,color:'var(--text-3)'}}>留空则从今日起收取，不导入历史记录</span>
            </div>
            <div style={{padding:'12px 14px',borderRadius:9,background:'rgba(202,138,4,.07)',border:'1px solid rgba(202,138,4,.2)'}}>
              <span style={{fontSize:12.5,color:'#92650a',fontWeight:500}}>📋 SPF/DKIM/DMARC 提示：从自有域名发信时建议在 DNS 配置 SPF 和 DKIM，以提升投递率和避免进垃圾箱。</span>
            </div>
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div className="row spread" style={{padding:'16px 20px',borderTop:'1px solid var(--border-2)',marginTop:16,flexShrink:0}}>
        <button className="btn btn-sec" onClick={step===1?onClose:()=>setStep(s=>s-1)}>
          {step===1?'取消':'← 上一步'}
        </button>
        <div className="row gap2">
          <span style={{fontSize:12,color:'var(--text-3)'}}>{step} / {steps.length}</span>
          {step<steps.length
            ? <button className="btn btn-pri" onClick={()=>setStep(s=>s+1)} disabled={!canNext()}>下一步 →</button>
            : <button className="btn btn-pri" onClick={()=>{ onSave(); toast('邮箱接入已配置，开始同步','info'); onClose(); }}>完成接入</button>
          }
        </div>
      </div>
    </div>
  );
}

/* ── WhatsApp 配置面板 ── */
function WhatsAppPanel({onClose}){
  const toast = useToast();
  return (
    <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:16}}>
      <div className="row gap3" style={{padding:'14px',borderRadius:10,background:'rgba(43,166,138,.07)',border:'1px solid rgba(43,166,138,.2)'}}>
        <Icon name="check" size={16} style={{color:'var(--green)',flex:'none'}}/>
        <div className="col" style={{gap:1}}>
          <span style={{fontWeight:600,fontSize:13.5,color:'var(--green)'}}>已连接 · Cloud API</span>
          <span style={{fontSize:12,color:'var(--text-3)'}}>Phone: +86 138 **** 8821 · 业务账号认证中</span>
        </div>
      </div>
      {[
        ['会话窗口策略','买家 24h 窗口期内自动回复，窗口关闭后发送模板消息'],
        ['模板消息余量','询盘确认模板 3 条 · 报价推送模板 2 条'],
        ['质量评级','当前评分 Green ✅，保持在 95%+ 以上触达率'],
      ].map(([t,d])=>(
        <div key={t} style={{padding:'12px 14px',borderRadius:9,border:'1px solid var(--border)',background:'var(--surface)'}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{t}</div>
          <div style={{fontSize:12,color:'var(--text-3)'}}>{d}</div>
        </div>
      ))}
      <button className="btn btn-sec" onClick={onClose} style={{alignSelf:'flex-end'}}>关闭</button>
    </div>
  );
}

/* ── 独立站表单面板 ── */
function FormWebhookPanel({onClose}){
  const toast = useToast();
  const url = 'https://api.closer.io/webhook/inquiry/f8a2b1c9d3e4';
  return (
    <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:16}}>
      <p style={{fontSize:13,color:'var(--text-2)'}}>将下方 Webhook URL 配置到你的网站表单或在线客服系统，提交的询盘将实时推送到 Closer。</p>
      <div className="col" style={{gap:6}}>
        <label style={{fontSize:12.5,fontWeight:600,color:'var(--text-2)'}}>Webhook URL</label>
        <div className="row gap2">
          <input className="input" readOnly value={url} style={{flex:1,fontFamily:'monospace',fontSize:12}}/>
          <button className="btn btn-sec" onClick={()=>{ navigator.clipboard?.writeText(url); toast('已复制到剪贴板','info'); }}>复制</button>
        </div>
      </div>
      <div style={{padding:'12px 14px',borderRadius:9,background:'var(--bg-2,#f4f5f8)',fontSize:12,color:'var(--text-3)'}}>
        POST 请求，JSON 格式，支持字段：<code>name</code> · <code>email</code> · <code>company</code> · <code>message</code> · <code>product</code>
      </div>
      <div style={{fontSize:12.5,fontWeight:600,color:'var(--text-2)',marginBottom:2}}>今日接入统计</div>
      <div className="row gap3">
        {[['今日提交','12'],['本月','340'],['转化率','62%']].map(([l,v])=>(
          <div key={l} style={{flex:1,padding:'10px 12px',borderRadius:9,border:'1px solid var(--border)',textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:700,color:'var(--primary)',fontVariantNumeric:'tabular-nums'}}>{v}</div>
            <div style={{fontSize:11.5,color:'var(--text-3)',marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-sec" onClick={onClose} style={{alignSelf:'flex-end'}}>关闭</button>
    </div>
  );
}

/* ── 邮件桥接面板 ── */
function BridgePanel({onClose}){
  const toast = useToast();
  const addr = 'bridge+f8a2b1c9@inbox.closer.io';
  return (
    <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:16}}>
      <div style={{padding:'12px 14px',borderRadius:9,background:'rgba(76,79,184,.07)',border:'1px solid rgba(76,79,184,.2)',fontSize:12.5,color:'var(--primary)'}}>
        将平台（阿里国际站/MIC/环球资源）的询盘通知邮件转发到下方地址，Closer 自动解析为结构化询盘。回复走邮件或 WhatsApp，<b>不</b>自动回平台站内。
      </div>
      <div className="col" style={{gap:6}}>
        <label style={{fontSize:12.5,fontWeight:600,color:'var(--text-2)'}}>桥接收件地址</label>
        <div className="row gap2">
          <input className="input" readOnly value={addr} style={{flex:1,fontFamily:'monospace',fontSize:12}}/>
          <button className="btn btn-sec" onClick={()=>{ navigator.clipboard?.writeText(addr); toast('已复制','info'); }}>复制</button>
        </div>
      </div>
      <div className="col" style={{gap:8}}>
        <div style={{fontSize:12.5,fontWeight:600,color:'var(--text-2)'}}>已支持解析的平台</div>
        {[
          ['阿里国际站','站内信通知邮件 · 自动识别买家/产品/询盘内容'],
          ['Made-in-China','MIC 询盘通知 · 解析联系人与需求'],
          ['环球资源 Global Sources','询盘通知邮件解析'],
          ['自定义平台','转发后人工标注字段映射（Beta）'],
        ].map(([t,d])=>(
          <div key={t} className="row gap3" style={{padding:'10px 12px',borderRadius:8,border:'1px solid var(--border)'}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'var(--primary)',flex:'none',marginTop:3}}/>
            <div className="col" style={{gap:1}}>
              <span style={{fontWeight:600,fontSize:13}}>{t}</span>
              <span style={{fontSize:11.5,color:'var(--text-3)'}}>{d}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-sec" onClick={onClose} style={{alignSelf:'flex-end'}}>关闭</button>
    </div>
  );
}

/* ── 邮件修复面板（授权码已过期） ── */
function EmailRepairPanel({onClose, onFixed}){
  const toast = useToast();
  const [pwd, setPwd] = useState('');
  const [testing, setTesting] = useState(false);
  const [ok, setOk] = useState(false);
  const runTest = () => {
    if(!pwd){ toast('请填写新授权码','warn'); return; }
    setTesting(true);
    setTimeout(()=>{ setTesting(false); setOk(true); toast('重新连接成功','info'); }, 1800);
  };
  return (
    <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:16}}>
      <div className="row gap3" style={{padding:'13px 15px',borderRadius:10,
        background:'rgba(224,82,82,.06)',border:'1px solid rgba(224,82,82,.3)'}}>
        <Icon name="alert" size={16} style={{color:'var(--red)',flex:'none'}}/>
        <div className="col" style={{gap:2}}>
          <span style={{fontWeight:600,fontSize:13.5,color:'var(--red)'}}>IMAP 授权码已过期</span>
          <span style={{fontSize:12,color:'var(--text-3)'}}>新邮件暂停同步 · 最近同步：2 小时前</span>
        </div>
      </div>
      <div className="col" style={{gap:5}}>
        <label style={{fontSize:12.5,fontWeight:600,color:'var(--text-2)'}}>重新填写应用专用密码</label>
        <input className="input" type="password" placeholder="从邮箱安全设置重新生成" value={pwd} onChange={e=>setPwd(e.target.value)}/>
        <span style={{fontSize:11.5,color:'var(--primary)',cursor:'pointer'}}>Gmail：如何重新生成授权码？↗</span>
      </div>
      {ok&&(
        <div className="row gap2" style={{padding:'11px 14px',borderRadius:9,
          background:'rgba(43,166,138,.07)',border:'1px solid rgba(43,166,138,.2)'}}>
          <Icon name="check" size={15} style={{color:'var(--green)'}}/>
          <span style={{fontSize:13,color:'var(--green)',fontWeight:600}}>重新连接成功，同步已恢复</span>
        </div>
      )}
      <div className="row spread">
        <button className="btn btn-sec" onClick={onClose}>取消</button>
        {ok
          ? <button className="btn btn-pri" onClick={()=>{ onFixed(); onClose(); }}>完成</button>
          : <button className="btn btn-pri" onClick={runTest} disabled={testing}>
              {testing?'验证中…':'验证并重连'}
            </button>
        }
      </div>
    </div>
  );
}

/* ── ToggleRow ── */
function ToggleRow({icon,title,desc,on,set,locked}){
  return (
    <div className="row spread" style={{padding:'16px 20px'}}>
      <div className="row gap3">
        <span style={{width:34,height:34,borderRadius:8,background:'var(--primary-tint)',color:'var(--primary)',
          display:'inline-flex',alignItems:'center',justifyContent:'center',flex:'none'}}>
          <Icon name={icon} size={17}/>
        </span>
        <div className="col">
          <span style={{fontWeight:600,fontSize:13.5}} className="row gap2">
            {title}{locked&&<Icon name="shield" size={12} style={{color:'var(--red)'}}/>}
          </span>
          <span className="aux">{desc}</span>
        </div>
      </div>
      <div className={`switch ${on?'on':''}`} onClick={()=>set(!on)} style={locked?{opacity:.7}:null}/>
    </div>
  );
}

/* ══════════════════════════════════════════
   渠道接入页面
══════════════════════════════════════════ */
function Settings(){
  const toast = useToast();
  /* connected: key → 接入数量（0 = 未接入） */
  const [connCount, setConnCount] = useState({
    email:1, whatsapp:1, form:1, email_bridge:0,
    alibaba:0, facebook:0, csv:0, wechat:0, linkedin:0, telegram:0, tiktok:0,
  });
  const [drawer, setDrawer] = useState(null);

  const isConnected = (key) => (connCount[key]||0) > 0;

  const openManage = (key) => {
    if(key==='email')             setDrawer('email_repair');
    else if(key==='whatsapp')     setDrawer('whatsapp');
    else if(key==='form')         setDrawer('form');
    else if(key==='email_bridge') setDrawer('bridge');
    else if(key==='facebook')     toast('Facebook 第一版用于手动录入和 CSV 导入，真实 API 集成后置','info');
    else                          toast('配置界面即将上线','info');
  };

  const openConnect = (key) => {
    if(key==='email')             setDrawer('email');
    else if(key==='whatsapp')     setDrawer('whatsapp');
    else if(key==='form')         setDrawer('form');
    else if(key==='email_bridge') setDrawer('bridge');
    else if(key==='facebook')     { setConnCount(c=>({...c,facebook:(c.facebook||0)+1})); toast('已启用 Facebook 手动线索入口','ok'); }
    else                          toast('配置界面即将上线','info');
  };

  const drawerTitle = {
    email:'邮箱接入配置',
    email_repair:'邮箱连接修复',
    whatsapp:'WhatsApp 配置',
    form:'独立站表单',
    bridge:'邮件桥接配置',
  }[drawer]||'配置';

  /* 已接入的 key 列表 */
  const connectedKeys = Object.keys(connCount).filter(k=>connCount[k]>0);

  /* 今日合计：所有已接入渠道 todayCount 之和 */
  const totalToday = connectedKeys.reduce((s,k)=>s+(CONNECTED_META[k]?.todayCount||0), 0);

  return (
    <div className="page-scroll">
      <div style={{padding:'24px 28px',maxWidth:1040,margin:'0 auto'}}>

        {/* Header */}
        <div className="row spread" style={{marginBottom:28,alignItems:'flex-end'}}>
          <div className="col" style={{gap:2}}>
            <span className="eyebrow" style={{color:'var(--tech-deep)'}}>Channels · 询盘接入</span>
            <span className="h1">渠道接入</span>
            <span className="muted" style={{marginTop:2}}>统一接入 Email、WhatsApp、独立站表单和 Facebook，先沉淀线索，再推进客户生命周期</span>
          </div>
          {totalToday>0&&(
            <div style={{padding:'6px 14px',borderRadius:8,background:'rgba(43,166,138,.1)',color:'var(--green)',fontSize:13,fontWeight:600}}>
              今日 <span style={{fontVariantNumeric:'tabular-nums'}}>{totalToday}</span> 条询盘
            </div>
          )}
        </div>

        {/* 已接入渠道概览 */}
        {connectedKeys.length>0&&(
          <ConnectedSection connectedKeys={connectedKeys} onManage={openManage}/>
        )}

        {/* 分割线 */}
        {connectedKeys.length>0&&(
          <div style={{height:1,background:'var(--border-2)',marginBottom:28}}/>
        )}

        {/* 渠道目录 — 始终显示所有渠道，已接入的展示状态 */}
        <div style={{fontSize:11.5,fontWeight:700,color:'var(--text-3)',letterSpacing:'.06em',
          textTransform:'uppercase',marginBottom:16}}>渠道目录</div>

        {CHANNEL_GROUPS.map(group=>{
          const channels = group.keys
            .map(k=>CHANNEL_CATALOG.find(c=>c.key===k))
            .filter(Boolean)
            .filter(ch=>{
              /* 单实例且已接入：从目录消失，只在顶部已接入区管理 */
              if((connCount[ch.key]||0)>0 && !ch.multi) return false;
              return true;
            });
          if(channels.length===0) return null;
          return (
            <div key={group.label} style={{marginBottom:24}}>
              <div style={{fontSize:11.5,fontWeight:600,color:'var(--text-3)',marginBottom:10}}>{group.label}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {channels.map(ch=>{
                  const cnt  = connCount[ch.key]||0;
                  const conn = cnt > 0; /* 只有 multi 渠道会带着 conn=true 留在此 */
                  return (
                    <div key={ch.key} className="card card-pad anim-up">
                      <div className="row gap3" style={{marginBottom:12}}>
                        <ChanIcon ch={ch.key} size={40}/>
                        <div className="col" style={{minWidth:0,gap:2,flex:1}}>
                          <div className="row gap2" style={{flexWrap:'wrap',alignItems:'center'}}>
                            <span style={{fontWeight:700,fontSize:14}}>{ch.name}</span>
                            <ReplyBadge reply={ch.reply}/>
                            {ch.isNew&&<span style={{fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4,
                              background:'rgba(99,102,241,.12)',color:'#6366f1'}}>NEW</span>}
                          </div>
                          <span style={{fontSize:12,color:'var(--text-3)'}}>{ch.sub}</span>
                          {conn&&(
                            <span style={{fontSize:11.5,color:'var(--green)',fontWeight:500,marginTop:1}}>
                              已接入 {cnt} 个账号
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="row spread" style={{alignItems:'center'}}>
                        <span style={{fontSize:11,color:'var(--text-3)',padding:'2px 7px',borderRadius:5,
                          background:'var(--bg-2,#f4f5f8)',fontFamily:'monospace'}}>
                          {ch.method}
                        </span>
                        {/* 目录只有连接入口，管理统一在顶部已接入区 */}
                        <button className="btn btn-sm btn-pri" onClick={()=>openConnect(ch.key)}>
                          {conn ? '再接入' : '连接'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 自定义与插件扩展 */}
        <div style={{height:1,background:'var(--border-2)',margin:'4px 0 24px'}}/>
        <div style={{fontSize:11.5,fontWeight:700,color:'var(--text-3)',letterSpacing:'.06em',
          textTransform:'uppercase',marginBottom:12}}>自定义与插件</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:32}}>
          {/* 自定义 Webhook */}
          <div className="card card-pad anim-up">
            <div className="row gap3" style={{marginBottom:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:'#374151',
                display:'flex',alignItems:'center',justifyContent:'center',flex:'none',
                boxShadow:'inset 0 1px 0 rgba(255,255,255,.15)'}}>
                <Icon name="link" size={18} style={{color:'#fff'}}/>
              </div>
              <div className="col" style={{gap:2,flex:1,minWidth:0}}>
                <div className="row gap2" style={{alignItems:'center'}}>
                  <span style={{fontWeight:700,fontSize:14}}>自定义 Webhook</span>
                </div>
                <span style={{fontSize:12,color:'var(--text-3)'}}>任意支持 HTTP 回调的平台均可接入</span>
              </div>
            </div>
            <div className="row spread" style={{alignItems:'center'}}>
              <span style={{fontSize:11,color:'var(--text-3)',padding:'2px 7px',borderRadius:5,
                background:'var(--bg-2,#f4f5f8)',fontFamily:'monospace'}}>HTTP POST</span>
              <button className="btn btn-sm btn-pri" onClick={()=>toast('自定义 Webhook 配置即将上线','info')}>配置</button>
            </div>
          </div>

          {/* 插件市场 */}
          <div className="card card-pad anim-up" style={{
            background:'linear-gradient(135deg,var(--primary-tint) 0%,rgba(99,102,241,.04) 100%)',
            border:'1px solid rgba(76,79,184,.2)'}}>
            <div className="row gap3" style={{marginBottom:12}}>
              <div style={{width:40,height:40,borderRadius:10,
                background:'linear-gradient(135deg,var(--primary),rgba(99,102,241,1))',
                display:'flex',alignItems:'center',justifyContent:'center',flex:'none',
                boxShadow:'inset 0 1px 0 rgba(255,255,255,.2)'}}>
                <Icon name="box" size={18} style={{color:'#fff'}}/>
              </div>
              <div className="col" style={{gap:2,flex:1,minWidth:0}}>
                <div className="row gap2" style={{alignItems:'center'}}>
                  <span style={{fontWeight:700,fontSize:14}}>插件市场</span>
                  <span style={{fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4,
                    background:'rgba(76,79,184,.12)',color:'var(--primary)'}}>Beta</span>
                </div>
                <span style={{fontSize:12,color:'var(--text-3)'}}>安装社区插件，接入未列出的平台或工具</span>
              </div>
            </div>
            <div className="row spread" style={{alignItems:'center'}}>
              <span style={{fontSize:12,color:'var(--text-3)'}}>12 个插件可用</span>
              <button className="btn btn-sm btn-sec"
                style={{color:'var(--primary)',borderColor:'rgba(76,79,184,.3)'}}
                onClick={()=>toast('插件市场即将上线','info')}>
                浏览插件 →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 渠道配置 Drawer */}
      <Drawer open={!!drawer} onClose={()=>setDrawer(null)} title={drawerTitle} width={500}>
        {drawer==='email'        &&<EmailWizard onClose={()=>setDrawer(null)} onSave={()=>setConnCount(c=>({...c,email:(c.email||0)+1}))}/>}
        {drawer==='email_repair' &&<EmailRepairPanel onClose={()=>setDrawer(null)} onFixed={()=>{}}/>}
        {drawer==='whatsapp'     &&<WhatsAppPanel onClose={()=>setDrawer(null)}/>}
        {drawer==='form'         &&<FormWebhookPanel onClose={()=>setDrawer(null)}/>}
        {drawer==='bridge'       &&<BridgePanel onClose={()=>setDrawer(null)}/>}
      </Drawer>
    </div>
  );
}

/* ══════════════════════════════════════════
   大模型配置
══════════════════════════════════════════ */
const LLM_PROVIDERS = {
  anthropic:{name:'Anthropic Claude', base:'https://api.anthropic.com', models:[
    ['claude-opus-4-8','Claude Opus 4.8（推荐 · 最强）'],
    ['claude-sonnet-4-6','Claude Sonnet 4.6（均衡）'],
    ['claude-haiku-4-5-20251001','Claude Haiku 4.5（高速）'],
    ['claude-fable-5','Claude Fable 5'],
  ]},
  openai:{name:'OpenAI', base:'https://api.openai.com/v1', models:[
    ['gpt-4o','GPT-4o'],['gpt-4o-mini','GPT-4o mini'],['o3','o3'],
  ]},
  deepseek:{name:'DeepSeek', base:'https://api.deepseek.com', models:[
    ['deepseek-chat','deepseek-chat'],['deepseek-reasoner','deepseek-reasoner'],
  ]},
  qwen:{name:'通义千问', base:'https://dashscope.aliyuncs.com/compatible-mode/v1', models:[
    ['qwen-max','qwen-max'],['qwen-plus','qwen-plus'],['qwen-turbo','qwen-turbo'],
  ]},
  custom:{name:'自定义 / 私有部署', base:'', models:[['custom','自定义模型 ID']]},
};
function LlmConfig(){
  const toast = useToast();
  const [prov,setProv]   = useState('anthropic');
  const [model,setModel] = useState('claude-opus-4-8');
  const [apiKey,setKey]  = useState('');
  const [base,setBase]   = useState(LLM_PROVIDERS.anthropic.base);
  const [temp,setTemp]   = useState(0.3);
  const [maxTok,setMax]  = useState(4096);
  const [stream,setStream] = useState(true);
  const onProv=(p)=>{ setProv(p); const d=LLM_PROVIDERS[p]; setModel(d.models[0][0]); setBase(d.base); };

  return (
    <div className="card" style={{overflow:'hidden',marginBottom:28}}>
      <div style={{padding:'16px 18px',display:'grid',gap:14}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <label className="field"><span>服务商</span>
            <select value={prov} onChange={e=>onProv(e.target.value)}>
              {Object.entries(LLM_PROVIDERS).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
            </select>
          </label>
          <label className="field"><span>模型</span>
            <select value={model} onChange={e=>setModel(e.target.value)}>
              {LLM_PROVIDERS[prov].models.map(([id,label])=><option key={id} value={id}>{label}</option>)}
            </select>
          </label>
        </div>
        <label className="field"><span>API Key</span>
          <input type="password" value={apiKey} onChange={e=>setKey(e.target.value)} placeholder={prov==='anthropic'?'sk-ant-...':'sk-...'}/>
        </label>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12}}>
          <label className="field"><span>Base URL（可选）</span>
            <input value={base} onChange={e=>setBase(e.target.value)} placeholder="https://..."/>
          </label>
          <label className="field"><span>温度 {temp.toFixed(1)}</span>
            <input type="range" min="0" max="1" step="0.1" value={temp} onChange={e=>setTemp(+e.target.value)} style={{height:36}}/>
          </label>
          <label className="field"><span>最大输出 tokens</span>
            <input type="number" value={maxTok} onChange={e=>setMax(+e.target.value)}/>
          </label>
        </div>
      </div>
      <div className="divider"/>
      <ToggleRow icon="zap" title="流式输出" desc="逐字返回，对话更跟手" on={stream} set={setStream}/>
      <div className="divider"/>
      <div className="row spread" style={{padding:'12px 18px',gap:12,flexWrap:'wrap'}}>
        <span className="aux" style={{fontSize:12}}><Icon name="shield" size={12} style={{marginRight:5,verticalAlign:'-1px'}}/>API Key 仅保存在本地，不随演示数据上传。</span>
        <div className="row gap2">
          <button className="btn btn-sec btn-sm" onClick={()=>toast('已发送测试请求 · 连接正常（演示）','ok')}><Icon name="check" size={14}/>测试连接</button>
          <button className="btn btn-pri btn-sm" onClick={()=>toast(`已保存：${LLM_PROVIDERS[prov].name} · ${model}`,'ok')}>保存配置</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   系统设置页面（AI 行为 · 合规 · 知识库）
══════════════════════════════════════════ */
function Sysconfig(){
  const toast = useToast();
  const [disclose, setDisclose]   = useState(true);
  const [nightAuto, setNightAuto] = useState(true);
  const [strictMode, setStrict]   = useState(false);
  const [autoLearn, setAutoLearn] = useState(true);

  return (
    <div className="page-scroll">
      <div style={{padding:'24px 28px',maxWidth:860,margin:'0 auto'}}>

        {/* Header */}
        <div className="col" style={{gap:2,marginBottom:28}}>
          <span className="eyebrow" style={{color:'var(--tech-deep)'}}>System · 全局配置</span>
          <span className="h1">系统设置</span>
          <span className="muted" style={{marginTop:2}}>大模型、AI 行为、合规护栏与知识库管理</span>
        </div>

        {/* 大模型配置 */}
        <SectionTitle icon="bot" sub="选择驱动 AI 应答、定价建议与文档生成的大模型">大模型配置</SectionTitle>
        <LlmConfig/>

        {/* AI 行为与合规 */}
        <SectionTitle icon="shield" sub="符合各渠道平台条款与数据合规要求">AI 行为与合规</SectionTitle>
        <div className="card" style={{overflow:'hidden',marginBottom:28}}>
          <ToggleRow icon="message" title="AI 身份披露"
            desc="在对话中向客户披露「由 AI 助理协助」，满足 WhatsApp 等平台条款"
            on={disclose} set={setDisclose}/>
          <div className="divider"/>
          <ToggleRow icon="clock" title="7×24 夜间自主应答"
            desc="非工作时间自动接住并推进询盘，触红线才叫醒你"
            on={nightAuto} set={setNightAuto}/>
          <div className="divider"/>
          <ToggleRow icon="shield" title="敏感操作必转人工"
            desc="合同条款 / 付款方式 / 超额折扣 / 大额订单一律转人工（强制护栏）"
            on={true} set={()=>toast('该护栏为强制项，不可关闭','warn')} locked/>
        </div>

        {/* 智能分诊 */}
        <SectionTitle icon="sliders" sub="入口 AI 自动判别询盘类型，过滤噪音，确保真实线索不漏接">智能分诊</SectionTitle>
        <div className="card" style={{overflow:'hidden',marginBottom:28}}>
          <ToggleRow icon="inbox" title="新线索优先进「待确认」队列"
            desc="AI 拿不准时交由人工一键判定，避免噪音污染收件箱"
            on={strictMode} set={setStrict}/>
          <div className="divider"/>
          <ToggleRow icon="analytics" title="根据操作记录持续优化"
            desc="你的每次标注都会让分诊判断越来越准"
            on={autoLearn} set={setAutoLearn}/>
        </div>

        {/* 知识库 */}
        <SectionTitle icon="box" sub="产品库、价格规则、话术风格">知识库</SectionTitle>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:28}}>
          {[
            ['package','产品库',      '6 个 SKU',    '产品信息与规格供 AI 引用'],
            ['rules',  '报价规则',    '4 档阶梯价',  '人工报价准备策略'],
            ['doc',    '话术与 FAQ',  '12 条已配置', '常见问答与沟通风格'],
          ].map(([ic,t,s,sub])=>(
            <div key={t} className="card card-pad clickable anim-up" style={{cursor:'pointer'}}>
              <div className="row gap2" style={{marginBottom:8}}>
                <span style={{color:'var(--primary)'}}><Icon name={ic} size={18}/></span>
                <span style={{fontWeight:700,fontSize:13.5}}>{t}</span>
              </div>
              <div style={{fontSize:18,fontWeight:700,color:'var(--text)',fontVariantNumeric:'tabular-nums',marginBottom:2}}>{s}</div>
              <div style={{fontSize:12,color:'var(--text-3)',marginBottom:12}}>{sub}</div>
              <div className="row spread" style={{alignItems:'center'}}>
                <span style={{fontSize:11.5,color:'var(--primary)',fontWeight:600}}>管理 →</span>
              </div>
            </div>
          ))}
        </div>

        {/* 账号与团队 */}
        <SectionTitle icon="users" sub="成员、权限与账户信息">账号与团队</SectionTitle>
        <div className="card" style={{overflow:'hidden',marginBottom:28}}>
          {[
            {icon:'user',  label:'账户信息',  desc:'邮箱 · 密码 · 两步验证'},
            {icon:'users', label:'团队成员',  desc:'邀请成员 · 分配角色权限'},
            {icon:'bell',  label:'通知偏好',  desc:'询盘提醒 · 故障告警 · 日报'},
          ].map((item,i)=>(
            <React.Fragment key={item.label}>
              {i>0&&<div className="divider"/>}
              <button className="row spread clickable" style={{padding:'15px 20px',width:'100%',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
                <div className="row gap3">
                  <span style={{width:34,height:34,borderRadius:8,background:'var(--bg-2,#f4f5f8)',color:'var(--text-2)',
                    display:'inline-flex',alignItems:'center',justifyContent:'center',flex:'none'}}>
                    <Icon name={item.icon} size={17}/>
                  </span>
                  <div className="col">
                    <span style={{fontWeight:600,fontSize:13.5}}>{item.label}</span>
                    <span className="aux">{item.desc}</span>
                  </div>
                </div>
                <Icon name="chevR" size={16} style={{color:'var(--text-3)'}}/>
              </button>
            </React.Fragment>
          ))}
        </div>

      </div>
    </div>
  );
}

export { Settings, Sysconfig, CHANNEL_CATALOG, CHANNEL_GROUPS, ChanIcon, ReplyBadge };
