import { useState } from 'react';
import { Icon } from '../icons.jsx';
import { SELLER } from '../sampleData.js';
import { Avatar, Grade, fmtMoney } from '../ui.jsx';

/* ===== conversation.jsx ===== */
/* ============ 会话详情页（核心）============ */

/* —— 报价卡：可展开明细 / 可编辑 / 触底价禁止 —— */
function QuoteCard({q, onEdit, editable, compact}){
  const [open,setOpen]=useState(false);
  return (
    <div className="card" style={{border:'1px solid var(--primary-light)',maxWidth:380,overflow:'hidden',boxShadow:'var(--shadow-sm)'}}>
      <div style={{background:'var(--primary-tint)',padding:'10px 14px',borderBottom:'1px solid var(--primary-light)'}} className="row spread">
        <span className="row gap2"><Icon name="doc" size={15} style={{color:'var(--primary)'}}/>
          <span style={{fontWeight:600,fontSize:13.5,color:'var(--primary)'}}>报价单 · {q.incoterm}</span></span>
        <span className="badge badge-pri">有效期 {q.validDays} 天</span>
      </div>
      <div style={{padding:'14px'}}>
        <div className="aux" style={{fontWeight:600,color:'var(--text)'}}>{q.product}</div>
        <div className="aux" style={{marginBottom:12}}>SKU {q.sku} · MOQ {q.moq} 套 · 交期 {q.leadTime}</div>
        <div className="row spread" style={{alignItems:'baseline',marginBottom:10}}>
          <span className="aux">{q.qty} 套 × 单价</span>
          <span className="num" style={{fontSize:24,fontWeight:600,color:'var(--primary)'}}>{fmtMoney(q.unit)}</span>
        </div>
        <div className="divider" style={{margin:'4px 0 10px'}}></div>
        <div className="row spread"><span className="aux">合计（{q.currency}）</span>
          <span className="num" style={{fontWeight:600,fontSize:15}}>{fmtMoney(q.total)}</span></div>

        <button className="row gap1 clickable" onClick={()=>setOpen(o=>!o)}
          style={{marginTop:12,color:'var(--text-2)',fontSize:12.5,fontWeight:600}}>
          <Icon name={open?'chevU':'chevD'} size={14}/>{open?'收起明细':'展开明细（成本 / 阶梯价 / 底价）'}
        </button>

        {open&&<div className="anim-up" style={{marginTop:10}}>
          <div style={{background:'#fafbfc',border:'1px solid var(--border-2)',borderRadius:8,padding:'10px 12px'}}>
            <div className="aux" style={{fontWeight:600,marginBottom:6}}>成本构成 / 套</div>
            {q.lines.map(([k,v])=>(
              <div className="row spread" key={k} style={{padding:'3px 0'}}>
                <span className="aux">{k}</span><span className="num aux" style={{color:'var(--text)'}}>{fmtMoney(v)}</span>
              </div>
            ))}
          </div>
          <div className="aux" style={{fontWeight:600,margin:'12px 0 6px'}}>阶梯价</div>
          <div style={{border:'1px solid var(--border-2)',borderRadius:8,overflow:'hidden'}}>
            {q.tiers.map((t,i)=>(
              <div key={i} className="row spread" style={{padding:'7px 12px',fontSize:12.5,
                background:t.active?'var(--primary-tint)':'#fff',borderTop:i?'1px solid var(--border-2)':'none',
                fontWeight:t.active?600:400}}>
                <span>{t.min}{t.max?`–${t.max}`:'+'} 套{t.active&&<span className="badge badge-pri" style={{marginLeft:6,height:18}}>当前</span>}</span>
                <span className="num">{fmtMoney(t.price)}</span>
              </div>
            ))}
          </div>
          <div className="row gap2" style={{marginTop:10,padding:'8px 12px',background:'var(--red-light)',borderRadius:8}}>
            <Icon name="shield" size={15} style={{color:'var(--red)'}}/>
            <span className="aux" style={{color:'#b53d39',fontWeight:600}}>底价红线 {fmtMoney(q.floor)} / 套 · 不可自动突破</span>
          </div>
        </div>}

        {editable&&<div className="row gap2" style={{marginTop:14}}>
          <button className="btn btn-pri btn-sm" style={{flex:1}} onClick={onEdit}><Icon name="edit" size={14}/>修改并发送</button>
          <button className="btn btn-sec btn-sm" style={{flex:1}}><Icon name="check" size={14}/>批准原价</button>
        </div>}
      </div>
    </div>
  );
}

