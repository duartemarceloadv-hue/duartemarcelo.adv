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
var est={mes:'',sit:'',orig:'',ass:'',marc:{},dados:null,ficha:null,termos:null,gerar:null,gOpc:null,tLab:'',tReg:''};
// quem assina: definido na receita, RT do termo (definido ao gerar) ou sem termo
var ASS={definido:'Definido na receita',rt:'RT do termo (ao gerar)',semtermo:'Sem termo com o laboratório'};
function assDe(r){return r.prescritor?'definido':(r.rt_termo?'rt':'semtermo')}
function podeGerar(){var d=est.dados,eu=D.eu()||{};return !!(d&&(d.pode_gerar!==undefined?d.pode_gerar:(eu.receitas_gravar&&eu.todas!==false)))}
// linhas da lista: receitas do mês + unidades ativas ainda sem receita no mês
function linhas(){
  var d=est.dados; if(!d) return [];
  return d.receitas.concat((d.sem_receita||[]).map(function(u){return {sem:true,id:'',unidade_id:u.unidade_id,unidade:u.unidade,status:'sem',rt_termo:u.rt_termo,prescritor:null}}));
}
// só rascunho ou unidade sem receita pode ser gerada de novo; gerada/enviada ao RT não muda
function marcavel(r){return podeGerar()&&(r.sem||r.status==='rascunho')}
function marcadas(){return linhas().filter(function(r){return marcavel(r)&&est.marc[r.unidade_id]})}

