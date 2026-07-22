import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../icons.jsx';
import { CHANNELS, LEAD_DISPOSITION_PLAYBOOK, LEAD_IMPORT_BATCH, LEAD_QUEUE, LIFECYCLE_STAGES, OWNER_WORKLOAD, QUALIFICATION_CRITERIA } from '../sampleData.js';
import { Avatar, ChannelIcon, Empty, Grade, Modal, useToast } from '../ui.jsx';
import { fetchInquiries } from '../data.js';

const STAGE_FLOW=['first_contact_due','contacted','needs_discovery','strong_intent','quote_ready','followup'];
const IMPORT_STATUS_META={
  create:{label:'新建', cls:'badge-green'},
  merge:{label:'合并', cls:'badge-pri'},
  review:{label:'复核', cls:'badge-red'},
};

function stageMeta(stage){
  return LIFECYCLE_STAGES.find(s=>s.key===stage)||{label:stage,color:'var(--text-2)'};
}

function qualStatusMeta(status){
  if(status==='pass') return {label:'通过', cls:'pass'};
  if(status==='risk') return {label:'风险', cls:'risk'};
  if(status==='gap') return {label:'待补', cls:'gap'};
  if(status==='fail') return {label:'不符', cls:'fail'};
  return {label:'未知', cls:'unknown'};
}

function consentStatusMeta(status){
  if(status==='allowed') return {label:'可联系', cls:'allowed'};
  if(status==='limited') return {label:'仅核验', cls:'limited'};
  if(status==='blocked') return {label:'禁用', cls:'blocked'};
  return {label:'待确认', cls:'pending'};
}

function scoreTone(score){
  if(score>=80) return 'good';
  if(score>=50) return 'warn';
  return 'bad';
}

function scoreStatusRatio(status){
  if(status==='pass') return 1;
  if(status==='risk') return .45;
  if(status==='gap') return .42;
  if(status==='unknown') return .25;
  if(status==='fail') return 0;
  return .18;
}

function scoreStatusLabel(status){
  if(status==='pass') return '已验证';
  if(status==='risk') return '有风险';
  if(status==='gap') return '待补';
  if(status==='fail') return '扣分';
  return '待确认';
}

function scoreBreakdownFor(lead){
  const qualification=lead.qualification || [];
  const weights=[
    {key:'fit', label:'客户匹配', max:22},
    {key:'need', label:'需求完整', max:24},
    {key:'authority', label:'采购角色', max:16},
    {key:'timing', label:'采购时机', max:16},
    {key:'commercial', label:'商务边界', max:22},
  ];
  const raw=weights.map(weight=>{
    const item=qualification.find(q=>q.key===weight.key) || {status:'unknown', evidence:QUALIFICATION_CRITERIA.find(c=>c.key===weight.key)?.desc || '待补判断依据'};
    return {...weight, status:item.status, evidence:item.evidence, raw:weight.max*scoreStatusRatio(item.status)};
  });
  const rawTotal=raw.reduce((sum,item)=>sum+item.raw,0);
  const target=lead.qualificationScore || Math.round(rawTotal);
  const scale=rawTotal>0 ? target/rawTotal : 1;
  const scaled=raw.map(item=>({
    ...item,
    score:Math.min(item.max, Math.round(item.raw*scale)),
    statusLabel:scoreStatusLabel(item.status),
  }));
  let delta=target-scaled.reduce((sum,item)=>sum+item.score,0);
  let guard=0;
  while(delta!==0 && guard<100) {
    const adjustable=scaled.find(item=>delta>0 ? item.score<item.max : item.score>0);
    if(!adjustable) break;
    adjustable.score+=delta>0 ? 1 : -1;
    delta+=delta>0 ? -1 : 1;
    guard+=1;
  }
  return scaled;
}

function ownerRecordFor(lead){
  if(lead.owner==='未分配') return OWNER_WORKLOAD.owners.find(owner=>owner.id==='queue') || OWNER_WORKLOAD.owners[0];
  return OWNER_WORKLOAD.owners.find(owner=>owner.name===lead.owner) || OWNER_WORKLOAD.owners[0];
}

