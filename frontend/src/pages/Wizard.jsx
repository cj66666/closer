import { useState } from 'react';
import { Icon } from '../icons.jsx';
import { useToast, Logo } from '../ui.jsx';
import { NumField } from './QuoteRules.jsx';
import { CHANNEL_CATALOG, CHANNEL_GROUPS, ChanIcon, ReplyBadge } from './Settings.jsx';

/* ─── channel credential config ───────────────────────────────────── */

/* channels that can be auto-created with no credentials */
const AUTO_CREATE = {
  form:         { channel_type: 'site_form' },
  email_bridge: { channel_type: 'email', credentials: { bridge_mode: true } },
};

/* channel_type sent to backend per catalog key */
const CHANNEL_TYPE_MAP = {
  email:    'email',
  whatsapp: 'whatsapp',
  wechat:   'wecom',
  facebook: 'facebook',
  linkedin: 'linkedin',
  telegram: 'telegram',
  tiktok:   'tiktok',
};

/* credential field definitions per channel */
const CRED_FIELDS = {
  whatsapp: [
    { key:'phone_number_id', label:'手机号码 ID',     placeholder:'12345678901234',  hint:'Meta 开发者后台 → WhatsApp → 手机号码' },
    { key:'access_token',    label:'永久访问令牌',     placeholder:'EAAxxxxxxx',      hint:'Meta 后台生成的永久令牌', secret:true },
    { key:'verify_token',    label:'Webhook 验证令牌', placeholder:'自定义字符串',    hint:'与 Meta Webhook 处填写的字符串保持一致', optional:true },
  ],
  email: [
    { key:'username', label:'邮箱地址',              placeholder:'you@example.com',  hint:'' },
    { key:'password', label:'密码 / 应用专用密码',    placeholder:'',                hint:'Gmail / Outlook 请用应用密码', secret:true },
    { key:'host',     label:'IMAP 主机（可选）',      placeholder:'留空自动识别',     hint:'如 imap.gmail.com', optional:true },
    { key:'port',     label:'端口',                  placeholder:'993',              hint:'默认 993（SSL）', type:'number', optional:true },
  ],
  wechat: [
    { key:'webhook_url', label:'群机器人 Webhook', placeholder:'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=…', hint:'企业微信群 → 添加机器人 → 复制 Webhook 地址', secret:true },
  ],
  facebook: [
    { key:'page_access_token', label:'Page Access Token', placeholder:'EAAxxxxxxx', hint:'Meta 开发者后台 → 应用 → 页面令牌', secret:true },
    { key:'app_secret',        label:'App Secret',         placeholder:'',           hint:'Meta 开发者后台 → 应用密钥', secret:true },
    { key:'verify_token',      label:'Webhook 验证令牌',   placeholder:'自定义字符串', hint:'与 Meta Webhook 保持一致', optional:true },
  ],
  linkedin: [
    { key:'client_secret',  label:'Client Secret',  placeholder:'', hint:'LinkedIn Developer 后台 → Auth', secret:true },
    { key:'webhook_secret', label:'Webhook Secret', placeholder:'', hint:'可选，验证回调签名', optional:true, secret:true },
  ],
  telegram: [
    { key:'bot_token', label:'Bot Token', placeholder:'123456:ABCdef…', hint:'通过 @BotFather 创建机器人获取', secret:true },
  ],
  tiktok: [
    { key:'access_token',   label:'Access Token',   placeholder:'',         hint:'TikTok Ads 后台 → 应用管理', secret:true },
    { key:'advertiser_id',  label:'Advertiser ID',  placeholder:'12345678', hint:'TikTok Ads 广告主账户 ID' },
    { key:'webhook_secret', label:'Webhook Secret', placeholder:'',         hint:'可选，验证签名用', optional:true, secret:true },
  ],
};

const IMAP_HOSTS = {
  gmail: 'imap.gmail.com', outlook: 'outlook.office365.com', hotmail: 'outlook.office365.com',
  yahoo: 'imap.mail.yahoo.com', qq: 'imap.qq.com', '163': 'imap.163.com',
  exmail: 'imap.exmail.qq.com', zoho: 'imap.zoho.com', mxhichina: 'imap.mxhichina.com',
};
function guessImapHost(email) {
  const domain = (email || '').split('@')[1] || '';
  if (!domain) return '';
  for (const [k, v] of Object.entries(IMAP_HOSTS)) {
    if (domain.includes(k)) return v;
  }
  return `imap.${domain}`;
}

