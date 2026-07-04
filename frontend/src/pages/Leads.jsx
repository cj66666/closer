import { useMemo, useState } from 'react';
import { Icon } from '../icons.jsx';
import { CHANNELS, LEAD_QUEUE, LIFECYCLE_STAGES } from '../sampleData.js';
import { Avatar, ChannelIcon, Empty, Grade, Modal, useToast } from '../ui.jsx';

const STAGE_FLOW=['first_contact_due','contacted','needs_discovery','strong_intent','quote_ready','followup'];

function stageMeta(stage){
  return LIFECYCLE_STAGES.find(s=>s.key===stage)||{label:stage,color:'var(--text-2)'};
}

function LeadsPage({onOpenProfile}){
  const toast=useToast();
  const [items,setItems]=useState(LEAD_QUEUE);
  const [stage,setStage]=useState('all');
  const [q,setQ]=useState('');
  const [activeId,setActiveId]=useState(items[0]?.id);
  const [modal,setModal]=useState(false);
  const filtered=useMemo(()=>{
    return items.filter(item=>{
      if(stage!=='all'&&item.stage!==stage) return false;
      if(!q) return true;
      const text=`${item.company} ${item.contact} ${item.title} ${item.summary}`.toLowerCase();
      return text.includes(q.toLowerCase());
    });
  },[items,stage,q]);
  const active=items.find(item=>item.id===activeId)||filtered[0]||items[0];
  const stageOptions=[{key:'all',label:'全部',count:items.length},...LIFECYCLE_STAGES.map(s=>({key:s.key,label:s.label,count:items.filter(i=>i.stage===s.key).length})).filter(s=>s.count>0)];

  const updateLead=(id, patch)=>{
    setItems(list=>list.map(item=>item.id===id?{...item,...patch}:item));
  };
  const nextStage=()=>{
    const idx=STAGE_FLOW.indexOf(active.stage);
    const next=STAGE_FLOW[Math.min(idx+1,STAGE_FLOW.length-1)]||'contacted';
    updateLead(active.id,{stage:next,tags:[...new Set([...(active.tags||[]), stageMeta(next).label])]});
    toast(`已推进到「${stageMeta(next).label}」`,'ok');
  };
  const markTakeover=()=>{
    updateLead(active.id,{stage:'human_takeover',takeover:true,tags:[...new Set([...(active.tags||[]),'需人工报价'])]});
    toast('已标记人工接管：AI 停止承诺价格和方案','warn');
  };
  const createFacebookLead=(lead)=>{
    const item={
      id:'lead-new-'+Date.now(), source:'facebook', leadType:'contact_only', stage:'first_contact_due', intent:'medium', grade:'B',
      company:lead.company||'(未填写公司)', contact:lead.name||'Facebook Lead', country:lead.country||'未知', flag:'🏳️',
      contactValue:lead.phone||lead.email||'待补联系方式', title:'Facebook 手动录入线索',
      summary:lead.note||'客户只留下联系方式，等待业务员主动首次联系。',
      nextStep:'首次联系：确认采购品类、数量、目的地和时间要求。',
      due:'今天', age:'刚刚', probability:'B', takeover:true,
      tags:['Facebook 来源','仅留联系方式','待补需求'], missing:['采购品类','目标数量','目的港'],
      assessment:{authenticity:'likely_real', validity:'needs_more_info', deal_probability:'B'},
      sla:{target:'5 分钟', elapsed:'刚刚', pct:10, status:'ok', label:'SLA 内'},
      owner:'Hank', lastTouch:'未联系',
      priorityReason:'Facebook 留资线索需要当天首次联系，先验证是否真实采购。',
      matchedFields:[
        {label:'联系方式', value:lead.phone||lead.email?'已留':'待补', ok:!!(lead.phone||lead.email)},
        {label:'公司身份', value:lead.company||'未填写', ok:!!lead.company},
        {label:'采购需求', value:'待确认', ok:false},
      ],
      clarificationQuestions:['贵司主要采购哪类户外家具？','预计数量和目标到货时间？','目的港或交付国家是哪里？'],
      handoffReasons:['首次联系由业务员主动发起'],
      replyDraft:'Hi, this is Hank from Sunpath Outdoor. I saw your Facebook inquiry about outdoor furniture. May I confirm which category you are sourcing for and the approximate quantity?',
    };
    setItems(list=>[item,...list]);
    setActiveId(item.id);
    setModal(false);
    toast('Facebook 留资线索已进入待首次联系','ok');
  };

  return (
    <div className="lead-page">
      <div className="lead-page-head">
        <div>
          <span className="eyebrow" style={{color:'var(--primary)'}}>Leads</span>
          <h1 className="lead-title small">线索池</h1>
          <p className="lead-sub">统一承接完整询盘和仅留联系方式线索，先初筛、再沟通、再人工报价。</p>
        </div>
        <button className="btn btn-pri" onClick={()=>setModal(true)}><Icon name="plus" size={16}/>录入 Facebook 线索</button>
      </div>

      <div className="lead-board">
        <aside className="lead-filter">
          <div style={{position:'relative',marginBottom:12}}>
            <span style={{position:'absolute',left:10,top:9,color:'var(--text-3)'}}><Icon name="search" size={15}/></span>
            <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="搜索公司 / 联系人 / 需求" style={{paddingLeft:32}}/>
          </div>
          <div className="lead-section-title">生命周期阶段</div>
          <div className="stage-list">
            {stageOptions.map(opt=>(
              <button key={opt.key} className={`stage-row ${stage===opt.key?'active':''}`} onClick={()=>setStage(opt.key)}>
                <span className="stage-dot" style={{background:opt.key==='all'?'var(--text-3)':stageMeta(opt.key).color}}/>
                <span>{opt.label}</span>
                <b>{opt.count}</b>
              </button>
            ))}
          </div>
        </aside>

        <section className="lead-list-pane">
          {filtered.length===0&&<Empty icon="search" title="没有匹配线索" desc="换个阶段或关键词试试"/>}
          {filtered.map(item=>(
            <button key={item.id} className={`lead-card-row ${active?.id===item.id?'active':''}`} onClick={()=>setActiveId(item.id)}>
              <div className="row spread" style={{gap:10,alignItems:'flex-start'}}>
                <div className="row gap2" style={{minWidth:0}}>
                  <Grade g={item.grade} size={24}/>
                  <div className="col" style={{minWidth:0,gap:2}}>
                    <span className="lead-company ellipsis">{item.company}</span>
                    <span className="aux ellipsis">{item.contact} · {item.title}</span>
                  </div>
                </div>
                <span className="lead-due">{item.due}</span>
              </div>
              <p className="lead-card-summary">{item.summary}</p>
              <div className="row spread" style={{gap:10}}>
                <span className="row gap2 aux"><ChannelIcon ch={item.source} size={20}/>{CHANNELS[item.source]?.name}</span>
                <span className="row gap2">
                  {item.sla&&<span className={`badge ${item.sla.status==='overdue'?'badge-red':item.sla.status==='ok'?'badge-green':'badge-grey'}`}>{item.sla.label}</span>}
                  <span className="badge" style={{color:stageMeta(item.stage).color,background:'var(--bg-2)'}}>{stageMeta(item.stage).label}</span>
                </span>
              </div>
            </button>
          ))}
        </section>

        <section className="lead-detail">
          {active&&<LeadDetail lead={active} onNext={nextStage} onTakeover={markTakeover} onOpenProfile={onOpenProfile}/>}
        </section>
      </div>

      <FacebookLeadModal open={modal} onClose={()=>setModal(false)} onCreate={createFacebookLead}/>
    </div>
  );
}