function routingRecommendation(lead, owner){
  if(lead.owner==='未分配') {
    return {tone:'bad', label:'先分配负责人', text:'线索不得长期停留在未归属队列，先按区域和值班表分配，再启动 SLA。'};
  }
  if(owner.status==='overload' && lead.sla?.status==='overdue') {
    return {tone:'bad', label:'建议启用备用负责人', text:`${owner.name} 当前超负荷且该线索已超 SLA，可让 ${owner.backup} 接手首响或补需求。`};
  }
  if(lead.takeover) {
    return {tone:'warn', label:'人工接管优先', text:'该线索涉及强意向、报价、账期或方案边界，AI 只整理材料和提醒，不自动承诺。'};
  }
  return {tone:'good', label:'当前路由可执行', text:'负责人容量和线索阶段匹配，按当前节奏推进即可。'};
}

function contactChannelIcon(key){
  if(key==='phone') return 'phone';
  if(key==='email') return 'mail';
  if(key==='whatsapp') return 'whatsapp';
  if(key==='facebook') return 'message';
  if(key==='website') return 'store';
  return 'message';
}

function LeadsPage({api, onOpenProfile, go}){
  const toast=useToast();
  const [items,setItems]=useState(LEAD_QUEUE);
  useEffect(()=>{
    if(!api) return;
    fetchInquiries(api).then(d=>{ if(d.length) setItems(d); }).catch(()=>{});
  },[api]);
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
  const applyDisposition=(plan)=>{
    updateLead(active.id,{
      stage:plan.nextStage,
      tags:[...new Set([...(active.tags||[]), plan.label])],
      disposition:{key:plan.key,label:plan.label,route:stageMeta(plan.nextStage).label,reason:`业务员已按规则记录：${plan.trigger}`},
    });
    toast(`已记录处置：${plan.label}`,'ok');
  };
  const updateConsent=(channelKey,status)=>{
    const statusText=consentStatusMeta(status).label;
    const nextChannels=(active.consent?.channels||[]).map(channel=>channel.key===channelKey
      ? {...channel,status,evidence:status==='allowed'?'业务员已记录客户同意该渠道联系':status==='blocked'?'客户退订或禁止该渠道联系':channel.evidence}
      : channel);
    updateLead(active.id,{
      consent:{...(active.consent||{}), lastChecked:'刚刚', channels:nextChannels},
      tags:[...new Set([...(active.tags||[]), `联系许可:${statusText}`])],
    });
    toast(`已更新联系许可：${statusText}`,'ok');
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
      qualificationScore:50,
      qualification:[
        {key:'fit', status:lead.company?'pass':'gap', evidence:lead.company?'公司名已留，待背调':'公司身份待补'},
        {key:'need', status:'gap', evidence:'仅留联系方式，采购品类和数量待确认'},
        {key:'authority', status:'unknown', evidence:'采购角色待确认'},
        {key:'timing', status:'unknown', evidence:'采购窗口未说明'},
        {key:'commercial', status:'unknown', evidence:'预算、账期和目的港未知'},
      ],
      disposition:{key:'discover', label:'继续补需求', route:'待首次联系', reason:'新录入留资先完成首联和资格字段确认'},
      consent:{
        basis:'Facebook 手动录入留资', privacy:'待核对表单隐私政策', lastChecked:'刚刚',
        nextAction:'先说明来源和公司身份；切到 WhatsApp 前记录客户同意。',
        channels:[
          {key:'phone', label:'电话', status:lead.phone?'allowed':'pending', evidence:lead.phone?'客户留电话':'未留电话'},
          {key:'email', label:'Email', status:lead.email?'allowed':'pending', evidence:lead.email?'客户留邮箱':'未留邮箱'},
          {key:'facebook', label:'Facebook', status:'allowed', evidence:'手动录入 Facebook 来源'},
          {key:'whatsapp', label:'WhatsApp', status:'pending', evidence:'未确认 WhatsApp 同意'},
        ],
      },
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

      <ImportReviewPanel batch={LEAD_IMPORT_BATCH} onApply={()=>toast('已按去重与路由规则生成客户档案和跟进任务','ok')}/>

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
              <div className="lead-qualification-strip">
                <span>资格 {item.qualificationScore || 0}</span>
                <b>{item.disposition?.label || '待判断'}</b>
                <small>{item.disposition?.route || stageMeta(item.stage).label}</small>
              </div>
              <div className="lead-consent-strip">
                <span>联系许可</span>
                <b>{(item.consent?.channels||[]).filter(channel=>channel.status==='allowed').map(channel=>channel.label).join(' / ') || '待确认'}</b>
                <small>{(item.consent?.channels||[]).some(channel=>channel.status==='pending')?'有待确认渠道':'已记录'}</small>
              </div>
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
          {active&&<LeadDetail lead={active} onNext={nextStage} onTakeover={markTakeover} onDisposition={applyDisposition} onConsentChange={updateConsent} onOpenProfile={onOpenProfile} onOpenInbox={()=>go?.('inbox')}/>}
        </section>
      </div>

      <FacebookLeadModal open={modal} onClose={()=>setModal(false)} onCreate={createFacebookLead}/>
    </div>
  );
}