/* ─── CredForm ─────────────────────────────────────────────────────── */
function CredForm({ channelKey, fields, values, onChange, onConnect, onCancel, connecting }) {
  const [shown, setShown] = useState({});
  const cat = Object.fromEntries(CHANNEL_CATALOG.map(c => [c.key, c]));
  const name = cat[channelKey]?.name || channelKey;
  return (
    <div style={{marginTop:10, padding:'16px', background:'var(--bg-2,#f4f5f8)', borderRadius:10, border:'1px solid var(--border-2)'}}>
      <div className="row gap2" style={{marginBottom:14}}>
        <ChanIcon ch={channelKey} size={26}/>
        <span style={{fontWeight:600}}>配置 {name}</span>
      </div>
      <div className="col" style={{gap:10}}>
        {fields.map(f => {
          const inputType = f.secret && !shown[f.key] ? 'password' : (f.type || 'text');
          return (
            <div key={f.key} className="col" style={{gap:3}}>
              <div className="row gap1" style={{alignItems:'center'}}>
                <label className="field-label" style={{marginBottom:0,flex:'none'}}>{f.label}</label>
                {f.optional && <span className="badge" style={{fontSize:10,height:16,padding:'0 5px',background:'#eef1f4',color:'var(--text-3)',flex:'none'}}>可选</span>}
              </div>
              <div className="row gap1">
                <input
                  className="input"
                  style={{flex:1}}
                  type={inputType}
                  placeholder={f.placeholder || ''}
                  value={values[f.key] || ''}
                  onChange={e => onChange(f.key, e.target.value)}
                />
                {f.secret && (
                  <button className="btn btn-ghost btn-sm" style={{flex:'none',padding:'0 10px',color:'var(--text-3)',fontSize:12}}
                    onClick={() => setShown(s => ({...s, [f.key]: !s[f.key]}))}>
                    {shown[f.key] ? '隐藏' : '显示'}
                  </button>
                )}
              </div>
              {f.hint && <span className="aux" style={{fontSize:11,color:'var(--text-3)'}}>{f.hint}</span>}
            </div>
          );
        })}
      </div>
      <div className="row gap2" style={{marginTop:14, justifyContent:'flex-end'}}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>取消</button>
        <button className="btn btn-pri btn-sm" onClick={onConnect} disabled={connecting}>
          {connecting ? <span style={{opacity:.6}}>连接中…</span> : <><Icon name="zap" size={13}/>连接</>}
        </button>
      </div>
    </div>
  );
}