/* ---------- lista ---------- */
function telaLista(){
  var d=est.dados, pg=podeGerar();
  var mes=est.mes||(d&&d.mes)||D.hoje().slice(0,7);
  var ac=pg||(D.eu()||{}).receitas_gravar?'<button type="button" class="btn pri" id="rec-gerar">Gerar receitas do mês</button>':'';
  var linha='';
  if(d){var c=d.contagem||{},ns=(d.sem_receita||[]).filter(function(u){return !D.estado.unidade||u.unidade_id===D.estado.unidade}).length;
    linha=D.plural(d.receitas.length,'receita','receitas')+' de '+nomeMes(mes)+Object.keys(ST).filter(function(k){return c[k]}).map(function(k){return ' · '+ST[k][0]+': '+c[k]}).join('')+(ns?' · '+D.plural(ns,'unidade sem receita','unidades sem receita'):'')+(D.escopoTxt()?' · '+D.escopoTxt():'')}
  var h=D.titulo('Receitas do mês',ac,linha);
  var meses=[];[somaMes(D.hoje().slice(0,7),1),D.hoje().slice(0,7)].concat((d&&d.meses)||[]).forEach(function(m){if(meses.indexOf(m)<0)meses.push(m)});
  meses.sort().reverse();
  var l=linhas().filter(function(r){
    if(D.estado.unidade&&r.unidade_id!==D.estado.unidade) return false;
    if(est.sit&&r.status!==est.sit) return false;
    if(est.orig&&(r.sem||(est.orig==='antigo')!==!!r.legado)) return false;
    if(est.ass&&assDe(r)!==est.ass) return false;
    return true});
  var lm=l.filter(marcavel), todas=lm.length&&lm.every(function(r){return est.marc[r.unidade_id]});
  h+='<div class="filtros">'+D.campo('Mês','<select class="sel" id="rec-mes">'+meses.map(function(m){return D.opt(m,nomeMes(m),mes)}).join('')+'</select>')+
    D.campo('Situação','<select class="sel" id="rec-sit">'+D.opt('','Todas',est.sit)+Object.keys(ST).map(function(k){return D.opt(k,ST[k][0],est.sit)}).join('')+D.opt('sem','Sem receita no mês',est.sit)+'</select>')+
    D.campo('Origem','<select class="sel" id="rec-orig">'+D.opt('','Todas',est.orig)+D.opt('antigo','Sistema antigo',est.orig)+D.opt('novo','Sistema novo',est.orig)+'</select>')+
    D.campo('Quem assina','<select class="sel" id="rec-ass">'+D.opt('','Todos',est.ass)+Object.keys(ASS).map(function(k){return D.opt(k,ASS[k],est.ass)}).join('')+'</select>')+
    ((est.sit||est.orig||est.ass)?'<button type="button" class="botao sec mini" id="rec-limpar">Limpar filtros</button>':'')+
    (d&&lm.length?'<label class="campo chk"><input type="checkbox" id="rec-todas"'+(todas?' checked':'')+'><span>Marcar todas que podem ser geradas ('+lm.length+')</span></label>':'')+'</div>';
  if(!d) return h+'<div class="tabela"><div class="vazio">Carregando as receitas…</div></div>';
  h+='<div class="tabela cartoes com-sel"><table><thead><tr><th class="sel-c"></th><th>Unidade</th><th>Situação</th><th>Origem</th><th>Quem assina</th><th>Assinatura</th><th class="r">Produtos</th><th class="r">Total (unid.)</th><th>Ajustes</th>'+(pg?'<th>Gerar</th>':'')+'</tr></thead><tbody>';
  if(!l.length) h+='<tr><td colspan="'+(pg?10:9)+'" class="vazio">'+(linhas().length?'Nenhuma receita com esses filtros.':'Nenhuma receita de '+esc(nomeMes(mes))+'. '+(pg?'Use “Gerar receitas do mês”.':''))+'</td></tr>';
  l.forEach(function(r){
    var a=assDe(r), nome=r.prescritor||r.rt_termo, mk=marcavel(r), sem=r.sem;
    h+='<tr'+(sem?'':' class="lp" data-rec="'+esc(r.id)+'" tabindex="0"')+'><td class="sel-c">'+(mk?'<input type="checkbox" data-rec-sel="'+esc(r.unidade_id)+'" aria-label="Marcar '+esc(r.unidade)+'"'+(est.marc[r.unidade_id]?' checked':'')+'>':'')+'</td>'+
      '<td class="c1"><b>'+esc(r.unidade)+'</b></td>'+
      '<td class="c2">'+(sem?D.tag(['Sem receita no mês','a']):D.tag(ST[r.status]||[r.status,'n']))+'</td>'+
      '<td class="cl'+(sem?' vz':'')+'"><span class="rot-m">Origem </span>'+(sem?'<span class="fraco">—</span>':(r.legado?'Sistema antigo':'Sistema novo'))+'</td>'+
      '<td class="cl'+(nome?'':' vz')+'"><span class="rot-m">Quem assina </span>'+(nome?esc(nome):'<span class="fraco">—</span>')+'</td>'+
      '<td class="cl"><span class="rot-m">Assinatura </span>'+(a==='semtermo'?'<span class="nao">'+ASS[a]+'</span>':(a==='rt'?'<span class="fraco">'+ASS[a]+'</span>':ASS[a]))+'</td>'+
      '<td class="cl r num'+(sem?' vz':'')+'"><span class="rot-m">Produtos </span>'+(sem?'<span class="fraco">—</span>':(r.itens||(r.sem_pedidos?'<span class="fraco">sem pedidos no período</span>':'0')))+'</td>'+
      '<td class="cl r num'+(sem?' vz':'')+'"><span class="rot-m">Total </span>'+(sem?'<span class="fraco">—</span>':qtd(r.total))+'</td>'+
      '<td class="cl'+(sem?' vz':'')+'"><span class="rot-m">Ajustes </span>'+(sem?'<span class="fraco">—</span>':(r.ajustados?D.plural(r.ajustados,'produto ajustado','produtos ajustados'):'<span class="fraco">nenhum</span>'))+'</td>'+
      (pg?'<td class="cl'+(mk?'':' vz')+'">'+(mk?'<button type="button" class="botao sec mini" data-rec-un="'+esc(r.unidade_id)+'">'+(sem?'Gerar só esta':'Recalcular só esta')+'</button>':'<span class="fraco">—</span>')+'</td>':'')+'</tr>';
  });
  h+='</tbody></table></div>';
  var mc=marcadas();
  if(mc.length) h+='<div class="lote" id="rec-lote"><span>'+D.plural(mc.length,'unidade marcada','unidades marcadas')+' · '+esc(nomeMes(mes))+'</span><button type="button" class="botao sec mini" id="rec-desmarcar">Desmarcar</button><button type="button" class="botao mini" id="rec-gerar-marc">Gerar as marcadas</button></div>';
  return h;
}
function redesenha(){var y=window.scrollY;$('#tela').innerHTML=telaLista();window.scrollTo(0,y)}
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
  if(pode&&r.status==='rascunho'&&(D.eu()||{}).todas!==false) acs+='<button type="button" class="btn" id="rec-recalc">Recalcular só esta unidade</button>';
  if(pode&&r.status==='rascunho') acs+='<button type="button" class="btn pri" id="rec-st" data-para="gerada">Marcar como gerada</button>';
  if(pode&&r.status==='gerada') acs+='<button type="button" class="btn pri" id="rec-st" data-para="enviada_rt">Marcar como enviada ao RT</button>';
  // pedido a partir da receita: só depois de gerada (assinada pelo RT do termo); os itens vêm do saldo da receita
  if(D.podeCriar&&D.podeCriar()){
    var pronta=r.status==='gerada'||r.status==='enviada_rt';
    acs+=pronta?'<button type="button" class="btn" id="rec-pedido">Criar pedido</button>':'<button type="button" class="btn" id="rec-pedido" aria-disabled="true" title="Marque a receita como gerada antes de criar o pedido">Criar pedido</button>';
  }
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
  var pds=d.pedidos||[];
  if(pds.length) h+=D.secao('rec-pedidos','Pedidos desta receita',D.plural(pds.length,'pedido','pedidos'),'','<ul class="arqs">'+pds.map(function(p){return '<li><span class="nm"><button type="button" class="link" data-p="'+esc(p.id)+'"'+(p.rascunho&&!p.cancelado?' data-rasc="1"':'')+'>'+esc(p.num||'Rascunho')+'</button></span><span class="mt">'+(p.cancelado?'cancelado':(p.rascunho?'rascunho, ainda não enviado':'enviado em '+D.dt(p.enviado_em)))+'</span></li>'}).join('')+'</ul>');
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

