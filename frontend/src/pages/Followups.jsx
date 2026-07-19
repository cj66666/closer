import { useMemo, useState } from 'react';
import { Icon } from '../icons.jsx';
import { CADENCE_PLAYBOOKS, FOLLOWUP_HEALTH, FOLLOWUP_TASKS, LIFECYCLE_STAGES, WORKFLOW_AUTOMATION_RULES } from '../sampleData.js';
import { ChannelIcon, Empty, useToast } from '../ui.jsx';

function stageLabel(stage){
  return LIFECYCLE_STAGES.find(s=>s.key===stage)?.label || stage;
}

function statusMeta(status){
  if(status==='overdue') return {label:'已逾期', cls:'badge-red'};
  if(status==='due') return {label:'现在处理', cls:'badge-red'};
  if(status==='today') return {label:'今日', cls:'badge-pri'};
  if(status==='done') return {label:'已完成', cls:'badge-green'};
  return {label:'待办', cls:'badge-grey'};
}

function taskIcon(task){
  if(task.stage==='first_contact_due') return 'phone';
  if(task.stage==='human_takeover') return 'hand';
  if(task.stage==='quote_ready') return 'doc';
  return 'message';
}

function taskRank(task){
  const statusRank={overdue:0,due:1,today:2,upcoming:3,done:4};
  const priorityRank={'高':0,'中':1,'低':2};
  return (statusRank[task.status] ?? 9) * 10 + (priorityRank[task.priority] ?? 5);
}

function healthMeta(status){
  if(status==='overdue') return {label:'已超频', cls:'bad', icon:'alert', badge:'badge-red'};
  if(status==='due') return {label:'需要触达', cls:'warn', icon:'zap', badge:'badge-red'};
  if(status==='watch') return {label:'观察中', cls:'watch', icon:'eye', badge:'badge-grey'};
  return {label:'节奏健康', cls:'good', icon:'checkCircle', badge:'badge-green'};
}

function healthRank(item){
  const statusRank={overdue:0,due:1,watch:2,healthy:3};
  const priorityRank={'高':0,'中':1,'低':2};
  return (statusRank[item.status] ?? 9) * 10 + (priorityRank[item.priority] ?? 5);
}

function workflowStatusMeta(status){
  if(status==='active') return {label:'启用', cls:'badge-green'};
  if(status==='draft') return {label:'草稿', cls:'badge-grey'};
  if(status==='paused') return {label:'暂停', cls:'badge-red'};
  return {label:'待配置', cls:'badge-grey'};
}

function workflowToneLabel(tone){
  if(tone==='bad') return '高风险';
  if(tone==='warn') return '待补字段';
  if(tone==='good') return '健康';
  return '待确认';
}