function LeadDetail({lead,onNext,onTakeover,onOpenProfile}){
  const meta=stageMeta(lead.stage);
  return (
    <div className="lead-detail-inner">
      <div className="row gap3" style={{alignItems:'flex-start'}}>
        <Avatar name={lead.contact} size={48}/>
        <div className="col" style={{minWidth:0,gap:3}}>
          <div className="row gap2"><span className="h3 ellipsis">{lead.company}</span><span className="flag">{lead.flag}</span></div>
          <span className="aux">{lead.contact} · {lead.country}</span>
          <span className="aux ellipsis">{lead.contactValue}</span>
        </div>
      </div>
      <div className="lead-stage-banner" style={{borderColor:meta.color+'55'}}>
        <span className="stage-dot" style={{background:meta.color}}/>
        <b>{meta.label}</b>
        <span className="aux">成交概率 {lead.probability} · {lead.intent==='high'?'强意向':'需继续判断'}</span>
      </div>
      <div className={`sla-card compact ${lead.sla?.status==='overdue'?'urgent':''}`}>
        <div className="row spread" style={{gap:10}}>
          <div>
            <div className="field-label">5 分钟响应 SLA</div>
            <b>{lead.sla?.label || '未计时'} · {lead.sla?.elapsed || '—'}</b>
          </div>
          <span className="badge badge-pri">{lead.owner}</span>
        </div>
        <div className="sla-meter"><span style={{width:`${lead.sla?.pct||0}%`}}/></div>
        <p>{lead.priorityReason}</p>
      </div>
      <div className="detail-block">
        <span className="field-label">需求摘要</span>
        <p>{lead.summary}</p>
      </div>
      <div className="detail-block">
        <span className="field-label">AI 初筛输出</span>
        <div className="assessment-grid">
          <InfoCell label="真实性" value={lead.assessment.authenticity}/>
          <InfoCell label="有效性" value={lead.assessment.validity}/>
          <InfoCell label="概率" value={lead.assessment.deal_probability}/>
        </div>
      </div>
      <div className="detail-block">
        <span className="field-label">匹配证据</span>
        <div className="evidence-list">
          {(lead.matchedFields||[]).map(item=>(
            <div key={item.label} className={`evidence-row ${item.ok?'ok':'missing'}`}>
              <Icon name={item.ok?'checkCircle':'alert'} size={14}/>
              <span>{item.label}</span>
              <b>{item.value}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="detail-block">
        <span className="field-label">缺失信息</span>
        <div className="tag-wrap">{lead.missing.map(item=><span key={item} className="badge badge-grey">{item}</span>)}</div>
      </div>
      <div className="detail-block">
        <span className="field-label">建议追问</span>
        <div className="question-list">
          {(lead.clarificationQuestions||[]).map(q=><div key={q}>· {q}</div>)}
        </div>
      </div>
      <div className="next-box">
        <div className="row gap2" style={{fontWeight:700,marginBottom:6}}><Icon name="bot" size={15} style={{color:'var(--primary)'}}/>下一步建议</div>
        <p>{lead.nextStep}</p>
      </div>
      <div className="draft-box">
        <div className="row gap2" style={{fontWeight:700,marginBottom:6}}><Icon name="message" size={15}/>首响草稿</div>
        <p>{lead.replyDraft}</p>
      </div>
      {lead.handoffReasons?.length>0&&(
        <div className="handoff-box">
          <div className="row gap2" style={{fontWeight:700,marginBottom:6}}><Icon name="hand" size={15}/>人工接管边界</div>
          <div className="tag-wrap">{lead.handoffReasons.map(reason=><span key={reason} className="badge badge-red">{reason}</span>)}</div>
        </div>
      )}
      <div className="tag-wrap" style={{marginTop:14}}>{lead.tags.map(tag=><span key={tag} className="badge badge-pri">{tag}</span>)}</div>
      <div className="row gap2" style={{marginTop:18}}>
        <button className="btn btn-pri btn-sm" style={{flex:1}} onClick={onNext}><Icon name="arrowRight" size={14}/>推进阶段</button>
        <button className="btn btn-sec btn-sm" onClick={onTakeover}><Icon name="hand" size={14}/>人工接管</button>
        <button className="btn btn-sec btn-sm" onClick={()=>onOpenProfile?.(lead)}><Icon name="user" size={14}/>档案</button>
      </div>
    </div>
  );
}

function InfoCell({label,value}){
  return <div className="info-cell"><span>{label}</span><b>{value}</b></div>;
}

function FacebookLeadModal({open,onClose,onCreate}){
  const [form,setForm]=useState({name:'',company:'',country:'',phone:'',email:'',note:''});
  const set=(key,value)=>setForm(current=>({...current,[key]:value}));
  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div style={{padding:20}}>
        <div className="row spread" style={{marginBottom:16}}>
          <div><div className="h3">录入 Facebook 留资线索</div><div className="aux">第一版支持手动录入，后续再接 Graph API。</div></div>
          <button className="btn-icon btn-ghost" onClick={onClose}><Icon name="x" size={18}/></button>
        </div>
        <div className="form-grid">
          <label className="field"><span>联系人</span><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Daniel Carter"/></label>
          <label className="field"><span>公司</span><input value={form.company} onChange={e=>set('company',e.target.value)} placeholder="Westfield Retail Group"/></label>
          <label className="field"><span>国家</span><input value={form.country} onChange={e=>set('country',e.target.value)} placeholder="UK"/></label>
          <label className="field"><span>电话</span><input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+44 ..."/></label>
          <label className="field full"><span>Email</span><input value={form.email} onChange={e=>set('email',e.target.value)} placeholder="buyer@example.com"/></label>
          <label className="field full"><span>备注</span><textarea value={form.note} onChange={e=>set('note',e.target.value)} placeholder="客户只留下联系方式，关注户外家具目录。" rows={3}/></label>
        </div>
        <div className="row gap2" style={{justifyContent:'flex-end',marginTop:18}}>
          <button className="btn btn-sec btn-sm" onClick={onClose}>取消</button>
          <button className="btn btn-pri btn-sm" onClick={()=>onCreate(form)}><Icon name="plus" size={14}/>创建线索</button>
        </div>
      </div>
    </Modal>
  );
}

export { LeadsPage };
