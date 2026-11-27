/* Laboratórios › Receitas do mês e Termos (módulo em arquivo próprio, carregado pela casca).
   Regra do dia 01 migrada como está; aqui só por botão "Gerar receitas do mês" (sem rotina agendada).
   Fluxo: Rascunho → Gerada → Enviada ao RT (só marca; o sistema não envia e-mail). */
(function(){
"use strict";
var D=window.DH, M=D.MOD, $=function(s,r){return (r||document).querySelector(s)}, esc=D.esc;
var ST={rascunho:['Rascunho','n'],gerada:['Gerada','i'],enviada_rt:['Enviada ao RT','s'],cancelada:['Cancelada','n']};
var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
function nomeMes(m){var p=String(m||'').split('-');return p.length<2?m:MESES[+p[1]-1]+'/'+p[0]}
function somaMes(m,n){var p=m.split('-'),d=new Date(Date.UTC(+p[0],+p[1]-1+n,1));return d.toISOString().slice(0,7)}
function qtd(v){return v==null?'—':Number(v).toLocaleString('pt-BR')}
var est={mes:'',sit:'',dados:null,ficha:null,termos:null,gerar:null};

/* ---------- lista ---------- */
function telaLista(){
  var d=est.dados, eu=D.eu()||{};
  var mes=est.mes||(d&&d.mes)||D.hoje().slice(0,7);
  var ac=eu.receitas_gravar?'<button type="button" class="btn pri" id="rec-gerar">Gerar receitas do mês</button>':'';
  var linha='';
  if(d){var c=d.contagem||{};linha=D.plural(d.receitas.length,'receita','receitas')+' de '+nomeMes(mes)+Object.keys(ST).filter(function(k){return c[k]}).map(function(k){return ' · '+ST[k][0]+': '+c[k]}).join('')+(D.escopoTxt()?' · '+D.escopoTxt():'')}
  var h=D.titulo('Receitas do mês',ac,linha);
  var meses=[];[somaMes(D.hoje().slice(0,7),1),D.hoje().slice(0,7)].concat((d&&d.meses)||[]).forEach(function(m){if(meses.indexOf(m)<0)meses.push(m)});
  meses.sort().reverse();
  h+='<div class="filtros">'+D.campo('Mês','<select class="sel" id="rec-mes">'+meses.map(function(m){return D.opt(m,nomeMes(m),mes)}).join('')+'</select>')+
    D.campo('Situação','<select class="sel" id="rec-sit">'+D.opt('','Todas',est.sit)+Object.keys(ST).map(function(k){return D.opt(k,ST[k][0],est.sit)}).join('')+'</select>')+'</div>';
  if(!d) return h+'<div class="tabela"><div class="vazio">Carregando as receitas…</div></div>';
  var l=d.receitas.filter(function(r){return (!est.sit||r.status===est.sit)&&(!D.estado.unidade||r.unidade_id===D.estado.unidade)});
  h+='<div class="tabela cartoes"><table><thead><tr><th>Unidade</th><th>Situação</th><th>Quem assina</th><th class="r">Produtos</th><th class="r">Total (unid.)</th><th>Ajustes</th></tr></thead><tbody>';
  if(!l.length) h+='<tr><td colspan="6" class="vazio">'+(d.receitas.length?'Nenhuma receita com esses filtros.':'Nenhuma receita de '+esc(nomeMes(mes))+'. '+(eu.receitas_gravar?'Use “Gerar receitas do mês”.':''))+'</td></tr>';
  l.forEach(function(r){
    var quem=r.prescritor?esc(r.prescritor):(r.rt_termo?'<span class="fraco">RT do termo: '+esc(r.rt_termo)+'</span>':'<span class="nao">sem termo com o laboratório</span>');
    h+='<tr class="lp" data-rec="'+esc(r.id)+'" tabindex="0"><td class="c1"><b>'+esc(r.unidade)+'</b>'+(r.legado?'<span class="sub2">veio do sistema antigo</span>':'')+'</td>'+
      '<td class="c2">'+D.tag(ST[r.status]||[r.status,'n'])+'</td>'+
      '<td class="cl"><span class="rot-m">Assina </span>'+quem+'</td>'+
      '<td class="cl r num"><span class="rot-m">Produtos </span>'+(r.itens||(r.sem_pedidos?'<span class="fraco">sem pedidos no período</span>':'0'))+'</td>'+
      '<td class="cl r num"><span class="rot-m">Total </span>'+qtd(r.total)+'</td>'+
      '<td class="cl">'+(r.ajustados?D.plural(r.ajustados,'produto ajustado','produtos ajustados'):'<span class="fraco">nenhum</span>')+'</td></tr>';
  });
  return h+'</tbody></table></div>';
}
async function carregarLista(){
  est.dados=null; if(D.estado.tela==='receitas') $('#tela').innerHTML=telaLista();
  try{var d=await D.api('receitas',{mes:est.mes||undefined});est.dados=d;if(!est.mes)est.mes=d.mes;if(D.estado.tela==='receitas')$('#tela').innerHTML=telaLista()}
  catch(x){if(D.estado.tela==='receitas'&&x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
}

/* ---------- ficha ---------- */
function ficha(d){
  var r=d.receita, pode=d.pode_gravar, edita=pode&&(r.status==='rascunho'||r.status==='gerada');
  var h='<nav class="migalha" aria-label="Caminho"><button type="button" data-ir="receitas">Receitas do mês</button><span aria-hidden="true">›</span><span>Ficha da receita</span></nav>';
  var acs='';
  if(edita) acs+='<button type="button" class="btn" id="rec-ajustar">Ajustar quantidades</button>';
  if(pode&&r.status==='rascunho') acs+='<button type="button" class="btn pri" id="rec-st" data-para="gerada">Marcar como gerada</button>';
  if(pode&&r.status==='gerada') acs+='<button type="button" class="btn pri" id="rec-st" data-para="enviada_rt">Marcar como enviada ao RT</button>';
  acs+='<button type="button" class="btn" id="rec-pedido" aria-disabled="true" title="Fica para a próxima etapa">Criar pedido <span class="selo n">em breve</span></button>';
  var se=r.status_em||{}, datas=['rascunho','gerada','enviada_rt'].filter(function(k){return se[k]}).map(function(k){return ST[k][0]+' '+D.dt(se[k])}).join(' · ');
  var quem=r.prescritor?esc(r.prescritor):(d.rt_termo?'<span class="fraco">ainda não definido — ao gerar, assina o RT do termo</span>':'<span class="nao">sem termo com o laboratório</span>');
  h+='<section class="fcab"><div class="l1"><h1>Receita de '+esc(nomeMes(r.mes))+'</h1>'+D.tag(ST[r.status]||[r.status,'n'])+'<div class="ac">'+acs+'</div></div>'+
    '<dl class="kv">'+D.kvi('Unidade',esc(r.unidade))+D.kvi('Laboratório',esc(r.lab_nome))+D.kvi('Quem assina',quem)+D.kvi('Protocolo',esc(r.protocolo||'—'))+'</dl>'+
    (datas?'<div><span class="nota">Situação: '+esc(datas)+(r.emitida_em&&!datas.includes(D.dt(r.emitida_em))?' · emitida '+D.dt(r.emitida_em):'')+'</span></div>':'')+'</section>';
  var falta=[];
  if(!r.prescritor&&d.rt_termo) falta.push('Ao marcar como gerada, quem assina será o RT do termo: '+esc(d.rt_termo.nome)+' (termo de '+D.dt(d.rt_termo.de)+').');
  if(!r.prescritor&&!d.rt_termo) falta.push('A unidade não tem termo vigente com o laboratório: cadastre o termo antes de gerar (só o RT do termo pode assinar).');
  if(falta.length) h+='<section class="falta" aria-label="O que falta"><h2>O que falta</h2><ul>'+falta.map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul></section>';
  // itens
  var it=d.itens;
  var sIt=it.length?'<div class="tabela cartoes"><table><thead><tr><th>Produto</th><th class="r">Calculado</th><th class="r">Média por mês</th><th class="r">Quantidade</th><th>Ajuste</th></tr></thead><tbody>'+
    it.map(function(x){return '<tr><td class="c1">'+esc(x.descricao)+'</td><td class="cl r num"><span class="rot-m">Calculado </span>'+qtd(x.calc)+'</td><td class="cl r num"><span class="rot-m">Média </span>'+qtd(x.media)+'</td>'+
      '<td class="c2 r num"><b>'+qtd(x.qtd)+'</b></td><td class="cl">'+(x.ajustado?'<span class="selo a">ajustado</span> '+esc(x.ajuste_justificativa||'')+(x.ajustado_por?' <span class="fraco">('+esc(x.ajustado_por)+')</span>':''):'<span class="fraco">igual ao cálculo</span>')+'</td></tr>'}).join('')+
    '</tbody><tfoot><tr><td colspan="3" class="c1">Total</td><td class="c2 r num">'+qtd(it.reduce(function(t,x){return t+(x.qtd||0)},0))+'</td><td></td></tr></tfoot></table></div>'
    :'<div class="cp"><span class="fraco">Nenhum produto. A unidade não teve pedido com itens no período do cálculo.</span></div>';
  // cálculo
  var c=r.calculo||{}, per=c.periodo||{};
  var sCalc='<div class="cp"><dl class="kv kv3">'+D.kvi('Período',per.de?D.dt(per.de)+' a '+D.dt(per.ate):'—')+D.kvi('Meses com pedido com itens',(c.mesesComDados||0)+' de '+(c.janelaMeses||'—'))+
    D.kvi('Pedidos no período',String(c.pedidos||0)+((c.pedidosSemItens||[]).length?' ('+c.pedidosSemItens.length+' sem itens)':''))+'</dl>'+
    '<span class="nota">Regra do sistema antigo: soma dos itens dos pedidos não cancelados do período, dividida pelos meses em que houve pedido com itens, arredondada para cima em múltiplos de 50; Minoxidil 2% conta como 0,5% e Complexo como Pill food. Ajustes feitos à mão não são sobrescritos ao gerar de novo.</span></div>';
  // do sistema antigo (só o que não aparece acima)
  var L=r.legado, sAnt='';
  if(L){var cam=[];var a=L.assinante;
    if(a&&(a.nome||a.crbm)&&!(r.prescritor&&a.nome===r.prescritor)) cam.push(['Assinante no sistema antigo',esc([a.nome,a.crbm].filter(Boolean).join(' · '))+(r.prescritor?'':' <span class="fraco">(não ligado: sem registro no conselho reconhecido)</span>')]);
    if(L.statusEm&&L.statusEm.Assinada) cam.push(['Assinada (sistema antigo)',D.dt(L.statusEm.Assinada)]);
    if(L.interno) cam.push(['Nº de pedido do antigo',esc(L.interno)+(L.internoEm?' em '+D.dt(L.internoEm):'')]);
    if(cam.length) sAnt='<div class="cp"><dl class="kv kv3">'+cam.map(function(x){return D.kvi(x[0],x[1])}).join('')+'</dl></div>';
  }
  var ev=d.historico||[];
  var sHist=ev.length?'<ul class="hist">'+ev.map(function(x){return '<li><span class="q">'+D.dtHora(x.em)+'</span><span class="t">'+esc(x.texto)+'</span><span class="o">'+esc(x.por)+'</span></li>'}).join('')+'</ul>':'<div class="cp"><span class="fraco">Nenhuma alteração registrada no sistema novo.</span></div>';
  if(r.legado_ref) sHist+='<div class="cp"><span class="nota">A carga vinda do sistema antigo não aparece como alteração.</span></div>';
  h+=D.secao('rec-itens','Produtos',D.plural(it.filter(function(x){return x.qtd>0}).length,'produto','produtos'),'',sIt);
  h+=D.secao('rec-calc','Cálculo','','',sCalc);
  if(sAnt) h+=D.secao('rec-antigo','Do sistema antigo','somente leitura','',sAnt);
  h+=D.secao('rec-hist','Histórico',D.plural(ev.length,'registro','registros'),'',sHist);
  return h;
}
async function abrirFicha(id,semHist){
  D.estado.tela='receita'; D.estado.menu='receitas'; D.marcaMenu();
  if(!semHist) D.navega('#receita/'+id);
  $('#tela').innerHTML='<p class="vazio">Carregando a receita…</p>'; window.scrollTo(0,0);
  try{est.ficha=await D.api('receita',{receita_id:id});if(D.estado.tela==='receita')$('#tela').innerHTML=ficha(est.ficha)}
  catch(x){if(x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
}

/* ---------- gerar ---------- */
function abrirGerar(){
  var mes=est.mes||D.hoje().slice(0,7), ms=[somaMes(D.hoje().slice(0,7),1),D.hoje().slice(0,7),somaMes(D.hoje().slice(0,7),-1)];
  if(ms.indexOf(mes)<0) ms.push(mes);
  D.abrirDlg('Gerar receitas do mês','<form id="f-rec-gerar" novalidate><div class="dlg-corpo"><p class="fraco" style="margin:0 0 10px">Calcula a receita de cada unidade pela regra do sistema antigo e cria em <b>rascunho</b>. Receitas já geradas ou enviadas ao RT não são mexidas; nos rascunhos, os ajustes feitos à mão são mantidos. Primeiro o sistema mostra o que vai fazer.</p>'+
    D.campoD('Mês da receita','<select class="ent" id="rg-mes">'+ms.map(function(m){return D.opt(m,nomeMes(m),mes)}).join('')+'</select>')+'<div id="rg-prev"></div>'+
    '<div id="dlg-erro"></div></div><div class="dlg-pe"><button type="button" class="botao sec" id="dlg-cancela">Cancelar</button><button type="submit" class="botao" id="rg-ok">Ver o que será feito</button></div></form>');
  est.gerar=null;
}
async function enviarGerar(e){
  e.preventDefault();
  var bt=$('#rg-ok'), mes=$('#rg-mes').value, t=bt.textContent; bt.disabled=true; bt.textContent='Calculando…';
  try{
    if(!est.gerar||est.gerar.mes!==mes){
      var r=await D.api('gerar_receitas',{mes:mes,simular:true}); est.gerar=r;
      var l=r.unidades||[];
      $('#rg-prev').innerHTML='<div class="alerta"><b>'+esc(nomeMes(r.mes))+':</b> '+D.plural(r.criadas,'receita nova','receitas novas')+' em rascunho, '+D.plural(r.atualizadas,'rascunho recalculado','rascunhos recalculados')+', '+D.plural(r.ignoradas,'já gerada ou enviada (não muda)','já geradas ou enviadas (não mudam)')+'. Período do cálculo: '+D.dt(r.periodo.de)+' a '+D.dt(r.periodo.ate)+'.</div>'+
        '<ul class="arqs">'+l.filter(function(x){return x.acao!=='ignorada (gerada)'&&x.acao!=='ignorada (enviada_rt)'}).map(function(x){return '<li><span class="nm">'+esc(x.unidade)+'</span><span class="mt">'+esc(x.acao)+' · '+D.plural(Object.keys(x.itens||{}).length,'produto','produtos')+' · '+D.plural(x.pedidos,'pedido','pedidos')+'</span></li>'}).join('')+'</ul>';
      bt.disabled=!(r.criadas||r.atualizadas); bt.textContent=(r.criadas||r.atualizadas)?'Gerar agora':'Nada a gerar'; return;
    }
    bt.textContent='Gerando…';
    var g=await D.api('gerar_receitas',{mes:mes,simular:false});
    D.fecharDlg(); D.avisar(g.mensagem||'Receitas geradas.'); est.mes=mes; carregarLista();
  }catch(x){bt.disabled=false;bt.textContent=t;D.erroDlg(x)}
}

/* ---------- ajustar ---------- */
function abrirAjustar(){
  var d=est.ficha, it=d.itens, tem={};
  it.forEach(function(x){tem[x.produto_id]=1});
  var linhas=it.map(function(x){return '<tr><td>'+esc(x.descricao)+'<span class="sub2">calculado: '+qtd(x.calc)+'</span></td><td class="r"><input class="ent num aj-q" data-prod="'+esc(x.produto_id)+'" inputmode="numeric" value="'+esc(String(x.qtd))+'" aria-label="Quantidade de '+esc(x.descricao)+'"></td></tr>'}).join('');
  var outros=d.produtos.filter(function(p){return !tem[p.id]});
  D.abrirDlg('Ajustar quantidades — '+d.receita.unidade,'<form id="f-rec-aj" novalidate><div class="dlg-corpo"><p class="fraco" style="margin:0 0 10px">O ajuste fica registrado com a justificativa e o seu e-mail. Gerar de novo não desfaz o ajuste.</p>'+
    '<table class="t itens-ed"><thead><tr><th>Produto</th><th class="r">Quantidade</th></tr></thead><tbody id="aj-corpo">'+linhas+'</tbody></table>'+
    (outros.length?D.campoD('Incluir produto','<select class="ent" id="aj-novo">'+D.opt('','— escolha —','')+outros.map(function(p){return D.opt(p.id,p.descricao,'')}).join('')+'</select>','opcional'):'')+
    D.campoD('Justificativa','<textarea class="ent" id="aj-just" maxlength="500" placeholder="Ex.: unidade pediu reduzir fator porque o estoque está alto"></textarea>')+D.rodapeDlg('Salvar ajuste'));
  $('#dlg .dlg').classList.add('larga');
}
function enviarAjustar(e){
  e.preventDefault();
  var itens=[],erro='';
  document.querySelectorAll('#aj-corpo .aj-q').forEach(function(i){var v=D.numBR(i.value);if(isNaN(v)||v<0)erro='Quantidade inválida.';itens.push({produto_id:i.dataset.prod,qtd:v})});
  if(erro) return D.erroDlg(erro);
  var j=$('#aj-just').value.trim(); if(j.length<5) return D.erroDlg('Escreva a justificativa (pelo menos 5 letras).');
  var bt=$('#f-rec-aj button[type=submit]'); bt.disabled=true; bt.textContent='Gravando…';
  D.api('ajustar_receita',{receita_id:est.ficha.receita.id,itens:itens,justificativa:j}).then(function(r){D.fecharDlg();D.avisar(r.mensagem);abrirFicha(est.ficha.receita.id,true)})
   .catch(function(x){bt.disabled=false;bt.textContent='Salvar ajuste';D.erroDlg(x)});
}

/* ---------- termos ---------- */
function telaTermos(){
  var d=est.termos;
  var h=D.titulo('Termos de responsabilidade','',d?D.plural(d.termos.length,'termo vigente','termos vigentes')+' · '+D.plural(d.sem_termo.length,'unidade sem termo','unidades sem termo'):'');
  if(!d) return h+'<div class="tabela"><div class="vazio">Carregando os termos…</div></div>';
  var l=d.termos.filter(function(t){return !D.estado.unidade||t.unidade_id===D.estado.unidade});
  h+='<div class="tabela cartoes"><table><thead><tr><th>Unidade</th><th>Laboratório</th><th>RT do termo</th><th>Desde</th><th>Arquivo</th></tr></thead><tbody>';
  if(!l.length) h+='<tr><td colspan="5" class="vazio">Nenhum termo.</td></tr>';
  l.forEach(function(t){h+='<tr><td class="c1"><b>'+esc(t.unidade)+'</b></td><td class="c2">'+esc(t.lab==='CP'?'Centro Paulista':t.lab_nome)+'</td><td class="cl"><span class="rot-m">RT </span>'+esc(t.rt)+(t.registro?'<span class="sub2">'+esc(t.registro)+'</span>':'<span class="sub2 vermelho">registro não informado</span>')+'</td>'+
    '<td class="cl num"><span class="rot-m">Desde </span>'+D.dt(t.de)+(t.ate?' a '+D.dt(t.ate):'')+'</td><td class="cl">'+(t.arquivo_local==='sistema_antigo'?'<span class="fraco">no sistema antigo</span>':'')+(t.arquivo_nome?'<span class="sub2">'+esc(t.arquivo_nome)+'</span>':'')+'</td></tr>'});
  h+='</tbody></table></div>';
  var sem=d.sem_termo.filter(function(u){return !D.estado.unidade||u.id===D.estado.unidade});
  if(sem.length) h+='<section class="sec"><div class="sh"><h2>Unidades sem termo vigente</h2><span class="q">sem termo, a receita não tem quem assine</span></div><div class="cp"><span>'+sem.map(function(u){return esc(u.nome)}).join(', ')+'</span></div></section>';
  h+='<p class="nota">Os arquivos dos termos continuam no sistema antigo até a cópia dos arquivos.</p>';
  return h;
}
async function carregarTermos(){
  est.termos=null; if(D.estado.tela==='termos') $('#tela').innerHTML=telaTermos();
  try{est.termos=await D.api('termos');if(D.estado.tela==='termos')$('#tela').innerHTML=telaTermos()}
  catch(x){if(D.estado.tela==='termos'&&x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
}

/* ---------- registro na casca ---------- */
M.telas.receitas={render:function(){$('#tela').innerHTML=telaLista()},abrir:function(){carregarLista()}};
M.telas.termos={render:function(){$('#tela').innerHTML=telaTermos()},abrir:function(){carregarTermos()}};
M.rotas.push([/^receita\/([0-9a-f-]{36})$/i,function(m,sem){abrirFicha(m[1],sem)}]);
M.cliques.push(function(b){
  if(b.dataset.rec){abrirFicha(b.dataset.rec);return true}
  if(b.id==='rec-gerar'){abrirGerar();return true}
  if(b.id==='rec-ajustar'){abrirAjustar();return true}
  if(b.id==='rec-pedido'){D.avisar('Criar pedido a partir da receita fica para a próxima etapa.');return true}
  if(b.id==='rec-st'){var para=b.dataset.para,txt=para==='gerada'?'Marcar a receita como gerada?':'Marcar como enviada ao RT? (o sistema não envia e-mail: só registra a data)';
    if(!confirm(txt))return true;
    b.disabled=true;D.api('receita_status',{receita_id:est.ficha.receita.id,para:para}).then(function(r){D.avisar(r.mensagem);abrirFicha(est.ficha.receita.id,true)}).catch(function(x){b.disabled=false;D.avisar(x.message)});return true}
  return false;
});
M.envios.push(function(e){if(e.target.id==='f-rec-gerar'){enviarGerar(e);return true}if(e.target.id==='f-rec-aj'){enviarAjustar(e);return true}return false});
M.mudancas.push(function(t){
  if(t.id==='rec-mes'){est.mes=t.value;carregarLista()}
  else if(t.id==='rec-sit'){est.sit=t.value;$('#tela').innerHTML=telaLista()}
  else if(t.id==='rg-mes'){est.gerar=null;var b=$('#rg-ok');if(b){b.disabled=false;b.textContent='Ver o que será feito'}$('#rg-prev').innerHTML=''}
  else if(t.id==='aj-novo'&&t.value){var o=t.selectedOptions[0];$('#aj-corpo').insertAdjacentHTML('beforeend','<tr><td>'+esc(o.textContent)+'<span class="sub2">incluído no ajuste</span></td><td class="r"><input class="ent num aj-q" data-prod="'+esc(t.value)+'" inputmode="numeric" value="0"></td></tr>');o.remove();t.value=''}
});
document.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('tr.lp[data-rec]')){e.preventDefault();abrirFicha(e.target.dataset.rec)}});
})();