/* ---------- gerar (todas, várias ou uma unidade; sempre com prévia antes de gravar) ---------- */
// o: {mes, unidades:[ids], receitaId} — unidades preenchidas = começa em "só as unidades escolhidas"
function abrirGerar(o){
  o=o||{}; est.gOpc=o;
  var mes=o.mes||est.mes||D.hoje().slice(0,7), ms=[somaMes(D.hoje().slice(0,7),1),D.hoje().slice(0,7),somaMes(D.hoje().slice(0,7),-1)];
  if(ms.indexOf(mes)<0) ms.push(mes);
  var esc1=!!(o.unidades&&o.unidades.length), sel={}; (o.unidades||[]).forEach(function(id){sel[id]=1});
  // lista de unidades do cabeçalho + as que vieram marcadas na lista de receitas (se faltarem lá)
  var uns=D.unidades().slice(), nomes={};
  linhas().forEach(function(r){nomes[r.unidade_id]=r.unidade});
  (o.unidades||[]).forEach(function(id){if(!uns.some(function(u){return u.id===id}))uns.push({id:id,nome:nomes[id]||D.nomeUnidade(id)||'Unidade'})});
  uns.sort(function(a,b){return a.nome.localeCompare(b.nome,'pt-BR')});
  var nome1=o.unidades&&o.unidades.length===1?(nomes[o.unidades[0]]||D.nomeUnidade(o.unidades[0])||(est.ficha&&est.ficha.receita.unidade)):'';
  var tit=nome1?'Gerar receita — '+nome1:'Gerar receitas do mês';
  D.abrirDlg(tit,'<form id="f-rec-gerar" novalidate><div class="dlg-corpo"><p class="fraco" style="margin:0 0 10px">Calcula a receita pela regra do sistema antigo e cria em <b>rascunho</b>. Receitas já geradas ou enviadas ao RT não são mexidas; nos rascunhos, os ajustes feitos à mão são mantidos. Primeiro o sistema mostra o que vai fazer.</p>'+
    D.campoD('Mês da receita','<select class="ent" id="rg-mes">'+ms.map(function(m){return D.opt(m,nomeMes(m),mes)}).join('')+'</select>')+
    '<div class="campo"><span>Unidades</span></div><div class="escolha">'+
      '<label><input type="radio" name="rg-esc" value="todas"'+(esc1?'':' checked')+'><span>Todas as unidades</span><span></span></label>'+
      '<label><input type="radio" name="rg-esc" value="escolhidas"'+(esc1?' checked':'')+'><span>Só as unidades escolhidas</span><span class="fraco" id="rg-n"></span></label></div>'+
    '<div class="escolha" id="rg-lista"'+(esc1?'':' hidden')+'>'+uns.map(function(u){return '<label><input type="checkbox" data-rg-un="'+esc(u.id)+'"'+(sel[u.id]?' checked':'')+'><span>'+esc(u.nome)+'</span><span></span></label>'}).join('')+'</div>'+
    '<div id="rg-prev"></div><div id="dlg-erro"></div></div><div class="dlg-pe"><button type="button" class="botao sec" id="dlg-cancela">Cancelar</button><button type="submit" class="botao" id="rg-ok">Ver o que será feito</button></div></form>');
  est.gerar=null; contaEscolhidas();
}
function escolhidas(){
  var r=$('input[name=rg-esc]:checked'); if(!r||r.value!=='escolhidas') return null;
  return [].map.call(document.querySelectorAll('#rg-lista input[data-rg-un]:checked'),function(i){return i.dataset.rgUn});
}
function contaEscolhidas(){var n=$('#rg-n'),l=escolhidas();if(n)n.textContent=l?D.plural(l.length,'escolhida','escolhidas'):''}
function zeraPrevia(){est.gerar=null;var b=$('#rg-ok');if(b){b.disabled=false;b.textContent='Ver o que será feito'}var p=$('#rg-prev');if(p)p.innerHTML='';contaEscolhidas()}
async function enviarGerar(e){
  e.preventDefault();
  var bt=$('#rg-ok'), mes=$('#rg-mes').value, uns=escolhidas(), t=bt.textContent;
  if(uns&&!uns.length) return D.erroDlg('Escolha ao menos uma unidade (ou marque “Todas as unidades”).');
  var chave=mes+'|'+(uns?uns.slice().sort().join(','):'todas'), corpo={mes:mes};
  if(uns) corpo.unidades=uns;
  bt.disabled=true; bt.textContent='Calculando…'; if($('#dlg-erro'))$('#dlg-erro').innerHTML='';
  try{
    if(!est.gerar||est.gerar.chave!==chave){
      var r=await D.api('gerar_receitas',Object.assign({simular:true},corpo)); est.gerar={chave:chave,r:r};
      var l=r.unidades||[];
      var mud=l.filter(function(x){return x.acao!=='ignorada (gerada)'&&x.acao!=='ignorada (enviada_rt)'}), ign=l.filter(function(x){return mud.indexOf(x)<0});
      $('#rg-prev').innerHTML='<div class="alerta"><b>'+esc(nomeMes(r.mes))+(uns?' · '+D.plural(uns.length,'unidade escolhida','unidades escolhidas'):' · todas as unidades')+':</b> '+D.plural(r.criadas,'receita nova','receitas novas')+' em rascunho, '+D.plural(r.atualizadas,'rascunho recalculado','rascunhos recalculados')+', '+D.plural(r.ignoradas,'já gerada ou enviada (não muda)','já geradas ou enviadas (não mudam)')+'. Período do cálculo: '+D.dt(r.periodo.de)+' a '+D.dt(r.periodo.ate)+'.</div>'+
        '<ul class="arqs">'+mud.map(function(x){return '<li><span class="nm">'+esc(x.unidade)+'</span><span class="mt">'+esc(x.acao)+' · '+D.plural(Object.keys(x.itens||{}).length,'produto','produtos')+' · '+D.plural(x.pedidos,'pedido','pedidos')+'</span></li>'}).join('')+
        (uns?ign.map(function(x){return '<li><span class="nm">'+esc(x.unidade)+'</span><span class="mt">'+esc(x.acao.replace('enviada_rt','enviada ao RT'))+' · não muda</span></li>'}).join(''):'')+'</ul>';
      bt.disabled=!(r.criadas||r.atualizadas); bt.textContent=(r.criadas||r.atualizadas)?'Gerar agora':'Nada a gerar'; return;
    }
    bt.textContent='Gerando…';
    var g=await D.api('gerar_receitas',Object.assign({simular:false},corpo));
    var o=est.gOpc||{};
    D.fecharDlg(); D.avisar(g.mensagem||'Receitas geradas.'); est.marc={};
    if(o.receitaId&&D.estado.tela==='receita') abrirFicha(o.receitaId,true); else {est.mes=mes; if(D.estado.tela==='receitas') carregarLista(); else D.ir('receitas')}
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
function nomeLab(t){return t.lab==='CP'?'Centro Paulista':t.lab_nome}
function telaTermos(){
  var d=est.termos;
  var h=D.titulo('Termos de responsabilidade','',d?D.plural(d.termos.length,'termo','termos')+' · '+D.plural(d.sem_termo.length,'unidade sem termo vigente','unidades sem termo vigente'):'');
  var labs={}; if(d) d.termos.forEach(function(t){labs[t.lab]=nomeLab(t)});
  h+='<div class="filtros">'+D.campo('Laboratório','<select class="sel" id="t-lab">'+D.opt('','Todos',est.tLab)+Object.keys(labs).map(function(k){return D.opt(k,labs[k],est.tLab)}).join('')+'</select>')+
    D.campo('Registro do RT','<select class="sel" id="t-reg">'+D.opt('','Todos',est.tReg)+D.opt('com','Com registro',est.tReg)+D.opt('sem','Sem registro',est.tReg)+'</select>')+
    ((est.tLab||est.tReg)?'<button type="button" class="botao sec mini" id="t-limpar">Limpar filtros</button>':'')+'</div>';
  if(!d) return h+'<div class="tabela"><div class="vazio">Carregando os termos…</div></div>';
  var l=d.termos.filter(function(t){return (!D.estado.unidade||t.unidade_id===D.estado.unidade)&&(!est.tLab||t.lab===est.tLab)&&(!est.tReg||(est.tReg==='com')===!!t.registro)});
  h+='<div class="tabela cartoes"><table><thead><tr><th>Unidade</th><th>Laboratório</th><th>RT do termo</th><th>Registro</th><th>Desde</th><th>Até</th><th>Arquivo</th><th>Onde está o arquivo</th></tr></thead><tbody>';
  if(!l.length) h+='<tr><td colspan="8" class="vazio">Nenhum termo com esses filtros.</td></tr>';
  l.forEach(function(t){h+='<tr><td class="c1"><b>'+esc(t.unidade)+'</b></td><td class="c2">'+esc(nomeLab(t))+'</td>'+
    '<td class="cl"><span class="rot-m">RT </span>'+esc(t.rt)+'</td>'+
    '<td class="cl"><span class="rot-m">Registro </span>'+(t.registro?esc(t.registro):'<span class="nao">não informado</span>')+'</td>'+
    '<td class="cl num"><span class="rot-m">Desde </span>'+D.dt(t.de)+'</td>'+
    '<td class="cl num'+(t.ate?'':' vz')+'"><span class="rot-m">Até </span>'+(t.ate?D.dt(t.ate):'<span class="fraco">—</span>')+'</td>'+
    '<td class="cl'+(t.arquivo_nome?'':' vz')+'"><span class="rot-m">Arquivo </span>'+(t.arquivo_nome?esc(t.arquivo_nome):'<span class="fraco">—</span>')+'</td>'+
    '<td class="cl'+(t.arquivo_local?'':' vz')+'"><span class="rot-m">Onde está </span>'+(t.arquivo_local==='sistema_antigo'?'Sistema antigo':(t.arquivo_local?'Sistema novo':'<span class="fraco">—</span>'))+'</td></tr>'});
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
  if(b.dataset.recUn){abrirGerar({mes:est.mes,unidades:[b.dataset.recUn]});return true}
  if(b.id==='rec-gerar'){abrirGerar({mes:est.mes});return true}
  if(b.id==='rec-gerar-marc'){abrirGerar({mes:est.mes,unidades:marcadas().map(function(r){return r.unidade_id})});return true}
  if(b.id==='rec-desmarcar'){est.marc={};redesenha();return true}
  if(b.id==='rec-limpar'){est.sit='';est.orig='';est.ass='';redesenha();return true}
  if(b.id==='t-limpar'){est.tLab='';est.tReg='';$('#tela').innerHTML=telaTermos();return true}
  if(b.id==='rec-recalc'){var rc=est.ficha.receita;abrirGerar({mes:rc.mes,unidades:[rc.unidade_id],receitaId:rc.id});return true}
  if(b.id==='rec-ajustar'){abrirAjustar();return true}
  if(b.id==='rec-pedido'){
    var rc=est.ficha.receita;
    if(b.getAttribute('aria-disabled')==='true'){D.avisar('A receita ainda está em rascunho: marque como gerada (assinada pelo RT do termo) antes de criar o pedido.');return true}
    b.disabled=true;
    D.api('np_criar',{unidade_id:rc.unidade_id,laboratorio_id:rc.lab,receita_id:rc.id}).then(function(x){D.avisar(x.mensagem);D.abrirRascunho(x.pedido_id)}).catch(function(x){b.disabled=false;D.avisar(x.message)});
    return true}
  if(b.id==='rec-st'){var para=b.dataset.para,txt=para==='gerada'?'Marcar a receita como gerada?':'Marcar como enviada ao RT? (o sistema não envia e-mail: só registra a data)';
    if(!confirm(txt))return true;
    b.disabled=true;D.api('receita_status',{receita_id:est.ficha.receita.id,para:para}).then(function(r){D.avisar(r.mensagem);abrirFicha(est.ficha.receita.id,true)}).catch(function(x){b.disabled=false;D.avisar(x.message)});return true}
  return false;
});
M.envios.push(function(e){if(e.target.id==='f-rec-gerar'){enviarGerar(e);return true}if(e.target.id==='f-rec-aj'){enviarAjustar(e);return true}return false});
M.mudancas.push(function(t){
  if(t.id==='rec-mes'){est.mes=t.value;est.marc={};carregarLista()}
  else if(t.id==='rec-sit'){est.sit=t.value;redesenha()}
  else if(t.id==='rec-orig'){est.orig=t.value;redesenha()}
  else if(t.id==='rec-ass'){est.ass=t.value;redesenha()}
  else if(t.dataset&&t.dataset.recSel){est.marc[t.dataset.recSel]=t.checked;redesenha()}
  else if(t.id==='rec-todas'){var mk=t.checked;[].forEach.call(document.querySelectorAll('input[data-rec-sel]'),function(i){est.marc[i.dataset.recSel]=mk});redesenha()}
  else if(t.id==='t-lab'){est.tLab=t.value;$('#tela').innerHTML=telaTermos()}
  else if(t.id==='t-reg'){est.tReg=t.value;$('#tela').innerHTML=telaTermos()}
  else if(t.id==='rg-mes'||t.name==='rg-esc'||(t.dataset&&t.dataset.rgUn)){if(t.name==='rg-esc'){var lt=$('#rg-lista');if(lt)lt.hidden=t.value!=='escolhidas'}zeraPrevia()}
  else if(t.id==='aj-novo'&&t.value){var o=t.selectedOptions[0];$('#aj-corpo').insertAdjacentHTML('beforeend','<tr><td>'+esc(o.textContent)+'<span class="sub2">incluído no ajuste</span></td><td class="r"><input class="ent num aj-q" data-prod="'+esc(t.value)+'" inputmode="numeric" value="0"></td></tr>');o.remove();t.value=''}
});
document.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('tr.lp[data-rec]')){e.preventDefault();abrirFicha(e.target.dataset.rec)}});
})();