function ImportReviewPanel({batch,onApply}){
  const [expanded,setExpanded]=useState(false);
  const [activeId,setActiveId]=useState(batch.rowsPreview[0]?.id);
  const active=batch.rowsPreview.find(row=>row.id===activeId)||batch.rowsPreview[0];
  return (
    <section className="import-review-panel">
      <div className="row spread import-review-head">
        <div className="row gap3" style={{alignItems:'flex-start',minWidth:0}}>
          <span className="import-icon"><Icon name="upload" size={18}/></span>
          <div className="col" style={{gap:3,minWidth:0}}>
            <div className="row gap2" style={{flexWrap:'wrap'}}>
              <h2>导入前体检</h2>
              <span className="badge badge-grey">{batch.filename}</span>
            </div>
            <p>{batch.source} · {batch.rows} 行 · {batch.importedAt}。先做字段标准化、去重、负责人分配和生命周期路由，再进入线索池。</p>
          </div>
        </div>
        <div className="row gap2" style={{flexWrap:'wrap',justifyContent:'flex-end'}}>
          <button className="btn btn-sec btn-sm" onClick={()=>setExpanded(open=>!open)}>
            <Icon name={expanded?'chevU':'chevD'} size={14}/>{expanded?'收起复核':'展开复核'}
          </button>
          <button className="btn btn-pri btn-sm" onClick={onApply}><Icon name="check" size={14}/>确认入库</button>
        </div>
      </div>

      <div className="import-metric-grid">
        {batch.metrics.map(item=>(
          <div key={item.label} className={`import-metric ${item.status}`}>
            <b>{item.value}</b>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {!expanded&&(
        <div className="import-compact-note">
          <Icon name="shieldCheck" size={14}/>
          <span>默认收起复核明细，避免线索池首屏被导入流程占满；有重复、缺字段或人工复核时再展开处理。</span>
        </div>
      )}

      {expanded&&<div className="import-review-layout">
        <div className="import-row-list">
          {batch.rowsPreview.map(row=>{
            const meta=IMPORT_STATUS_META[row.status]||IMPORT_STATUS_META.review;
            return (
              <button key={row.id} className={`import-row ${active?.id===row.id?'active':''}`} onClick={()=>setActiveId(row.id)}>
                <div className="row spread" style={{gap:8,alignItems:'flex-start'}}>
                  <div className="row gap2" style={{minWidth:0}}>
                    <ChannelIcon ch={row.source} size={20}/>
                    <div className="col" style={{gap:2,minWidth:0}}>
                      <b className="ellipsis">{row.company}</b>
                      <span className="aux ellipsis">{row.contact} · {row.country}</span>
                    </div>
                  </div>
                  <span className={`badge ${meta.cls}`}>{meta.label}</span>
                </div>
                <p>{row.issue}</p>
              </button>
            );
          })}
        </div>

        {active&&(
          <div className="import-detail-card">
            <div className="row spread" style={{gap:10}}>
              <div>
                <div className="field-label">系统处理建议</div>
                <h3>{active.action}</h3>
              </div>
              <span className="badge badge-pri">{active.owner}</span>
            </div>
            <div className="import-route">
              <div>
                <span>来源</span>
                <b>{CHANNELS[active.source]?.name||active.source}</b>
              </div>
              <Icon name="arrowRight" size={15}/>
              <div>
                <span>进入阶段</span>
                <b>{stageMeta(active.stage).label}</b>
              </div>
            </div>
            <div className="detail-block" style={{marginTop:12}}>
              <span className="field-label">缺失字段</span>
              <div className="tag-wrap">{active.missing.map(item=><span key={item} className="badge badge-grey">{item}</span>)}</div>
            </div>
            <div className="import-rule-list">
              {batch.rules.map(rule=>(
                <div key={rule} className="import-rule-row">
                  <Icon name="shieldCheck" size={14}/>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>}
    </section>
  );
}

function LeadDetail({lead,onNext,onTakeover,onDisposition,onConsentChange,onOpenProfile,onOpenInbox}){
  const meta=stageMeta(lead.stage);
  const qualification=lead.qualification || [];
  const disposition=lead.disposition || {};
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
      <ScoreRoutingPanel lead={lead}/>
      <ContactConsentPanel consent={lead.consent} onConsentChange={onConsentChange}/>
      <div className="qualification-panel">
        <div className="qualification-head">
          <div>
            <span className="field-label">资格判断 & 去向</span>
            <h3>{disposition.label || '待判断'} · {lead.qualificationScore || 0} 分</h3>
            <p>{disposition.reason || '根据客户匹配、需求、角色、时机和商务边界判断下一步。'}</p>
          </div>
          <span className="badge badge-pri">{disposition.route || meta.label}</span>
        </div>
        <div className="qualification-grid">
          {QUALIFICATION_CRITERIA.map(criterion=>{
            const item=qualification.find(q=>q.key===criterion.key) || {status:'unknown', evidence:criterion.desc};
            const status=qualStatusMeta(item.status);
            return (
              <div key={criterion.key} className={`qualification-cell ${status.cls}`}>
                <div className="row spread" style={{gap:8}}>
                  <b>{criterion.label}</b>
                  <span>{status.label}</span>
                </div>
                <p>{item.evidence}</p>
              </div>
            );
          })}
        </div>
        <div className="disposition-strip">
          {LEAD_DISPOSITION_PLAYBOOK.map(plan=>(
            <button key={plan.key} className={`disposition-btn ${plan.tone} ${disposition.key===plan.key?'active':''}`} onClick={()=>onDisposition(plan)}>
              <b>{plan.label}</b>
              <span>{plan.action}</span>
            </button>
          ))}
        </div>
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
      {lead.assessment && <div className="detail-block">
        <span className="field-label">AI 初筛输出</span>
        <div className="assessment-grid">
          <InfoCell label="真实性" value={lead.assessment.authenticity}/>
          <InfoCell label="有效性" value={lead.assessment.validity}/>
          <InfoCell label="概率" value={lead.assessment.deal_probability}/>
        </div>
      </div>}
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
      <div className="row gap2" style={{marginTop:18,flexWrap:'wrap'}}>
        <button className="btn btn-pri btn-sm" style={{flex:1}} onClick={onNext}><Icon name="arrowRight" size={14}/>推进阶段</button>
        <button className="btn btn-sec btn-sm" style={{flex:1}} onClick={onOpenInbox}><Icon name="message" size={14}/>进入沟通</button>
        <button className="btn btn-sec btn-sm" onClick={onTakeover}><Icon name="hand" size={14}/>人工接管</button>
        <button className="btn btn-sec btn-sm" onClick={()=>onOpenProfile?.(lead)}><Icon name="user" size={14}/>档案</button>
      </div>
    </div>
  );
}

function ScoreRoutingPanel({lead}){
  const score=lead.qualificationScore || 0;
  const tone=scoreTone(score);
  const components=scoreBreakdownFor(lead);
  const owner=ownerRecordFor(lead);
  const routing=routingRecommendation(lead, owner);
  const loadPct=Math.min(100, Math.round((owner.openLeads/(owner.capacity || 1))*100));
  return (
    <div className="score-routing-panel">
      <div className="score-routing-head">
        <div>
          <span className="field-label">线索评分与分配透明度</span>
          <h3>{score} 分 · {lead.grade} 级线索</h3>
          <p>把“值不值得跟”和“谁来跟”拆开看，避免黑箱评分和人工派单延迟。</p>
        </div>
        <div className={`score-ring ${tone}`}>
          <b>{score}</b>
          <span>score</span>
        </div>
      </div>
      <div className="score-routing-grid">
        <div className="score-factor-list">
          {components.map(item=>(
            <div key={item.key} className={`score-factor ${item.status}`}>
              <div className="row spread" style={{gap:8}}>
                <b>{item.label}</b>
                <span>{item.score}/{item.max} · {item.statusLabel}</span>
              </div>
              <div className="score-meter"><span style={{width:`${Math.round(item.score/item.max*100)}%`}}/></div>
              <p>{item.evidence}</p>
            </div>
          ))}
        </div>
        <div className={`routing-card ${routing.tone}`}>
          <div className="routing-owner-row">
            <Avatar name={owner.name} size={34}/>
            <div>
              <b>{owner.name}</b>
              <span>{owner.role}</span>
            </div>
            <em>{owner.statusLabel}</em>
          </div>
          <div className="routing-capacity">
            <span>容量 {owner.openLeads}/{owner.capacity}</span>
            <span>{owner.availability}</span>
          </div>
          <div className="routing-meter"><span style={{width:`${loadPct}%`}}/></div>
          <div className="routing-evidence">
            <span><Icon name={CHANNELS[lead.source]?.icon || 'inbox'} size={13}/>{CHANNELS[lead.source]?.name || lead.source}</span>
            <span><Icon name="target" size={13}/>{lead.grade} 级 · {lead.intent==='high'?'强意向':'需判断'}</span>
            <span><Icon name="clock" size={13}/>{lead.sla?.label || '未计时'}</span>
          </div>
          <div className="routing-next">
            <b>{routing.label}</b>
            <p>{routing.text}</p>
          </div>
          <div className="routing-escalation">
            <span>升级规则</span>
            <b>{owner.escalation}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactConsentPanel({consent,onConsentChange}){
  const channels=consent?.channels || [];
  const whatsapp=channels.find(channel=>channel.key==='whatsapp');
  return (
    <div className="consent-panel">
      <div className="consent-head">
        <div>
          <span className="field-label">联系许可与渠道偏好</span>
          <h3>{consent?.basis || '待记录联系依据'}</h3>
          <p>{consent?.nextAction || '先确认客户同意和可用渠道，再发起跨渠道触达。'}</p>
        </div>
        <span className="badge badge-grey">{consent?.lastChecked || '未校验'}</span>
      </div>
      <div className="consent-source">
        <Icon name="shieldCheck" size={14}/>
        <span>{consent?.privacy || '缺少隐私政策或授权来源记录'}</span>
      </div>
      <div className="consent-channel-grid">
        {channels.map(channel=>{
          const status=consentStatusMeta(channel.status);
          return (
            <div key={channel.key} className={`consent-channel ${status.cls}`}>
              <div className="row spread" style={{gap:8}}>
                <span className="row gap2" style={{minWidth:0}}>
                  <Icon name={contactChannelIcon(channel.key)} size={15}/>
                  <b>{channel.label}</b>
                </span>
                <em>{status.label}</em>
              </div>
              <p>{channel.evidence}</p>
            </div>
          );
        })}
      </div>
      <div className="consent-actions">
        {whatsapp&&whatsapp.status!=='allowed'&&(
          <button className="btn btn-sec btn-sm" onClick={()=>onConsentChange?.('whatsapp','allowed')}>
            <Icon name="whatsapp" size={14}/>记录 WhatsApp 同意
          </button>
        )}
        <button className="btn btn-danger-o btn-sm" onClick={()=>onConsentChange?.('email','blocked')}>
          <Icon name="xCircle" size={14}/>标记退订
        </button>
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
