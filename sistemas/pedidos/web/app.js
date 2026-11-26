/* Sistema de Pedidos Dr. Hair (novo) — ambiente de teste.
   Telas e regras do modelo aprovado (modelo/index.html), agora ligadas à API pedidos-api.
   Nenhum dado fica embutido aqui: tudo vem da API depois do login. */
(function(){
"use strict";
var SUPA_URL='https://xqxjmeioodmdhxhivyqu.supabase.co';
// chave pública do projeto (feita para ficar no navegador; o acesso real é controlado pela API)
var SUPA_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeGptZWlvb2RtZGh4aGl2eXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyOTYwODYsImV4cCI6MjEwNjg3MjA4Nn0.0-Qpbo1xBIeh5vrfBiOe3vcCybuRrTclfNEKJ2VCa6M';
var API=SUPA_URL+'/functions/v1/pedidos-api';
var MAX_ARQ=10*1024*1024;

var sb=window.supabase.createClient(SUPA_URL,SUPA_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'dh-pedidos-novo'}});

var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var fmtR=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
var R=function(v){return fmtR.format(v||0).replace(/ /g,' ')};
var dt=function(s){if(!s)return '—';var p=String(s).slice(0,10).split('-');return p[2]+'/'+p[1]+'/'+p[0]};
var ms=function(s){var p=s.split('-');return Date.UTC(+p[0],p[1]-1,+p[2])};
var addD=function(s,n){var d=new Date(ms(s)+n*864e5);return d.toISOString().slice(0,10)};
var plural=function(n,a,b){return n+' '+(n===1?a:b)};
var r2=function(v){return Math.round(v*100)/100};
function hojeLocal(){var d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function numBR(s){s=String(s||'').trim().replace(/[R$\s]/g,'');if(!s)return NaN;if(s.indexOf(',')>=0)s=s.replace(/\./g,'').replace(',','.');return Number(s)}
function valBR(v){return (v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}

var SIT_P={E:['Enviado ao laboratório, aguardando produção','t-blue'],L:['Confirmado pelo laboratório','t-teal'],C:['A caminho da unidade','t-amber'],R:['Recebido na unidade','t-green'],X:['Cancelado','t-gray'],D:['Rascunho','t-gray']};
var SIT_PC={
  V:['Vencida e sem pagamento','t-red','Pagar — vencidas de verdade','Pagar esta parcela','--red'],
  A:['A vencer','t-blue','Pagar no vencimento','Pagar esta parcela','--blue'],
  P:['Paga por nós, falta a baixa do laboratório','t-amber','Cobrar baixa do laboratório','Cobrar baixa','--amber'],
  B:['Baixada pelo laboratório, falta nosso comprovante','t-amber','Anexar comprovante','Anexar comprovante','--amber'],
  Q:['Paga e baixada — tudo certo','t-green','Nada a fazer','','--green'],
  X:['Cancelada','t-gray','Nada a fazer','','--gray']};
var FORMA={cartao:'Cartão',pix:'PIX',boleto:'Boleto',outro:'Outra forma'};
function tag(t){return '<span class="tag '+t[1]+'">'+esc(t[0])+'</span>'}

/* ---------- API ---------- */
function ErroApi(status,corpo){this.status=status;this.corpo=corpo||{};this.message=(corpo&&corpo.erro)||('Erro '+status)}
async function api(acao,dados){
  var s=(await sb.auth.getSession()).data.session;
  if(!s){mostrarLogin();throw new ErroApi(401,{erro:'Entre com seu e-mail e senha.',codigo:'sem_sessao'})}
  var r;
  try{
    r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.access_token,'apikey':SUPA_KEY},body:JSON.stringify(Object.assign({acao:acao},dados||{}))});
  }catch(e){throw new ErroApi(0,{erro:'Sem conexão com o servidor. Confira a internet e tente de novo.'})}
  var corpo=null; try{corpo=await r.json()}catch(e){}
  if(!r.ok){
    var c=corpo&&corpo.codigo;
    if(r.status===401){mostrarLogin('Sua sessão terminou. Entre de novo.')}
    else if(c==='trocar_senha'){mostrarTrocaSenha()}
    else if(c==='mfa'){mostrarMfa()}
    throw new ErroApi(r.status,corpo||{erro:'Erro '+r.status});
  }
  return corpo;
}

/* ---------- estado ---------- */
var EU=null, HOJE=hojeLocal();
var estado={tela:'inicio',busca:'',sit:'',lab:'',acao:false,especial:'',lim:60,unid:'',grupo:'',abertos:{},sel:{}};
var cache={inicio:null,pedidos:null,pag:null};
var fichaAtual=null;

