import { useEffect, useState } from 'react';
import { Icon } from '../icons.jsx';
import { PRODUCTS } from '../sampleData.js';
import { fetchProducts } from '../data.js';
import { fmtMoney, useToast, Drawer, Modal, Empty } from '../ui.jsx';

/* ===== products.jsx ===== */
/* ============ 产品库 ============ */

/* 报价准备就绪：成本 + MOQ + 定价规则齐全才可辅助人工报价 */
const isReady=(p)=>p.cost!=null && p.moq!=null && !!p.priced;
function missingOf(p){
  const miss=[];
  if(p.cost==null) miss.push('成本');
  if(p.moq==null) miss.push('MOQ');
  if(!p.priced) miss.push('定价规则');
  return miss;
}
function ReadyBadge({p, onConfig}){
  if(isReady(p)) return <span className="badge" style={{background:'var(--green-light)',color:'#1f7568'}}><Icon name="check" size={11}/>报价准备就绪</span>;
  return (
    <span className="badge clickable" onClick={(e)=>{e.stopPropagation();onConfig&&onConfig(p);}}
      title={'缺：'+missingOf(p).join(' / ')+' · 去配置定价'}
      style={{background:'var(--orange-light)',color:'#a06916'}}>
      <Icon name="alert" size={11}/>待配置定价
    </span>
  );
}

