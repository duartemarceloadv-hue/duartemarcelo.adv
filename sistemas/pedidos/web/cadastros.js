/* Cadastros do núcleo (Unidades, Pessoas, Pendências de cadastro) — só Operações/administrador.
   Toda alteração pede justificativa e fica no registro de alterações do núcleo.
   Pessoas só são juntadas por decisão de Operações (nunca automaticamente pelo nome). */
(function(){
"use strict";
var D=window.DH, M=D.MOD, $=function(s,r){return (r||document).querySelector(s)}, esc=D.esc;
var est={uni:null,ubusca:'',pes:null,pbusca:'',ppapel:'',pend:null,pst:'abertas',fu:null,fp:null,op:null};
var fmtCnpj=function(s){return String(s||'').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5')};
var periodo=function(de,ate){return (de?D.dt(de):'início não informado')+(ate?' a '+D.dt(ate):' até hoje')};
var nrm=function(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()};
function hist(ev){
  return ev.length?'<ul class="hist">'+ev.map(function(x){return '<li><span class="q">'+D.dtHora(x.em)+'</span><span class="t">'+esc(x.texto)+(x.justificativa?'<span class="sub2">Justificativa: '+esc(x.justificativa)+'</span>':'')+'</span><span class="o">'+esc(x.por)+'</span></li>'}).join('')+'</ul>'
    :'<div class="cp"><span class="fraco">Nenhuma alteração registrada.</span></div>';
}
function erroTela(x,tela){if(D.estado.tela===tela&&x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
var JUST='<label class="campo"><span>Justificativa <small>(obrigatória; fica no histórico)</small></span><textarea class="ent" id="c-just" maxlength="500"></textarea></label>';

/* ---------- Unidades ---------- */
function telaUnidades(){
  var d=est.uni, h=D.titulo('Unidades','',d?D.plural(d.unidades.length,'unidade','unidades')+' · cadastro comum a todos os módulos':'');
  h+='<div class="filtros">'+D.campo('Buscar','<input class="busca" id="u-busca" type="search" placeholder="Nome, cidade ou CNPJ" value="'+esc(est.ubusca)+'">','c-busca')+'</div>';
  if(!d) return h+'<div class="tabela"><div class="vazio">Carregando as unidades…</div></div>';
  var q=nrm(est.ubusca).trim(), qd=q.replace(/\D/g,'');
  var l=d.unidades.filter(function(u){return (!D.estado.unidade||u.id===D.estado.unidade)&&(!q||nrm(u.nome+' '+u.cidade+' '+u.uf).indexOf(q)>=0||(qd.length>3&&String(u.cnpj||'').indexOf(qd)>=0))});
  h+='<div class="tabela cartoes"><table><thead><tr><th>Unidade</th><th>CNPJ vigente</th><th>RT titular</th><th>Sócio</th><th>Termo (C. Paulista)</th><th>Pendências</th></tr></thead><tbody>';
  if(!l.length) h+='<tr><td colspan="6" class="vazio">Nenhuma unidade com essa busca.</td></tr>';
  l.forEach(function(u){
    h+='<tr class="lp" data-uni="'+esc(u.id)+'" tabindex="0"><td class="c1"><b>'+esc(u.nome)+'</b><span class="sub2">'+esc([u.cidade,u.uf].filter(Boolean).join('/'))+(u.ativo?'':' · inativa')+'</span></td>'+
      '<td class="cl num"><span class="rot-m">CNPJ </span>'+(u.cnpj?fmtCnpj(u.cnpj):'<span class="nao">sem CNPJ</span>')+'</td>'+
      '<td class="cl"><span class="rot-m">RT </span>'+(u.rt?esc(u.rt):'<span class="nao">sem RT titular</span>')+(u.n_rt>1?'<span class="sub2">+'+(u.n_rt-1)+' substituta</span>':'')+'</td>'+
      '<td class="cl"><span class="rot-m">Sócio </span>'+(u.socios?esc(u.socios):'<span class="fraco">—</span>')+'</td>'+
      '<td class="cl"><span class="rot-m">Termo </span>'+(u.termo?'desde '+D.dt(u.termo):'<span class="nao">sem termo</span>')+'</td>'+
      '<td class="c2">'+(u.pend?'<span class="selo a">'+u.pend+'</span>':'<span class="fraco">—</span>')+'</td></tr>';
  });
  return h+'</tbody></table></div>';
}
async function carregarUnidades(){
  est.uni=null; if(D.estado.tela==='unidades') $('#tela').innerHTML=telaUnidades();
  try{est.uni=await D.api('cad_unidades');if(D.estado.tela==='unidades')$('#tela').innerHTML=telaUnidades()}catch(x){erroTela(x,'unidades')}
}
function fichaUnidade(d){
  var u=d.unidade, h='<nav class="migalha" aria-label="Caminho"><button type="button" data-ir="unidades">Unidades</button><span aria-hidden="true">›</span><span>Ficha da unidade</span></nav>';
  h+='<section class="fcab"><div class="l1"><h1>'+esc(u.nome)+'</h1>'+D.tag(u.ativo?['Ativa','s']:['Inativa','n'])+'<div class="ac"><button type="button" class="btn" data-uop="dados">Editar dados</button></div></div>'+
    '<dl class="kv">'+D.kvi('Cidade / UF',esc([u.cidade,u.uf].filter(Boolean).join(' / ')||'—'))+D.kvi('Abertura',u.abertura?D.dt(u.abertura):'—')+D.kvi('Protocolo clínico',esc(u.protocolo||'—'))+
    D.kvi('Sistema de Documentos',u.doc_unidade_id?'ligada':'<span class="nao">não ligada</span>')+'</dl>'+(u.obs?'<div><span class="nota">Observação</span><div>'+esc(u.obs)+'</div></div>':'')+'</section>';
  if(d.pendencias.length) h+='<section class="falta"><h2>Pendências de cadastro</h2><ul>'+d.pendencias.map(function(p){return '<li><button type="button" class="link" data-ir="pendencias">'+esc(p.descricao)+'</button></li>'}).join('')+'</ul></section>';
  // CNPJ
  var vig=d.cnpjs.filter(function(c){return !c.ate}), ant=d.cnpjs.filter(function(c){return c.ate});
  var sC='<ul class="arqs">'+(vig.length?vig.map(function(c){return '<li><span class="nm"><b>'+fmtCnpj(c.cnpj)+'</b> — '+esc(c.razao_social)+'</span><span class="mt">vigente · '+periodo(c.de,null)+'</span></li>'}).join(''):'<li><span class="nao">Sem CNPJ vigente</span></li>')+
    ant.map(function(c){return '<li><span class="nm">'+fmtCnpj(c.cnpj)+' — '+esc(c.razao_social)+'</span><span class="mt">'+periodo(c.de,c.ate)+'</span></li>'}).join('')+'</ul>';
  // sócios
  var sS='<ul class="arqs">'+(d.socios.length?d.socios.map(function(s){return '<li><span class="nm"><button type="button" class="link" data-pes="'+esc(s.pessoa_id)+'">'+esc(s.nome)+'</button></span><span class="mt">'+periodo(s.de,s.ate)+'</span>'+(s.ate?'':'<button type="button" class="link" data-uop="socio_encerrar" data-id="'+esc(s.id)+'">encerrar</button>')+'</li>'}).join(''):'<li><span class="fraco">Nenhum sócio cadastrado.</span></li>')+'</ul>'+
    '<div class="cp"><span class="nota">No sistema antigo o sócio era só o primeiro nome, sem documento.</span></div>';
  // RT
  var rv=d.rts.filter(function(r){return !r.ate}), re=d.rts.filter(function(r){return r.ate});
  var linhaRt=function(r){return '<li><span class="nm"><button type="button" class="link" data-pes="'+esc(r.pessoa_id)+'">'+esc(r.nome)+'</button><span class="sub2">'+esc(r.registro||'registro não informado')+(r.cargo?' · '+esc(r.cargo):'')+(r.vinculo?' · '+esc(r.vinculo):'')+'</span></span>'+
    '<span class="mt">'+(r.tipo?esc(r.tipo==='titular'?'Titular':'Substituta'):'tipo não informado')+' · '+periodo(r.de,r.ate)+'</span>'+
    (r.ate?'':'<button type="button" class="link" data-uop="rt_tipo" data-id="'+esc(r.id)+'" data-tipo="'+(r.tipo==='titular'?'substituta':'titular')+'">tornar '+(r.tipo==='titular'?'substituta':'titular')+'</button><button type="button" class="link" data-uop="rt_encerrar" data-id="'+esc(r.id)+'">encerrar</button>')+'</li>'};
  var sR='<ul class="arqs">'+(rv.length?rv.map(linhaRt).join(''):'<li><span class="nao">Sem RT vigente</span></li>')+'</ul>'+(re.length?'<div class="sub-t">Encerradas</div><ul class="arqs">'+re.map(linhaRt).join('')+'</ul>':'');
  // termos (do Laboratórios, só leitura aqui)
  var sT=d.termos.length?'<ul class="arqs">'+d.termos.map(function(t){return '<li><span class="nm">'+esc(t.lab==='CP'?'Centro Paulista':t.lab_nome)+' — RT <button type="button" class="link" data-pes="'+esc(t.rt_id)+'">'+esc(t.rt)+'</button>'+(t.arquivo_nome?'<span class="sub2">'+esc(t.arquivo_nome)+'</span>':'')+'</span><span class="mt">'+periodo(t.de,t.ate)+(t.arquivo_local==='sistema_antigo'?' · arquivo no sistema antigo':'')+'</span></li>'}).join('')+'</ul>'
    :'<div class="cp"><span class="nao">Nenhum termo com laboratório.</span></div>';
  var sA='<ul class="arqs">'+(d.apelidos.length?d.apelidos.map(function(a){return '<li><span class="nm">'+esc(a.nome)+'</span><span class="mt">'+esc(a.sistema)+'</span><button type="button" class="link perigo" data-uop="apelido_remover" data-id="'+esc(a.id)+'">remover</button></li>'}).join(''):'<li><span class="fraco">Nenhum.</span></li>')+'</ul>'+
    '<div class="cp"><span class="nota">Nomes pelos quais a unidade aparece nos outros sistemas e planilhas; usados para reconhecer a unidade nas importações.</span></div>';
  h+=D.secao('u-cnpj','Empresa (CNPJ)',D.plural(d.cnpjs.length,'vínculo','vínculos'),'<button type="button" class="botao mini sec" data-uop="cnpj">Novo CNPJ</button>',sC);
  h+=D.secao('u-socios','Sócios','','<button type="button" class="botao mini sec" data-uop="socio_incluir">Incluir sócio</button>',sS);
  h+=D.secao('u-rt','Responsável técnico','titular e substituta','<button type="button" class="botao mini sec" data-uop="rt_incluir">Incluir RT</button>',sR);
  h+=D.secao('u-termos','Termos com laboratórios','registrados no Laboratórios','',sT);
  h+=D.secao('u-apelidos','Apelidos',D.plural(d.apelidos.length,'nome','nomes'),'<button type="button" class="botao mini sec" data-uop="apelido_incluir">Incluir apelido</button>',sA);
  h+=D.secao('u-hist','Histórico',D.plural(d.historico.length,'registro','registros'),'',hist(d.historico));
  return h;
}
async function abrirUnidade(id,sem){
  D.estado.tela='unidade'; D.estado.menu='unidades'; D.marcaMenu(); if(!sem) D.navega('#unidade/'+id);
  $('#tela').innerHTML='<p class="vazio">Carregando a unidade…</p>'; window.scrollTo(0,0);
  try{est.fu=await D.api('cad_unidade',{unidade_id:id});if(D.estado.tela==='unidade')$('#tela').innerHTML=fichaUnidade(est.fu)}catch(x){erroTela(x,'unidade')}
}
var buscaPessoa=function(){return D.campoD('Pessoa','<input class="ent" id="c-pbusca" type="search" placeholder="Digite parte do nome ou o nº do registro" autocomplete="off">')+'<div class="escolha" id="c-pres"><label><span></span><span class="fraco">Digite para buscar.</span><span></span></label></div>'};
function abrirOpUnidade(op,b){
  var u=est.fu.unidade, h='<form id="f-cad-u" novalidate><div class="dlg-corpo">', tit='';
  est.op={op:op,id:b.dataset.id||null,tipo:b.dataset.tipo||null};
  if(op==='dados'){tit='Editar dados — '+u.nome;
    h+='<div class="duas">'+D.campoD('Nome','<input class="ent" id="c-nome" maxlength="80" value="'+esc(u.nome)+'">')+D.campoD('Abertura',D.inData('c-abertura',u.abertura),'opcional')+'</div>'+
      '<div class="duas">'+D.campoD('Cidade','<input class="ent" id="c-cidade" maxlength="80" value="'+esc(u.cidade||'')+'">')+D.campoD('UF','<input class="ent" id="c-uf" maxlength="2" value="'+esc(u.uf||'')+'">')+'</div>'+
      '<label class="campo chk"><input type="checkbox" id="c-ativo"'+(u.ativo?' checked':'')+'><span>Unidade ativa</span></label>'+D.campoD('Observação','<textarea class="ent" id="c-obs" maxlength="500">'+esc(u.obs||'')+'</textarea>','opcional')}
  else if(op==='cnpj'){tit='Novo CNPJ — '+u.nome;h+='<p class="fraco" style="margin:0 0 10px">O CNPJ atual é encerrado no dia anterior ao início do novo e continua no histórico.</p><div class="duas">'+D.campoD('CNPJ','<input class="ent num" id="c-cnpj" inputmode="numeric" maxlength="18">')+D.campoD('Início',D.inData('c-de',''))+'</div>'+D.campoD('Razão social','<input class="ent" id="c-razao" maxlength="160">')}
  else if(op==='apelido_incluir'){tit='Incluir apelido — '+u.nome;h+='<div class="duas">'+D.campoD('Apelido','<input class="ent" id="c-ap" maxlength="80">')+D.campoD('Onde aparece','<input class="ent" id="c-sis" maxlength="40" placeholder="ex.: planilha do laboratório">','opcional')+'</div>'}
  else if(op==='apelido_remover'){var a=est.fu.apelidos.filter(function(x){return x.id===est.op.id})[0];tit='Remover apelido';h+='<p style="margin:0 0 10px">Remover “'+esc(a.nome)+'” ('+esc(a.sistema)+')? Fica no histórico.</p>'}
  else if(op==='rt_incluir'){tit='Incluir RT — '+u.nome;h+=buscaPessoa()+'<div class="duas">'+D.campoD('Tipo','<select class="ent" id="c-tipo">'+D.opt('titular','Titular','')+D.opt('substituta','Substituta','')+'</select>')+D.campoD('Início como RT',D.inData('c-de',''))+'</div>'}
  else if(op==='socio_incluir'){tit='Incluir sócio — '+u.nome;h+=buscaPessoa()+'<div class="duas">'+D.campoD('Início',D.inData('c-de',''))+'<span></span></div>'}
  else if(op==='rt_encerrar'||op==='socio_encerrar'){var r=(op==='rt_encerrar'?est.fu.rts:est.fu.socios).filter(function(x){return x.id===est.op.id})[0];tit=(op==='rt_encerrar'?'Encerrar RT — ':'Encerrar sócio — ')+r.nome;h+='<div class="duas">'+D.campoD('Último dia',D.inData('c-ate',D.hoje(),D.hoje()))+'<span></span></div>'}
  else if(op==='rt_tipo'){var rr=est.fu.rts.filter(function(x){return x.id===est.op.id})[0];tit='Tornar '+est.op.tipo+' — '+rr.nome;h+='<p style="margin:0 0 10px">'+esc(rr.nome)+' passa a ser RT '+esc(est.op.tipo)+' da unidade.</p>'}
  D.abrirDlg(tit,h+JUST+D.rodapeDlg('Salvar'));
}
function dadosOpUnidade(){
  var o=est.op.op, v=function(id){var e=$('#'+id);return e?e.value:''};
  if(o==='dados') return {nome:v('c-nome'),cidade:v('c-cidade'),uf:v('c-uf'),abertura:v('c-abertura')||null,ativo:$('#c-ativo').checked,obs:v('c-obs')};
  if(o==='cnpj') return {cnpj:v('c-cnpj'),razao_social:v('c-razao'),de:v('c-de')};
  if(o==='apelido_incluir') return {nome:v('c-ap'),sistema:v('c-sis')};
  if(o==='rt_incluir'||o==='socio_incluir'){var p=$('input[name=c-pessoa]:checked');return {pessoa_id:p?p.value:'',tipo:v('c-tipo'),de:v('c-de')}}
  if(o==='rt_encerrar'||o==='socio_encerrar') return {id:est.op.id,ate:v('c-ate')};
  if(o==='rt_tipo') return {id:est.op.id,tipo:est.op.tipo};
  return {id:est.op.id};
}
async function enviarOpUnidade(e){
  e.preventDefault();
  var j=$('#c-just').value.trim(); if(j.length<5) return D.erroDlg('Escreva a justificativa (pelo menos 5 letras).');
  var dd=dadosOpUnidade(); if(('pessoa_id' in dd)&&!dd.pessoa_id) return D.erroDlg('Escolha a pessoa.');
  var bt=$('#f-cad-u button[type=submit]'); bt.disabled=true; bt.textContent='Gravando…';
  try{var r=await D.api('cad_salvar_unidade',{unidade_id:est.fu.unidade.id,op:est.op.op,dados:dd,justificativa:j});D.fecharDlg();D.avisar(r.mensagem);est.uni=null;abrirUnidade(est.fu.unidade.id,true)}
  catch(x){bt.disabled=false;bt.textContent='Salvar';D.erroDlg(x)}
}
var tBp;
function buscarPessoa(q){
  clearTimeout(tBp); tBp=setTimeout(async function(){
    var box=$('#c-pres'); if(!box) return;
    if(q.trim().length<2){box.innerHTML='<label><span></span><span class="fraco">Digite para buscar.</span><span></span></label>';return}
    try{var r=await D.api('cad_buscar_pessoa',{busca:q});
      box.innerHTML=r.pessoas.length?r.pessoas.map(function(p){return '<label><input type="radio" name="c-pessoa" value="'+esc(p.id)+'"><span>'+esc(p.nome)+'<small>'+esc(p.reg||'sem registro')+'</small></span><span></span></label>'}).join(''):'<label><span></span><span class="fraco">Ninguém encontrado. Cadastros de pessoa nascem das importações; peça a Operações se faltar alguém.</span><span></span></label>'}
    catch(x){box.innerHTML='<label><span></span><span class="vermelho">'+esc(x.message)+'</span><span></span></label>'}
  },250);
}

/* ---------- Pessoas ---------- */
function telaPessoas(){
  var d=est.pes, h=D.titulo('Pessoas','',d?D.plural(d.pessoas.filter(function(p){return !p.juntada}).length,'pessoa','pessoas')+' com função (RT, prescritor, sócio) · nenhuma junção automática por nome':'');
  h+='<div class="filtros">'+D.campo('Buscar','<input class="busca" id="p-busca" type="search" placeholder="Nome ou nº do registro" value="'+esc(est.pbusca)+'">','c-busca')+
    D.campo('Função','<select class="sel" id="p-papel">'+[['','Todas'],['RT','RT vigente'],['Prescritor','Prescritor'],['Sócio','Sócio'],['pend','Com pendência'],['juntada','Juntadas a outra']].map(function(o){return D.opt(o[0],o[1],est.ppapel)}).join('')+'</select>')+'</div>';
  if(!d) return h+'<div class="tabela"><div class="vazio">Carregando as pessoas…</div></div>';
  var q=nrm(est.pbusca).trim(), un=D.estado.unidade?D.nomeUnidade(D.estado.unidade):'';
  var l=d.pessoas.filter(function(p){
    if(est.ppapel==='juntada'){if(!p.juntada)return false}else if(p.juntada) return false;
    if(est.ppapel==='pend'&&!p.pend) return false;
    if(est.ppapel&&['RT','Prescritor','Sócio'].indexOf(est.ppapel)>=0&&p.papeis.indexOf(est.ppapel)<0) return false;
    if(un&&p.unidades.indexOf(un)<0) return false;
    return !q||nrm(p.nome+' '+p.registros.join(' ')).indexOf(q)>=0});
  h+='<div class="tabela cartoes"><table><thead><tr><th>Nome</th><th>Função</th><th>Registro no conselho</th><th>Onde atua</th><th>Pendências</th></tr></thead><tbody>';
  if(!l.length) h+='<tr><td colspan="5" class="vazio">Ninguém com esses filtros.</td></tr>';
  l.slice(0,300).forEach(function(p){
    h+='<tr class="lp" data-pes="'+esc(p.id)+'" tabindex="0"><td class="c1"><b>'+esc(p.nome)+'</b>'+(p.ativo?'':'<span class="sub2">inativa</span>')+'</td>'+
      '<td class="cl"><span class="rot-m">Função </span>'+(p.papeis.join(', ')||'<span class="fraco">—</span>')+'</td>'+
      '<td class="cl"><span class="rot-m">Registro </span>'+(p.registros.length?esc(p.registros.join(', ')):'<span class="fraco">não informado</span>')+'</td>'+
      '<td class="cl"><span class="rot-m">Onde </span>'+(p.unidades.length?esc(p.unidades.join(', ')):'<span class="fraco">—</span>')+'</td>'+
      '<td class="c2">'+(p.pend?'<span class="selo a">'+p.pend+'</span>':'<span class="fraco">—</span>')+'</td></tr>'});
  return h+'</tbody></table></div>';
}
async function carregarPessoas(){
  est.pes=null; if(D.estado.tela==='pessoas') $('#tela').innerHTML=telaPessoas();
  try{est.pes=await D.api('cad_pessoas');if(D.estado.tela==='pessoas')$('#tela').innerHTML=telaPessoas()}catch(x){erroTela(x,'pessoas')}
}
function fichaPessoa(d){
  var p=d.pessoa, h='<nav class="migalha" aria-label="Caminho"><button type="button" data-ir="pessoas">Pessoas</button><span aria-hidden="true">›</span><span>Ficha da pessoa</span></nav>';
  var vivo=!p.juntada_em;
  h+='<section class="fcab"><div class="l1"><h1>'+esc(p.nome)+'</h1>'+D.tag(p.juntada_em?['Juntada a outra','n']:(p.ativo?['Ativa','s']:['Inativa','n']))+(vivo?'<div class="ac"><button type="button" class="btn" data-pop="dados">Editar dados</button></div>':'')+'</div>'+
    (p.juntada_em?'<div class="cancelado">Este cadastro foi juntado a <button type="button" class="link" data-pes="'+esc(p.juntada_em)+'">'+esc(p.juntada_nome)+'</button>.</div>':'')+
    ((p.outros_nomes||[]).length?'<div><span class="nota">Outras grafias nas fontes</span><div>'+esc(p.outros_nomes.join(' · '))+'</div></div>':'')+(p.obs?'<div><span class="nota">Observação</span><div>'+esc(p.obs)+'</div></div>':'')+'</section>';
  if(d.pendencias.length) h+='<section class="falta"><h2>Pendências de cadastro</h2><ul>'+d.pendencias.map(function(x){return '<li><button type="button" class="link" data-ir="pendencias">'+esc(x.descricao)+'</button></li>'}).join('')+'</ul></section>';
  var sD='<ul class="arqs">'+(d.documentos.length?d.documentos.map(function(x){return '<li><span class="nm">'+esc(x.tipo)+' '+esc(x.numero)+'</span><span class="mt">'+periodo(x.de,x.ate)+'</span></li>'}).join(''):'<li><span class="fraco">Nenhum documento. As fontes importadas não tinham CPF nem CNPJ.</span></li>')+'</ul>'+
    '<div class="cp"><span class="nota">CPF aparece mascarado.</span></div>';
  var sR='<ul class="arqs">'+(d.profissional.length?d.profissional.map(function(x){return '<li><span class="nm">'+(x.registro?esc(x.conselho+' '+x.registro+(x.uf?'-'+x.uf:'')):'<span class="fraco">registro não informado</span>')+(x.registro_original&&x.registro?'<span class="sub2">escrito na fonte: '+esc(x.registro_original)+'</span>':'')+'</span><span class="mt">'+(x.habilitado_prescrever?'pode prescrever':'não prescreve')+'</span>'+(vivo?'<button type="button" class="link" data-pop="registro" data-id="'+esc(x.id)+'">editar</button>':'')+'</li>'}).join(''):'<li><span class="fraco">Nenhum.</span></li>')+'</ul>';
  var at=[];
  d.rts.forEach(function(r){at.push('<li><span class="nm">RT '+(r.tipo?esc(r.tipo):'')+' em <button type="button" class="link" data-uni="'+esc(r.unidade_id)+'">'+esc(r.unidade)+'</button>'+(r.cargo?'<span class="sub2">'+esc(r.cargo)+(r.vinculo?' · '+esc(r.vinculo):'')+'</span>':'')+'</span><span class="mt">'+periodo(r.de,r.ate)+'</span></li>')});
  d.socios.forEach(function(s){at.push('<li><span class="nm">Sócio em <button type="button" class="link" data-uni="'+esc(s.unidade_id)+'">'+esc(s.unidade)+'</button></span><span class="mt">'+periodo(s.de,s.ate)+'</span></li>')});
  if(d.prescritor_em.length) at.push('<li><span class="nm">Prescritor em '+d.prescritor_em.map(function(x){return '<button type="button" class="link" data-uni="'+esc(x.unidade_id)+'">'+esc(x.unidade)+'</button>'}).join(', ')+'</span><span class="mt">lista do sistema antigo</span></li>');
  d.termos.forEach(function(t){at.push('<li><span class="nm">RT do termo com '+esc(t.lab)+' — '+esc(t.unidade)+'</span><span class="mt">'+periodo(t.de,t.ate)+'</span></li>')});
  if(d.receitas) at.push('<li><span class="nm">Assina '+D.plural(d.receitas,'receita','receitas')+' do mês</span></li>');
  var sA='<ul class="arqs">'+(at.join('')||'<li><span class="fraco">Nenhuma função registrada.</span></li>')+'</ul>';
  var sO='<ul class="arqs">'+d.origens.map(function(o){return '<li><span class="nm">'+esc(o.nome_fonte||'')+'</span><span class="mt">'+esc(o.sistema)+' · '+esc(o.ref)+'</span></li>'}).join('')+'</ul>';
  h+=D.secao('p-docs','Documentos fiscais','',vivo?'<button type="button" class="botao mini sec" data-pop="documento_incluir">Incluir documento</button>':'',sD);
  h+=D.secao('p-reg','Registro profissional','',vivo?'<button type="button" class="botao mini sec" data-pop="registro">Incluir registro</button>':'',sR);
  h+=D.secao('p-onde','Onde atua','','',sA);
  h+=D.secao('p-orig','Origem do cadastro',D.plural(d.origens.length,'registro','registros')+' de outros sistemas','',sO);
  h+=D.secao('p-hist','Histórico',D.plural(d.historico.length,'registro','registros'),'',hist(d.historico));
  return h;
}
async function abrirPessoa(id,sem){
  D.estado.tela='pessoa'; D.estado.menu='pessoas'; D.marcaMenu(); if(!sem) D.navega('#pessoa/'+id);
  $('#tela').innerHTML='<p class="vazio">Carregando a pessoa…</p>'; window.scrollTo(0,0);
  try{est.fp=await D.api('cad_pessoa',{pessoa_id:id});if(D.estado.tela==='pessoa')$('#tela').innerHTML=fichaPessoa(est.fp)}catch(x){erroTela(x,'pessoa')}
}
function abrirOpPessoa(op,b){
  var p=est.fp.pessoa, h='<form id="f-cad-p" novalidate><div class="dlg-corpo">', tit='';
  est.op={op:op,id:b.dataset.id||null};
  if(op==='dados'){tit='Editar dados — '+p.nome;h+=D.campoD('Nome','<input class="ent" id="c-nome" maxlength="120" value="'+esc(p.nome)+'">')+'<label class="campo chk"><input type="checkbox" id="c-ativo"'+(p.ativo?' checked':'')+'><span>Ativa</span></label>'+D.campoD('Observação','<textarea class="ent" id="c-obs" maxlength="500">'+esc(p.obs||'')+'</textarea>','opcional')}
  else if(op==='registro'){var x=est.op.id?est.fp.profissional.filter(function(y){return y.id===est.op.id})[0]:{};tit=(est.op.id?'Editar':'Incluir')+' registro — '+p.nome;
    h+='<div class="duas">'+D.campoD('Conselho','<select class="ent" id="c-cons">'+['CRBM','CRM','CRF','COREN','outro'].map(function(c){return D.opt(c,c,x.conselho||'CRBM')}).join('')+'</select>')+D.campoD('Número','<input class="ent num" id="c-reg" inputmode="numeric" value="'+esc(x.registro||'')+'">')+'</div>'+
      '<div class="duas">'+D.campoD('UF','<input class="ent" id="c-uf" maxlength="2" value="'+esc(x.uf||'')+'">','opcional')+'<label class="campo chk"><input type="checkbox" id="c-presc"'+(x.habilitado_prescrever?' checked':'')+'><span>Pode prescrever</span></label></div>'}
  else if(op==='documento_incluir'){tit='Incluir documento — '+p.nome;h+='<div class="duas">'+D.campoD('Tipo','<select class="ent" id="c-dtipo">'+D.opt('CPF','CPF','')+D.opt('CNPJ','CNPJ (recebe como PJ)','')+'</select>')+D.campoD('Número','<input class="ent num" id="c-dnum" inputmode="numeric" maxlength="18">')+'</div>'+
    '<div class="duas">'+D.campoD('Desde',D.inData('c-de',''),'opcional')+'<span></span></div><p class="fraco" style="margin:0 0 10px">Só informe documento conferido no original. Se ele já estiver em outra pessoa, o sistema avisa.</p>'}
  D.abrirDlg(tit,h+JUST+D.rodapeDlg('Salvar'));
}
async function enviarOpPessoa(e){
  e.preventDefault();
  var j=$('#c-just').value.trim(); if(j.length<5) return D.erroDlg('Escreva a justificativa (pelo menos 5 letras).');
  var o=est.op.op, v=function(id){var x=$('#'+id);return x?x.value:''}, dd;
  if(o==='dados') dd={nome:v('c-nome'),ativo:$('#c-ativo').checked,obs:v('c-obs')};
  else if(o==='registro') dd={id:est.op.id,conselho:v('c-cons'),registro:v('c-reg'),uf:v('c-uf'),habilitado_prescrever:$('#c-presc').checked};
  else dd={tipo:v('c-dtipo'),numero:v('c-dnum'),de:v('c-de')||null};
  var bt=$('#f-cad-p button[type=submit]'); bt.disabled=true; bt.textContent='Gravando…';
  try{var r=await D.api('cad_salvar_pessoa',{pessoa_id:est.fp.pessoa.id,op:o,dados:dd,justificativa:j});D.fecharDlg();D.avisar(r.mensagem);est.pes=null;abrirPessoa(est.fp.pessoa.id,true)}
  catch(x){bt.disabled=false;bt.textContent='Salvar';D.erroDlg(x)}
}

/* ---------- Pendências ---------- */
var TIPO={possivel_duplicada:'Possível mesma pessoa',socio_empresa:'Sócio é empresa',datas_inconsistentes:'Datas inconsistentes',unidade_nao_reconhecida:'Unidade não reconhecida',outro:'Outro'};
var DEC={juntadas:'Juntadas',mantidas_separadas:'Mantidas separadas',resolvida:'Resolvida',descartada:'Descartada'};
function lado(p,rot){
  if(!p) return '';
  var at=[];(p.rt||[]).forEach(function(r){at.push('RT em '+r.u+' ('+periodo(r.de,r.ate)+')')});
  if((p.socio||[]).length) at.push('Sócio em '+p.socio.join(', '));
  if((p.presc||[]).length) at.push('Prescritor em '+p.presc.join(', '));
  if(p.termos) at.push('RT de '+D.plural(p.termos,'termo','termos'));
  if(p.receitas) at.push('assina '+D.plural(p.receitas,'receita','receitas'));
  return '<div class="pd-lado"><span class="nota">'+esc(rot)+'</span><b><button type="button" class="link" data-pes="'+esc(p.id)+'">'+esc(p.nome)+'</button></b>'+
    '<span>'+(p.registros.length?esc(p.registros.join(', ')):'<span class="fraco">sem registro no conselho</span>')+'</span>'+
    '<span class="fraco">'+esc(at.join(' · ')||'sem função registrada')+'</span><span class="fraco">Veio de: '+esc([...new Set(p.origens||[])].join(', '))+'</span></div>';
}
function telaPend(){
  var d=est.pend, c=d&&d.contagem;
  var h=D.titulo('Pendências de cadastro','',c?D.plural(c.abertas,'aberta','abertas')+' · '+D.plural(c.decididas,'decidida','decididas')+' · juntar só quando for a mesma pessoa; cada decisão pede justificativa':'');
  h+='<div class="filtros">'+D.campo('Mostrar','<select class="sel" id="pd-st">'+D.opt('abertas','Abertas',est.pst)+D.opt('decididas','Decididas',est.pst)+'</select>')+'</div>';
  if(!d) return h+'<div class="tabela"><div class="vazio">Carregando as pendências…</div></div>';
  if(!d.pendencias.length) return h+'<div class="tabela"><div class="vazio">Nenhuma pendência '+(est.pst==='abertas'?'aberta':'decidida')+'.</div></div>';
  d.pendencias.forEach(function(x){
    var ac='';
    if(x.status==='aberta'){
      if(x.tipo==='possivel_duplicada') ac='<button type="button" class="botao mini" data-pd="'+esc(x.id)+'" data-dec="juntar" data-fica="a">Juntar (fica a 1ª)</button><button type="button" class="botao mini sec" data-pd="'+esc(x.id)+'" data-dec="juntar" data-fica="b">Juntar (fica a 2ª)</button><button type="button" class="botao mini sec" data-pd="'+esc(x.id)+'" data-dec="separadas">Manter separadas</button>';
      else ac='<button type="button" class="botao mini sec" data-pd="'+esc(x.id)+'" data-dec="resolvida">Marcar resolvida</button><button type="button" class="botao mini sec" data-pd="'+esc(x.id)+'" data-dec="descartada">Descartar</button>';
    }
    h+='<section class="sec pd"><div class="sh"><h2>'+esc(TIPO[x.tipo]||x.tipo)+'</h2>'+(x.status!=='aberta'?D.tag([DEC[x.status]||x.status,x.status==='juntadas'?'s':'n']):'')+'</div>'+
      '<div class="cp">'+(x.tipo==='possivel_duplicada'?'<div class="pd-par">'+lado(x.a,'1ª')+lado(x.b,'2ª')+'</div>':'<span>'+esc(x.descricao)+'</span>'+(x.a?lado(x.a,'Pessoa'):'')+(x.unidade?'<span class="fraco">Unidade: '+esc(x.unidade)+'</span>':''))+
      (x.status!=='aberta'?'<span class="nota">Decidido por '+esc(x.decidido_por||'')+' em '+D.dtHora(x.decidido_em)+': '+esc(x.justificativa||'')+'</span>':'')+
      (ac?'<div class="acoes-f">'+ac+'</div>':'')+'</div></section>';
  });
  return h;
}
async function carregarPend(){
  est.pend=null; if(D.estado.tela==='pendencias') $('#tela').innerHTML=telaPend();
  try{est.pend=await D.api('cad_pendencias',{status:est.pst});if(D.estado.tela==='pendencias')$('#tela').innerHTML=telaPend()}catch(x){erroTela(x,'pendencias')}
}
function abrirDecisao(b){
  var x=est.pend.pendencias.filter(function(y){return y.id===b.dataset.pd})[0], dec=b.dataset.dec;
  est.op={pd:x.id,dec:dec,fica:b.dataset.fica||'a',conf:false};
  var txt=dec==='juntar'?'Juntar os dois cadastros. Fica: <b>'+esc((est.op.fica==='b'?x.b:x.a).nome)+'</b>. Funções, registros, termos e receitas do outro passam para ele; o outro fica inativo, apontando para este.'
    :dec==='separadas'?'São pessoas diferentes: os dois cadastros continuam.':'Encerrar esta pendência.';
  D.abrirDlg(dec==='juntar'?'Juntar cadastros':dec==='separadas'?'Manter separadas':'Encerrar pendência','<form id="f-cad-pd" novalidate><div class="dlg-corpo"><p style="margin:0 0 10px">'+txt+'</p><div id="pd-conf"></div>'+JUST+D.rodapeDlg('Confirmar'));
}
async function enviarDecisao(e){
  e.preventDefault();
  var j=$('#c-just').value.trim(); if(j.length<5) return D.erroDlg('Escreva a justificativa (pelo menos 5 letras).');
  var c=$('#pd-confirma'); var bt=$('#f-cad-pd button[type=submit]'); bt.disabled=true; bt.textContent='Gravando…';
  try{var r=await D.api('cad_decidir_pendencia',{pendencia_id:est.op.pd,decisao:est.op.dec,fica:est.op.fica,justificativa:j,confirmar_registros:!!(c&&c.checked)});D.fecharDlg();D.avisar(r.mensagem);est.pes=null;est.uni=null;carregarPend()}
  catch(x){bt.disabled=false;bt.textContent='Confirmar';
    if(x.corpo&&x.corpo.codigo==='registros_diferentes'){$('#pd-conf').innerHTML='<div class="alerta">'+esc(x.message)+'<label class="campo chk"><input type="checkbox" id="pd-confirma"><span>Confirmo: é a mesma pessoa</span></label></div>';return}
    D.erroDlg(x)}
}

/* ---------- registro na casca ---------- */
M.telas.unidades={render:function(){$('#tela').innerHTML=telaUnidades()},abrir:function(){carregarUnidades()}};
M.telas.pessoas={render:function(){$('#tela').innerHTML=telaPessoas()},abrir:function(){carregarPessoas()}};
M.telas.pendencias={render:function(){$('#tela').innerHTML=telaPend()},abrir:function(){carregarPend()}};
M.rotas.push([/^unidade\/([0-9a-f-]{36})$/i,function(m,s){abrirUnidade(m[1],s)}]);
M.rotas.push([/^pessoa\/([0-9a-f-]{36})$/i,function(m,s){abrirPessoa(m[1],s)}]);
M.cliques.push(function(b){
  if(b.dataset.uni){abrirUnidade(b.dataset.uni);return true}
  if(b.dataset.pes){abrirPessoa(b.dataset.pes);return true}
  if(b.dataset.uop){abrirOpUnidade(b.dataset.uop,b);return true}
  if(b.dataset.pop){abrirOpPessoa(b.dataset.pop,b);return true}
  if(b.dataset.pd){abrirDecisao(b);return true}
  return false;
});
M.envios.push(function(e){var id=e.target.id;
  if(id==='f-cad-u'){enviarOpUnidade(e);return true} if(id==='f-cad-p'){enviarOpPessoa(e);return true} if(id==='f-cad-pd'){enviarDecisao(e);return true} return false});
M.mudancas.push(function(t){
  if(t.id==='p-papel'){est.ppapel=t.value;$('#tela').innerHTML=telaPessoas()}
  else if(t.id==='pd-st'){est.pst=t.value;carregarPend()}
});
var tB;
document.addEventListener('input',function(e){
  var t=e.target, id=t.id;
  if(id==='c-pbusca'){buscarPessoa(t.value);return}
  if(id!=='u-busca'&&id!=='p-busca') return;
  if(id==='u-busca') est.ubusca=t.value; else est.pbusca=t.value;
  clearTimeout(tB); tB=setTimeout(function(){var pos=t.selectionStart;$('#tela').innerHTML=id==='u-busca'?telaUnidades():telaPessoas();var n=$('#'+id);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}},250);
});
document.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('tr.lp[data-uni],tr.lp[data-pes]')){e.preventDefault();if(e.target.dataset.uni)abrirUnidade(e.target.dataset.uni);else abrirPessoa(e.target.dataset.pes)}});
})();