/* —— 甄别卡 —— */
function ScreeningCard({m}){
  return (
    <div className="card" style={{maxWidth:460,padding:'12px 14px',background:'#fff',border:'1px solid var(--border-2)'}}>
      <div className="row spread" style={{marginBottom:10}}>
        <span className="row gap2"><Icon name="shieldCheck" size={15} style={{color:'var(--green)'}}/>
          <span style={{fontWeight:600,fontSize:13}}>询盘甄别完成</span></span>
        <span className="row gap1"><Grade g={m.grade} size={20}/><span className="badge badge-A">高价值真实采购</span></span>
      </div>
      <div className="col" style={{gap:7}}>
        {m.signals.map((s,i)=>(
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:12.5,lineHeight:1.5}}>
            <Icon name="check" size={13} style={{color:'var(--green)',flex:'none',marginTop:3}}/>
            <span className="muted" style={{flex:1,minWidth:0}}>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="aux" style={{marginTop:9,paddingTop:9,borderTop:'1px solid var(--border-2)',color:'var(--text)'}}>{m.note}</div>
    </div>
  );
}

/* —— 需求理解卡 —— */
function UnderstandCard({m}){
  return (
    <div className="card" style={{maxWidth:460,padding:'12px 14px',border:'1px solid var(--border-2)'}}>
      <div className="row gap2" style={{marginBottom:10}}>
        <Icon name="package" size={15} style={{color:'var(--primary)'}}/>
        <span style={{fontWeight:600,fontSize:13}}>需求理解 · 已匹配产品库</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 16px'}}>
        {m.parse.map(([k,v])=>(
          <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8,fontSize:12.5,minWidth:0}}>
            <span className="faint" style={{flex:'none'}}>{k}</span><span style={{fontWeight:500,textAlign:'right',minWidth:0}}>{v}</span>
          </div>
        ))}
      </div>
      <div className="row gap2" style={{marginTop:10,padding:'8px 10px',background:'var(--primary-tint)',borderRadius:7}}>
        <Icon name="check" size={14} style={{color:'var(--primary)'}}/>
        <span className="aux" style={{color:'var(--primary)',fontWeight:600}}>{m.product} · {m.sku}</span>
      </div>
    </div>
  );
}