/* ---------- acesso: login, troca de senha, autenticador ---------- */
function telaAcesso(h){
  $('#abas').hidden=true; fecharFicha(); fecharDlg();
  $('#tela').innerHTML='<section class="acesso">'+h+'</section>';
  var f=$('#tela input'); if(f) f.focus();
}
function topoUsuario(){
  var u=$('#usuario');
  if(!EU){u.hidden=true;u.innerHTML='';return}
  u.hidden=false; u.innerHTML='<span class="nm"><b>'+esc(EU.nome)+'</b></span><button type="button" class="sair" id="sair">Sair</button>';
}
function mostrarLogin(msg){
  EU=null; topoUsuario();
  telaAcesso('<h2>Entrar</h2><p>Use o e-mail e a senha do Sistema de Pedidos.</p>'+(msg?'<div class="alerta">'+esc(msg)+'</div>':'')+
    '<form id="f-login" novalidate><label class="campo"><span>E-mail</span><input class="ent" id="l-email" type="email" autocomplete="username" required></label>'+
    '<label class="campo"><span>Senha</span><input class="ent" id="l-senha" type="password" autocomplete="current-password" required></label>'+
    '<div id="l-erro"></div><button class="botao grande" type="submit">Entrar</button></form>');
}
async function entrar(e){
  e.preventDefault();
  var em=$('#l-email').value.trim().toLowerCase(), se=$('#l-senha').value, out=$('#l-erro'), bt=$('#f-login button');
  if(!em||!se){out.innerHTML='<div class="erro">Preencha o e-mail e a senha.</div>';return}
  bt.disabled=true; bt.textContent='Entrando…'; out.innerHTML='';
  var r=await sb.auth.signInWithPassword({email:em,password:se});
  if(r.error){
    bt.disabled=false; bt.textContent='Entrar';
    var m=/invalid/i.test(r.error.message)?'E-mail ou senha incorretos.':(/rate|many/i.test(r.error.message)?'Muitas tentativas. Espere alguns minutos e tente de novo.':'Não foi possível entrar agora. Tente de novo.');
    out.innerHTML='<div class="erro">'+esc(m)+'</div>'; return;
  }
  await iniciar();
}
function mostrarTrocaSenha(){
  telaAcesso('<h2>Troque a senha temporária</h2><p>Por segurança, crie a sua senha antes de usar o sistema. Use pelo menos 10 caracteres, com letras e números.</p>'+
    '<form id="f-senha" novalidate><label class="campo"><span>Nova senha</span><input class="ent" id="s-nova" type="password" autocomplete="new-password" minlength="10" required></label>'+
    '<label class="campo"><span>Repita a nova senha</span><input class="ent" id="s-rep" type="password" autocomplete="new-password" required></label>'+
    '<div id="s-erro"></div><button class="botao grande" type="submit">Salvar nova senha</button></form>');
}
async function salvarSenha(e){
  e.preventDefault();
  var n=$('#s-nova').value, rp=$('#s-rep').value, out=$('#s-erro'), bt=$('#f-senha button');
  if(n.length<10){out.innerHTML='<div class="erro">A nova senha precisa ter pelo menos 10 caracteres.</div>';return}
  if(!/[A-Za-z]/.test(n)||!/\d/.test(n)){out.innerHTML='<div class="erro">Use letras e números na nova senha.</div>';return}
  if(n!==rp){out.innerHTML='<div class="erro">As duas senhas não são iguais.</div>';return}
  bt.disabled=true; bt.textContent='Salvando…';
  try{await api('trocar_senha',{nova:n}); await sb.auth.refreshSession(); avisar('Senha trocada.'); await iniciar()}
  catch(x){bt.disabled=false;bt.textContent='Salvar nova senha';if($('#s-erro'))$('#s-erro').innerHTML='<div class="erro">'+esc(x.message)+'</div>'}
}
var mfaFator=null;
async function mostrarMfa(){
  telaAcesso('<p class="vazio">Preparando o aplicativo autenticador…</p>');
  var l=await sb.auth.mfa.listFactors();
  if(l.error){telaAcesso('<div class="erro">'+esc('Não foi possível consultar o autenticador. Saia e entre de novo.')+'</div><button class="botao grande" type="button" id="sair">Sair</button>');return}
  var ok=(l.data.totp||[]).filter(function(f){return f.status==='verified'});
  if(ok.length){
    mfaFator=ok[0].id;
    telaAcesso('<h2>Código do autenticador</h2><p>Abra o aplicativo autenticador no celular e digite o código de 6 números de “Pedidos Dr. Hair”.</p>'+formCodigo());
    return;
  }
  // remove cadastros começados e não concluídos
  var pend=(l.data.all||[]).filter(function(f){return f.status!=='verified'});
  for(var i=0;i<pend.length;i++){await sb.auth.mfa.unenroll({factorId:pend[i].id})}
  var en=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'Pedidos Dr. Hair'});
  if(en.error){telaAcesso('<div class="erro">Não foi possível iniciar o cadastro do autenticador ('+esc(en.error.message)+'). Saia e entre de novo.</div><button class="botao grande" type="button" id="sair">Sair</button>');return}
  mfaFator=en.data.id;
  var qr=svgQr(en.data.totp.qr_code||'');
  telaAcesso('<h2>Cadastre o autenticador</h2><p>Quem cuida do financeiro entra com senha <b>e</b> um código do celular. É feito uma vez só.</p>'+
    '<ol class="passos"><li>Instale no celular um aplicativo autenticador (Google Authenticator ou Microsoft Authenticator).</li><li>No aplicativo, toque em “adicionar” e leia o código abaixo com a câmera.</li><li>Digite o código de 6 números que aparecer.</li></ol>'+
    '<div class="qr"><img alt="Código QR para cadastrar o autenticador" src="'+esc(qr)+'"></div>'+
    '<div style="font-size:13px;color:var(--muted);margin-bottom:4px">Sem câmera? Digite esta chave no aplicativo:</div><div class="segredo">'+esc(en.data.totp.secret)+'</div>'+formCodigo());
}
function svgQr(q){
  // o Supabase devolve 'data:image/svg+xml;utf-8,<svg…>' sem codificar; normaliza para uma imagem válida
  var svg=q;
  for(var i=0;i<3;i++){
    if(svg.indexOf('data:')===0) svg=svg.slice(svg.indexOf(',')+1);
    else if(/^%/.test(svg)){try{svg=decodeURIComponent(svg)}catch(e){break}}
    else break;
  }
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function formCodigo(){
  return '<form id="f-mfa" novalidate><label class="campo"><span>Código de 6 números</span><input class="ent codigo" id="m-cod" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required></label>'+
    '<div id="m-erro"></div><button class="botao grande" type="submit">Confirmar</button></form><p style="margin-top:14px"><button type="button" class="link" id="sair">Sair e entrar com outra conta</button></p>';
}
async function confirmarMfa(e){
  e.preventDefault();
  var c=$('#m-cod').value.replace(/\D/g,''), out=$('#m-erro'), bt=$('#f-mfa button');
  if(c.length!==6){out.innerHTML='<div class="erro">Digite os 6 números do aplicativo.</div>';return}
  bt.disabled=true; bt.textContent='Conferindo…';
  var r=await sb.auth.mfa.challengeAndVerify({factorId:mfaFator,code:c});
  if(r.error){bt.disabled=false;bt.textContent='Confirmar';out.innerHTML='<div class="erro">Código não confere. Espere o próximo código no aplicativo e tente de novo.</div>';return}
  await iniciar();
}
async function sair(){await sb.auth.signOut().catch(function(){});cache={inicio:null,pedidos:null,pag:null};mostrarLogin()}

async function iniciar(){
  var s=(await sb.auth.getSession()).data.session;
  if(!s){mostrarLogin();return}
  try{EU=await api('sessao')}
  catch(x){
    if(x.status===403&&x.corpo.codigo==='sem_acesso'){await sb.auth.signOut();mostrarLogin(x.message);return}
    if(x.status!==401) telaAcesso('<div class="erro">'+esc(x.message)+'</div><button class="botao grande" type="button" id="recarregar">Tentar de novo</button>');
    return;
  }
  topoUsuario();
  if(EU.trocar_senha){mostrarTrocaSenha();return}
  if(EU.precisa_mfa&&EU.aal!=='aal2'){mostrarMfa();return}
  $('#abas').hidden=false;
  var h=(location.hash||'').slice(1); estado.tela=['pedidos','pagamentos'].indexOf(h)>=0?h:'inicio';
  ir(estado.tela);
}

/* ---------- Início ---------- */
function defCartoes(d){
  var c=d.cartoes;
  return [
   {g:'Financeiro',itens:[
    {acao:'Anexar comprovante',det:'O laboratório já deu baixa, mas não temos o comprovante do nosso pagamento.',c:'--amber',r:c.B,ir:['pagamentos','B']},
    {acao:'Cobrar baixa do laboratório',det:'Pagamos (com comprovante), mas o laboratório ainda não deu baixa.',c:'--amber',r:c.P,ir:['pagamentos','P']},
    {acao:'Pagar — vencidas de verdade',det:'Venceram, não têm pagamento nosso nem baixa do laboratório.',c:'--red',r:c.V,ir:['pagamentos','V']},
    {acao:'Pagar — vencem nos próximos 7 dias',det:'Vencem até '+dt(d.h7)+'.',c:'--blue',r:c.A7,ir:['pagamentos','A7']}]},
   {g:'Laboratório',itens:[
    {acao:'Cobrar laboratório — passou do prazo de 30 dias',det:'Ainda não saíram do laboratório e já passou o prazo.',c:'--red',r:c.atraso,ir:['pedidos','atraso']},
    {acao:'Confirmar entrega — a caminho há mais de 7 dias',det:'Saíram do laboratório há mais de uma semana e ninguém confirmou a chegada.',c:'--amber',r:c.caminho,ir:['pedidos','caminho']}]},
   {g:'Cadastro',itens:[
    {acao:'Completar itens — pedidos sem itens',det:'Sem produtos cadastrados, o total aparece zerado.',c:'--gray',r:c.semitens,ir:['pedidos','semitens'],semValor:true},
    {acao:'Confirmar recebimento',det:'O laboratório marcou como enviado, mas não temos data de envio nem de entrega.',c:'--amber',r:c.labEnviou,ir:['pedidos','labEnviou']}]}];
}
var FILTRO_NOME={atraso:'Passou do prazo de 30 dias',caminho:'A caminho há mais de 7 dias',semitens:'Pedidos sem itens',labEnviou:'Confirmar recebimento'};
function telaInicio(d){
  var h='<h2>O que fazer</h2><p class="sub">Cada cartão mostra quantos itens pedem ação e quanto dinheiro envolve. Clique para ver a lista.</p>';
  defCartoes(d).forEach(function(g){
    h+='<section class="grupo"><h3>'+g.g+'</h3><div class="cartoes">';
    g.itens.forEach(function(c){
      var val=c.semValor?'total ainda não calculado':R(c.r.v);
      h+='<button type="button" class="cartao'+(c.r.n?'':' zero')+'" style="--c:var('+c.c+')" data-card="'+c.ir[0]+':'+c.ir[1]+'">'+
         '<div class="acao">'+esc(c.acao)+'</div><div class="nums"><span class="qtd">'+c.r.n+'</span><span class="val">'+val+'</span></div>'+
         '<div class="det">'+esc(c.det)+'</div></button>';
    });
    h+='</div></section>';
  });
  var o=d.onde, ordem=['E','L','C'], max=Math.max(1,o.E,o.L,o.C), cor={E:'--blue',L:'--teal',C:'--amber'};
  h+='<section class="grupo"><h3>Onde estão os pedidos em aberto</h3><div class="painel"><div class="barras">';
  ordem.forEach(function(s){
    h+='<button type="button" class="barra" data-sit="'+s+'" style="--c:var('+cor[s]+')"><span>'+esc(SIT_P[s][0])+'</span><span class="trilho"><span class="ench" style="display:block;width:'+(o[s]/max*100)+'%"></span></span><span class="n">'+o[s]+'</span></button>';
  });
  h+='</div><p class="nota-rodape">'+o.abertos+' pedidos em aberto, dos quais '+o.atrasados+' já passaram do prazo do laboratório. Recebidos: '+o.recebidos+' · Cancelados: '+o.cancelados+'.</p></div></section>';
  return h;
}

/* ---------- Pedidos ---------- */
function chip(grupo,val,txt,ativo){return '<button type="button" class="chip" data-f="'+grupo+'" data-v="'+val+'" aria-pressed="'+ativo+'">'+esc(txt)+'</button>'}
function filtrosPedidos(){return {busca:estado.busca,sit:estado.sit,lab:estado.lab,so_acao:estado.acao,especial:estado.especial}}
function telaPedidos(d){
  var h='<h2>Pedidos</h2><p class="sub">Do mais urgente para o menos urgente. Clique num pedido para abrir a ficha completa.</p><div class="ferr">'+
   '<input class="busca" id="busca" type="search" placeholder="Buscar por nº DH, nº do laboratório ou unidade" value="'+esc(estado.busca)+'" aria-label="Buscar pedido">';
  if(estado.especial) h+='<div class="chips"><span class="rot">Vindo do Início</span><button type="button" class="chip fixo" data-f="esp" data-v="">'+esc(FILTRO_NOME[estado.especial])+' ✕</button></div>';
  h+='<div class="chips"><span class="rot">Situação</span>'+chip('sit','','Todas',!estado.sit);
  ['E','C','R','X'].forEach(function(s){h+=chip('sit',s,{E:'No laboratório',C:'A caminho',R:'Recebidos',X:'Cancelados'}[s],estado.sit===s)});
  h+='</div><div class="chips"><span class="rot">Laboratório</span>'+chip('lab','','Todos',!estado.lab)+chip('lab','CP','Centro Paulista',estado.lab==='CP')+chip('lab','INJ','Injemed',estado.lab==='INJ')+
     '<span style="width:8px"></span>'+chip('acao','1','Só os que precisam de ação',estado.acao)+'</div>';
  if(!d){return h+'<div class="contagem">Carregando…</div></div><div class="lista"><div class="vazio">Carregando os pedidos…</div></div>'}
  h+='<div class="contagem">'+plural(d.qtd,'pedido','pedidos')+' · total '+R(d.total)+'</div></div>';
  h+='<div class="lista" role="list"><div class="cab" aria-hidden="true"><span>Nº DH</span><span>Unidade</span><span>Laboratório</span><span>Enviado em</span><span>Situação</span><span class="r">Total</span></div>';
  if(!d.itens.length) h+='<div class="vazio">Nenhum pedido com esses filtros.</div>';
  d.itens.forEach(function(p){
    var a=p.acoes[0];
    h+='<button type="button" class="linha" role="listitem" data-p="'+esc(p.id)+'">'+
     '<span class="c-dh dh">'+esc(p.num)+'<span class="nl">lab. '+esc(p.numLab||'—')+'</span></span>'+
     '<span class="c-un">'+esc(p.un)+'</span>'+
     '<span class="c-lab">'+esc(p.labNome)+'</span>'+
     '<span class="c-env"><span class="rot-m">enviado </span>'+dt(p.env)+'</span>'+
     '<span class="c-sit">'+tag(SIT_P[p.sit]||SIT_P.E)+'</span>'+
     '<span class="c-tot r num">'+(p.sub===0&&p.sit!=='X'?'<span style="color:var(--faint)">sem itens</span>':R(p.total))+'</span>'+
     '<span class="faz">'+(a?'<span aria-hidden="true">→</span><b style="--c:var('+a.cor+')">'+esc(a.txt)+'</b>'+(p.acoes.length>1?' <span>+'+(p.acoes.length-1)+' '+(p.acoes.length>2?'outras':'outra')+'</span>':''):'<span style="color:var(--faint)">Nada a fazer</span>')+'</span>'+
     '</button>';
  });
  h+='</div>';
  var resta=d.qtd-d.itens.length;
  if(resta>0) h+='<button type="button" class="mais" id="maisPed">Mostrar mais '+Math.min(60,resta)+' de '+resta+' restantes</button>';
  return h;
}
var seqPed=0;
async function carregarPedidos(anexar){
  var meu=++seqPed, f=filtrosPedidos();
  var ini=anexar&&cache.pedidos?cache.pedidos.itens.length:0;
  try{
    var d=await api('pedidos',Object.assign({inicio:ini,limite:60},f));
    if(meu!==seqPed) return;
    if(anexar&&cache.pedidos){cache.pedidos.itens=cache.pedidos.itens.concat(d.itens);cache.pedidos.qtd=d.qtd;cache.pedidos.total=d.total}
    else cache.pedidos=d;
    if(estado.tela==='pedidos') render();
  }catch(x){if(meu===seqPed&&estado.tela==='pedidos'&&x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
}

/* ---------- Pagamentos ---------- */
var GRUPOS=[
  {id:'V',f:function(x){return x.sit==='V'},sel:true},
  {id:'A7',f:function(x){return x.prox7},nome:'Vencem nos próximos 7 dias',acao:'Pagar até o vencimento',cor:'--blue',sel:true},
  {id:'P',f:function(x){return x.sit==='P'},cob:true},
  {id:'B',f:function(x){return x.sit==='B'},sel:true},
  {id:'A',f:function(x){return x.sit==='A'&&!x.prox7},nome:'A vencer (depois de 7 dias)',acao:'Nada a fazer agora — pagar no vencimento',cor:'--blue',sel:true},
  {id:'Q',f:function(x){return x.sit==='Q'}},
  {id:'X',f:function(x){return x.sit==='X'}}];
var GRUPO_TXT={V:'Venceram e não há pagamento nosso nem baixa do laboratório.',P:'Temos o comprovante, mas o laboratório ainda não registrou o pagamento (planilha e Omie).',B:'O laboratório registrou o pagamento, mas nosso comprovante não está anexado.',A:'Vencimento mais distante.',Q:'Pagamento nosso + baixa do laboratório conferidos.',X:'Canceladas, não precisam ser pagas.'};
function selecionadas(){var d=cache.pag;if(!d)return [];return d.parcelas.filter(function(x){return estado.sel[x.id]})}
function telaPagamentos(d){
  if(!d) return '<h2>Pagamentos</h2><p class="sub">Parcelas cobradas pelos laboratórios, agrupadas pelo que precisa ser feito.</p><p class="vazio">Carregando as parcelas…</p>';
  var base=d.parcelas.filter(function(x){return !estado.unid||x.unidade_id===estado.unid});
  var pode=d.pode_gravar;
  var h='<h2>Pagamentos</h2><p class="sub">Parcelas cobradas pelos laboratórios, agrupadas pelo que precisa ser feito.'+(pode?' Marque as parcelas pagas com o mesmo comprovante e clique em “Anexar comprovante”.':'')+'</p>'+
   '<div class="ferr"><label class="chips"><span class="rot">Unidade</span><select class="sel" id="unid"><option value="">Todas as unidades</option>'+
   d.unidades.map(function(u){return '<option value="'+esc(u.id)+'"'+(u.id===estado.unid?' selected':'')+'>'+esc(u.nome)+'</option>'}).join('')+'</select></label>'+
   '<div class="contagem">'+plural(base.length,'parcela','parcelas')+' · '+R(base.reduce(function(t,x){return t+x.valor},0))+'</div></div>';
  GRUPOS.forEach(function(g){
    var s=SIT_PC[g.id]||SIT_PC.A;
    var nome=g.nome||s[0], acao=g.acao||s[2], cor=g.cor||s[4];
    var l=base.filter(g.f).sort(function(a,b){return a.venc<b.venc?-1:a.venc>b.venc?1:0});
    var aberto=estado.abertos[g.id]!==undefined?estado.abertos[g.id]:(estado.grupo?estado.grupo===g.id:(g.id==='V'||g.id==='A7'));
    var lim=estado.abertos['lim'+g.id]||25;
    var txt=g.id==='A7'?'Ainda não venceram, mas vencem até '+dt(d.h7)+'.':GRUPO_TXT[g.id];
    h+='<section class="gp" id="g-'+g.id+'" style="--c:var('+cor+')'+(l.length?'':';opacity:.55')+'">'+
     '<button type="button" class="gp-cab" data-g="'+g.id+'" aria-expanded="'+aberto+'"><span class="t"><b>'+esc(nome)+'</b><span>'+esc(txt)+'</span><br><span style="color:var(--text);font-weight:600">→ '+esc(acao)+'</span></span>'+
     '<span class="tot"><b>'+R(l.reduce(function(t,x){return t+x.valor},0))+'</b><span>'+plural(l.length,'parcela','parcelas')+' · '+(aberto?'ocultar':'ver lista')+'</span></span></button>';
    if(aberto&&l.length){
      h+='<div class="gp-corpo">';
      if(g.cob) h+='<div class="gp-acoes">'+(estado.unid?'<button type="button" class="botao mini" data-cob-un="'+esc(estado.unid)+'">Gerar cobrança de baixa desta unidade</button><span>Monta a mensagem para o laboratório, com datas e valores. Nada é enviado.</span>':'<span>Para gerar a mensagem de cobrança, escolha a unidade acima (ou abra um pedido).</span>')+'</div>';
      if(g.sel&&pode) h+='<div class="gp-acoes"><span>Marque as parcelas pagas com um mesmo comprovante (todas da mesma unidade).</span></div>';
      h+='<div class="pl cab2"><span></span><span>Pedido</span><span>Unidade</span><span>Parcela</span><span>Vencimento</span><span class="r">Valor</span><span>Forma</span></div>';
      l.slice(0,lim).forEach(function(x){
        var marcavel=g.sel&&pode&&x.livre>0;
        h+='<div class="pl" role="button" tabindex="0" data-p="'+esc(x.pedido_id)+'"><span class="sel-c">'+(marcavel?'<input type="checkbox" data-selp="'+esc(x.id)+'" aria-label="Marcar parcela '+x.n+'/'+x.de+' do pedido '+esc(x.num)+'"'+(estado.sel[x.id]?' checked':'')+'>':'')+'</span>'+
         '<span class="dh" style="font-weight:700">'+esc(x.num)+'</span><span class="p-un">'+esc(x.un)+'</span><span class="p-n num">'+x.n+'/'+x.de+'</span><span class="p-venc num">vence '+dt(x.venc)+'</span><span class="r num" style="font-weight:600">'+R(x.valor)+'</span><span class="p-forma">'+esc(FORMA[x.forma]||x.forma)+'</span></div>';
      });
      if(l.length>lim) h+='<div style="padding:10px 16px"><button type="button" class="botao sec mini" data-mais="'+g.id+'">Mostrar mais ('+(l.length-lim)+' restantes)</button></div>';
      h+='</div>';
    }
    h+='</section>';
  });
  var sl=selecionadas();
  if(sl.length){
    var uns=new Set(sl.map(function(x){return x.unidade_id}));
    h+='<div class="barra-sel" id="barra-sel"><span>'+plural(sl.length,'parcela marcada','parcelas marcadas')+' · falta pagar '+R(sl.reduce(function(t,x){return t+x.livre},0))+(uns.size>1?' · <b>atenção: unidades diferentes</b>':'')+'</span>'+
      '<button type="button" class="botao sec mini" id="limpar-sel">Desmarcar</button><button type="button" class="botao mini" id="anexar-sel"'+(uns.size>1?' disabled':'')+'>Anexar comprovante</button></div>';
  }
  return h;
}
async function carregarPagamentos(){
  try{cache.pag=await api('pagamentos');if(estado.tela==='pagamentos'){render();if(estado.grupo){var g=$('#g-'+estado.grupo);if(g)g.scrollIntoView({block:'start'})}}}
  catch(x){if(estado.tela==='pagamentos'&&x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
}

/* ---------- ficha do pedido ---------- */
function ficha(d){
  var p=d.pedido, lab=d.lab, pode=d.pode_gravar;
  var pagas=p.parc.filter(function(x){return x.sit==='Q'||x.sit==='P'}).length, ativas=p.parc.filter(function(x){return x.sit!=='X'});
  var pagoEm=p.parc.map(function(x){return x.pagoEm}).filter(Boolean).sort()[0];
  var vencidas=p.parc.some(function(x){return x.sit==='V'});
  var canc=p.sit==='X';
  var et=[
    {n:'Pedido',d:dt(p.env),e:'enviado ao laboratório',c:p.env?'ok':''},
    {n:'Pagamento',d:ativas.length?(pagas+' de '+ativas.length+' pagas'):'sem parcelas',e:pagoEm?'1º pagamento '+dt(pagoEm):(ativas.some(function(x){return x.sit==='B'})?'baixa do lab., sem comprovante':''),c:vencidas?'ruim':(ativas.length&&pagas===ativas.length?'ok':(ativas.length?'atencao':''))},
    {n:'Laboratório',d:p.conf?dt(p.conf):(p.etapa?p.etapa.charAt(0)+p.etapa.slice(1).toLowerCase():'—'),e:p.atraso>0?p.atraso+' dias além do prazo ('+dt(p.prazo)+')':(p.prazo&&!p.exp?'prazo '+dt(p.prazo):''),c:p.atraso>0?'ruim':(p.exp||p.rec?'ok':'atencao')},
    {n:'Envio',d:dt(p.exp),e:p.rast?'rastreio '+p.rast:(p.diasCaminho?'há '+p.diasCaminho+' dias':''),c:p.exp?(p.diasCaminho>7?'atencao':'ok'):''},
    {n:'Entrega',d:dt(p.rec),e:p.rec?'recebido na unidade':'',c:p.rec?'ok':''}];
  if(canc) et.forEach(function(x){if(!x.c||x.c==='atencao'||x.c==='ruim')x.c='x'});
  var podeReceber=pode&&['E','L','C'].indexOf(p.sit)>=0;
  var livres=p.parc.filter(function(x){return x.livre>0});
  var temP=p.parc.some(function(x){return x.sit==='P'});
  var h='<div class="f-cab"><div class="tt"><h2>'+esc(p.num)+'</h2><div class="meta">'+esc(p.un)+' · '+esc(lab.nome)+' · '+esc(lab.numNome)+': '+esc(p.numLab||'—')+'</div><div style="margin-top:6px">'+tag(SIT_P[p.sit]||SIT_P.E)+'</div></div><button type="button" class="fechar" id="fechar" aria-label="Fechar ficha">×</button></div><div class="f-corpo">';
  if(p.acoes.length||podeReceber){
    h+='<div class="sec" style="border-left:4px solid var('+(p.acoes[0]?p.acoes[0].cor:'--amber')+')"><h4>O que fazer agora</h4>'+p.acoes.map(function(a){return '<div style="margin-bottom:4px">→ <b>'+esc(a.txt)+'</b></div>'}).join('');
    h+='<div class="acoes-f">'+(podeReceber?'<button type="button" class="botao mini" id="b-receber">Confirmar recebimento</button>':'')+
      (pode&&livres.length?'<button type="button" class="botao mini sec" data-anexar-ped="1">Anexar comprovante</button>':'')+
      (temP?'<button type="button" class="botao mini sec" data-cob-ped="'+esc(p.id)+'">Gerar cobrança de baixa</button>':'')+'</div>';
    if(podeReceber) h+='<div id="f-receber-box"></div>';
    h+='</div>';
  }
  if(canc) h+='<div class="sec"><h4>Cancelado</h4><div>'+esc(p.cancMot||'Motivo não informado')+'</div></div>';
  h+='<div class="sec"><h4>Linha do tempo</h4><ol class="tempo">'+et.map(function(x){return '<li class="'+x.c+'"><b>'+x.n+'</b><span>'+esc(x.d)+'</span>'+(x.e?'<em>'+esc(x.e)+'</em>':'')+'</li>'}).join('')+'</ol>'+
   '<div class="origem">Origem: '+(p.origem==='migracao'?'datas migradas do sistema antigo':'datas lançadas no sistema')+(p.etapa?'; etapa “'+esc(p.etapa)+'” veio da planilha do laboratório'+(p.etapaPrev?' (previsão '+dt(p.etapaPrev)+')':''):'')+'. Prazo do laboratório: '+lab.prazo+' dias corridos a partir do envio'+(p.prev?' (aqui vale a previsão informada)':'')+'.'+
   (p.rec&&p.recPor?' Recebimento confirmado por '+esc(p.recPor)+'.':'')+'</div></div>';
  h+='<div class="sec"><h4>Itens <small>'+plural(p.itens.length,'produto','produtos')+'</small></h4>';
  if(p.itens.length){
    h+='<table class="t"><thead><tr><th>Produto</th><th class="r">Qtd</th><th class="r">Preço</th><th class="r">Total</th></tr></thead><tbody>'+
     p.itens.map(function(it){return '<tr><td>'+esc(it.prod)+'</td><td class="r">'+Number(it.qtd).toLocaleString('pt-BR')+'</td><td class="r">'+R(it.preco)+'</td><td class="r">'+R(it.total)+'</td></tr>'}).join('')+
     '</tbody><tfoot><tr><td colspan="3">Produtos</td><td class="r">'+R(p.sub)+'</td></tr><tr><td colspan="3" style="font-weight:400">Frete</td><td class="r" style="font-weight:400">'+R(p.frete)+'</td></tr><tr><td colspan="3">Total do pedido</td><td class="r">'+R(p.total)+'</td></tr></tfoot></table>';
  } else h+='<div style="color:var(--muted)">Nenhum item cadastrado. No sistema antigo este pedido não tinha os produtos lançados. (Completar itens chega na próxima etapa.)</div>';
  h+='<div class="origem">Origem: itens e preços '+(p.origem==='migracao'?'migrados do sistema antigo':'lançados no sistema')+' (preço congelado na data do pedido).</div></div>';
  h+='<div class="sec"><h4>Parcelas <small>'+R(p.parc.reduce(function(t,x){return t+x.valor},0))+' cobrados pelo laboratório</small></h4>';
  if(!p.parc.length) h+='<div style="color:var(--muted)">Nenhuma parcela cadastrada.</div>';
  p.parc.forEach(function(x){
    var s=SIT_PC[x.sit]||SIT_PC.A;
    var bx=[]; if(x.bPlan)bx.push('baixa na planilha do laboratório em '+dt(x.bPlan)); if(x.bOmie)bx.push('baixa na Omie em '+dt(x.bOmie));
    var btn='';
    if(x.sit==='P') btn='<button type="button" class="botao mini" data-cob-ped="'+esc(p.id)+'">Cobrar baixa</button>';
    else if(pode&&x.livre>0) btn='<button type="button" class="botao mini" data-anexar-parc="'+esc(x.id)+'">'+(x.sit==='B'?'Anexar comprovante':'Pagar esta parcela')+'</button>';
    h+='<div class="parc"><div><b>Parcela '+x.n+' de '+x.de+'</b> · vence '+dt(x.venc)+' · '+esc(FORMA[x.forma]||x.forma)+'</div><div class="v">'+R(x.valor)+'</div>'+
     '<div class="d">'+(x.pago?'Pago por nós: '+R(x.pago)+(x.pagoEm?' em '+dt(x.pagoEm):'')+' (com comprovante)'+(x.livre>0&&x.sit!=='X'?' · falta '+R(x.livre):''):'Sem pagamento nosso registrado')+(bx.length?' · '+bx.join(' · '):' · sem baixa do laboratório')+(x.cancMot?' · '+esc(x.cancMot):'')+'</div>'+
     ((x.pagamentos||[]).length?'<ul class="pags">'+x.pagamentos.map(function(g){return '<li><span>Comprovante: '+R(g.valor)+' pago em '+dt(g.pago_em)+' ('+esc(FORMA[g.forma]||g.forma)+')'+(g.registrado_por&&g.registrado_por!=='migracao'?' · registrado por '+esc(g.registrado_por):'')+'</span>'+(g.abre?'<button type="button" class="link" data-abrir="'+esc(g.arquivo_id)+'">abrir</button>':'')+'</li>'}).join('')+'</ul>':'')+
     '<div class="a">'+tag(x.prox7?['Vence em até 7 dias','t-blue']:s)+btn+'</div>'+
     '<div class="d" style="color:var(--faint)">Origem: '+esc(x.orig)+'. Situação calculada pelo sistema, não digitada.</div></div>';
  });
  h+='</div>';
  h+='<div class="sec"><h4>Notas fiscais <small>'+plural(p.nf.length,'nota','notas')+'</small></h4>';
  if(p.nf.length) h+='<table class="t"><thead><tr><th>Número</th><th>Emissão</th><th class="r">Frete</th><th class="r">Total</th></tr></thead><tbody>'+p.nf.map(function(n){return '<tr><td>'+esc(n.num)+(n.canc?' '+tag(['Cancelada','t-gray']):'')+'</td><td>'+dt(n.emis)+'</td><td class="r">'+R(n.frete)+'</td><td class="r">'+R(n.total)+'</td></tr>'}).join('')+'</tbody></table>';
  else h+='<div style="color:var(--muted)">Nenhuma nota fiscal ligada a este pedido.</div>';
  h+='<div class="origem">Origem: notas migradas do sistema antigo e do Portal Omie.</div></div>';
  h+='<div class="sec"><h4>Anexos <small>'+plural(p.arq.length,'arquivo','arquivos')+'</small></h4>';
  if(p.arq.length) h+='<ul class="arqs">'+p.arq.map(function(a){return '<li><span class="nm">'+esc(a.nome)+(a.subst?' <span class="tag t-gray">substituído</span>':'')+(a.abre?' <button type="button" class="link" data-abrir="'+esc(a.id)+'">abrir</button>':'')+'</span><span class="ct">'+esc(a.cat)+'</span></li>'}).join('')+'</ul>';
  else h+='<div style="color:var(--muted)">Nenhum arquivo anexado.</div>';
  h+='<div class="origem">Arquivos do sistema antigo aparecem só com nome e tipo (ainda não foram copiados). Os enviados por aqui abrem com “abrir”.</div></div>';
  h+='<div class="sec"><h4>Dados do pedido</h4><dl class="kv"><dt>Nº interno</dt><dd>'+esc(p.num)+'</dd><dt>'+esc(lab.numNome)+'</dt><dd>'+esc(p.numLab||'—')+'</dd><dt>Laboratório</dt><dd>'+esc(lab.nomeLongo)+'</dd><dt>Condição padrão</dt><dd>'+esc(lab.cond)+'</dd>'+
   (p.tipo?'<dt>Tipo</dt><dd>'+(p.tipo==='mae'?'Pedido mãe':'Remessa de pedido mãe')+'</dd>':'')+
   (p.obs?'<dt>Observação</dt><dd>'+esc(p.obs)+'</dd>':'')+
   (p.recObs?'<dt>Obs. do recebimento</dt><dd>'+esc(p.recObs)+'</dd>':'')+
   '</dl><div class="origem">Origem: '+(p.leg?'migrado do sistema antigo (referência '+esc(p.leg)+')':'lançado no sistema novo')+'.</div></div>';
  h+='</div>';
  return h;
}
var ultimoFoco=null;
async function abrirFicha(id){
  var f=$('#ficha'); if(!f.classList.contains('on')) ultimoFoco=document.activeElement;
  f.innerHTML='<div class="f-cab"><div class="tt"><h2>Carregando…</h2></div><button type="button" class="fechar" id="fechar" aria-label="Fechar ficha">×</button></div><div class="f-corpo"><p class="vazio">Carregando a ficha do pedido…</p></div>';
  f.classList.add('on'); f.setAttribute('aria-hidden','false'); $('#veu').classList.add('on'); $('#fechar').focus();
  try{
    var d=await api('pedido',{pedido_id:id}); fichaAtual=d;
    if(!f.classList.contains('on')) return;
    f.innerHTML=ficha(d); $('.f-corpo',f).scrollTop=0; $('#fechar').focus();
  }catch(x){if(x.status!==401&&x.status!==403)$('.f-corpo',f).innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
}
function fecharFicha(){var f=$('#ficha');if(!f.classList.contains('on'))return;f.classList.remove('on');f.setAttribute('aria-hidden','true');$('#veu').classList.remove('on');fichaAtual=null;if(ultimoFoco&&ultimoFoco.focus)ultimoFoco.focus()}
function aposGravar(){
  cache.inicio=null; cache.pag=null; cache.pedidos=null; estado.sel={};
  if(fichaAtual) abrirFicha(fichaAtual.pedido.id);
  ir(estado.tela,true);
}

/* confirmar recebimento (dentro da ficha) */
function formReceber(){
  var box=$('#f-receber-box'); if(!box) return;
  var hoje=fichaAtual.hoje||HOJE, env=fichaAtual.pedido.env||'';
  box.innerHTML='<form id="f-receber" class="form-in" novalidate><div class="duas"><label class="campo"><span>Data em que chegou na unidade</span><input class="ent" type="date" id="r-data" value="'+hoje+'" max="'+hoje+'"'+(env?' min="'+env+'"':'')+' required></label></div>'+
    '<label class="campo"><span>Observação <small>(opcional — ex.: chegou com caixa amassada)</small></span><textarea class="ent" id="r-obs" maxlength="500"></textarea></label>'+
    '<div id="r-erro"></div><div class="acoes-f"><button type="submit" class="botao">Confirmar recebimento</button><button type="button" class="botao sec" id="r-cancela">Cancelar</button></div></form>';
  $('#r-data').focus();
}
async function enviarReceber(e){
  e.preventDefault();
  var d=$('#r-data').value, out=$('#r-erro'), bt=$('#f-receber button[type=submit]'), hoje=fichaAtual.hoje||HOJE;
  if(!d){out.innerHTML='<div class="erro">Informe a data em que o pedido chegou.</div>';return}
  if(d>hoje){out.innerHTML='<div class="erro">A data não pode ser no futuro.</div>';return}
  bt.disabled=true; bt.textContent='Gravando…';
  try{var r=await api('confirmar_recebimento',{pedido_id:fichaAtual.pedido.id,data:d,obs:$('#r-obs').value});avisar(r.mensagem||'Recebimento confirmado.');aposGravar()}
  catch(x){bt.disabled=false;bt.textContent='Confirmar recebimento';if($('#r-erro'))$('#r-erro').innerHTML='<div class="erro">'+esc(x.message)+'</div>'}
}

/* ---------- janelas ---------- */
var dlgFoco=null;
function abrirDlg(titulo,corpo){
  var d=$('#dlg'); dlgFoco=document.activeElement;
  d.innerHTML='<div class="dlg"><div class="dlg-cab"><h2 id="dlg-titulo">'+esc(titulo)+'</h2><button type="button" class="fechar" id="dlg-fechar" aria-label="Fechar">×</button></div>'+corpo+'</div>';
  d.classList.add('on'); var f=$('.dlg input:not([type=checkbox]),.dlg textarea,.dlg button.botao',d); (f||$('#dlg-fechar')).focus();
}
function fecharDlg(){var d=$('#dlg');if(!d.classList.contains('on'))return;d.classList.remove('on');d.innerHTML='';if(dlgFoco&&dlgFoco.focus)dlgFoco.focus()}

/* anexar comprovante: lista = parcelas que podem entrar; marcadas = já escolhidas */
var anexo=null;
function abrirAnexar(lista,marcadas,contexto){
  anexo={lista:lista,contexto:contexto,repetidoOk:false};
  var hoje=(fichaAtual&&fichaAtual.hoje)||(cache.pag&&cache.pag.hoje)||HOJE;
  var formas=lista.filter(function(x){return marcadas.indexOf(x.id)>=0}).map(function(x){return x.forma});
  var forma=formas[0]&&FORMAS_OK.indexOf(formas[0])>=0?formas[0]:'pix';
  var h='<form id="f-anexo" novalidate><div class="dlg-corpo">'+
    '<p style="margin:0 0 10px;color:var(--muted);font-size:14px">'+esc(contexto)+' Cada comprovante vale para uma unidade (CNPJ). O valor é distribuído nas parcelas marcadas, da que vence primeiro para a última.</p>'+
    '<div class="campo"><span>Parcelas pagas com este comprovante</span></div><div class="escolha">'+
    lista.map(function(x){return '<label><input type="checkbox" data-anx="'+esc(x.id)+'"'+(marcadas.indexOf(x.id)>=0?' checked':'')+'><span>'+esc(x.num)+' · parcela '+x.n+'/'+x.de+'<small>'+esc(x.un)+' · vence '+dt(x.venc)+(x.livre<x.valor?' · já pago '+R(x.valor-x.livre):'')+'</small></span><span class="v">'+R(x.livre)+'</span></label>'}).join('')+'</div>'+
    '<div class="duas"><label class="campo"><span>Valor pago (R$)</span><input class="ent num" id="a-valor" inputmode="decimal" autocomplete="off" required></label>'+
    '<label class="campo"><span>Data do pagamento</span><input class="ent" type="date" id="a-data" value="'+hoje+'" max="'+hoje+'" required></label></div>'+
    '<div class="duas"><label class="campo"><span>Forma</span><select class="ent" id="a-forma">'+FORMAS_OK.map(function(f){return '<option value="'+f+'"'+(f===forma?' selected':'')+'>'+FORMA[f]+'</option>'}).join('')+'</select></label>'+
    '<label class="campo"><span>Arquivo do comprovante <small>(PDF, JPG, PNG ou XML, até 10 MB)</small></span><input class="ent" type="file" id="a-arq" accept=".pdf,.jpg,.jpeg,.png,.xml,application/pdf,image/jpeg,image/png,application/xml,text/xml" required></label></div>'+
    '<label class="campo"><span>Observação <small>(opcional)</small></span><textarea class="ent" id="a-obs" maxlength="500"></textarea></label>'+
    '<div id="a-erro"></div></div><div class="dlg-pe"><button type="button" class="botao sec" id="dlg-cancela">Cancelar</button><button type="submit" class="botao" id="a-enviar">Registrar pagamento</button></div></form>';
  abrirDlg('Anexar comprovante de pagamento',h);
  atualizaValorAnexo(true);
}
var FORMAS_OK=['pix','boleto','cartao','outro'];
function marcadasAnexo(){return anexo.lista.filter(function(x){var c=$('[data-anx="'+x.id+'"]');return c&&c.checked})}
function atualizaValorAnexo(){var l=marcadasAnexo();var v=$('#a-valor');if(v)v.value=l.length?valBR(r2(l.reduce(function(t,x){return t+x.livre},0))):''}
function lerArquivo(f){return new Promise(function(ok,nok){var r=new FileReader();r.onload=function(){ok(String(r.result).replace(/^data:[^,]*,/,''))};r.onerror=function(){nok(new Error('Não foi possível ler o arquivo.'))};r.readAsDataURL(f)})}
async function enviarAnexo(e){
  if(e) e.preventDefault();
  var out=$('#a-erro'), bt=$('#a-enviar');
  var err=function(m){out.innerHTML='<div class="erro">'+esc(m)+'</div>'};
  var l=marcadasAnexo();
  if(!l.length) return err('Marque ao menos uma parcela.');
  if(new Set(l.map(function(x){return x.unidade_id})).size>1) return err('As parcelas marcadas são de unidades diferentes. Use um comprovante por unidade.');
  var livre=r2(l.reduce(function(t,x){return t+x.livre},0)), v=r2(numBR($('#a-valor').value));
  if(!(v>0)) return err('Informe o valor pago.');
  if(v>livre+0.005) return err('O valor ('+R(v)+') é maior do que falta pagar nas parcelas marcadas ('+R(livre)+').');
  var data=$('#a-data').value, hoje=$('#a-data').max;
  if(!data) return err('Informe a data do pagamento.');
  if(data>hoje) return err('A data do pagamento não pode ser no futuro.');
  var f=$('#a-arq').files[0];
  if(!f) return err('Escolha o arquivo do comprovante.');
  if(f.size>MAX_ARQ) return err('O arquivo passa de 10 MB. Envie uma versão menor.');
  if(!/\.(pdf|jpe?g|png|xml)$/i.test(f.name)) return err('Tipo de arquivo não aceito. Envie PDF, JPG, PNG ou XML.');
  bt.disabled=true; bt.textContent='Enviando…'; out.innerHTML='';
  try{
    var b64=await lerArquivo(f);
    var r=await api('anexar_comprovante',{parcela_ids:l.map(function(x){return x.id}),valor:v,pago_em:data,forma:$('#a-forma').value,obs:$('#a-obs').value,
      arquivo:{nome:f.name,tipo:f.type,base64:b64},confirmar_repetido:anexo.repetidoOk});
    fecharDlg(); avisar(r.mensagem||'Comprovante registrado.'); aposGravar();
  }catch(x){
    bt.disabled=false; bt.textContent='Registrar pagamento';
    if(!$('#a-erro')) return;
    if(x.corpo&&x.corpo.codigo==='repetido'){
      $('#a-erro').innerHTML='<div class="alerta"><b>'+esc(x.message)+'</b><br>'+(x.corpo.repetidos||[]).map(function(r){return esc(r.nome)+' — enviado em '+dt(r.em)+(r.pedidos?' (pedido '+esc(r.pedidos)+')':'')}).join('<br>')+
        '<div class="acoes-f"><button type="button" class="botao mini" id="a-mesmo">É outro pagamento — enviar mesmo assim</button></div></div>';
    } else err(x.message);
  }
}

/* cobrança de baixa */
async function abrirCobranca(dados){
  abrirDlg('Cobrança de baixa ao laboratório','<div class="dlg-corpo"><p class="vazio">Montando a mensagem…</p></div>');
  try{
    var r=await api('cobranca_baixa',dados);
    if(!$('#dlg').classList.contains('on')) return;
    var h='<div class="dlg-corpo">';
    if(!r.textos.length) h+='<p>'+esc(r.mensagem||'Nada a cobrar.')+'</p>';
    else h+='<p style="margin:0 0 12px;color:var(--muted);font-size:14px">Confira, copie e envie ao laboratório pelo canal de costume (e-mail ou WhatsApp). <b>O sistema não envia nada sozinho.</b></p>'+
      r.textos.map(function(t,i){return '<h3 style="margin-top:4px">'+esc(t.lab)+' · '+plural(t.qtd,'parcela','parcelas')+' · '+R(t.total)+'</h3><textarea class="txt-cob" id="cob-'+i+'" readonly>'+esc(t.texto)+'</textarea><div class="acoes-f" style="margin:0 0 16px"><button type="button" class="botao mini" data-copiar="cob-'+i+'">Copiar mensagem</button></div>'}).join('');
    h+='</div><div class="dlg-pe"><button type="button" class="botao sec" id="dlg-cancela">Fechar</button></div>';
    $('#dlg .dlg').innerHTML=$('#dlg .dlg-cab').outerHTML+h;
  }catch(x){if($('#dlg .dlg-corpo'))$('#dlg .dlg-corpo').innerHTML='<div class="erro">'+esc(x.message)+'</div>'}
}
async function copiar(id,bt){
  var t=$('#'+id); var ok=false;
  try{await navigator.clipboard.writeText(t.value);ok=true}catch(e){try{t.focus();t.select();ok=document.execCommand('copy')}catch(e2){}}
  bt.textContent=ok?'Copiado ✓':'Selecione o texto e copie (Ctrl+C)'; setTimeout(function(){bt.textContent='Copiar mensagem'},2500);
}
async function abrirArquivo(id){
  try{var r=await api('abrir_arquivo',{arquivo_id:id});window.open(r.url,'_blank','noopener')}catch(x){avisar(x.message)}
}

/* ---------- navegação ---------- */
var tAviso;
function avisar(t){var a=$('#aviso');a.textContent=t;a.classList.add('on');clearTimeout(tAviso);tAviso=setTimeout(function(){a.classList.remove('on')},4200)}
function render(){
  var t=estado.tela, el=$('#tela');
  document.querySelectorAll('.aba[data-ir]').forEach(function(b){if(b.dataset.ir===t)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  if(t==='pedidos') el.innerHTML=telaPedidos(cache.pedidos);
  else if(t==='pagamentos') el.innerHTML=telaPagamentos(cache.pag);
  else el.innerHTML=cache.inicio?telaInicio(cache.inicio):'<p class="vazio">Carregando os números…</p>';
}
async function ir(t,recarregar){
  estado.tela=t; try{history.replaceState(null,'','#'+t)}catch(e){}
  render(); if(!recarregar) window.scrollTo(0,0);
  if(t==='pedidos'){cache.pedidos=null;render();carregarPedidos()}
  else if(t==='pagamentos'){if(!cache.pag||recarregar)carregarPagamentos();else if(estado.grupo){var g=$('#g-'+estado.grupo);if(g)g.scrollIntoView({block:'start'})}}
  else{try{cache.inicio=await api('inicio');if(estado.tela==='inicio')render()}catch(x){if(estado.tela==='inicio'&&x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}}
}
var tBusca;
document.addEventListener('click',function(e){
  var b=e.target.closest('button,[data-p],input[type=checkbox]'); if(!b) return;
  if(b.matches('input[type=checkbox]')){
    if(b.dataset.selp){estado.sel[b.dataset.selp]=b.checked;var y=window.scrollY;render();window.scrollTo(0,y)}
    else if(b.dataset.anx) atualizaValorAnexo();
    e.stopPropagation(); return;
  }
  if(b.id==='sair'){sair();return}
  if(b.id==='recarregar'){iniciar();return}
  if(b.id==='tema'){trocaTema();return}
  if(b.id==='dlg-fechar'||b.id==='dlg-cancela'){fecharDlg();return}
  if(b.id==='a-mesmo'){anexo.repetidoOk=true;enviarAnexo();return}
  if(b.dataset.copiar){copiar(b.dataset.copiar,b);return}
  if(b.dataset.abrir){abrirArquivo(b.dataset.abrir);return}
  if(b.id==='b-receber'){formReceber();return}
  if(b.id==='r-cancela'){$('#f-receber-box').innerHTML='';return}
  if(b.dataset.cobPed){abrirCobranca({pedido_id:b.dataset.cobPed});return}
  if(b.dataset.cobUn){abrirCobranca({unidade_id:b.dataset.cobUn});return}
  if(b.dataset.anexarParc||b.dataset.anexarPed){
    var p=fichaAtual.pedido, lista=p.parc.filter(function(x){return x.livre>0}).map(function(x){return {id:x.id,num:p.num,un:p.un,unidade_id:p.unidade_id,n:x.n,de:x.de,venc:x.venc,valor:x.valor,livre:x.livre,forma:x.forma}});
    abrirAnexar(lista,b.dataset.anexarParc?[b.dataset.anexarParc]:lista.filter(function(x){return p.parc.some(function(y){return y.id===x.id&&(y.sit==='V'||y.sit==='B'||y.prox7)})}).map(function(x){return x.id}),'Pedido '+p.num+'.');
    return;
  }
  if(b.id==='anexar-sel'){var sl=selecionadas();abrirAnexar(sl,sl.map(function(x){return x.id}),'Parcelas marcadas na tela Pagamentos.');return}
  if(b.id==='limpar-sel'){estado.sel={};render();return}
  if(b.dataset.ir){estado.especial='';estado.grupo='';ir(b.dataset.ir);return}
  if(b.id==='novo'){avisar('Novo pedido ainda não faz parte desta versão. Vem na próxima etapa.');return}
  if(b.id==='fechar'){fecharFicha();return}
  if(b.dataset.card){var c=b.dataset.card.split(':');
    if(c[0]==='pedidos'){estado.especial=c[1];estado.sit='';estado.lab='';estado.acao=false;estado.busca='';ir('pedidos')}
    else{estado.grupo=c[1];estado.abertos={};estado.unid='';ir('pagamentos')}
    return}
  if(b.dataset.sit&&b.classList.contains('barra')){estado.especial='';estado.sit=b.dataset.sit;estado.lab='';estado.acao=false;ir('pedidos');return}
  if(b.dataset.f){var f=b.dataset.f,v=b.dataset.v;
    if(f==='sit')estado.sit=v; else if(f==='lab')estado.lab=v; else if(f==='acao')estado.acao=!estado.acao; else if(f==='esp')estado.especial='';
    cache.pedidos=null;render();carregarPedidos();return}
  if(b.id==='maisPed'){b.disabled=true;b.textContent='Carregando…';carregarPedidos(true);return}
  if(b.dataset.g){var id=b.dataset.g;var cur=b.getAttribute('aria-expanded')==='true';estado.abertos[id]=!cur;render();return}
  if(b.dataset.mais){estado.abertos['lim'+b.dataset.mais]=(estado.abertos['lim'+b.dataset.mais]||25)+50;render();return}
  if(b.dataset.p!==undefined){abrirFicha(b.dataset.p);return}
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){if($('#dlg').classList.contains('on'))fecharDlg();else fecharFicha();return}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('.pl[data-p]')){e.preventDefault();abrirFicha(e.target.dataset.p)}
});
$('#veu').addEventListener('click',fecharFicha);
$('#dlg').addEventListener('click',function(e){if(e.target.id==='dlg')fecharDlg()});
document.addEventListener('submit',function(e){
  var id=e.target.id;
  if(id==='f-login')entrar(e); else if(id==='f-senha')salvarSenha(e); else if(id==='f-mfa')confirmarMfa(e);
  else if(id==='f-receber')enviarReceber(e); else if(id==='f-anexo')enviarAnexo(e);
});
document.addEventListener('input',function(e){
  if(e.target.id==='busca'){estado.busca=e.target.value;clearTimeout(tBusca);tBusca=setTimeout(function(){
    var pos=e.target.selectionStart;cache.pedidos=null;carregarPedidos().then(function(){var n=$('#busca');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}})},300)}
});
document.addEventListener('change',function(e){if(e.target.id==='unid'){estado.unid=e.target.value;render()}});

/* tema */
var TEMAS=['auto','light','dark'],NOME_T={auto:'automático',light:'claro',dark:'escuro'},tema='auto';
try{tema=localStorage.getItem('dh-tema')||'auto'}catch(e){}
function aplicaTema(){if(tema==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',tema);$('#tema').textContent='Tema: '+NOME_T[tema]}
function trocaTema(){tema=TEMAS[(TEMAS.indexOf(tema)+1)%3];try{localStorage.setItem('dh-tema',tema)}catch(e){}aplicaTema()}
aplicaTema();

sb.auth.onAuthStateChange(function(ev){if(ev==='SIGNED_OUT'){EU=null;topoUsuario()}});
iniciar();
})();
