import { useState } from 'react';
import { Icon } from '../icons.jsx';
import { CHANNELS } from '../sampleData.js';
import { ChannelIcon, useToast, Logo } from '../ui.jsx';
import { NumField } from './QuoteRules.jsx';

/* ===== wizard.jsx ===== */
/* ============ 首次使用配置向导 ============ */
function Wizard({onClose}){
  const STEPS=[
    {key:'channel', icon:'globe', title:'接入渠道', desc:'连上你的询盘来源，Closer 才能替你接住每一条'},
    {key:'product', icon:'package', title:'录入产品', desc:'导入产品与规格，作为自动报价的知识底座'},
    {key:'price', icon:'rules', title:'设置报价与底价', desc:'配置阶梯价与底价红线 —— 最关键的护栏'},
    {key:'tone', icon:'message', title:'设置话术风格', desc:'让 AI 用你的语气与客户沟通'},
    {key:'live', icon:'zap', title:'上线', desc:'开启 7×24 自主应答'},
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
          <div className="anim-up" key={step}>{renderStep(s.key)}</div>
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
              : <button className="btn btn-green" onClick={()=>{toast('🎉 配置完成，Closer 已上线！','ok');onClose();}}><Icon name="zap" size={16}/>上线，开始接单</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderStep(key){
  if(key==='channel') return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      {Object.entries(CHANNELS).map(([k,ch])=>(
        <div key={k} className="card card-pad row spread clickable">
          <div className="row gap3"><ChannelIcon ch={k} size={40}/>
            <div className="col"><span style={{fontWeight:600}}>{ch.name}</span><span className="aux">{k==='alibaba'?'P1 支持':'立即连接'}</span></div></div>
          <div className={`switch ${k!=='alibaba'?'on':''}`}></div>
        </div>
      ))}
    </div>
  );
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
      <span className="muted" style={{maxWidth:380,marginTop:6}}>Closer 将开始 7×24 接住你的询盘，自主甄别、报价、议价与跟进。触及底价或敏感操作时，会第一时间叫醒你。</span>
    </div>
  );
}

export { Wizard };