/* —— 护栏横幅 —— */
function GuardrailBanner({m, onApproveSuggestion, onEditQuote, onTakeover, resolved}){
  const [open,setOpen]=useState(true);
  if(resolved){
    return (
      <div className="anim-up" style={{background:'var(--green-light)',border:'1px solid #b9e0d8',borderRadius:10,padding:'12px 16px',margin:'4px 0'}}>
        <div className="row gap2"><Icon name="checkCircle" size={17} style={{color:'var(--green)'}}/>
          <span style={{fontWeight:600,color:'#1f7568',fontSize:13.5}}>护栏已解除 · 已按你的决定继续</span></div>
      </div>
    );
  }
  return (
    <div className="anim-up" style={{background:'var(--red-light)',border:'1px solid #f0c4c2',borderRadius:10,
      overflow:'hidden',margin:'4px 0',boxShadow:'0 2px 10px rgba(217,83,79,.12)'}}>
      <div style={{padding:'13px 16px'}}>
        <div className="row spread">
          <span className="row gap2">
            <span style={{width:28,height:28,borderRadius:7,background:'var(--red)',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
              <Icon name="shield" size={16}/></span>
            <span className="col" style={{gap:1}}>
              <span style={{fontWeight:700,color:'#b53d39',fontSize:14}}>已暂停自动发送 · 待你确认</span>
              <span className="aux" style={{color:'#b53d39'}}>触及 {m.hits.length} 条护栏，AI 不会自动让步</span>
            </span>
          </span>
          <button className="btn-icon btn-ghost" onClick={()=>setOpen(o=>!o)} style={{color:'#b53d39'}}>
            <Icon name={open?'chevU':'chevD'} size={18}/></button>
        </div>

        {open&&<div className="anim-up" style={{marginTop:12}}>
          <div className="col" style={{gap:8}}>
            {m.hits.map((h,i)=>(
              <div key={i} className="row gap2" style={{background:'#fff',border:'1px solid #f0c4c2',borderRadius:8,padding:'9px 11px'}}>
                <Icon name="alert" size={15} style={{color:'var(--red)',flex:'none',marginTop:1}}/>
                <div className="col">
                  <span style={{fontWeight:600,fontSize:12.5,color:'#b53d39'}}>{h.type}</span>
                  <span className="aux" style={{color:'var(--text)'}}>{h.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,padding:'10px 12px',background:'#fff',borderRadius:8,border:'1px solid var(--border-2)'}}>
            <div className="aux" style={{fontWeight:600,color:'var(--text)',marginBottom:4}}>📋 AI 对话摘要</div>
            <div className="aux" style={{lineHeight:1.6}}>{m.summary}</div>
            <div className="aux" style={{fontWeight:600,color:'var(--primary)',margin:'9px 0 4px'}}>💡 AI 建议</div>
            <div className="aux" style={{lineHeight:1.6,color:'var(--text)'}}>{m.suggestion}</div>
          </div>
        </div>}

        <div className="row gap2" style={{marginTop:13}}>
          <button className="btn btn-danger btn-sm" onClick={onApproveSuggestion}><Icon name="check" size={14}/>采纳建议并发送</button>
          <button className="btn btn-sec btn-sm" onClick={onEditQuote}><Icon name="edit" size={14}/>修改报价</button>
          <button className="btn btn-sec btn-sm" onClick={onTakeover}><Icon name="hand" size={14}/>我来接管</button>
        </div>
      </div>
    </div>
  );
}

/* —— 消息气泡（支持自动翻译：中文译文为主 + 保留原文）—— */
function Bubble({m, translate=true}){
  const side = m.role==='customer' ? 'left' : 'right';
  const isAI = m.role==='ai';
  const isHuman = m.role==='human';
  const bilingual = translate && m.zh && m.lang && m.lang!=='ZH';
  const origLabel = isAI || isHuman ? `发送给客户 · ${m.lang}` : `原文 · ${m.lang}`;
  return (
    <div className="row anim-up" style={{justifyContent:side==='left'?'flex-start':'flex-end',gap:10,alignItems:'flex-end'}}>
      {side==='left'&&<Avatar name={m.who||'Sanne'} size={30}/>}
      <div style={{maxWidth:'min(560px,72%)'}}>
        {(isAI||isHuman)&&<div className="row gap1" style={{justifyContent:'flex-end',marginBottom:3}}>
          {isAI?<span className="badge badge-pri" style={{height:18,fontSize:11}}><Icon name="bot" size={11}/>AI · {m.lang}</span>
               :<span className="badge badge-grey" style={{height:18,fontSize:11}}><Icon name="user" size={11}/>人工 · {SELLER.name.split(' ')[0]}</span>}
        </div>}
        <div style={{
          background: side==='left'?'#fff':(isAI?'var(--primary-tint)':'#fff'),
          border: side==='left'?'1px solid var(--border-2)':(isAI?'1px solid var(--primary-light)':'1px solid var(--border)'),
          borderRadius:12, padding:'10px 13px', fontSize:13.5, lineHeight:1.6,
          borderBottomLeftRadius:side==='left'?3:12, borderBottomRightRadius:side==='left'?12:3,
        }}>
          {bilingual ? (
            <>
              <div>{m.zh}</div>
              <div style={{display:'flex',alignItems:'center',gap:6,margin:'8px 0 6px'}}>
                <span style={{flex:1,height:1,background:side==='left'?'var(--border-2)':'rgba(31,92,140,.14)'}}></span>
                <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:10.5,fontWeight:600,color:'var(--text-3)',whiteSpace:'nowrap'}}>
                  <Icon name="language" size={11}/>{origLabel}</span>
                <span style={{flex:1,height:1,background:side==='left'?'var(--border-2)':'rgba(31,92,140,.14)'}}></span>
              </div>
              <div style={{fontSize:12,color:'var(--text-3)',lineHeight:1.55}}>{m.text}</div>
            </>
          ) : m.text}
        </div>
        <div className="aux" style={{textAlign:side==='left'?'left':'right',marginTop:3,fontSize:11}}>{m.time}{bilingual&&<span style={{color:'var(--tech-deep)'}}> · 已自动翻译</span>}</div>
      </div>
      {side==='right'&&(isAI?<Avatar type="ai" size={30}/>:<Avatar name={SELLER.name} size={30}/>)}
    </div>
  );
}

function Typing(){
  return (
    <div className="row gap2 anim-in" style={{alignItems:'flex-end'}}>
      <Avatar type="ai" size={30}/>
      <div style={{background:'var(--primary-tint)',border:'1px solid var(--primary-light)',borderRadius:12,borderBottomLeftRadius:3,padding:'12px 14px'}}>
        <div className="row gap1">
          {[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:'50%',background:'var(--primary)',opacity:.5,
            animation:`pulse 1s ${i*.2}s infinite`}}></span>)}
        </div>
      </div>
    </div>
  );
}

export { QuoteCard, ScreeningCard, UnderstandCard, GuardrailBanner, Bubble, Typing };
