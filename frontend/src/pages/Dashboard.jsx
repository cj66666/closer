import { useMemo, useState } from 'react';
import { Icon } from '../icons.jsx';
import { FOLLOWUP_TASKS, LEAD_QUEUE, LIFECYCLE_STAGES, SELLER } from '../sampleData.js';
import { Avatar, ChannelIcon, Grade, SectionTitle } from '../ui.jsx';

function stageLabel(stage){
  return LIFECYCLE_STAGES.find(s=>s.key===stage)?.label || stage;
}

function stageColor(stage){
  return LIFECYCLE_STAGES.find(s=>s.key===stage)?.color || 'var(--text-2)';
}

function Dashboard({go, onOpenProfile}){
  const [activeId,setActiveId]=useState(LEAD_QUEUE[0]?.id);
  const active=LEAD_QUEUE.find(l=>l.id===activeId)||LEAD_QUEUE[0];
  const stats=useMemo(()=>[
    {label:'待首次联系', value:LEAD_QUEUE.filter(l=>l.stage==='first_contact_due').length, icon:'phone', color:'#1877F2', route:'leads'},
    {label:'待人工接管', value:LEAD_QUEUE.filter(l=>l.takeover).length, icon:'hand', color:'var(--red)', route:'leads'},
    {label:'强意向客户', value:LEAD_QUEUE.filter(l=>l.intent==='high').length, icon:'target', color:'var(--green)', route:'crm'},
    {label:'逾期跟进', value:FOLLOWUP_TASKS.filter(t=>t.status==='overdue'||t.status==='due').length, icon:'clock', color:'var(--orange)', route:'followups'},
  ],[]);
  const stageCounts=LIFECYCLE_STAGES.map(stage=>({stage, count:LEAD_QUEUE.filter(l=>l.stage===stage.key).length})).filter(x=>x.count>0);

  return (
    <div className="page-scroll">
      <div className="lead-workbench">
        <div className="lead-head">
          <div>
            <span className="eyebrow" style={{color:'var(--primary)'}}>Lead Lifecycle</span>
            <h1 className="lead-title">线索与客户生命周期工作台</h1>
            <p className="lead-sub">AI 负责初筛、补需求和提醒；方案设计、价格和合同由业务员接管。</p>
          </div>
          <div className="lead-head-actions">
            <button className="btn btn-sec" onClick={()=>go('settings')}><Icon name="globe" size={16}/>渠道</button>
            <button className="btn btn-pri" onClick={()=>go('leads')}><Icon name="inbox" size={16}/>处理线索</button>
          </div>
        </div>

        <div className="lead-shell">
          <aside className="lead-panel">
            <SectionTitle icon="dashboard" sub={SELLER.company}>今日概览</SectionTitle>
            <div className="lead-stat-grid">
              {stats.map(item=>(
                <button key={item.label} className="lead-stat" onClick={()=>go(item.route)}>
                  <span style={{color:item.color}}><Icon name={item.icon} size={18}/></span>
                  <span className="lead-stat-value">{item.value}</span>
                  <span className="lead-stat-label">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="lead-section-title">阶段分布</div>
            <div className="stage-list">
              {stageCounts.map(({stage,count})=>(
                <button key={stage.key} className="stage-row" onClick={()=>go('crm')}>
                  <span className="stage-dot" style={{background:stage.color}}/>
                  <span>{stage.label}</span>
                  <b>{count}</b>
                </button>
              ))}
            </div>
          </aside>

          <main className="lead-center">
            <div className="lead-toolbar">
              <SectionTitle icon="inbox" sub="只放今天必须处理的线索">线索任务队列</SectionTitle>
              <button className="btn btn-sec btn-sm" onClick={()=>go('leads')}><Icon name="filter" size={14}/>全部线索</button>
            </div>
            <div className="lead-list">
              {LEAD_QUEUE.map(lead=>(
                <button key={lead.id} className={`lead-row ${active.id===lead.id?'active':''}`} onClick={()=>setActiveId(lead.id)}>
                  <div className="lead-row-top">
                    <span className="row gap2" style={{minWidth:0}}>
                      <Grade g={lead.grade} size={24}/>
                      <span className="flag">{lead.flag}</span>
                      <span className="lead-company ellipsis">{lead.company}</span>
                    </span>
                    <span className="lead-due">{lead.due}</span>
                  </div>
                  <div className="lead-row-title">{lead.title}</div>
                  <div className="lead-row-meta">
                    <ChannelIcon ch={lead.source} size={20}/>
                    <span style={{color:stageColor(lead.stage)}}>{stageLabel(lead.stage)}</span>
                    {lead.takeover&&<span className="badge badge-red">人工接管</span>}
                  </div>
                </button>
              ))}
            </div>
          </main>

          <aside className="lead-context">
            <SectionTitle icon="user" sub="客户上下文与下一步">当前线索</SectionTitle>
            <div className="context-card">
              <div className="row gap3" style={{alignItems:'flex-start'}}>
                <Avatar name={active.contact} size={42}/>
                <div className="col" style={{minWidth:0,gap:2}}>
                  <div className="row gap2" style={{minWidth:0}}>
                    <span className="h3 ellipsis">{active.company}</span>
                    <span className="flag">{active.flag}</span>
                  </div>
                  <span className="aux">{active.contact} · {active.country}</span>
                  <span className="aux ellipsis">{active.contactValue}</span>
                </div>
              </div>
              <div className="context-summary">{active.summary}</div>
              <div className="tag-wrap">
                {active.tags.map(tag=><span key={tag} className="badge badge-pri">{tag}</span>)}
              </div>
              <div className="next-box">
                <div className="row gap2" style={{fontWeight:700,color:'var(--text)',marginBottom:6}}>
                  <Icon name="bot" size={15} style={{color:'var(--primary)'}}/>下一步建议
                </div>
                <p>{active.nextStep}</p>
              </div>
              <div className="missing-box">
                <span className="field-label">缺失信息</span>
                <div className="tag-wrap">
                  {active.missing.map(item=><span key={item} className="badge badge-grey">{item}</span>)}
                </div>
              </div>
              <div className="row gap2" style={{marginTop:16}}>
                <button className="btn btn-pri btn-sm" style={{flex:1}} onClick={()=>go('leads')}><Icon name="message" size={14}/>处理</button>
                <button className="btn btn-sec btn-sm" onClick={()=>onOpenProfile?.(active)}><Icon name="user" size={14}/>档案</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export { Dashboard };
