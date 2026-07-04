import { useMemo, useState } from 'react';
import { Icon } from '../icons.jsx';
import { FOLLOWUP_TASKS, LIFECYCLE_STAGES } from '../sampleData.js';
import { ChannelIcon, Empty, useToast } from '../ui.jsx';

function stageLabel(stage){
  return LIFECYCLE_STAGES.find(s=>s.key===stage)?.label || stage;
}

function statusMeta(status){
  if(status==='overdue') return {label:'已逾期', cls:'badge-red'};
  if(status==='due') return {label:'现在处理', cls:'badge-red'};
  if(status==='today') return {label:'今日', cls:'badge-pri'};
  return {label:'待办', cls:'badge-grey'};
}

function FollowupsPage(){
  const toast=useToast();
  const [tasks,setTasks]=useState(FOLLOWUP_TASKS);
  const [filter,setFilter]=useState('open');
  const visible=useMemo(()=>tasks.filter(task=>filter==='all'||(filter==='done'?task.done:!task.done)),[tasks,filter]);
  const markDone=(id)=>{
    setTasks(list=>list.map(task=>task.id===id?{...task,done:true,status:'done'}:task));
    toast('跟进任务已完成','ok');
  };
  const snooze=(id)=>{
    setTasks(list=>list.map(task=>task.id===id?{...task,due:'明天 09:30',status:'upcoming'}:task));
    toast('已顺延到明天 09:30','info');
  };

  return (
    <div className="page-scroll">
      <div className="follow-page">
        <div className="lead-page-head">
          <div>
            <span className="eyebrow" style={{color:'var(--primary)'}}>Follow-up</span>
            <h1 className="lead-title small">跟进提醒</h1>
            <p className="lead-sub">围绕客户生命周期安排首次联系、补需求、人工接管和报价后跟进。</p>
          </div>
          <div className="row gap2">
            {['open','done','all'].map(key=>(
              <button key={key} className={`badge clickable ${filter===key?'badge-pri':'badge-grey'}`} style={{height:30,padding:'0 12px'}} onClick={()=>setFilter(key)}>
                {key==='open'?'未完成':key==='done'?'已完成':'全部'}
              </button>
            ))}
          </div>
        </div>

        <div className="follow-layout">
          <section className="follow-list">
            {visible.length===0&&<Empty icon="check" title="暂无跟进任务" desc="线索进入阶段后会自动生成下一步提醒"/>}
            {visible.map(task=>{
              const meta=statusMeta(task.status);
              return (
                <div key={task.id} className={`follow-row ${task.done?'done':''}`}>
                  <div className="row gap3" style={{alignItems:'flex-start',minWidth:0}}>
                    <span className="follow-icon"><Icon name={task.action.includes('首次')?'phone':task.action.includes('报价')?'doc':'message'} size={17}/></span>
                    <div className="col" style={{minWidth:0,flex:1,gap:3}}>
                      <div className="row gap2" style={{minWidth:0,flexWrap:'wrap'}}>
                        <b className="ellipsis">{task.company}</b>
                        <span className={`badge ${meta.cls}`}>{meta.label}</span>
                        <span className="badge badge-grey">{task.priority}优先级</span>
                      </div>
                      <div className="aux">{task.contact} · {stageLabel(task.stage)} · {task.action}</div>
                      <div className="row gap2 aux"><ChannelIcon ch={task.channel} size={18}/><span>{task.due}</span></div>
                    </div>
                  </div>
                  <div className="row gap2" style={{flex:'none'}}>
                    <button className="btn btn-sec btn-sm" disabled={task.done} onClick={()=>snooze(task.id)}><Icon name="clock" size={13}/>顺延</button>
                    <button className="btn btn-pri btn-sm" disabled={task.done} onClick={()=>markDone(task.id)}><Icon name="check" size={13}/>完成</button>
                  </div>
                </div>
              );
            })}
          </section>

          <aside className="follow-guide">
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