function WorkflowAutomationPanel({rules, activeId, onSelect, notice, onTest}){
  const active=rules.find(rule=>rule.id===activeId) || rules[0];
  const activeCount=rules.filter(rule=>rule.status==='active').length;
  const reviewCount=rules.filter(rule=>rule.tone==='bad'||rule.status!=='active').length;
  const runsToday=rules.reduce((sum,rule)=>sum+rule.runsToday,0);
  const enrolled=rules.reduce((sum,rule)=>sum+rule.enrolled,0);
  return (
    <section className="workflow-panel">
      <div className="workflow-head">
        <div>
          <h2>自动化规则与运行审计</h2>
          <p>成熟 CRM 的自动化不是一段隐藏脚本，而是“触发条件 → 判断条件 → 动作 → 停止条件 → 审计结果”都能被业务员和老板看见。</p>
        </div>
        <div className="workflow-stats">
          <span><b>{activeCount}</b>启用规则</span>
          <span><b>{reviewCount}</b>需关注</span>
          <span><b>{runsToday}</b>今日运行</span>
          <span><b>{enrolled}</b>当前命中</span>
        </div>
      </div>
      <div className="workflow-layout">
        <div className="workflow-list">
          {rules.map(rule=>{
            const status=workflowStatusMeta(rule.status);
            return (
              <button key={rule.id} className={`workflow-row ${rule.tone} ${active.id===rule.id?'active':''}`} onClick={()=>onSelect(rule.id)}>
                <div className="row spread" style={{gap:8,alignItems:'flex-start'}}>
                  <div className="workflow-row-main">
                    <b>{rule.title}</b>
                    <span>{rule.module} · {rule.owner}</span>
                  </div>
                  <span className={`badge ${status.cls}`}>{status.label}</span>
                </div>
                <div className="workflow-row-meta">
                  <span>{workflowToneLabel(rule.tone)}</span>
                  <span>{rule.enrolled} 命中</span>
                  <span>{rule.successRate}</span>
                </div>
                <p>{rule.lastRun}</p>
              </button>
            );
          })}
        </div>
        {active&&(
          <div className={`workflow-detail ${active.tone}`}>
            <div className="row spread" style={{gap:10,alignItems:'flex-start'}}>
              <div>
                <span className="field-label">当前规则</span>
                <h3>{active.title}</h3>
                <p>{active.trigger}</p>
              </div>
              <button className="btn btn-sec btn-sm" onClick={()=>onTest(active)}><Icon name="play" size={13}/>测试规则</button>
            </div>
            <div className="workflow-flow">
              <div>
                <span>触发</span>
                <b>{active.trigger}</b>
              </div>
              <Icon name="arrowRight" size={14}/>
              <div>
                <span>动作</span>
                <b>{active.actions[0]}</b>
              </div>
            </div>
            <div className="workflow-columns">
              <RuleBlock title="命中条件" items={active.criteria}/>
              <RuleBlock title="执行动作" items={active.actions}/>
              <RuleBlock title="护栏" items={active.guardrails}/>
            </div>
            <div className="workflow-stop">
              <span>停止条件</span>
              <b>{active.stop}</b>
            </div>
            <div className="workflow-audit-grid">
              <div><span>最近运行</span><b>{active.lastRun}</b></div>
              <div><span>下次检查</span><b>{active.nextCheck}</b></div>
              <div><span>成功率</span><b>{active.successRate}</b></div>
            </div>
            {notice&&<div className="workflow-notice"><Icon name="checkCircle" size={14}/>{notice}</div>}
          </div>
        )}
      </div>
    </section>
  );
}

function RuleBlock({title,items}){
  return (
    <div className="rule-block">
      <span>{title}</span>
      {items.map(item=><p key={item}><Icon name="check" size={12}/>{item}</p>)}
    </div>
  );
}