/* ============ 首次使用配置向导 ============ */
function Wizard({api, onClose}){
  const STEPS=[
    {key:'channel', icon:'globe',   title:'接入渠道', desc:'连上你的询盘来源，Closer 才能替你接住每一条'},
    {key:'product', icon:'package', title:'录入产品', desc:'导入产品与规格，作为需求判断和报价准备的知识底座'},
    {key:'price',   icon:'rules',   title:'设置报价与底价', desc:'配置阶梯价与底价红线，业务员人工报价时引用'},
    {key:'tone',    icon:'message', title:'设置话术风格', desc:'让 AI 用你的语气与客户沟通'},
    {key:'live',    icon:'zap',     title:'进入工作台', desc:'渠道凭据配置完成后即可开始接收询盘'},
  ];
  const [step,setStep]=useState(0);
  const toast=useToast();
  const pct=Math.round(((step+1)/STEPS.length)*100);
  const s=STEPS[step];

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,background:'var(--bg)',display:'flex',flexDirection:'column'}}>
      {/* 顶部进度 */}
      <div style={{padding:'18px 32px',borderBottom:'1px solid var(--border-2)',background:'#fff',flex:'none'}}>
        <div className="row spread" style={{maxWidth:900,margin:'0 auto'}}>
          <div className="row gap2"><Logo/><span className="aux" style={{borderLeft:'1px solid var(--border)',paddingLeft:10,marginLeft:2}}>首次配置向导</span></div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>稍后配置 <Icon name="x" size={14}/></button>
        </div>
        <div style={{maxWidth:900,margin:'16px auto 0'}}>
          <div className="row spread" style={{marginBottom:8}}>
            {STEPS.map((st,i)=>(
              <div key={st.key} className="row gap2" style={{flex:1,opacity:i<=step?1:.4}}>
                <span style={{width:26,height:26,borderRadius:'50%',flex:'none',display:'inline-flex',alignItems:'center',justifyContent:'center',
                  background:i<step?'var(--green)':i===step?'var(--primary)':'#eef1f4',color:i<=step?'#fff':'var(--text-3)',fontSize:12,fontWeight:700}}>
                  {i<step?<Icon name="check" size={14}/>:i+1}</span>
                <span style={{fontSize:12.5,fontWeight:i===step?600:500,color:i<=step?'var(--text)':'var(--text-3)'}} className="ellipsis">{st.title}</span>
              </div>
            ))}
          </div>
          <div style={{height:6,background:'#eef1f4',borderRadius:3,overflow:'hidden'}}>
            <div style={{width:`${pct}%`,height:'100%',background:'var(--primary)',borderRadius:3,transition:'width .4s'}}></div>
          </div>
        </div>
      </div>

      {/* 内容 */}
      <div className="scroll" style={{flex:1}}>
        <div style={{maxWidth:760,margin:'0 auto',padding:'32px'}}>
          <div className="row gap3" style={{marginBottom:24}}>
            <span style={{width:48,height:48,borderRadius:12,background:'var(--primary-tint)',color:'var(--primary)',display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Icon name={s.icon} size={24}/></span>
            <div className="col"><span className="h2">{s.title}</span><span className="muted">{s.desc}</span></div>
          </div>
          <div className="anim-up" key={step}>{renderStep(s.key, api)}</div>
        </div>
      </div>

      {/* 底部导航 */}
      <div style={{padding:'16px 32px',borderTop:'1px solid var(--border-2)',background:'#fff',flex:'none'}}>
        <div className="row spread" style={{maxWidth:760,margin:'0 auto'}}>
          <button className="btn btn-ghost" onClick={()=>step>0?setStep(step-1):onClose()}><Icon name="chevL" size={16}/>{step>0?'上一步':'取消'}</button>
          <div className="row gap2">
            <button className="btn btn-sec" onClick={()=>setStep(Math.min(step+1,STEPS.length-1))}>跳过</button>
            {step<STEPS.length-1
              ? <button className="btn btn-pri" onClick={()=>setStep(step+1)}>下一步 <Icon name="chevR" size={16}/></button>
              : <button className="btn btn-green" onClick={()=>{toast('配置完成，Closer 已上线！','ok');onClose();}}><Icon name="zap" size={16}/>进入工作台</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelStep({api}){
  const toast = useToast();
  const cat = Object.fromEntries(CHANNEL_CATALOG.map(c=>[c.key,c]));
  const [on, setOn] = useState({email:true, whatsapp:true, form:true});
  const [connectedIds, setConnectedIds] = useState({});
  const [creating, setCreating] = useState({});
  const [configuring, setConfiguring] = useState(null);
  const [credValues, setCredValues] = useState({});

  const toggle = async (k) => {
    const next = !on[k];
    setOn(s=>({...s,[k]:next}));
    if (!next) {
      if (configuring === k) setConfiguring(null);
      return;
    }
    /* no-credential channels: auto-create immediately */
    if (AUTO_CREATE[k] && !connectedIds[k]) {
      setCreating(c=>({...c,[k]:true}));
      try {
        const {channel_type, credentials={}} = AUTO_CREATE[k];
        const ch = await api.post('/api/v1/channels',{
          channel_type, name: cat[k]?.name||k, credentials, status:'connected',
        });
        setConnectedIds(c=>({...c,[k]:ch.id}));
        toast(`${cat[k]?.name||k} 已接入`,'ok');
      } catch(e) {
        toast(`接入失败：${e.message||'请稍后重试'}`,'warn');
        setOn(s=>({...s,[k]:false}));
      } finally {
        setCreating(c=>({...c,[k]:false}));
      }
      return;
    }
    /* channels needing credentials: open inline form */
    if (CRED_FIELDS[k] && !connectedIds[k]) {
      setConfiguring(k);
    }
  };

  const connectChannel = async (k) => {
    const fields = CRED_FIELDS[k] || [];
    const vals = credValues[k] || {};
    const missing = fields.filter(f => !f.optional && !(vals[f.key]||'').trim());
    if (missing.length) {
      toast(`请填写：${missing.map(f=>f.label).join('、')}`,'warn');
      return;
    }
    setCreating(c=>({...c,[k]:true}));
    try {
      const channel_type = CHANNEL_TYPE_MAP[k] || k;
      let credentials = {...vals};
      if (k === 'email') {
        if (!credentials.host) credentials.host = guessImapHost(vals.username||'');
        credentials.port = parseInt(credentials.port)||993;
        credentials.use_ssl = true;
      }
      const ch = await api.post('/api/v1/channels',{
        channel_type, name: cat[k]?.name||k, credentials, status:'connected',
      });
      setConnectedIds(c=>({...c,[k]:ch.id}));
      setConfiguring(null);
      toast(`${cat[k]?.name||k} 已接入`,'ok');
    } catch(e) {
      toast(`连接失败：${e.message||'请检查凭据后重试'}`,'warn');
    } finally {
      setCreating(c=>({...c,[k]:false}));
    }
  };

  const updateCred = (k, field, val) =>
    setCredValues(prev=>({...prev,[k]:{...(prev[k]||{}),[field]:val}}));

  const count = Object.values(on).filter(Boolean).length;
  const unconfigured = Object.keys(on).filter(k=>on[k]&&CRED_FIELDS[k]&&!connectedIds[k]&&k!==configuring);

  return (
    <div className="col" style={{gap:18}}>
      <div className="aux">
        选择询盘来源 —— 可多选，已选 <b style={{color:'var(--text)'}}>{count}</b> 个；需要凭据的渠道请在下方填写后点击「连接」才会生效。
      </div>

      {CHANNEL_GROUPS.map(g=>(
        <div key={g.label} className="col" style={{gap:8}}>
          <span className="field-label">{g.label}</span>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {g.keys.map(k=>{
              const c=cat[k]; if(!c)return null;
              const isConnected=!!connectedIds[k];
              const isCreating=!!creating[k];
              const isUnconfigured=on[k]&&!!CRED_FIELDS[k]&&!isConnected;
              return (
                <div key={k} onClick={()=>toggle(k)} className="card card-pad row spread clickable"
                  style={{
                    border: isConnected?'1px solid var(--green)':isUnconfigured?'1px solid #f59e0b':on[k]?'1px solid var(--primary)':'1px solid var(--border-2)',
                    background: isConnected?'rgba(43,166,138,.05)':isUnconfigured?'rgba(245,158,11,.05)':on[k]?'var(--primary-tint)':'#fff',
                    transition:'border .14s,background .14s', pointerEvents:isCreating?'none':'auto',
                  }}>
                  <div className="row gap3" style={{minWidth:0}}>
                    <ChanIcon ch={k} size={38}/>
                    <div className="col" style={{minWidth:0}}>
                      <div className="row gap2" style={{minWidth:0}}>
                        <span style={{fontWeight:600}} className="ellipsis">{c.name}</span>
                        <ReplyBadge reply={c.reply}/>
                        {c.isNew&&<span className="badge badge-pri" style={{fontSize:10,height:16,padding:'0 5px'}}>NEW</span>}
                      </div>
                      <span className="aux ellipsis" style={{fontSize:11.5, color:isConnected?'var(--green)':isUnconfigured?'#d97706':undefined}}>
                        {isCreating?'接入中…':isConnected?'✓ 已接入':isUnconfigured?'⚠ 待配置凭据':c.sub}
                      </span>
                    </div>
                  </div>
                  <div className={`switch ${on[k]?'on':''}`} style={{flex:'none',opacity:isCreating?.5:1}}></div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Active credential form */}
      {configuring && CRED_FIELDS[configuring] && (
        <CredForm
          channelKey={configuring}
          fields={CRED_FIELDS[configuring]}
          values={credValues[configuring]||{}}
          onChange={(field,val)=>updateCred(configuring,field,val)}
          onConnect={()=>connectChannel(configuring)}
          onCancel={()=>{setOn(s=>({...s,[configuring]:false}));setConfiguring(null);}}
          connecting={!!creating[configuring]}
        />
      )}

      {/* Pending unconfigured (not currently active in form) */}
      {unconfigured.length>0 && (
        <div style={{padding:'10px 14px',background:'rgba(245,158,11,.08)',borderRadius:8,border:'1px solid rgba(245,158,11,.25)'}}>
          <div className="row gap2" style={{flexWrap:'wrap',gap:8,alignItems:'center'}}>
            <span className="aux" style={{color:'#92400e',flex:1,minWidth:160}}>
              已选中但未配置：{unconfigured.map(k=>cat[k]?.name||k).join('、')}
            </span>
            {unconfigured.map(k=>(
              <button key={k} className="btn btn-sec btn-sm" style={{flex:'none'}}
                onClick={e=>{e.stopPropagation();setConfiguring(k);}}>
                配置 {cat[k]?.name||k}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="aux" style={{padding:'10px 12px',background:'var(--bg-2,#f4f5f8)',borderRadius:8,lineHeight:1.6}}>
        能力说明：<b style={{color:'var(--green)'}}>双向</b> 可自动收发 · <b style={{color:'#CA8A04'}}>仅草稿</b> AI 拟稿人工发 · <b style={{color:'var(--text-3)'}}>仅接收</b> 只进不回（到原平台回复）。
      </div>
    </div>
  );
}

function renderStep(key, api){
  if(key==='channel') return <ChannelStep api={api}/>;
  if(key==='product') return (
    <div className="card card-pad col center" style={{padding:'40px',border:'2px dashed var(--border)',background:'#fff'}}>
      <span style={{width:52,height:52,borderRadius:13,background:'var(--green-light)',color:'var(--green)',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:12}}><Icon name="upload" size={24}/></span>
      <span className="h3">拖入 Excel 或点击上传产品表</span>
      <span className="aux" style={{margin:'4px 0 14px'}}>支持 .xlsx / .csv · 自动识别产品名、规格、成本、MOQ</span>
      <button className="btn btn-pri btn-sm"><Icon name="download" size={14}/>下载模板</button>
      <div className="aux" style={{marginTop:14}}>或 <a style={{color:'var(--primary)',fontWeight:600}}>手动添加第一个产品</a></div>
    </div>
  );
  if(key==='price') return (
    <div className="card card-pad">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <NumField label="目标利润率" value={18} set={()=>{}} suffix="%"/>
        <NumField label="报价有效期" value={14} set={()=>{}} suffix="天"/>
      </div>
      <div className="card card-pad" style={{border:'1px solid #f0c4c2',background:'#fffafa'}}>
        <div className="row gap2"><Icon name="shield" size={18} style={{color:'var(--red)'}}/>
          <div className="col" style={{flex:1}}><span style={{fontWeight:600,color:'#b53d39'}}>底价红线（最重要）</span>
            <span className="aux">设定后，AI 任何让步都不会突破它</span></div>
          <div className="row gap1"><span className="aux">$</span><input className="input num" defaultValue={168} style={{width:80,fontWeight:700,color:'var(--red)',borderColor:'#f0c4c2'}}/></div>
        </div>
      </div>
    </div>
  );
  if(key==='tone') return (
    <div className="col" style={{gap:14}}>
      <div className="card card-pad">
        <span className="field-label">话术语气</span>
        <div className="row gap2">{['专业稳重','热情友好','简洁高效'].map((t,i)=>(
          <button key={t} className="badge clickable" style={{height:34,padding:'0 16px',background:i===0?'var(--primary)':'#f1f4f7',color:i===0?'#fff':'var(--text-2)',fontWeight:600}}>{t}</button>))}</div>
      </div>
      <div className="card card-pad">
        <span className="field-label">默认签名</span>
        <textarea className="input" rows={3} defaultValue={`Best regards,\nHank · Sunpath Outdoor\nUV-stable outdoor furniture since 2014`}/>
      </div>
    </div>
  );
  return (
    <div className="card card-pad col center" style={{padding:'48px',textAlign:'center'}}>
      <span style={{width:64,height:64,borderRadius:16,background:'var(--green-light)',color:'var(--green)',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16}}><Icon name="checkCircle" size={32}/></span>
      <span className="h2">一切就绪</span>
      <span className="muted" style={{maxWidth:380,marginTop:6}}>已配置的渠道立即开始接收询盘；Closer 会自动初筛、补需求并提醒跟进。价格、账期和方案确认会交给业务员。</span>
    </div>
  );
}

export { Wizard };