function Products({api, go, demoMode=false}){
  const [products,setProducts]=useState(demoMode ? PRODUCTS : []);
  const [view,setView]=useState('card');
  const [q,setQ]=useState('');
  const [showNew,setShowNew]=useState(false);
  const [showImport,setShowImport]=useState(false);
  const toast=useToast();
  useEffect(()=>{
    if(!api) return;
    fetchProducts(api).then(data=>setProducts(data)).catch(()=>{ if(demoMode) setProducts(PRODUCTS); });
  },[api,demoMode]);
  const list=products.filter(p=>`${p.name||''}${p.sku||''}${p.cat||''}`.toLowerCase().includes(q.toLowerCase()));
  const readyCount=products.filter(isReady).length;
  const totalCount=products.length;
  const readyRatio=totalCount ? readyCount / totalCount : 0;
  const goConfig=()=>{ if(go){ go('quoterules'); } else { toast('前往「报价准备 · 规则配置」补全定价','info'); } };

  return (
    <div style={{position:'relative',height:'100%'}}>
      <div className="page-scroll">
        <div style={{padding:'24px 28px',maxWidth:1240,margin:'0 auto'}}>
          <div className="row spread" style={{marginBottom:20}}>
            <div className="col"><span className="eyebrow" style={{color:'var(--tech-deep)'}}>Catalog · 知识底座</span><span className="h1">产品库</span>
              <span className="muted" style={{marginTop:4}}>{totalCount} 个 SKU · 报价准备就绪 {readyCount}/{totalCount} · 支撑需求理解与人工报价材料整理</span></div>
            <div className="row gap2">
              <button className="btn btn-sec" onClick={()=>setShowImport(true)}><Icon name="upload" size={16}/>Excel 批量导入</button>
              <button className="btn btn-pri" onClick={()=>setShowNew(true)}><Icon name="plus" size={16}/>新增产品</button>
            </div>
          </div>

          {/* 报价就绪占比仪表 */}
          <div className="card card-pad" style={{marginBottom:16}}>
            <div className="row spread" style={{marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:600}}>报价就绪占比</span>
              <span className="num" style={{fontWeight:700,color:'var(--green)'}}>{Math.round(readyRatio*100)}%</span>
            </div>
            <div style={{height:8,background:'#eef1f4',borderRadius:5,overflow:'hidden'}}>
              <div style={{width:`${readyRatio*100}%`,height:'100%',background:'var(--green)',borderRadius:5,transition:'width .6s'}}/>
            </div>
            <span className="aux" style={{marginTop:8,display:'block',fontSize:12}}>
              {Math.max(totalCount-readyCount,0)} 个产品「待配置定价」——补全成本 + MOQ + 定价规则后可进入人工报价准备。
            </span>
          </div>

          <div className="row spread" style={{marginBottom:16}}>
            <div style={{position:'relative',width:300}}>
              <span style={{position:'absolute',left:10,top:9,color:'var(--text-3)'}}><Icon name="search" size={16}/></span>
              <input className="input" placeholder="搜索产品 / SKU / 品类" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:32,height:36}}/>
            </div>
            <div className="row gap1" style={{background:'#eef1f4',borderRadius:8,padding:3}}>
              <button onClick={()=>setView('card')} className="btn-icon" style={{width:32,height:30,borderRadius:6,
                background:view==='card'?'#fff':'transparent',color:view==='card'?'var(--primary)':'var(--text-3)',
                boxShadow:view==='card'?'var(--shadow-sm)':'none'}}><Icon name="grid" size={16}/></button>
              <button onClick={()=>setView('list')} className="btn-icon" style={{width:32,height:30,borderRadius:6,
                background:view==='list'?'#fff':'transparent',color:view==='list'?'var(--primary)':'var(--text-3)',
                boxShadow:view==='list'?'var(--shadow-sm)':'none'}}><Icon name="list" size={16}/></button>
            </div>
          </div>

          {list.length===0
            ? <div className="card">
                <Empty icon="package" title={q ? '没有匹配产品' : '暂无产品'} desc={q ? '换个关键词试试。' : '新增或导入产品后，这里会显示真实产品库。'}/>
              </div>
            : view==='card'
            ? <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
                {list.map((p,i)=>(
                  <div key={p.sku} className="card card-hover clickable anim-up" style={{overflow:'hidden',animationDelay:`${i*.03}s`}}>
                    <div style={{height:150,background:`linear-gradient(135deg,${p.img},${p.img}aa)`,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                      {p.image
                        ? <img src={p.image} alt={p.name} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                        : <Icon name="package" size={40} style={{color:'rgba(38,38,38,.22)'}} strokeWidth={1.3}/>}
                      <span className="badge" style={{position:'absolute',top:10,left:10,background:'rgba(255,255,255,.92)',color:'var(--text-2)'}}>{p.cat}</span>
                      <span className="badge" style={{position:'absolute',top:10,right:10,
                        background:p.stock==='现货'?'var(--green-light)':'var(--orange-light)',color:p.stock==='现货'?'#1f7568':'#a06916'}}>{p.stock}</span>
                    </div>
                    <div style={{padding:14}}>
                      <div className="row spread" style={{marginBottom:6}}>
                        <div className="aux mono" style={{color:'var(--text-3)'}}>{p.sku}</div>
                        <ReadyBadge p={p} onConfig={goConfig}/>
                      </div>
                      <div style={{fontWeight:600,fontSize:13.5,margin:'2px 0 10px',lineHeight:1.4,height:38,overflow:'hidden'}}>{p.name}</div>
                      <div className="row spread">
                        <div className="col"><span className="aux" style={{fontSize:11}}>成本</span><span className="num" style={{fontWeight:600}}>{fmtMoney(p.cost)}</span></div>
                        <div className="col" style={{alignItems:'flex-end'}}><span className="aux" style={{fontSize:11}}>阶梯价</span><span className="num" style={{fontWeight:600,color:'var(--primary)'}}>{p.tier}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            : <div className="card" style={{overflow:'hidden'}}>
                <table className="tbl">
                  <thead><tr><th>SKU</th><th>产品名称</th><th>品类</th><th>成本</th><th>MOQ</th><th>阶梯价</th><th>库存</th><th>报价准备</th></tr></thead>
                  <tbody>
                    {list.map(p=>(
                      <tr key={p.sku} className="clickable">
                        <td className="mono" style={{color:'var(--text-2)'}}>{p.sku}</td>
                        <td style={{fontWeight:600}}>{p.name}</td>
                        <td><span className="badge badge-grey">{p.cat}</span></td>
                        <td className="num">{fmtMoney(p.cost)}</td>
                        <td className="num">{p.moq}</td>
                        <td className="num" style={{color:'var(--primary)',fontWeight:600}}>{p.tier}</td>
                        <td><span className="badge" style={{background:p.stock==='现货'?'var(--green-light)':'var(--orange-light)',color:p.stock==='现货'?'#1f7568':'#a06916'}}>{p.stock}</span></td>
                        <td><ReadyBadge p={p} onConfig={goConfig}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </div>
      </div>

      <NewProductDrawer open={showNew} onClose={()=>setShowNew(false)} onSave={()=>{setShowNew(false);toast('产品已保存（演示）','ok');}}/>
      <ImportWizard open={showImport} onClose={()=>setShowImport(false)} onImport={(n)=>{setShowImport(false);toast(`已导入 ${n} 条产品（演示）`,'ok');}}/>
    </div>
  );
}

/* —— 新增产品（单条录入）—— */
function NewProductDrawer({open, onClose, onSave}){
  return (
    <Drawer open={open} onClose={onClose} title="新增产品" width={460}>
      <div style={{padding:'16px 20px',display:'grid',gap:14}}>
        <Field label="产品名称" placeholder="如 Aspen 5-Seater PE Rattan Corner Sofa Set"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="SKU" placeholder="OF-RT-205"/>
          <Field label="品类" placeholder="藤编沙发"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <Field label="成本 (USD)" placeholder="128"/>
          <Field label="MOQ" placeholder="50"/>
          <Field label="交期" placeholder="35–40 天"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="col" style={{gap:6}}>
            <span className="field-label">库存状态</span>
            <select className="input"><option>现货</option><option>排产</option><option>停产</option></select>
          </div>
          <Field label="认证" placeholder="CE / FSC / REACH"/>
        </div>
        <div className="col" style={{gap:6}}>
          <span className="field-label">规格 / 材质</span>
          <textarea className="input" rows={3} placeholder="铝合金边框 + 抗 UV PE 藤编（2000+ 小时）…"/>
        </div>
        <div className="row gap2" style={{padding:'4px 0 12px',background:'rgba(234,161,58,.08)',borderRadius:8}}>
          <Icon name="alert" size={14} style={{color:'#a06916',flex:'none',marginLeft:10,marginTop:2}}/>
          <span className="aux" style={{color:'#8a5b14',fontSize:12}}>成本为敏感字段，AI 抽取后需人工确认；保存后到「报价准备」配置定价规则，供业务员人工报价时引用。</span>
        </div>
        <div className="row gap2" style={{justifyContent:'flex-end'}}>
          <button className="btn btn-sec" onClick={onClose}>取消</button>
          <button className="btn btn-pri" onClick={onSave}><Icon name="check" size={15}/>保存产品</button>
        </div>
      </div>
    </Drawer>
  );
}
function Field({label, placeholder}){
  return (
    <div className="col" style={{gap:6}}>
      <span className="field-label">{label}</span>
      <input className="input" placeholder={placeholder}/>
    </div>
  );
}

/* —— Excel 批量导入向导（AI 列映射 → 校验预览 → 入库）—— */
const MAPPING=[
  {src:'产品名称 / Product Name', field:'name', ok:true},
  {src:'货号 / SKU', field:'sku', ok:true},
  {src:'成本价 / Unit Cost', field:'cost', ok:true, confirm:true},
  {src:'起订量 / MOQ', field:'moq', ok:true},
  {src:'品类 / Category', field:'cat', ok:true},
  {src:'供货状态', field:'stock', ok:true},
  {src:'备注栏', field:'—（忽略）', ok:false},
];
function ImportWizard({open, onClose, onImport}){
  const rows=42, dup=3, ok=rows-dup;
  return (
    <Modal open={open} onClose={onClose} width={560}>
      <div style={{padding:'18px 20px'}}>
        <div className="row spread" style={{marginBottom:14}}>
          <span className="h3">Excel 批量导入</span>
          <button className="btn-icon btn-ghost" onClick={onClose}><Icon name="x" size={18}/></button>
        </div>

        <div className="row gap2" style={{marginBottom:14,fontSize:12,color:'var(--text-3)',fontWeight:600}}>
          <span style={{color:'var(--primary)'}}>① 上传</span><Icon name="chevR" size={12}/>
          <span style={{color:'var(--primary)'}}>② AI 列映射</span><Icon name="chevR" size={12}/>
          <span>③ 入库</span>
        </div>

        <div style={{border:'1.5px dashed var(--border)',borderRadius:10,padding:'18px',textAlign:'center',marginBottom:14,background:'#fafbfc'}}>
          <Icon name="upload" size={24} style={{color:'var(--text-3)'}}/>
          <div style={{fontSize:13,fontWeight:600,marginTop:6}}>products.xlsx · 42 行</div>
          <a style={{color:'var(--primary)',fontSize:12}}>下载模板</a>
        </div>

        <div className="field-label" style={{marginBottom:8}}>AI 智能列映射（自动识别中英文列名）</div>
        <div className="card" style={{overflow:'hidden',marginBottom:14}}>
          <table className="tbl">
            <thead><tr><th>源列名</th><th>映射到标准字段</th><th>状态</th></tr></thead>
            <tbody>
              {MAPPING.map(m=>(
                <tr key={m.src}>
                  <td>{m.src}</td>
                  <td className="mono" style={{color:m.ok?'var(--text)':'var(--text-3)'}}>{m.field}</td>
                  <td>{m.ok
                    ? (m.confirm
                        ? <span className="badge" style={{background:'var(--orange-light)',color:'#a06916'}}>需人工确认</span>
                        : <span className="badge" style={{background:'var(--green-light)',color:'#1f7568'}}><Icon name="check" size={11}/>已对齐</span>)
                    : <span className="badge badge-grey">忽略</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row gap3" style={{marginBottom:16,fontSize:12.5}}>
          <span style={{color:'var(--green)',fontWeight:600}}>✓ {ok} 条可入库</span>
          <span style={{color:'#a06916',fontWeight:600}}>⚠ {dup} 条 SKU 重复（将标记）</span>
          <span className="aux">成本字段需人工确认后入库</span>
        </div>

        <div className="row gap2" style={{justifyContent:'flex-end'}}>
          <button className="btn btn-sec" onClick={onClose}>取消</button>
          <button className="btn btn-pri" onClick={()=>onImport(ok)}><Icon name="check" size={15}/>确认入库 {ok} 条</button>
        </div>
      </div>
    </Modal>
  );
}

export { Products };
