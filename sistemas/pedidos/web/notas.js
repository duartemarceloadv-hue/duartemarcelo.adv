/* Laboratórios › Notas e PV (módulo em arquivo próprio, carregado pela casca).
   Fila das diferenças pedido × nota fiscal (conferência recalculada pelo banco, mesma regra do sistema antigo)
   e das diferenças com o pedido de venda do laboratório (as que estavam abertas no sistema antigo).
   Cada item abre com o pedido e o documento lado a lado e a decisão: aceitar a diferença, cobrar o laboratório
   ou corrigido; "Próxima" segue para o próximo item aberto da lista. */
(function(){
"use strict";
var D=window.DH, M=D.MOD, $=function(s,r){return (r||document).querySelector(s)}, esc=D.esc;
var TIPO={nf:'Nota fiscal',pv:'Pedido de venda'};
var ST={aberta:['Aguardando decisão','a'],cobrar_lab:['Cobrar o laboratório','i'],aceita:['Diferença aceita','s'],corrigida:['Corrigida','s'],resolvida:['Resolvida no recálculo','s'],substituida:['Substituída por nova conferência','n']};
var DONO={operacoes:'Operações',laboratorio:'Laboratório'};
var est={tipo:'',status:'abertas',dono:'',lab:'',busca:'',dados:null,item:null,ordem:[]};
function qtd(v){return v==null?'—':Number(v).toLocaleString('pt-BR')}
function r2(v){return Math.round(v*100)/100}

/* ---------- lista ---------- */
function filtrada(){
  var d=est.dados; if(!d) return [];
  var b=est.busca.trim().toLowerCase();
  return d.itens.filter(function(x){
    if(est.dono&&x.dono!==est.dono) return false;
    if(b&&((x.num||'')+' '+(x.nfs||'')+' '+(x.numLab||'')+' '+x.un).toLowerCase().indexOf(b)<0) return false;
    return true});
}
function tela(){
  var d=est.dados, comUn=!D.estado.unidade;
  var ac=d&&d.pode_recalcular?'<button type="button" class="btn" id="nt-recalc">Recalcular conferência</button>':'';
  var l=filtrada();
  var h=D.titulo('Notas e pedido de venda',ac,d?D.plural(l.length,'item','itens')+(d.recalculado_em?' · conferência pedido × nota fiscal refeita em '+D.dtHora(d.recalculado_em):'')+(D.escopoTxt()?' · '+D.escopoTxt():''):'');
  h+='<div class="filtros">'+
    D.campo('Buscar','<input class="busca" id="nt-busca" type="search" placeholder="Nº DH, nº do laboratório, NF ou unidade" value="'+esc(est.busca)+'">','c-busca')+
    D.campo('Tipo','<select class="sel" id="nt-tipo">'+D.opt('','Todos',est.tipo)+D.opt('nf','Nota fiscal',est.tipo)+(!d||d.ver_pv?D.opt('pv','Pedido de venda',est.tipo):'')+'</select>')+
    D.campo('Situação','<select class="sel" id="nt-st">'+D.opt('abertas','Abertas',est.status)+D.opt('aberta','Aguardando decisão',est.status)+D.opt('cobrar_lab','Cobrar o laboratório',est.status)+D.opt('aceita','Diferença aceita',est.status)+D.opt('corrigida','Corrigidas',est.status)+D.opt('resolvida','Resolvidas no recálculo',est.status)+D.opt('todas','Todas',est.status)+'</select>')+
    D.campo('Com quem','<select class="sel" id="nt-dono">'+D.opt('','Todos',est.dono)+D.opt('operacoes','Operações',est.dono)+D.opt('laboratorio','Laboratório',est.dono)+'</select>')+
    D.campo('Laboratório','<select class="sel" id="nt-lab">'+D.opt('','Todos',est.lab)+D.opt('CP','Centro Paulista',est.lab)+D.opt('INJ','Injemed',est.lab)+'</select>')+
    ((est.tipo||est.status!=='abertas'||est.dono||est.lab||est.busca)?'<button type="button" class="botao sec mini" id="nt-limpar">Limpar filtros</button>':'')+'</div>';
  if(!d) return h+'<div class="tabela"><div class="vazio">Carregando a fila…</div></div>';
  var nc=comUn?9:8;
  h+='<div class="tabela cartoes"><table><thead><tr><th>Nº DH</th>'+(comUn?'<th>Unidade</th>':'')+'<th>Tipo</th><th>NF</th><th>Desde</th><th class="r">Diferenças</th><th class="r">Valor em diferença</th><th>Com quem</th><th>Situação</th></tr></thead><tbody>';
  if(!l.length) h+='<tr><td colspan="'+nc+'" class="vazio">Nenhum item com esses filtros.</td></tr>';
  l.forEach(function(x){
    h+='<tr class="lp" data-div="'+esc(x.id)+'" tabindex="0">'+
      '<td class="c1"><b class="dh">'+esc(x.num||'(rascunho)')+'</b></td>'+
      (comUn?'<td class="cl"><span class="rot-m">Unidade </span>'+esc(x.un)+'</td>':'')+
      '<td class="c2">'+esc(TIPO[x.tipo])+'</td>'+
      '<td class="cl num'+(x.nfs?'':' vz')+'"><span class="rot-m">NF </span>'+(x.nfs?esc(x.nfs):'<span class="fraco">—</span>')+'</td>'+
      '<td class="cl num"><span class="rot-m">Desde </span>'+D.dt(x.desde)+'</td>'+
      '<td class="cl r num"><span class="rot-m">Diferenças </span>'+x.linhas+'</td>'+
      '<td class="cl r num'+(x.dif!=null?'':' vz')+'"><span class="rot-m">Valor em diferença </span>'+(x.dif!=null?D.R(x.dif):'<span class="fraco">—</span>')+'</td>'+
      '<td class="cl'+(x.dono?'':' vz')+'"><span class="rot-m">Com quem </span>'+(x.dono?esc(DONO[x.dono]):'<span class="fraco">—</span>')+'</td>'+
      '<td class="cl"><span class="rot-m">Situação </span>'+D.tag(ST[x.status]||[x.status,'n'])+'</td></tr>';
  });
  h+='</tbody></table></div>';
  h+='<p class="nota">Nota fiscal: a conferência pedido × NF é refeita pelo sistema (mesma regra do sistema antigo) e o item fecha sozinho quando passa a bater. Pedido de venda: diferenças registradas no sistema antigo, trazidas como estavam.</p>';
  return h;
}
function redesenha(){var y=window.scrollY;$('#tela').innerHTML=tela();window.scrollTo(0,y)}
async function carregar(){
  est.dados=null; if(D.estado.tela==='notas') redesenha();
  try{
    var d=await D.api('notas_lista',{tipo:est.tipo,status:est.status,unidade_id:D.estado.unidade,lab:est.lab});
    est.dados=d; est.ordem=filtrada().map(function(x){return x.id});
    if(D.estado.tela==='notas') redesenha();
  }catch(x){if(D.estado.tela==='notas'&&x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
}
function abrirLista(){
  var f=D.estado.notasFiltro; D.estado.notasFiltro='';
  if(f==='nf'||f==='pv'){est.tipo=f;est.status='aberta';est.dono=''}
  else if(f==='lab'){est.tipo='';est.status='cobrar_lab';est.dono=''}
  carregar();
}

/* ---------- item: pedido e documento lado a lado + decisão ---------- */
function proximaId(){
  var o=est.ordem, i=o.indexOf(est.item&&est.item.item.id);
  var ab=est.dados?est.dados.itens:[];
  for(var k=i+1;k<o.length;k++){var x=ab.filter(function(y){return y.id===o[k]})[0];if(!x||x.status==='aberta'||x.status==='cobrar_lab')return o[k]}
  return null;
}
function linhaSt(ok){return ok===null||ok===undefined?'<span class="fraco">—</span>':(ok?'<span class="ok">Confere</span>':'<span class="nao">Diferente</span>')}
function ficha(d){
  var it=d.item, p=d.pedido, c=d.comparacao, aberto=it.status==='aberta'||it.status==='cobrar_lab', prox=proximaId();
  var h='<nav class="migalha" aria-label="Caminho"><button type="button" data-ir="notas">Notas e PV</button><span aria-hidden="true">›</span><span>'+esc(TIPO[it.tipo])+'</span></nav>';
  var acs='<button type="button" class="btn" data-p="'+esc(p.id)+'">Abrir o pedido</button>'+(prox?'<button type="button" class="btn pri" id="nt-prox">Próxima</button>':'');
  h+='<section class="fcab"><div class="l1"><h1>'+esc(p.num||'(rascunho)')+'</h1>'+D.tag([TIPO[it.tipo],'n'])+D.tag(ST[it.status]||[it.status,'n'])+(p.teste?D.tag(['Teste','a']):'')+'<div class="ac">'+acs+'</div></div>'+
    '<dl class="kv">'+D.kvi('Unidade',esc(p.un))+D.kvi('Laboratório',esc(p.labNome))+D.kvi('Nº no laboratório',esc(p.numLab||'—'))+D.kvi('Desde',D.dt(it.desde))+
    (aberto?D.kvi('Com quem',esc(DONO[it.dono]||'—')):'')+(d.grupo.length?D.kvi('Conferido junto com',d.grupo.map(function(g){return '<button type="button" class="link" data-p="'+esc(g.id)+'">'+esc(g.num)+'</button>'}).join(' ')):'')+'</dl></section>';
  if(it.tipo==='nf'&&d.agora&&aberto){
    if(d.agora.ok) h+='<section class="falta"><h2>A conferência de agora já bate</h2><ul><li>O pedido ou a nota mudou depois desta diferença. Use “Corrigido” para fechar.</li></ul></section>';
    else if(!d.agora.mesma) h+='<section class="falta"><h2>A conferência de agora é diferente</h2><ul><li>O pedido ou a nota mudou: o sistema abre outro item com as diferenças de agora no próximo recálculo.</li></ul></section>';
  }
  // ----- lado a lado
  var s='';
  if(it.tipo==='nf'){
    var nfs=d.documentos.nfs.filter(function(n){return !n.canc});
    s+='<div class="sub-t">Itens <span class="nota">'+(c.itensDoPedido?'pedido × soma das notas (venda + bonificação)':'no sistema antigo os itens deste pedido vieram da própria nota: não são comparados')+'</span></div>';
    s+='<div class="tabela cartoes"><table><thead><tr><th>Produto</th><th class="r">No pedido</th><th class="r">Na NF (venda)</th><th class="r">Na NF (bonificação)</th><th>Conferência</th></tr></thead><tbody>'+
      (c.itens.length?c.itens.map(function(x){return '<tr><td class="c1">'+esc(x.produto)+'</td><td class="cl r num"><span class="rot-m">No pedido </span>'+qtd(x.pedido)+'</td><td class="cl r num"><span class="rot-m">Na NF (venda) </span>'+qtd(x.vendido)+'</td><td class="cl r num'+(x.bonificado?'':' vz')+'"><span class="rot-m">Na NF (bonificação) </span>'+(x.bonificado?qtd(x.bonificado):'<span class="fraco">—</span>')+'</td><td class="c2">'+linhaSt(x.confere)+'</td></tr>'}).join(''):'<tr><td colspan="5" class="vazio">Sem itens.</td></tr>')+'</tbody></table></div>';
    // cada valor aparece uma vez: o total e o frete das notas ficam na primeira linha de cada grupo
    var vl=c.valores, vNF=vl.filter(function(v){return v.campo==='Valor do pedido'})[0], vFr=vl.filter(function(v){return v.campo==='Frete'})[0];
    var lin=function(nome,v,ref){var df=(v!=null&&ref!=null)?r2(ref-v):null;return '<tr><td class="c1">'+esc(nome)+'</td><td class="cl r num"><span class="rot-m">Valor </span>'+(v==null?'—':D.R(v))+'</td><td class="c2 r num">'+(df==null?'<span class="fraco">—</span>':(Math.abs(df)>0.5?'<b class="vermelho">'+D.R(df)+'</b>':'<span class="ok">confere</span>'))+'</td></tr>'};
    var rows=lin('Total das notas fiscais (sem bonificação)',vNF?vNF.nf:null,null);
    vl.forEach(function(v){if(v.campo!=='Frete')rows+=lin(v.campo,v.pedido,v.nf)});
    if(vFr) rows+=lin('Frete das notas fiscais',vFr.nf,null)+lin('Frete do pedido',vFr.pedido,vFr.nf);
    s+='<div class="sub-t">Valores</div><div class="tabela cartoes"><table><thead><tr><th>O quê</th><th class="r">Valor</th><th class="r">Diferença para a NF</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
    if(c.precos.length){
      var variasNf=nfs.length>1;
      s+='<div class="sub-t">Preço × tabela vigente na emissão da NF</div><div class="tabela cartoes"><table><thead><tr><th>Produto</th>'+(variasNf?'<th>NF</th>':'')+'<th class="r">Preço na NF</th><th class="r">Tabela</th><th>Tabela desde</th><th class="r">Quantidade</th><th class="r">Diferença</th></tr></thead><tbody>'+
        c.precos.map(function(x){return '<tr><td class="c1">'+esc(x.produto)+'</td>'+(variasNf?'<td class="cl num"><span class="rot-m">NF </span>'+esc(x.nf)+'</td>':'')+'<td class="cl r num"><span class="rot-m">Preço na NF </span>'+D.R(x.unit)+'</td><td class="cl r num"><span class="rot-m">Tabela </span>'+D.R(x.tabela)+'</td><td class="cl num"><span class="rot-m">Tabela desde </span>'+D.dt(x.vigDe)+'</td><td class="cl r num"><span class="rot-m">Quantidade </span>'+qtd(x.qtd)+'</td><td class="c2 r num"><b class="vermelho">'+D.R(x.dif)+'</b></td></tr>'}).join('')+'</tbody></table></div>';
    }
    var fora=it.itens.filter(function(t){return /^Item na NF fora da tabela/.test(t)}).map(function(t){return t.replace(/^Item na NF fora da tabela:\s*/,'')});
    if(fora.length) s+='<div class="sub-t">Itens da NF que não estão na tabela de produtos</div><div class="cp"><ul class="lista-simples">'+fora.map(function(t){return '<li class="vermelho">'+esc(t)+'</li>'}).join('')+'</ul></div>';
    if(c.avisos.length) s+='<div class="sub-t">Avisos (não são diferença)</div><div class="cp"><ul class="lista-simples">'+c.avisos.map(function(t){return '<li class="fraco">'+esc(t)+'</li>'}).join('')+'</ul></div>';
  } else {
    s+='<div class="tabela cartoes"><table><thead><tr><th>Campo</th><th>No sistema (quando chegou o PV)</th><th>No pedido de venda</th><th>Hoje no sistema</th><th>Hoje</th></tr></thead><tbody>'+
      (c.linhas.length?c.linhas.map(function(x){return '<tr><td class="c1">'+esc(x.campo)+'</td><td class="cl"><span class="rot-m">No sistema (quando chegou o PV) </span>'+esc(x.antes)+'</td><td class="cl"><span class="rot-m">No pedido de venda </span>'+esc(x.pv)+'</td>'+
        '<td class="cl'+(x.hoje==null?' vz':'')+'"><span class="rot-m">Hoje no sistema </span>'+(x.hoje==null?'<span class="fraco">—</span>':esc(x.hoje))+'</td><td class="c2">'+(x.igual===null?'<span class="fraco">sem este dado no sistema novo</span>':(x.igual?'<span class="ok">Igual ao PV</span>':'<span class="nao">Diferente</span>'))+'</td></tr>'}).join(''):'<tr><td colspan="5" class="vazio">Sem campos comparados.</td></tr>')+'</tbody></table></div>';
    if(d.outras.length) s+='<div class="sub-t">Outras observações do pedido de venda</div><div class="cp"><ul class="lista-simples">'+d.outras.map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ul></div>';
  }
  h+=D.secao('nt-lado',it.tipo==='nf'?'Pedido × nota fiscal':'Pedido × pedido de venda',D.plural(it.itens.length,'diferença','diferenças'),'',s);
  // ----- documentos
  var abre=function(a,rot){return a?(a.abre?'<button type="button" class="link" data-abrir="'+esc(a.id)+'">'+rot+'</button>':rot+' <span class="fraco">(no sistema antigo)</span>'):''};
  var docs=d.documentos.nfs.map(function(n){var a=[abre(n.danfe,'DANFE'),abre(n.xml,'XML')].filter(Boolean).join(' · ');return '<li><span class="nm">NF '+esc(n.num)+(n.canc?' '+D.tag(['Cancelada','n']):'')+'</span><span class="mt">'+(a||'<span class="fraco">sem arquivo</span>')+'</span></li>'}).join('')+
    d.documentos.pv.map(function(a){return '<li><span class="nm">'+esc(a.nome)+'</span><span class="mt">'+abre(a,'Pedido de venda')+'</span></li>'}).join('');
  if(it.tipo==='pv'&&c.arquivo&&!d.documentos.pv.some(function(a){return a.nome===c.arquivo})) docs+='<li><span class="nm">'+esc(c.arquivo)+'</span><span class="mt">pedido de venda <span class="fraco">(no sistema antigo)</span></span></li>';
  h+=D.secao('nt-docs','Documentos','','',docs?'<ul class="arqs">'+docs+'</ul>':'<div class="cp"><span class="fraco">Nenhum documento ligado.</span></div>');
  // ----- decisão
  var sd='';
  if(aberto&&d.pode_decidir){
    sd='<form id="f-nt-dec" class="cp" novalidate><div class="escolha">'+
      '<label><input type="radio" name="nt-dec" value="aceitar"><span>Aceitar a diferença<small>A diferença fica registrada como aceita, com a justificativa.</small></span><span></span></label>'+
      (it.status!=='cobrar_lab'?'<label><input type="radio" name="nt-dec" value="cobrar"><span>Cobrar o laboratório<small>O item continua aberto, com o laboratório, até a correção.</small></span><span></span></label>':'')+
      '<label><input type="radio" name="nt-dec" value="corrigido"><span>Corrigido<small>'+(it.tipo==='nf'?'O sistema confere de novo e só fecha se a diferença sumiu.':'Os dados do pedido foram corrigidos.')+'</small></span><span></span></label></div>'+
      D.campoD('Justificativa','<textarea class="ent" id="nt-just" maxlength="500" placeholder="Ex.: o laboratório confirmou por e-mail que a bonificação veio a mais"></textarea>')+
      '<div id="dlg-erro"></div><div class="acoes-f"><button type="submit" class="botao" id="nt-gravar">Gravar decisão</button>'+(prox?'<button type="button" class="botao sec" id="nt-gravar-prox">Gravar e ir para a próxima</button>':'')+'</div></form>';
  } else if(!aberto){
    sd='<div class="cp"><dl class="kv kv3">'+D.kvi('Justificativa',esc(it.justificativa||'—'))+D.kvi('Decidido por',esc(it.decidido_por||'—'))+D.kvi('Quando',D.dtHora(it.decidido_em))+'</dl>'+
      (d.pode_reabrir&&(it.status==='aceita'||it.status==='corrigida')?'<form id="f-nt-reabrir" novalidate>'+D.campoD('Justificativa para reabrir','<textarea class="ent" id="nt-just-r" maxlength="500"></textarea>')+'<div id="dlg-erro"></div><div class="acoes-f"><button type="submit" class="botao sec">Reabrir</button></div></form>':'')+'</div>';
  } else sd='<div class="cp"><span class="fraco">Seu acesso não decide divergências.</span></div>';
  h+=D.secao('nt-decisao','Decisão','','',sd);
  // ----- histórico
  var ev=d.historico;
  h+=D.secao('nt-hist','Histórico',D.plural(ev.length,'registro','registros'),'',ev.length?'<ul class="hist">'+ev.map(function(x){return '<li><span class="q">'+D.dtHora(x.em)+'</span><span class="t">'+esc(x.texto)+(x.justificativa?' — '+esc(x.justificativa):'')+'</span><span class="o">'+esc(x.por)+'</span></li>'}).join('')+'</ul>':'<div class="cp"><span class="fraco">Nenhum registro.</span></div>');
  return h;
}
async function abrirItem(id,sem){
  D.estado.tela='divergencia'; D.estado.menu='notas'; D.marcaMenu();
  if(!sem) D.navega('#divergencia/'+id);
  $('#tela').innerHTML='<p class="vazio">Carregando…</p>'; window.scrollTo(0,0);
  try{
    if(!est.dados){try{est.dados=await D.api('notas_lista',{tipo:est.tipo,status:est.status,unidade_id:D.estado.unidade,lab:est.lab});est.ordem=filtrada().map(function(x){return x.id})}catch(y){}}
    est.item=await D.api('notas_item',{divergencia_id:id});
    if(D.estado.tela==='divergencia'){$('#tela').innerHTML=ficha(est.item);var h=$('#tela h1');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true})}}
  }catch(x){if(x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
}
async function decidir(depois){
  var r=$('input[name=nt-dec]:checked'), j=$('#nt-just').value.trim();
  if(!r) return D.erroDlg('Escolha a decisão.');
  if(j.length<5) return D.erroDlg('Escreva a justificativa (pelo menos 5 letras).');
  var bt=$('#nt-gravar'); bt.disabled=true; bt.textContent='Gravando…';
  try{
    var x=await D.api('notas_decidir',{divergencia_id:est.item.item.id,decisao:r.value,justificativa:j});
    D.avisar(x.mensagem);
    var prox=proximaId(), atual=est.item.item.id;
    if(est.dados) est.dados.itens.forEach(function(y){if(y.id===atual){y.status=x.status;y.dono=x.status==='cobrar_lab'?'laboratorio':(x.status==='aberta'?'operacoes':null)}});
    if(depois&&prox) abrirItem(prox); else abrirItem(atual,true);
  }catch(e){bt.disabled=false;bt.textContent='Gravar decisão';D.erroDlg(e)}
}

/* ---------- registro na casca ---------- */
M.telas.notas={render:redesenha,abrir:function(){abrirLista()}};
M.rotas.push([/^divergencia\/([0-9a-f-]{36})$/i,function(m,sem){abrirItem(m[1],sem)}]);
M.cliques.push(function(b){
  if(b.dataset.div){abrirItem(b.dataset.div);return true}
  if(b.id==='nt-prox'){var p=proximaId();if(p)abrirItem(p);return true}
  if(b.id==='nt-gravar-prox'){decidir(true);return true}
  if(b.id==='nt-limpar'){est.tipo='';est.status='abertas';est.dono='';est.lab='';est.busca='';carregar();return true}
  if(b.id==='nt-recalc'){b.disabled=true;b.textContent='Recalculando…';D.api('notas_recalcular').then(function(r){D.avisar(r.mensagem);carregar()}).catch(function(x){b.disabled=false;b.textContent='Recalcular conferência';D.avisar(x.message)});return true}
  return false;
});
M.envios.push(function(e){
  if(e.target.id==='f-nt-dec'){e.preventDefault();decidir(false);return true}
  if(e.target.id==='f-nt-reabrir'){e.preventDefault();var j=$('#nt-just-r').value.trim();if(j.length<5){D.erroDlg('Escreva a justificativa (pelo menos 5 letras).');return true}
    D.api('notas_decidir',{divergencia_id:est.item.item.id,decisao:'reabrir',justificativa:j}).then(function(x){D.avisar(x.mensagem);abrirItem(est.item.item.id,true)}).catch(function(x){D.erroDlg(x)});return true}
  return false;
});
M.mudancas.push(function(t){
  if(t.id==='nt-tipo'){est.tipo=t.value;carregar()}
  else if(t.id==='nt-st'){est.status=t.value;carregar()}
  else if(t.id==='nt-lab'){est.lab=t.value;carregar()}
  else if(t.id==='nt-dono'){est.dono=t.value;est.ordem=filtrada().map(function(x){return x.id});redesenha()}
});
var tB;
document.addEventListener('input',function(e){if(e.target.id==='nt-busca'){est.busca=e.target.value;clearTimeout(tB);tB=setTimeout(function(){var pos=e.target.selectionStart;est.ordem=filtrada().map(function(x){return x.id});redesenha();var n=$('#nt-busca');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}},250)}});
document.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('tr.lp[data-div]')){e.preventDefault();abrirItem(e.target.dataset.div)}});
})();
