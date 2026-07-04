import { useState } from 'react';
import { Icon } from '../icons.jsx';
import { CUSTOMERS, TIMELINE } from '../sampleData.js';
import { Avatar, Grade, fmtMoney } from '../ui.jsx';

/* ===== crm.jsx ===== */
/* ============ 客户档案 / CRM ============ */

/* 客户价值分级（区别于单条询盘 A/B/C 等级） */
const VTIER_META = {
  '核心客户':{fg:'#1f7568', bg:'var(--green-light)'},
  '成长客户':{fg:'var(--primary)', bg:'var(--primary-tint)'},
  '高潜新客':{fg:'#a06916', bg:'var(--orange-light)'},
  '潜力客户':{fg:'#6b7480', bg:'var(--grey-light)'},
};
function ValueTier({tier, size=12}){
  const m=VTIER_META[tier]||VTIER_META['潜力客户'];
  return <span className="badge" style={{color:m.fg,background:m.bg,fontSize:size,fontWeight:700}}>{tier||'潜力客户'}</span>;
}

/* 客户档案内容（用于右侧抽屉 + CRM 详情） */
function CustomerProfile({c}){
  if(!c) c=CUSTOMERS[0];
  return (
    <div style={{padding:'18px 20px'}}>
      <div className="row gap3" style={{marginBottom:16}}>
        <Avatar name={c.contact} size={48}/>
        <div className="col" style={{minWidth:0}}>
          <div className="row gap2"><span className="h3">{c.company}</span><span className="flag">{c.flag}</span><ValueTier tier={c.vtier}/></div>
          <span className="aux">{c.contact} · {c.country} · <a style={{color:'var(--primary)'}}>{c.domain}</a></span>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
        {[['关联询盘',c.inquiries],['历史成交',c.deals],['累计金额',c.value>1000?'$'+(c.value/1000).toFixed(0)+'k':'—']].map(([k,v])=>(
          <div key={k} className="col center" style={{padding:'12px 6px',background:'#fafbfc',borderRadius:8,border:'1px solid var(--border-2)'}}>
            <span className="num" style={{fontSize:19,fontWeight:600}}>{v}</span><span className="aux" style={{fontSize:11}}>{k}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{padding:'12px 14px',marginBottom:16,background:'var(--primary-tint)',border:'1px solid var(--primary-light)'}}>
        <div className="row gap2" style={{marginBottom:4}}><Icon name="building" size={14} style={{color:'var(--primary)'}}/><span className="aux" style={{fontWeight:600,color:'var(--primary)'}}>背调摘要</span></div>
        <div className="aux" style={{color:'var(--text)',lineHeight:1.6}}>{c.note}</div>
      </div>

      {c.nextAction&&(
        <div className="card" style={{padding:'12px 14px',marginBottom:16,
          background:'linear-gradient(135deg,color-mix(in srgb,var(--tech) 12%,transparent),color-mix(in srgb,var(--primary) 6%,transparent))',
          border:'1px solid color-mix(in srgb,var(--tech) 24%,transparent)'}}>
          <div className="row spread" style={{marginBottom:6}}>
            <div className="row gap2"><Icon name="bot" size={14} style={{color:'var(--tech-deep)'}}/><span className="aux" style={{fontWeight:700,color:'var(--tech-deep)'}}>AI 下一步建议</span></div>
            <span className="badge" style={{fontSize:11,fontWeight:700,color:'#a06916',background:'var(--orange-light)'}}>{c.nextAction.priority}</span>
          </div>
          <div style={{fontSize:13,color:'var(--text)',lineHeight:1.6,marginBottom:4}}>{c.nextAction.script}</div>
          <div className="aux" style={{fontSize:11.5}}>时机 · {c.nextAction.when}</div>
          <div className="row gap2" style={{marginTop:10}}>
            <button className="btn btn-pri btn-sm" style={{flex:1}}><Icon name="check" size={14}/>转为跟进任务</button>
            <button className="btn btn-sec btn-sm"><Icon name="message" size={14}/>进入会话</button>
          </div>
        </div>
      )}

      {c.prefs&&(
        <div style={{marginBottom:16}}>
          <div className="field-label" style={{marginBottom:8}}>偏好画像</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[['价格敏感度',c.prefs.price],['账期偏好',c.prefs.terms],['常购品类',c.prefs.category],['关注认证',c.prefs.cert],['语言 · 时区',c.prefs.lang]].map(([k,v])=>(
              <div key={k} className="col" style={{padding:'8px 10px',background:'#fafbfc',borderRadius:8,border:'1px solid var(--border-2)',gap:2}}>
                <span className="aux" style={{fontSize:10.5}}>{k}</span>
                <span style={{fontSize:12.5,fontWeight:600,color:'var(--text)'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="field-label" style={{marginBottom:10}}>跟进时间线</div>
      <div className="col" style={{position:'relative'}}>
        {TIMELINE.map((t,i)=>{
          const meta={guard:['shield','var(--red)'],ai:['bot','var(--primary)'],quote:['doc','var(--primary)'],screen:['shieldCheck','var(--green)'],in:['message','var(--text-2)']}[t.type];
          return (
            <div key={i} className="row gap3" style={{paddingBottom:14,position:'relative'}}>
              {i<TIMELINE.length-1&&<span style={{position:'absolute',left:11,top:24,bottom:0,width:1.5,background:'var(--border)'}}></span>}
              <span style={{width:23,height:23,borderRadius:'50%',background:'#fff',border:`1.5px solid ${meta[1]}`,color:meta[1],
                display:'inline-flex',alignItems:'center',justifyContent:'center',flex:'none',zIndex:1}}><Icon name={meta[0]} size={12}/></span>
              <div className="col" style={{marginTop:-2}}>
                <span className="aux" style={{fontSize:11}}>{t.time}</span>
                <span style={{fontSize:12.5,color:'var(--text)'}}>{t.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="row gap2" style={{marginTop:8}}>
        <button className="btn btn-pri btn-sm" style={{flex:1}}><Icon name="message" size={14}/>进入会话</button>
        <button className="btn btn-sec btn-sm"><Icon name="doc" size={14}/>历史报价</button>
      </div>
    </div>
  );
}

function CRM({onOpenProfile}){
  const [active,setActive]=useState('all');
  const tags=[['all','全部'],['谈判中','谈判中'],['老客户','老客户'],['已成交','已成交'],['报价中','报价中']];
  const list=CUSTOMERS.filter(c=>active==='all'||c.tag===active);
  return (
    <div className="page-scroll">
      <div style={{padding:'24px 28px',maxWidth:1240,margin:'0 auto'}}>
        <div className="row spread" style={{marginBottom:20}}>
          <div className="col"><span className="eyebrow" style={{color:'var(--tech-deep)'}}>CRM · 数据资产</span><span className="h1">客户档案</span>
            <span className="muted" style={{marginTop:4}}>Agent 自动建档、记录跟进进展与偏好，沉淀成交话术形成数据资产</span></div>
          <button className="btn btn-sec"><Icon name="download" size={16}/>导出 CRM</button>
        </div>

        <div className="row gap1" style={{marginBottom:16}}>
          {tags.map(([k,l])=>(
            <button key={k} onClick={()=>setActive(k)} className="badge clickable"
              style={{height:30,padding:'0 14px',background:active===k?'var(--primary)':'#f1f4f7',color:active===k?'#fff':'var(--text-2)',fontWeight:600}}>{l}</button>
          ))}
        </div>

        <div className="card" style={{overflow:'hidden'}}>
          <table className="tbl">
            <thead><tr><th>客户</th><th>客户价值</th><th>状态</th><th>关联询盘</th><th>成交</th><th>累计金额</th><th>最近活动</th><th></th></tr></thead>
            <tbody>
              {list.map(c=>(
                <tr key={c.id} className="clickable" onClick={()=>onOpenProfile(c)}>
                  <td>
                    <div className="row gap2"><Avatar name={c.contact} size={30}/>
                      <div className="col"><span className="row gap1" style={{fontWeight:600}}><span className="flag">{c.flag}</span>{c.company}</span>
                        <span className="aux" style={{fontSize:11}}>{c.contact}</span></div></div>
                  </td>
                  <td><ValueTier tier={c.vtier}/></td>
                  <td><span className="badge badge-grey">{c.tag}</span></td>
                  <td className="num">{c.inquiries}</td>
                  <td className="num">{c.deals}</td>
                  <td className="num" style={{fontWeight:600}}>{c.value>0?fmtMoney(c.value):'—'}</td>
                  <td className="aux">{c.last}</td>
                  <td><Icon name="chevR" size={16} style={{color:'var(--text-3)'}}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export { CustomerProfile, CRM };