function FollowupHealthPanel({items, existingLeadIds, onCreateTask}){
  const sorted=items.slice().sort((a,b)=>healthRank(a)-healthRank(b));
  const needsTouch=items.filter(item=>item.status==='overdue'||item.status==='due').length;
  const watched=items.filter(item=>item.status==='watch').length;
  const healthy=items.filter(item=>item.status==='healthy').length;
  return (
    <section className="follow-health-panel">
      <div className="follow-health-head">
        <div>
          <h2>客户接触健康度</h2>
          <p>按客户设置联系频率，超出节奏就变成红色队列；任务完成或漏跟时，销售可以直接补下一步动作。</p>
        </div>
        <div className="follow-health-stats">
          <span><b>{needsTouch}</b>需触达</span>
          <span><b>{watched}</b>观察</span>
          <span><b>{healthy}</b>健康</span>
        </div>
      </div>
      <div className="follow-health-list">
        {sorted.map(item=>{
          const meta=healthMeta(item.status);
          const exists=existingLeadIds.has(item.leadId);
          return (
            <div key={item.id} className={`follow-health-row ${meta.cls}`}>
              <span className="follow-health-icon"><Icon name={meta.icon} size={16}/></span>
              <div className="follow-health-main">
                <div className="row gap2" style={{minWidth:0,flexWrap:'wrap'}}>
                  <b className="ellipsis">{item.company}</b>
                  <span className={`badge ${meta.badge}`}>{meta.label}</span>
                  <span className="badge badge-grey">{item.frequency}</span>
                </div>
                <div className="follow-health-meta">
                  <span>{item.contact}</span>
                  <span>{item.owner}</span>
                  <span>{stageLabel(item.stage)}</span>
                  <span>{item.lastTouch} → {item.nextDue}</span>
                </div>
                <p>{item.reason}</p>
              </div>
              <div className="follow-health-action">
                <div className="row gap2" style={{justifyContent:'flex-end',marginBottom:8}}>
                  <ChannelIcon ch={item.channel} size={18}/>
                  <span>{item.action}</span>
                </div>
                <button className="btn btn-sec btn-sm" disabled={exists} onClick={()=>onCreateTask(item)}>
                  <Icon name={exists?'check':'plus'} size={13}/>{exists?'已在任务':'补任务'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FollowupsPage(){
  const toast=useToast();
  const [tasks,setTasks]=useState(FOLLOWUP_TASKS);
  const [filter,setFilter]=useState('open');
  const [stageFilter,setStageFilter]=useState('all');
  const [activeId,setActiveId]=useState(FOLLOWUP_TASKS[0]?.id);
  const [activeCadenceId,setActiveCadenceId]=useState(CADENCE_PLAYBOOKS[0]?.id);
  const [activeWorkflowId,setActiveWorkflowId]=useState(WORKFLOW_AUTOMATION_RULES[0]?.id);
  const [workflowNotice,setWorkflowNotice]=useState('');
  const visible=useMemo(()=>tasks
    .filter(task=>filter==='all'||(filter==='done'?task.done:!task.done))
    .filter(task=>stageFilter==='all'||task.stage===stageFilter)
    .slice()
    .sort((a,b)=>taskRank(a)-taskRank(b)),[tasks,filter,stageFilter]);
  const activeTask=tasks.find(task=>task.id===activeId) || visible[0];
  const activeCadence=CADENCE_PLAYBOOKS.find(plan=>plan.id===activeCadenceId) || CADENCE_PLAYBOOKS[0];
  const openTasks=tasks.filter(task=>!task.done);
  const existingOpenLeadIds=useMemo(()=>new Set(openTasks.map(task=>task.leadId)),[openTasks]);
  const summary=[
    {label:'已逾期', value:openTasks.filter(t=>t.status==='overdue').length, icon:'alert', color:'var(--red)'},
    {label:'现在处理', value:openTasks.filter(t=>t.status==='due').length, icon:'zap', color:'var(--orange)'},
    {label:'首次联系', value:openTasks.filter(t=>t.stage==='first_contact_due').length, icon:'phone', color:'#1877F2'},
    {label:'人工接管', value:openTasks.filter(t=>t.stage==='human_takeover').length, icon:'hand', color:'var(--red)'},
  ];
  const stageOptions=['all',...LIFECYCLE_STAGES.map(s=>s.key)];
  const markDone=(id)=>{
    setTasks(list=>list.map(task=>task.id===id?{...task,done:true,status:'done'}:task));
    toast('跟进任务已完成','ok');
  };
  const snooze=(id)=>{
    setTasks(list=>list.map(task=>task.id===id?{...task,due:'明天 09:30',status:'upcoming'}:task));
    toast('已顺延到明天 09:30','info');
  };
  const createHealthTask=(item)=>{
    if(tasks.some(task=>!task.done && task.leadId===item.leadId)){
      toast('该客户已有未完成跟进任务','info');
      return;
    }
    const status=item.status==='healthy'||item.status==='watch' ? 'upcoming' : item.status;
    const task={
      id:`health-${item.id}-${Date.now()}`,
      leadId:item.leadId,
      company:item.company,
      contact:item.contact,
      stage:item.stage,
      due:item.nextDue,
      status,
      action:item.action,
      channel:item.channel,
      priority:item.priority,
      owner:item.owner,
      rule:item.rule,
      reason:item.reason,
      script:item.script,
    };
    setTasks(list=>[task,...list]);
    setActiveId(task.id);
    setFilter('open');
    setStageFilter('all');
    toast('已从接触健康度补生成跟进任务','ok');
  };
  const testWorkflow=(rule)=>{
    setWorkflowNotice(`${rule.title} 测试通过：当前样例数据命中 ${rule.enrolled} 条记录，动作会写入任务和审计。`);
    toast('自动化规则测试通过','ok');
  };

  return (
    <div className="page-scroll">
      <div className="follow-page">
        <div className="lead-page-head">
          <div>
            <span className="eyebrow" style={{color:'var(--primary)'}}>Follow-up</span>
            <h1 className="lead-title small">跟进提醒</h1>
            <p className="lead-sub">围绕客户生命周期安排首次联系、补需求、人工接管和报价后跟进，避免靠销售记忆跟单。</p>
          </div>
          <div className="row gap2">
            {['open','done','all'].map(key=>(
              <button key={key} className={`badge clickable ${filter===key?'badge-pri':'badge-grey'}`} style={{height:30,padding:'0 12px'}} onClick={()=>setFilter(key)}>
                {key==='open'?'未完成':key==='done'?'已完成':'全部'}
              </button>
            ))}
          </div>
        </div>

        <div className="follow-summary-grid">
          {summary.map(item=>(
            <button key={item.label} className="follow-summary-card">
              <span style={{color:item.color}}><Icon name={item.icon} size={18}/></span>
              <b>{item.value}</b>
              <small>{item.label}</small>
            </button>
          ))}
        </div>

        <div className="row gap1" style={{marginBottom:14,flexWrap:'wrap'}}>
          {stageOptions.map(key=>{
            const stage=LIFECYCLE_STAGES.find(s=>s.key===key);
            const label=key==='all'?'全部阶段':stage?.label||key;
            const count=key==='all'?openTasks.length:openTasks.filter(t=>t.stage===key).length;
            if(key!=='all' && count===0) return null;
            return (
              <button key={key} className={`badge clickable ${stageFilter===key?'badge-pri':'badge-grey'}`} style={{height:28,padding:'0 11px'}} onClick={()=>setStageFilter(key)}>
                {label} {count}
              </button>
            );
          })}
        </div>

        <section className="cadence-panel">
          <div className="row spread cadence-head">
            <div>
              <h2>生命周期触达节奏</h2>
              <p>把首次联系、补需求、报价后跟进和老客户复购拆成固定节奏，销售每天只看下一步动作。</p>
            </div>
            <span className="badge badge-pri">{CADENCE_PLAYBOOKS.filter(plan=>plan.status==='启用').length} 套启用</span>
          </div>
          <div className="cadence-layout">
            <div className="cadence-list">
              {CADENCE_PLAYBOOKS.map(plan=>(
                <button key={plan.id} className={`cadence-card ${activeCadence?.id===plan.id?'active':''}`} onClick={()=>setActiveCadenceId(plan.id)}>
                  <div className="row spread" style={{gap:8}}>
                    <span className="row gap2" style={{minWidth:0}}>
                      <ChannelIcon ch={plan.channel} size={18}/>
                      <b className="ellipsis">{plan.title}</b>
                    </span>
                    <span className={`badge ${plan.status==='启用'?'badge-green':'badge-grey'}`}>{plan.status}</span>
                  </div>
                  <div className="aux">{stageLabel(plan.stage)} · {plan.owner}</div>
                  <p>{plan.goal}</p>
                </button>
              ))}
            </div>

            {activeCadence&&(
              <div className="cadence-detail">
                <div className="row spread" style={{gap:10,alignItems:'flex-start'}}>
                  <div>
                    <div className="row gap2">
                      <ChannelIcon ch={activeCadence.channel} size={20}/>
                      <h3>{activeCadence.title}</h3>
                    </div>
                    <p>{activeCadence.goal}</p>
                  </div>
                  <span className="badge badge-grey">{stageLabel(activeCadence.stage)}</span>
                </div>

                <div className="cadence-step-list">
                  {activeCadence.steps.map((step,index)=>(
                    <div className="cadence-step" key={`${activeCadence.id}-${step.time}`}>
                      <span className="cadence-index">{index+1}</span>
                      <div>
                        <div className="row gap2" style={{flexWrap:'wrap'}}>
                          <b>{step.time}</b>
                          <span className="badge badge-grey">{step.channel}</span>
                        </div>
                        <strong>{step.action}</strong>
                        <p>{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cadence-rule-grid">
                  <div>
                    <span>停止条件</span>
                    <p>{activeCadence.stop}</p>
                  </div>
                  <div>
                    <span>合规边界</span>
                    <p>{activeCadence.compliance}</p>
                  </div>
                </div>
                <div className="tag-wrap" style={{marginTop:10}}>
                  {activeCadence.tags.map(tag=><span className="badge badge-pri" key={tag}>{tag}</span>)}
                </div>
              </div>
            )}
          </div>
        </section>

        <WorkflowAutomationPanel
          rules={WORKFLOW_AUTOMATION_RULES}
          activeId={activeWorkflowId}
          onSelect={(id)=>{setActiveWorkflowId(id);setWorkflowNotice('');}}
          notice={workflowNotice}
          onTest={testWorkflow}
        />

        <FollowupHealthPanel items={FOLLOWUP_HEALTH} existingLeadIds={existingOpenLeadIds} onCreateTask={createHealthTask}/>

        <div className="follow-layout">
          <section className="follow-list">
            {visible.length===0&&<Empty icon="check" title="暂无跟进任务" desc="线索进入阶段后会自动生成下一步提醒"/>}
            {visible.map(task=>{
              const meta=statusMeta(task.status);
              return (
                <div key={task.id} className={`follow-row ${task.done?'done':''} ${activeTask?.id===task.id?'active':''}`} onClick={()=>setActiveId(task.id)}>
                  <div className="row gap3" style={{alignItems:'flex-start',minWidth:0}}>
                    <span className="follow-icon"><Icon name={taskIcon(task)} size={17}/></span>
                    <div className="col" style={{minWidth:0,flex:1,gap:3}}>
                      <div className="row gap2" style={{minWidth:0,flexWrap:'wrap'}}>
                        <b className="ellipsis">{task.company}</b>
                        <span className={`badge ${meta.cls}`}>{meta.label}</span>
                        <span className="badge badge-grey">{task.priority}优先级</span>
                      </div>
                      <div className="aux">{task.contact} · {stageLabel(task.stage)} · {task.action}</div>
                      <div className="aux ellipsis">{task.reason}</div>
                      <div className="row gap2 aux"><ChannelIcon ch={task.channel} size={18}/><span>{task.due}</span></div>
                    </div>
                  </div>
                  <div className="row gap2" style={{flex:'none'}}>
                    <button className="btn btn-sec btn-sm" disabled={task.done} onClick={(e)=>{e.stopPropagation();snooze(task.id);}}><Icon name="clock" size={13}/>顺延</button>
                    <button className="btn btn-pri btn-sm" disabled={task.done} onClick={(e)=>{e.stopPropagation();markDone(task.id);}}><Icon name="check" size={13}/>完成</button>
                  </div>
                </div>
              );
            })}
          </section>

          <aside className="follow-guide">
            {activeTask&&(
              <div className="follow-focus-card">
                <div className="row spread" style={{gap:10}}>
                  <div className="row gap2">
                    <span className="follow-icon"><Icon name={taskIcon(activeTask)} size={17}/></span>
                    <div className="col" style={{gap:1}}>
                      <b>{activeTask.company}</b>
                      <span className="aux">{activeTask.contact} · {activeTask.owner}</span>
                    </div>
                  </div>
                  <span className={`badge ${statusMeta(activeTask.status).cls}`}>{statusMeta(activeTask.status).label}</span>
                </div>
                <div className="follow-focus-meta">
                  <span>触发规则</span>
                  <b>{activeTask.rule}</b>
                </div>
                <div className="follow-focus-meta">
                  <span>为什么现在跟</span>
                  <p>{activeTask.reason}</p>
                </div>
                <div className="draft-box" style={{marginTop:10}}>
                  <div className="row gap2" style={{fontWeight:700,marginBottom:6}}><Icon name="message" size={15}/>建议话术</div>
                  <p>{activeTask.script}</p>
                </div>
              </div>
            )}
            <h3>跟进规则</h3>
            <div className="guide-step"><b>待首次联系</b><span>当天提醒业务员主动联系，确认是否真实采购。</span></div>
            <div className="guide-step"><b>需求确认中</b><span>1 天内补齐产品、数量、目的地和时间要求。</span></div>
            <div className="guide-step"><b>强意向 / 待报价</b><span>立即人工接管，AI 只整理资料和风险提示。</span></div>
            <div className="guide-step"><b>报价后</b><span>3 天、7 天自动提醒跟进，避免销售靠记忆。</span></div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export { FollowupsPage };
