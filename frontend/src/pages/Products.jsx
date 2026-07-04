import { useState } from 'react';
import { Icon } from '../icons.jsx';
import { PRODUCTS } from '../sampleData.js';
import { fmtMoney, useToast } from '../ui.jsx';

/* ===== products.jsx ===== */
/* ============ 产品库 ============ */
function Products(){
  const [view,setView]=useState('card');
  const [q,setQ]=useState('');
  const toast=useToast();
  const list=PRODUCTS.filter(p=>(p.name+p.sku+p.cat).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="page-scroll">
      <div style={{padding:'24px 28px',maxWidth:1240,margin:'0 auto'}}>
        <div className="row spread" style={{marginBottom:20}}>
          <div className="col"><span className="eyebrow" style={{color:'var(--tech-deep)'}}>Catalog · 知识底座</span><span className="h1">产品库</span>
            <span className="muted" style={{marginTop:4}}>{PRODUCTS.length} 个 SKU · 支撑需求理解与自动报价的知识底座（RAG）</span></div>
          <div className="row gap2">
            <button className="btn btn-sec" onClick={()=>toast('已打开 Excel 批量导入向导','info')}><Icon name="upload" size={16}/>Excel 批量导入</button>
            <button className="btn btn-pri" onClick={()=>toast('新建产品','info')}><Icon name="plus" size={16}/>新增产品</button>
          </div>
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

        {view==='card'
          ? <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
              {list.map((p,i)=>(
                <div key={p.sku} className="card card-hover clickable anim-up" style={{overflow:'hidden',animationDelay:`${i*.03}s`}}>
                  <div style={{height:120,background:`linear-gradient(135deg,${p.img},${p.img}aa)`,position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Icon name="package" size={40} style={{color:'rgba(38,38,38,.22)'}} strokeWidth={1.3}/>
                    <span className="badge" style={{position:'absolute',top:10,left:10,background:'rgba(255,255,255,.92)',color:'var(--text-2)'}}>{p.cat}</span>
                    <span className="badge" style={{position:'absolute',top:10,right:10,
                      background:p.stock==='现货'?'var(--green-light)':'var(--orange-light)',color:p.stock==='现货'?'#1f7568':'#a06916'}}>{p.stock}</span>
                  </div>
                  <div style={{padding:14}}>
                    <div className="aux mono" style={{color:'var(--text-3)'}}>{p.sku}</div>
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
                <thead><tr><th>SKU</th><th>产品名称</th><th>品类</th><th>成本</th><th>MOQ</th><th>阶梯价</th><th>库存</th></tr></thead>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
      </div>
    </div>
  );
}

export { Products };
