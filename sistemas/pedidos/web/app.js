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
  P:['Falta baixa na Omie','t-amber','Pedir ao laboratório a baixa na Omie','Pedir baixa','--amber'],
  N:['Falta nossa baixa no sistema','t-amber','Dar baixa no sistema (comprovante ou sem comprovante)','Dar baixa','--amber'],
  B:['Falta baixa na planilha do laboratório','t-amber','Pedir ao laboratório atualizar a planilha','Pedir atualização','--amber'],
  Q:['Finalizada — 3 baixas','t-green','Nada a fazer','','--green'],
  X:['Cancelada','t-gray','Nada a fazer','','--gray']};
var FORMA={cartao:'Cartão',pix:'PIX',boleto:'Boleto',outro:'Outra forma'};
function marca(d,exige){if(exige===false)return '<span class="fraco">não se aplica</span>';return d?'<span class="ok">✓</span> '+dt(d):'<span class="nao">✗</span> falta'}
function tag(t){return '<span class="tag '+t[1]+'">'+esc(t[0])+'</span>'}

/* ---------- API ---------- */
function ErroApi(status,corpo){this.status=status;this.corpo=corpo||{};this.message=(corpo&&corpo.erro)||('Erro '+status)}
async function api(acao,dados,url){
  var s=(await sb.auth.getSession()).data.session;
  if(!s){mostrarLogin();throw new ErroApi(401,{erro:'Entre com seu e-mail e senha.',codigo:'sem_sessao'})}
  var r;
  try{
    r=await fetch(url||API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.access_token,'apikey':SUPA_KEY},body:JSON.stringify(Object.assign({acao:acao},dados||{}))});
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
var estado={tela:'inicio',busca:'',sit:'',lab:'',acao:false,especial:'',lim:60,unid:'',grupo:'',abertos:{},sel:{},pUn:'',pDe:'',pAte:'',pPag:'',pOrdem:'urgencia',gBusca:'',gLab:'',gForma:'',gDe:'',gAte:''};
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
    {acao:'Pedir baixa na Omie ao laboratório',det:'Falta a baixa na Omie (o controle do laboratório). Sem ela o pagamento não finaliza.',c:'--amber',r:c.P,ir:['pagamentos','P']},
    {acao:'Dar baixa no sistema',det:'Omie e planilha já baixaram; falta a nossa baixa (comprovante, ou baixa sem comprovante conferida pela Omie).',c:'--amber',r:c.N,ir:['pagamentos','N']},
    {acao:'Pedir atualização da planilha',det:'A Omie já baixou, mas a planilha do laboratório não. Pendência de informação.',c:'--amber',r:c.B,ir:['pagamentos','B']},
    {acao:'Pagar — vencidas de verdade',det:'Venceram sem nenhuma das 3 baixas (Omie, planilha e nosso sistema).',c:'--red',r:c.V,ir:['pagamentos','V']},
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
function filtrosPedidos(){return {busca:estado.busca,sit:estado.sit,lab:estado.lab,so_acao:estado.acao,especial:estado.especial,unidade_id:estado.pUn,de:estado.pDe,ate:estado.pAte,pag:estado.pPag,ordem:estado.pOrdem}}
function opt(v,t,cur){return '<option value="'+esc(v)+'"'+(String(v)===String(cur||'')?' selected':'')+'>'+esc(t)+'</option>'}
function campo(rot,html){return '<label class="campo"><span>'+esc(rot)+'</span>'+html+'</label>'}
function filtrosAtivos(){return !!(estado.sit||estado.lab||estado.acao||estado.pUn||estado.pDe||estado.pAte||estado.pPag||estado.busca||estado.especial)}
function resumoParc(x){
  if(!x.n) return '<span class="fraco">sem parcelas</span>';
  var h='<span class="num">'+x.ok+'/'+x.n+' finalizadas</span>';
  if(x.venc) h+=' <span class="tag t-red mini">'+x.venc+' vencida'+(x.venc>1?'s':'')+'</span>';
  if(x.pend) h+=' <span class="tag t-amber mini">'+x.pend+' pend. de baixa</span>';
  if(x.falta>0) h+='<span class="sub2">falta '+R(x.falta)+(x.prox?' · vence '+dt(x.prox).slice(0,5):'')+'</span>';
  return h;
}
function telaPedidos(d){
  var uns=(d&&d.unidades)||estado.pUnLista||[]; if(d&&d.unidades) estado.pUnLista=d.unidades;
  var h='<div class="tit-linha"><h2>Pedidos</h2>'+(d?'<span class="contagem">'+plural(d.qtd,'pedido','pedidos')+' · total '+R(d.total)+'</span>':'')+'</div>';
  if(estado.especial) h+='<div class="chips" style="margin-bottom:8px"><span class="rot">Vindo do Início</span><button type="button" class="chip fixo" data-f="esp" data-v="">'+esc(FILTRO_NOME[estado.especial])+' ✕</button></div>';
  h+='<div class="filtros">'+
   campo('Buscar','<input class="busca" id="busca" type="search" placeholder="Nº DH, nº do laboratório, unidade ou rastreio" value="'+esc(estado.busca)+'">')+
   campo('Unidade','<select class="sel" data-pf="pUn">'+opt('','Todas',estado.pUn)+uns.map(function(u){return opt(u.id,u.nome,estado.pUn)}).join('')+'</select>')+
   campo('Laboratório','<select class="sel" data-pf="lab">'+opt('','Todos',estado.lab)+opt('CP','Centro Paulista',estado.lab)+opt('INJ','Injemed',estado.lab)+'</select>')+
   campo('Situação','<select class="sel" data-pf="sit">'+opt('','Todas',estado.sit)+opt('E','No laboratório',estado.sit)+opt('L','Confirmado pelo lab.',estado.sit)+opt('C','A caminho',estado.sit)+opt('R','Recebidos',estado.sit)+opt('X','Cancelados',estado.sit)+'</select>')+
   campo('Pagamento','<select class="sel" data-pf="pPag">'+opt('','Todos',estado.pPag)+opt('V','Com parcela vencida',estado.pPag)+opt('aberto','Com parcela a pagar',estado.pPag)+opt('P','Falta baixa na Omie',estado.pPag)+opt('B','Falta baixa na planilha',estado.pPag)+opt('N','Falta nossa baixa',estado.pPag)+opt('sem','Sem parcelas',estado.pPag)+'</select>')+
   campo('Enviado de','<input class="sel" type="date" data-pf="pDe" value="'+esc(estado.pDe||'')+'">')+
   campo('até','<input class="sel" type="date" data-pf="pAte" value="'+esc(estado.pAte||'')+'">')+
   campo('Ordenar por','<select class="sel" data-pf="pOrdem">'+opt('urgencia','Mais urgente primeiro',estado.pOrdem)+opt('recentes','Envio mais recente',estado.pOrdem)+opt('antigos','Envio mais antigo',estado.pOrdem)+opt('atraso','Mais dias de atraso',estado.pOrdem)+opt('valor','Maior valor',estado.pOrdem)+opt('unidade','Unidade (A–Z)',estado.pOrdem)+'</select>')+
   '<label class="campo chk"><input type="checkbox" id="so-acao"'+(estado.acao?' checked':'')+'><span>Só os que precisam de ação</span></label>'+
   (filtrosAtivos()?'<button type="button" class="botao sec mini" id="limpar-filtros">Limpar filtros</button>':'')+
   '</div>';
  if(!d) return h+'<div class="tabela"><div class="vazio">Carregando os pedidos…</div></div>';
  h+='<div class="tabela"><table class="tp"><thead><tr><th>Nº DH / lab.</th><th>Unidade</th><th>Lab.</th><th>Enviado</th><th>Prazo</th><th>Situação</th><th class="r">Total</th><th>Parcelas</th><th>NF</th><th>Próxima ação</th></tr></thead><tbody>';
  if(!d.itens.length) h+='<tr><td colspan="10" class="vazio">Nenhum pedido com esses filtros.</td></tr>';
  d.itens.forEach(function(p){
    var a=p.acoes[0], canc=p.sit==='X';
    var prazo=p.rec?'<span class="fraco">recebido '+dt(p.rec)+'</span>':(p.atraso>0?'<b class="vermelho">'+dt(p.prazo)+'</b><span class="sub2 vermelho">+'+p.atraso+' dias</span>':(p.exp?'<span class="fraco">saiu '+dt(p.exp)+'</span>'+(p.diasCaminho?'<span class="sub2">há '+p.diasCaminho+' dias</span>':''):dt(p.prazo)));
    h+='<tr class="lp'+(canc?' canc':'')+'" data-p="'+esc(p.id)+'" tabindex="0">'+
     '<td><b class="dh">'+esc(p.num)+'</b><span class="sub2">'+esc(p.numLab||'—')+'</span></td>'+
     '<td class="c-un">'+esc(p.un)+'</td>'+
     '<td class="nw">'+esc(p.lab==='CP'?'C. Paulista':p.labNome)+'</td>'+
     '<td class="num">'+dt(p.env)+'</td>'+
     '<td class="num">'+(canc?'—':prazo)+'</td>'+
     '<td class="nw">'+tag([SIT_CURTA[p.sit]||'—',(SIT_P[p.sit]||SIT_P.E)[1]])+(p.etapa&&!p.rec&&!canc?'<span class="sub2">lab.: '+esc(p.etapa.toLowerCase())+'</span>':'')+'</td>'+
     '<td class="r num">'+(p.sub===0&&!canc?'<span class="fraco">sem itens</span>':R(p.total))+'</td>'+
     '<td class="nw">'+(canc?'—':resumoParc(p.parc))+'</td>'+
     '<td class="num">'+(p.nf.length?esc(p.nf.slice(0,2).join(', '))+(p.nf.length>2?' +'+(p.nf.length-2):''):'<span class="fraco">—</span>')+'</td>'+
     '<td class="acao">'+(a?'<b style="--c:var('+a.cor+')">'+esc(a.txt)+'</b>'+(p.acoes.length>1?' <span class="fraco">+'+(p.acoes.length-1)+'</span>':''):'<span class="fraco">nada a fazer</span>')+'</td>'+
     '</tr>';
  });
  h+='</tbody></table></div>';
  var resta=d.qtd-d.itens.length;
  if(resta>0) h+='<button type="button" class="mais" id="maisPed">Mostrar mais '+Math.min(100,resta)+' de '+resta+' restantes</button>';
  return h;
}
var SIT_CURTA={E:'No laboratório',L:'Confirmado pelo lab.',C:'A caminho',R:'Recebido',X:'Cancelado',D:'Rascunho'};
var seqPed=0;
async function carregarPedidos(anexar){
  var meu=++seqPed, f=filtrosPedidos();
  var ini=anexar&&cache.pedidos?cache.pedidos.itens.length:0;
  try{
    var d=await api('pedidos',Object.assign({inicio:ini,limite:100},f));
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
  {id:'P',f:function(x){return x.sit==='P'},cob:true,sel:true},
  {id:'N',f:function(x){return x.sit==='N'},sel:true,semComp:true},
  {id:'B',f:function(x){return x.sit==='B'},cob:true},
  {id:'A',f:function(x){return x.sit==='A'&&!x.prox7},nome:'A vencer (depois de 7 dias)',acao:'Nada a fazer agora — pagar no vencimento',cor:'--blue',sel:true},
  {id:'Q',f:function(x){return x.sit==='Q'}},
  {id:'X',f:function(x){return x.sit==='X'}}];
var GRUPO_TXT={V:'Venceram sem nenhuma das 3 baixas: Omie, planilha do laboratório e nosso sistema.',P:'A Omie do laboratório ainda não baixou. Sem a Omie o pagamento não finaliza.',N:'Omie e planilha já baixaram. Falta a nossa baixa: anexe o comprovante ou dê baixa sem comprovante (vale porque a Omie já baixou).',B:'A Omie já baixou, mas a planilha do laboratório não. Pendência de informação: pedir ao laboratório atualizar.',A:'Vencimento mais distante.',Q:'Finalizadas: Omie, planilha e nosso sistema baixados.',X:'Canceladas, não precisam ser pagas.'};
function selecionadas(){var d=cache.pag;if(!d)return [];return d.parcelas.filter(function(x){return estado.sel[x.id]})}
function telaPagamentos(d){
  if(!d) return '<h2>Pagamentos</h2><p class="sub">Parcelas cobradas pelos laboratórios, agrupadas pelo que precisa ser feito.</p><p class="vazio">Carregando as parcelas…</p>';
  var bq=(estado.gBusca||'').trim().toLowerCase();
  var base=d.parcelas.filter(function(x){
    if(estado.unid&&x.unidade_id!==estado.unid) return false;
    if(estado.gLab&&x.lab!==estado.gLab) return false;
    if(estado.gForma&&x.forma!==estado.gForma) return false;
    if(estado.gDe&&x.venc<estado.gDe) return false;
    if(estado.gAte&&x.venc>estado.gAte) return false;
    if(bq&&(x.num+' '+(x.numLab||'')+' '+x.un).toLowerCase().indexOf(bq)<0) return false;
    return true});
  var pode=d.pode_gravar;
  var h='<h2>Pagamentos</h2><p class="sub">Parcelas cobradas pelos laboratórios, agrupadas pelo que precisa ser feito.'+(pode?' Marque as parcelas pagas com o mesmo comprovante e clique em “Anexar comprovante”.':'')+'</p>'+
   '<div class="filtros">'+
   campo('Buscar','<input class="busca" id="g-busca" type="search" placeholder="Nº DH, nº do laboratório ou unidade" value="'+esc(estado.gBusca)+'">')+
   campo('Unidade','<select class="sel" id="unid">'+opt('','Todas',estado.unid)+d.unidades.map(function(u){return opt(u.id,u.nome,estado.unid)}).join('')+'</select>')+
   campo('Laboratório','<select class="sel" data-gf="gLab">'+opt('','Todos',estado.gLab)+opt('CP','Centro Paulista',estado.gLab)+opt('INJ','Injemed',estado.gLab)+'</select>')+
   campo('Forma','<select class="sel" data-gf="gForma">'+opt('','Todas',estado.gForma)+opt('boleto','Boleto',estado.gForma)+opt('pix','PIX',estado.gForma)+opt('cartao','Cartão',estado.gForma)+opt('outro','Outra',estado.gForma)+'</select>')+
   campo('Vence de','<input class="sel" type="date" data-gf="gDe" value="'+esc(estado.gDe)+'">')+
   campo('até','<input class="sel" type="date" data-gf="gAte" value="'+esc(estado.gAte)+'">')+
   ((estado.unid||estado.gLab||estado.gForma||estado.gDe||estado.gAte||estado.gBusca)?'<button type="button" class="botao sec mini" id="limpar-g">Limpar filtros</button>':'')+
   '<span class="contagem">'+plural(base.length,'parcela','parcelas')+' · '+R(base.reduce(function(t,x){return t+x.valor},0))+'</span></div>';
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
      if(g.cob) h+='<div class="gp-acoes">'+(estado.unid?'<button type="button" class="botao mini" data-cob-un="'+esc(estado.unid)+'">Gerar mensagem ao laboratório desta unidade</button><span>Pede a baixa na Omie e/ou na planilha, com datas e valores. Nada é enviado.</span>':'<span>Para gerar a mensagem ao laboratório, escolha a unidade acima (ou abra um pedido).</span>')+'</div>';
      if(g.sel&&pode) h+='<div class="gp-acoes"><span>Marque as parcelas pagas com um mesmo comprovante (todas da mesma unidade).</span></div>';
      h+='<div class="tabela sem-borda"><table class="tp"><thead><tr><th class="sel-c"></th><th>Nº DH / lab.</th><th>Unidade</th><th>Lab.</th><th>Parcela</th><th>Vencimento</th><th class="r">Valor</th><th>Baixa Omie</th><th>Baixa planilha</th><th>Nosso sistema</th><th>Forma</th></tr></thead><tbody>';
      l.slice(0,lim).forEach(function(x){
        var marcavel=g.sel&&pode&&x.livre>0;
        h+='<tr class="lp" data-p="'+esc(x.pedido_id)+'" tabindex="0"><td class="sel-c">'+(marcavel?'<input type="checkbox" data-selp="'+esc(x.id)+'" aria-label="Marcar parcela '+x.n+'/'+x.de+' do pedido '+esc(x.num)+'"'+(estado.sel[x.id]?' checked':'')+'>':'')+'</td>'+
         '<td><b class="dh">'+esc(x.num)+'</b><span class="sub2">'+esc(x.numLab||'—')+'</span></td><td class="c-un">'+esc(x.un)+'</td><td>'+esc(x.lab==='CP'?'C. Paulista':x.labNome)+'</td>'+
         '<td class="num">'+x.n+'/'+x.de+'</td><td class="num">'+dt(x.venc)+(x.atrasoDias>0?'<span class="sub2 vermelho">há '+x.atrasoDias+' dias</span>':'')+'</td>'+
         '<td class="r num"><b>'+R(x.valor)+'</b></td>'+
         '<td class="num">'+marca(x.bOmie,x.exOmie)+'</td><td class="num">'+marca(x.bPlan,x.exPlan)+'</td>'+
         '<td class="num">'+(x.nossa?'<span class="ok">✓</span> '+(x.pago>=x.valor-0.01?'comprovante'+(x.pagoEm?' '+dt(x.pagoEm):''):'sem compr. '+dt(x.bSis)):(x.pago?'<span class="fraco">parcial '+R(x.pago)+'</span>':'<span class="nao">✗</span>'))+'</td>'+
         '<td class="nw">'+esc(FORMA[x.forma]||x.forma)+'</td></tr>';
      });
      h+='</tbody></table></div>';
      if(l.length>lim) h+='<div style="padding:10px 16px"><button type="button" class="botao sec mini" data-mais="'+g.id+'">Mostrar mais ('+(l.length-lim)+' restantes)</button></div>';
      h+='</div>';
    }
    h+='</section>';
  });
  var sl=selecionadas();
  if(sl.length){
    var uns=new Set(sl.map(function(x){return x.unidade_id}));
    h+='<div class="barra-sel" id="barra-sel"><span>'+plural(sl.length,'parcela marcada','parcelas marcadas')+' · falta pagar '+R(sl.reduce(function(t,x){return t+x.livre},0))+(uns.size>1?' · <b>atenção: unidades diferentes</b>':'')+'</span>'+
      '<button type="button" class="botao sec mini" id="limpar-sel">Desmarcar</button>'+(sl.every(function(x){return x.bOmie})?'<button type="button" class="botao sec mini" id="baixa-sel">Dar baixa sem comprovante</button>':'')+'<button type="button" class="botao mini" id="anexar-sel"'+(uns.size>1?' disabled':'')+'>Anexar comprovante</button></div>';
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
  var pagas=p.parc.filter(function(x){return x.sit==='Q'}).length, ativas=p.parc.filter(function(x){return x.sit!=='X'});
  var pagoEm=p.parc.map(function(x){return x.pagoEm}).filter(Boolean).sort()[0];
  var vencidas=p.parc.some(function(x){return x.sit==='V'});
  var canc=p.sit==='X';
  var et=[
    {n:'Pedido',d:dt(p.env),e:'enviado ao laboratório',c:p.env?'ok':''},
    {n:'Pagamento',d:ativas.length?(pagas+' de '+ativas.length+' finalizadas'):'sem parcelas',e:ativas.some(function(x){return x.sit==='P'||x.sit==='B'||x.sit==='N'})?'há baixas pendentes':(pagoEm?'1º pagamento '+dt(pagoEm):''),c:vencidas?'ruim':(ativas.length&&pagas===ativas.length?'ok':(ativas.length?'atencao':''))},
    {n:'Laboratório',d:p.conf?dt(p.conf):(p.etapa?p.etapa.charAt(0)+p.etapa.slice(1).toLowerCase():'—'),e:p.atraso>0?p.atraso+' dias além do prazo ('+dt(p.prazo)+')':(p.prazo&&!p.exp?'prazo '+dt(p.prazo):''),c:p.atraso>0?'ruim':(p.exp||p.rec?'ok':'atencao')},
    {n:'Envio',d:dt(p.exp),e:p.rast?'rastreio '+p.rast:(p.diasCaminho?'há '+p.diasCaminho+' dias':''),c:p.exp?(p.diasCaminho>7?'atencao':'ok'):''},
    {n:'Entrega',d:dt(p.rec),e:p.rec?'recebido na unidade':'',c:p.rec?'ok':''}];
  if(canc) et.forEach(function(x){if(!x.c||x.c==='atencao'||x.c==='ruim')x.c='x'});
  var podeReceber=pode&&['E','L','C'].indexOf(p.sit)>=0;
  var livres=p.parc.filter(function(x){return x.livre>0});
  var temP=p.parc.some(function(x){return x.sit==='P'||x.sit==='B'});
  var h='<div class="f-cab"><div class="tt"><h2>'+esc(p.num)+'</h2><div class="meta">'+esc(p.un)+' · '+esc(lab.nome)+' · '+esc(lab.numNome)+': '+esc(p.numLab||'—')+'</div><div style="margin-top:6px">'+tag(SIT_P[p.sit]||SIT_P.E)+'</div></div><button type="button" class="fechar" id="fechar" aria-label="Fechar ficha">×</button></div><div class="f-corpo">';
  if(p.acoes.length||podeReceber){
    h+='<div class="sec" style="border-left:4px solid var('+(p.acoes[0]?p.acoes[0].cor:'--amber')+')"><h4>O que fazer agora</h4>'+p.acoes.map(function(a){return '<div style="margin-bottom:4px">→ <b>'+esc(a.txt)+'</b></div>'}).join('');
    h+='<div class="acoes-f">'+(podeReceber?'<button type="button" class="botao mini" id="b-receber">Confirmar recebimento</button>':'')+
      (pode&&livres.length?'<button type="button" class="botao mini sec" data-anexar-ped="1">Anexar comprovante</button>':'')+
      (temP?'<button type="button" class="botao mini sec" data-cob-ped="'+esc(p.id)+'">Mensagem ao laboratório</button>':'')+'</div>';
    if(podeReceber) h+='<div id="f-receber-box"></div>';
    h+='</div>';
  }
  if(canc) h+='<div class="sec"><h4>Cancelado</h4><div>'+esc(p.cancMot||'Motivo não informado')+'</div></div>';
  h+='<div class="sec"><h4>Linha do tempo</h4><ol class="tempo">'+et.map(function(x){return '<li class="'+x.c+'"><b>'+x.n+'</b><span>'+esc(x.d)+'</span>'+(x.e?'<em>'+esc(x.e)+'</em>':'')+'</li>'}).join('')+'</ol>'+
   '<div class="origem">Origem: '+(p.origem==='migracao'?'datas migradas do sistema antigo':'datas lançadas no sistema')+(p.etapa?'; etapa “'+esc(p.etapa)+'” veio da planilha do laboratório'+(p.etapaPrev?' (previsão '+dt(p.etapaPrev)+')':''):'')+'. Prazo do laboratório: '+lab.prazo+' dias corridos a partir do envio'+(p.prev?' (aqui vale a previsão informada)':'')+'.'+
   (p.rec&&p.recPor?' Recebimento confirmado por '+esc(p.recPor)+'.':'')+'</div></div>';
  var arqPor=function(cods){return p.arq.filter(function(a){return cods.indexOf(a.cod)>=0})};
  var usados={};
  var lnk=function(a,rot){usados[a.id]=1;return a.abre?'<button type="button" class="link" data-abrir="'+esc(a.id)+'">'+esc(rot||'abrir')+'</button>':'<span class="fraco" title="Arquivo do sistema antigo, ainda não copiado">'+esc(rot||'')+' (no sistema antigo)</span>'};
  var arqLista=function(l){return '<ul class="arqs">'+l.map(function(a){usados[a.id]=1;return '<li><span class="nm">'+esc(a.nome)+(a.subst?' <span class="tag t-gray mini">substituído</span>':'')+'</span><span class="ct">'+esc(a.cat)+'</span><span class="ab">'+(a.abre?'<button type="button" class="link" data-abrir="'+esc(a.id)+'">abrir</button>':'<span class="fraco">no sistema antigo</span>')+'</span></li>'}).join('')+'</ul>'};
  var porId={}; p.arq.forEach(function(a){porId[a.id]=a});
  var colA='', colB='';
  // Itens
  var ed=pode&&!canc;
  colA+='<div class="sec"><h4>Itens <small>'+plural(p.itens.length,'produto','produtos')+(ed?' <button type="button" class="link" id="ed-itens">'+(p.itens.length?'editar itens':'completar itens')+'</button>':'')+'</small></h4>';
  if(p.itens.length){
    colA+='<table class="t"><thead><tr><th>Produto</th><th class="r">Qtd</th><th class="r">Preço</th><th class="r">Total</th></tr></thead><tbody>'+
     p.itens.map(function(it){return '<tr><td>'+esc(it.prod)+'</td><td class="r">'+Number(it.qtd).toLocaleString('pt-BR')+'</td><td class="r">'+R(it.preco)+'</td><td class="r">'+R(it.total)+'</td></tr>'}).join('')+
     '</tbody><tfoot><tr><td colspan="3">Produtos</td><td class="r">'+R(p.sub)+'</td></tr><tr><td colspan="3" style="font-weight:400">Frete</td><td class="r" style="font-weight:400">'+R(p.frete)+'</td></tr><tr><td colspan="3">Total do pedido</td><td class="r">'+R(p.total)+'</td></tr></tfoot></table>';
  } else colA+='<div class="fraco">Nenhum item cadastrado. No sistema antigo este pedido não tinha os produtos lançados.</div>';
  colA+='<div class="origem">Origem: itens e preços '+(p.origem==='migracao'?'migrados do sistema antigo':'lançados no sistema')+' (preço congelado na data do pedido).</div></div>';
  // Pedido e receita
  var docs=arqPor(['pedido_venda','espelho','receita','termo']);
  colA+='<div class="sec"><h4>Pedido e receita <small>'+plural(docs.length,'arquivo','arquivos')+'</small></h4>'+(docs.length?arqLista(docs):'<div class="fraco">Nenhum pedido de venda, espelho ou receita anexado.</div>')+'</div>';
  // Dados
  colA+='<div class="sec"><h4>Dados do pedido <small>'+(ed?'<button type="button" class="link" id="ed-pedido">editar dados</button> · <button type="button" class="link perigo" id="canc-pedido">cancelar pedido</button>':'')+(canc&&d.pode_admin?'<button type="button" class="link" id="reabrir-pedido">reabrir pedido</button>':'')+'</small></h4><dl class="kv"><dt>Nº interno</dt><dd>'+esc(p.num)+'</dd><dt>'+esc(lab.numNome)+'</dt><dd>'+esc(p.numLab||'—')+'</dd><dt>Laboratório</dt><dd>'+esc(lab.nomeLongo)+'</dd><dt>Condição padrão</dt><dd>'+esc(lab.cond)+'</dd>'+
   '<dt>Enviado ao laboratório</dt><dd>'+dt(p.env)+'</dd>'+(p.conf?'<dt>Confirmado pelo lab.</dt><dd>'+dt(p.conf)+'</dd>':'')+(p.prev?'<dt>Previsão de saída</dt><dd>'+dt(p.prev)+'</dd>':'')+(p.exp?'<dt>Saiu do laboratório</dt><dd>'+dt(p.exp)+'</dd>':'')+(p.rec?'<dt>Recebido na unidade</dt><dd>'+dt(p.rec)+'</dd>':'')+'<dt>Frete</dt><dd>'+R(p.frete)+'</dd>'+
   (p.rast?'<dt>Rastreio</dt><dd>'+esc(p.rast)+'</dd>':'')+
   (p.tipo?'<dt>Tipo</dt><dd>'+(p.tipo==='mae'?'Pedido mãe':'Remessa de pedido mãe')+'</dd>':'')+
   (p.obs?'<dt>Observação</dt><dd>'+esc(p.obs)+'</dd>':'')+
   (p.recObs?'<dt>Obs. do recebimento</dt><dd>'+esc(p.recObs)+'</dd>':'')+
   '</dl><div class="origem">Origem: '+(p.leg?'migrado do sistema antigo (referência '+esc(p.leg)+')':'lançado no sistema novo')+'.</div></div>';
  // Parcelas e boletos
  var boletosLivres=arqPor(['boleto']).filter(function(a){return !p.parc.some(function(x){return x.boleto===a.id})});
  colB+='<div class="sec"><h4>Parcelas e boletos <small>'+R(p.parc.reduce(function(t,x){return t+x.valor},0))+' cobrados pelo laboratório'+(ed?' · <button type="button" class="link" id="nova-parc">+ lançar parcela</button>':'')+'</small></h4>';
  if(!p.parc.length) colB+='<div class="fraco">Nenhuma parcela cadastrada.</div>';
  p.parc.forEach(function(x){
    var s=SIT_PC[x.sit]||SIT_PC.A;
    var btn='';
    if((x.sit==='P'||x.sit==='B')) btn+='<button type="button" class="botao mini sec" data-cob-ped="'+esc(p.id)+'">Mensagem ao laboratório</button>';
    if(pode&&x.livre>0) btn+='<button type="button" class="botao mini'+(x.sit==='V'||x.sit==='N'?'':' sec')+'" data-anexar-parc="'+esc(x.id)+'">'+(x.sit==='V'||x.sit==='A'?'Pagar esta parcela':'Anexar comprovante')+'</button>';
    if(pode&&!x.nossa&&x.bOmie&&x.sit!=='X') btn+='<button type="button" class="botao mini sec" data-baixa-parc="'+esc(x.id)+'">Baixar sem comprovante</button>';
    var tres='<div class="tres">'+
      '<span><b>Omie</b> '+marca(x.bOmie,x.exOmie)+'</span>'+
      '<span><b>Planilha</b> '+marca(x.bPlan,x.exPlan)+'</span>'+
      '<span><b>Nosso sistema</b> '+(x.nossa?'<span class="ok">✓</span> '+(x.pago>=x.valor-0.01?'comprovante':'sem comprovante '+dt(x.bSis)+(x.bSisPor?' por '+esc(x.bSisPor):'')):'<span class="nao">✗</span> falta')+'</span></div>';
    var bol=x.boleto&&porId[x.boleto]?porId[x.boleto]:null;
    colB+='<div class="parc"><div><b>Parcela '+x.n+' de '+x.de+'</b> · vence '+dt(x.venc)+' · '+esc(FORMA[x.forma]||x.forma)+'</div><div class="v">'+R(x.valor)+'</div>'+
     tres+(x.cancMot?'<div class="d">'+esc(x.cancMot)+'</div>':'')+(x.bSisObs?'<div class="d">Obs. da baixa: '+esc(x.bSisObs)+'</div>':'')+
     '<div class="d">Boleto: '+(bol?esc(bol.nome)+' '+lnk(bol,'abrir'):(x.forma==='boleto'?'<span class="fraco">não ligado a esta parcela'+(boletosLivres.length?' (veja os boletos do pedido abaixo)':'')+'</span>':'<span class="fraco">não se aplica</span>'))+'</div>'+
     '<div class="d">Comprovante: '+((x.pagamentos||[]).length?x.pagamentos.map(function(g){var a=porId[g.arquivo_id];if(a)usados[a.id]=1;return R(g.valor)+' em '+dt(g.pago_em)+' ('+esc(FORMA[g.forma]||g.forma)+') '+(g.abre?'<button type="button" class="link" data-abrir="'+esc(g.arquivo_id)+'">abrir</button>':'<span class="fraco">(no sistema antigo)</span>')}).join(' · '):(x.bSis?'<span class="fraco">baixa sem comprovante (Omie conferida)</span>':'<span class="fraco">nenhum</span>'))+'</div>'+
     '<div class="a">'+tag(x.prox7?['Vence em até 7 dias','t-blue']:s)+btn+'</div>'+(ed&&x.sit!=='X'?'<div class="d"><button type="button" class="link" data-ed-parc="'+esc(x.id)+'">editar parcela</button> · <button type="button" class="link perigo" data-canc-parc="'+esc(x.id)+'">cancelar parcela</button></div>':'')+'</div>';
  });
  if(p.parc.length){var origs={};p.parc.forEach(function(x){origs[x.orig]=1});colB+='<div class="origem">Origem das parcelas: '+esc(Object.keys(origs).join('; '))+'. A parcela só finaliza com as 3 baixas: Omie, planilha do laboratório e nosso sistema.</div>'}
  if(boletosLivres.length) colB+='<div class="sub-sec"><b>Boletos do pedido</b> <span class="fraco">(vieram do sistema antigo sem indicação da parcela)</span>'+arqLista(boletosLivres)+'</div>';
  // comprovantes soltos
  var compSoltos=arqPor(['comprovante']).filter(function(a){return !p.parc.some(function(x){return (x.pagamentos||[]).some(function(g){return g.arquivo_id===a.id})})});
  if(compSoltos.length) colB+='<div class="sub-sec"><b>Outros comprovantes</b>'+arqLista(compSoltos)+'</div>';
  colB+='</div>';
  // Notas fiscais
  colB+='<div class="sec"><h4>Notas fiscais <small>'+plural(p.nf.length,'nota','notas')+'</small></h4>';
  if(p.nf.length) colB+='<table class="t"><thead><tr><th>Número</th><th>Emissão</th><th class="r">Frete</th><th class="r">Total</th><th>PDF</th><th>XML</th></tr></thead><tbody>'+p.nf.map(function(n){
     var pdf=n.danfe_id?(porId[n.danfe_id]||{id:n.danfe_id,abre:n.d_abre}):null, xml=n.xml_id?(porId[n.xml_id]||{id:n.xml_id,abre:n.x_abre}):null;
     return '<tr><td>'+esc(n.num)+(n.canc?' '+tag(['Cancelada','t-gray']):'')+'</td><td>'+dt(n.emis)+'</td><td class="r">'+R(n.frete)+'</td><td class="r">'+R(n.total)+'</td><td>'+(pdf?lnk(pdf,'PDF'):'<span class="fraco">—</span>')+'</td><td>'+(xml?lnk(xml,'XML'):'<span class="fraco">—</span>')+'</td></tr>'}).join('')+'</tbody></table>';
  else colB+='<div class="fraco">Nenhuma nota fiscal ligada a este pedido.</div>';
  var nfSoltas=arqPor(['nota_fiscal','xml_nf']).filter(function(a){return !usados[a.id]});
  if(nfSoltas.length) colB+='<div class="sub-sec"><b>Arquivos de nota sem número ligado</b>'+arqLista(nfSoltas)+'</div>';
  colB+='<div class="origem">Origem: notas migradas do sistema antigo e do Portal Omie.</div></div>';
  // Outros anexos
  var outros=p.arq.filter(function(a){return !usados[a.id]});
  colB+='<div class="sec"><h4>Outros anexos <small>'+plural(outros.length,'arquivo','arquivos')+'</small></h4>'+(outros.length?arqLista(outros):'<div class="fraco">Nenhum.</div>')+'</div>';
  if(p.leg&&/^cp:/.test(p.leg)) colB+='<div class="sec" id="sec-legado"><h4>Sistema antigo <small>dados, links da Omie, conferência e histórico</small></h4><div class="fraco">Carregando…</div></div>';
  h+='<div class="f-cols"><div class="col">'+colA+'</div><div class="col">'+colB+'</div></div>';
  h+='<div class="origem">Arquivos marcados “no sistema antigo” ainda não foram copiados para o sistema novo. Os enviados por aqui abrem com “abrir”.</div>';
  h+='</div>';
  return h;
}
var API_HIST=SUPA_URL+'/functions/v1/pedidos-historico';
function dtHora(s){if(!s)return '—';var d=new Date(s);return isNaN(d)?esc(s):d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})}
async function carregaLegado(id){
  var el=$('#sec-legado'); if(!el) return;
  try{
    var r=await api('historico',{pedido_id:id},API_HIST);
    if(!fichaAtual||fichaAtual.pedido.id!==id||!(el=$('#sec-legado')))return;
    if(!r.tem){el.remove();return}
    var dados=Object.keys(r.dados).filter(function(k){var v=r.dados[k];return v!==null&&v!==undefined&&v!==''});
    var h='<h4>Sistema antigo <small>nº '+esc(r.id)+' · somente leitura</small></h4>';
    if(dados.length) h+='<dl class="kv">'+dados.map(function(k){var v=r.dados[k];return '<dt>'+esc(k)+'</dt><dd>'+esc(/^\d{4}-\d{2}-\d{2}$/.test(String(v))?dt(v):(typeof v==='object'?JSON.stringify(v):v))+'</dd>'}).join('')+'</dl>';
    if(r.links.length) h+='<div class="sub-sec"><b>Links</b><ul class="arqs">'+r.links.map(function(l){return '<li><span class="nm">'+esc(l.rotulo)+'</span><span class="ab"><a class="link" href="'+esc(l.url)+'" target="_blank" rel="noopener noreferrer">abrir</a></span></li>'}).join('')+'</ul></div>';
    if(r.conf) h+='<div class="sub-sec"><b>Conferência pedido × nota fiscal</b> <span class="fraco">('+esc(r.conf.nfs||'')+(r.conf.em?' · '+dt(r.conf.em):'')+')</span>'+
      (r.conf.ok?'<div class="d"><span class="ok">✓</span> Confere</div>':'<ul class="lista-simples">'+r.conf.diverg.map(function(x){return '<li class="vermelho">'+esc(x)+'</li>'}).join('')+'</ul>')+
      (r.conf.avisos.length?'<ul class="lista-simples">'+r.conf.avisos.map(function(x){return '<li class="fraco">'+esc(x)+'</li>'}).join('')+'</ul>':'')+'</div>';
    h+='<details class="sub-sec"><summary><b>Histórico de alterações</b> <span class="fraco">('+r.historico.length+')</span></summary><ul class="hist">'+
      r.historico.map(function(x){return '<li><span class="fraco">'+dtHora(x.em)+' · '+esc(x.por||'?')+(x.auto&&x.auto!==x.por?' ('+esc(x.auto)+')':'')+'</span><br>'+esc(x.texto)+'</li>'}).join('')+'</ul></details>';
    el.innerHTML=h;
  }catch(x){var e=$('#sec-legado');if(e)e.innerHTML='<h4>Sistema antigo</h4><div class="fraco">'+esc(x.message)+'</div>'}
}
var ultimoFoco=null;
async function abrirFicha(id){
  var f=$('#ficha'); if(!f.classList.contains('on')) ultimoFoco=document.activeElement;
  f.innerHTML='<div class="f-cab"><div class="tt"><h2>Carregando…</h2></div><button type="button" class="fechar" id="fechar" aria-label="Fechar ficha">×</button></div><div class="f-corpo"><p class="vazio">Carregando a ficha do pedido…</p></div>';
  f.classList.add('on'); f.setAttribute('aria-hidden','false'); $('#veu').classList.add('on'); $('#fechar').focus();
  try{
    var d=await api('pedido',{pedido_id:id}); fichaAtual=d;
    if(!f.classList.contains('on')) return;
    f.innerHTML=ficha(d); $('.f-corpo',f).scrollTop=0; $('#fechar').focus(); carregaLegado(id);
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


/* ---------- edição ---------- */
function campoD(rot,html,dica){return '<label class="campo"><span>'+esc(rot)+(dica?' <small>('+esc(dica)+')</small>':'')+'</span>'+html+'</label>'}
function inData(id,v,max){return '<input class="ent" type="date" id="'+id+'" value="'+esc(v||'')+'"'+(max?' max="'+max+'"':'')+'>'}
function erroDlg(x){var e=$('#dlg-erro');if(e)e.innerHTML='<div class="erro">'+esc(x.message||x)+'</div>'}
function rodapeDlg(txt){return '<div id="dlg-erro"></div></div><div class="dlg-pe"><button type="button" class="botao sec" id="dlg-cancela">Cancelar</button><button type="submit" class="botao">'+esc(txt)+'</button></div></form>'}
async function gravarDlg(form,acao,dados,okTxt){
  var bt=$('#'+form+' button[type=submit]'),t=bt.textContent;bt.disabled=true;bt.textContent='Gravando…';
  try{var r=await api(acao,dados);fecharDlg();avisar(r.mensagem||okTxt);aposGravar()}
  catch(x){bt.disabled=false;bt.textContent=t;erroDlg(x)}
}
function abrirEditarPedido(){
  var d=fichaAtual,p=d.pedido,h=d.hoje||HOJE;
  var html='<form id="f-edped" novalidate><div class="dlg-corpo"><p class="fraco" style="margin:0 0 10px">Tudo o que for alterado fica no registro de alterações, com seu e-mail.</p>'+
   '<div class="duas">'+campoD(d.lab.numNome,'<input class="ent" id="e-numlab" maxlength="40" value="'+esc(p.numLab||'')+'">')+
   campoD('Unidade','<select class="ent" id="e-un">'+d.unidades.map(function(u){return '<option value="'+esc(u.id)+'"'+(u.id===p.unidade_id?' selected':'')+'>'+esc(u.nome)+'</option>'}).join('')+'</select>')+'</div>'+
   '<div class="duas">'+campoD('Enviado ao laboratório',inData('e-env',p.env,h))+campoD('Confirmado pelo laboratório',inData('e-conf',p.conf,h),'opcional')+'</div>'+
   '<div class="duas">'+campoD('Previsão de saída do laboratório',inData('e-prev',p.prev),'opcional')+campoD('Saiu do laboratório',inData('e-exp',p.exp,h),'opcional')+'</div>'+
   '<div class="duas">'+campoD('Recebido na unidade',inData('e-rec',p.rec,h),'opcional')+campoD('Rastreio','<input class="ent" id="e-rast" maxlength="80" value="'+esc(p.rast||'')+'">','opcional')+'</div>'+
   '<div class="duas">'+campoD('Frete (R$)','<input class="ent num" id="e-frete" inputmode="decimal" value="'+esc(valBR(p.frete||0))+'">')+'<span></span></div>'+
   campoD('Observação','<textarea class="ent" id="e-obs" maxlength="1000">'+esc(p.obs||'')+'</textarea>','opcional')+rodapeDlg('Salvar alterações');
  abrirDlg('Editar dados do pedido '+p.num,html);
}
function enviarEditarPedido(e){
  e.preventDefault();
  var fr=numBR($('#e-frete').value);if(isNaN(fr)){erroDlg('Frete inválido.');return}
  gravarDlg('f-edped','editar_pedido',{pedido_id:fichaAtual.pedido.id,dados:{num_lab:$('#e-numlab').value,unidade_id:$('#e-un').value,enviado_em:$('#e-env').value,confirmado_lab_em:$('#e-conf').value,previsao_envio:$('#e-prev').value,expedido_em:$('#e-exp').value,recebido_em:$('#e-rec').value,rastreio:$('#e-rast').value,frete:fr,obs:$('#e-obs').value}},'Pedido atualizado.');
}
var cancAlvo=null;
function abrirCancelar(tipo,id,titulo,aviso){
  cancAlvo={tipo:tipo,id:id};
  abrirDlg(titulo,'<form id="f-canc" novalidate><div class="dlg-corpo"><p style="margin:0 0 10px">'+esc(aviso)+'</p>'+campoD('Motivo','<textarea class="ent" id="c-mot" maxlength="500" placeholder="Ex.: pedido duplicado; o laboratório cancelou por e-mail em 22/07"></textarea>')+rodapeDlg('Confirmar cancelamento'));
}
function enviarCancelar(e){
  e.preventDefault();var m=$('#c-mot').value.trim();if(m.length<5){erroDlg('Escreva o motivo (pelo menos 5 letras).');return}
  if(cancAlvo.tipo==='pedido')gravarDlg('f-canc','cancelar_pedido',{pedido_id:cancAlvo.id,motivo:m},'Pedido cancelado.');
  else gravarDlg('f-canc','cancelar_parcela',{parcela_id:cancAlvo.id,motivo:m},'Parcela cancelada.');
}
var parcAlvo=null;
function abrirParcela(id){
  var p=fichaAtual.pedido,h=fichaAtual.hoje||HOJE,x=id?p.parc.filter(function(y){return y.id===id})[0]:null;
  var ult=p.parc.filter(function(y){return y.sit!=='X'});
  parcAlvo=id||null;
  var de=x?x.de:(ult.length?ult[0].de:1), n=x?x.n:Math.min(de,ult.length+1);
  var html='<form id="f-parc" novalidate><div class="dlg-corpo">'+
   '<div class="duas">'+campoD('Parcela nº','<input class="ent num" id="p-n" inputmode="numeric" value="'+n+'">')+campoD('de (total de parcelas)','<input class="ent num" id="p-de" inputmode="numeric" value="'+de+'">')+'</div>'+
   '<div class="duas">'+campoD('Vencimento',inData('p-venc',x?x.venc:''))+campoD('Valor (R$)','<input class="ent num" id="p-valor" inputmode="decimal" value="'+(x?esc(valBR(x.valor)):'')+'">')+'</div>'+
   '<div class="duas">'+campoD('Forma','<select class="ent" id="p-forma">'+FORMAS_OK.map(function(f){return '<option value="'+f+'"'+(x&&x.forma===f||(!x&&f==='boleto')?' selected':'')+'>'+FORMA[f]+'</option>'}).join('')+'</select>')+'<span></span></div>'+
   '<div class="duas">'+campoD('Baixa na Omie',inData('p-omie',x?x.bOmie:'',h),'opcional; o robô da Omie preenche')+campoD('Baixa na planilha',inData('p-plan',x?x.bPlan:'',h),'opcional; só 1ª parcela')+'</div>'+
   rodapeDlg(x?'Salvar parcela':'Lançar parcela');
  abrirDlg(x?('Editar parcela '+x.n+'/'+x.de+' — '+p.num):('Lançar parcela — '+p.num),html);
}
function enviarParcela(e){
  e.preventDefault();
  var v=numBR($('#p-valor').value);if(isNaN(v)||v<=0){erroDlg('Informe o valor da parcela.');return}
  if(!$('#p-venc').value){erroDlg('Informe o vencimento.');return}
  gravarDlg('f-parc','salvar_parcela',{pedido_id:fichaAtual.pedido.id,parcela:{id:parcAlvo,pedido_id:fichaAtual.pedido.id,n:$('#p-n').value,de:$('#p-de').value,vencimento:$('#p-venc').value,valor:v,forma:$('#p-forma').value,baixa_omie_em:$('#p-omie').value,baixa_planilha_em:$('#p-plan').value}},'Parcela salva.');
}
var itensCat=null;
async function abrirItens(){
  var p=fichaAtual.pedido;
  abrirDlg('Itens do pedido '+p.num,'<div class="dlg-corpo"><p class="vazio">Carregando produtos e preços…</p></div>');
  try{itensCat=await api('produtos',{pedido_id:p.id})}catch(x){$('#dlg .dlg-corpo').innerHTML='<div class="erro">'+esc(x.message)+'</div>';return}
  var linhas=itensCat.itens.length?itensCat.itens:[{produto_id:'',qtd:'',preco:''}];
  var html='<form id="f-itens" novalidate><div class="dlg-corpo"><p class="fraco" style="margin:0 0 10px">O preço vem da tabela vigente em '+dt(itensCat.ref)+' (data do envio). Se o laboratório cobrou outro valor, altere o preço — a diferença aparece na conferência de cobrança.</p>'+
   '<table class="t itens-ed"><thead><tr><th>Produto</th><th class="r">Qtd</th><th class="r">Preço un.</th><th class="r">Total</th><th></th></tr></thead><tbody id="it-corpo">'+linhas.map(linhaItem).join('')+'</tbody>'+
   '<tfoot><tr><td><button type="button" class="link" id="it-mais">+ adicionar produto</button></td><td></td><td class="r">Produtos</td><td class="r" id="it-tot">—</td><td></td></tr></tfoot></table>'+rodapeDlg('Salvar itens');
  abrirDlg('Itens do pedido '+p.num,html);$('#dlg .dlg').classList.add('larga');
  totalItens();
}
function linhaItem(it){
  var ops='<option value="">— escolha —</option>'+itensCat.produtos.map(function(pr){return '<option value="'+esc(pr.id)+'" data-preco="'+(pr.preco==null?'':pr.preco)+'"'+(pr.id===it.produto_id?' selected':'')+'>'+esc(pr.descricao)+'</option>'}).join('');
  return '<tr class="it-l"><td><select class="ent it-prod">'+ops+'</select></td><td><input class="ent num it-qtd" inputmode="decimal" value="'+esc(it.qtd===''?'':String(it.qtd).replace('.',','))+'" style="width:80px"></td>'+
    '<td><input class="ent num it-preco" inputmode="decimal" value="'+esc(it.preco===''||it.preco==null?'':valBR(it.preco))+'" style="width:100px"></td><td class="r it-total">—</td><td><button type="button" class="link perigo it-rem" aria-label="Remover linha">×</button></td></tr>';
}
function totalItens(){
  var t=0;document.querySelectorAll('#it-corpo .it-l').forEach(function(tr){var q=numBR(tr.querySelector('.it-qtd').value),pr=numBR(tr.querySelector('.it-preco').value),v=(isNaN(q)||isNaN(pr))?0:r2(q*pr);tr.querySelector('.it-total').textContent=v?R(v):'—';t+=v});
  var e=$('#it-tot');if(e)e.textContent=R(t);
}
function enviarItens(e){
  e.preventDefault();var itens=[],erro='';
  document.querySelectorAll('#it-corpo .it-l').forEach(function(tr,i){var pid=tr.querySelector('.it-prod').value,q=numBR(tr.querySelector('.it-qtd').value),pr=numBR(tr.querySelector('.it-preco').value);
    if(!pid&&!tr.querySelector('.it-qtd').value)return;
    if(!pid)erro=erro||('Linha '+(i+1)+': escolha o produto.');else if(isNaN(q)||q<=0)erro=erro||('Linha '+(i+1)+': quantidade inválida.');else if(isNaN(pr)||pr<0)erro=erro||('Linha '+(i+1)+': preço inválido.');
    itens.push({produto_id:pid,qtd:q,preco:pr})});
  if(erro){erroDlg(erro);return}
  gravarDlg('f-itens','salvar_itens',{pedido_id:fichaAtual.pedido.id,itens:itens},'Itens salvos.');
}

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
var baixaIds=[];
function abrirBaixa(lista){
  baixaIds=lista.map(function(x){return x.id});
  var hoje=(fichaAtual&&fichaAtual.hoje)||(cache.pag&&cache.pag.hoje)||HOJE;
  var h='<form id="f-baixa" novalidate><div class="dlg-corpo"><p style="margin:0 0 10px;color:var(--muted);font-size:14px">Use quando a Omie do laboratório já baixou e você não tem o comprovante. Fica registrado quem deu a baixa e quando.</p>'+
    '<ul class="arqs">'+lista.map(function(x){return '<li><span class="nm">'+esc(x.num)+' · parcela '+x.n+'/'+x.de+' <small class="fraco">'+esc(x.un||'')+' · Omie '+dt(x.bOmie)+'</small></span><span class="ab">'+R(x.valor)+'</span></li>'}).join('')+'</ul>'+
    '<div class="duas"><label class="campo"><span>Data da baixa</span><input class="ent" type="date" id="b-data" value="'+hoje+'" max="'+hoje+'" required></label></div>'+
    '<label class="campo"><span>Observação <small>(opcional)</small></span><textarea class="ent" id="b-obs" maxlength="500" placeholder="Ex.: conferido na Omie; comprovante não localizado"></textarea></label>'+
    '<div id="b-erro"></div></div><div class="dlg-pe"><button type="button" class="botao sec" id="dlg-cancela">Cancelar</button><button type="submit" class="botao">Dar baixa ('+lista.length+')</button></div></form>';
  abrirDlg('Dar baixa sem comprovante',h);
}
async function enviarBaixa(e){
  e.preventDefault();
  var d=$('#b-data').value, bt=$('#f-baixa button[type=submit]');
  if(!d){$('#b-erro').innerHTML='<div class="erro">Informe a data.</div>';return}
  bt.disabled=true; bt.textContent='Gravando…';
  try{var r=await api('baixar_sem_comprovante',{parcela_ids:baixaIds,data:d,obs:$('#b-obs').value});fecharDlg();avisar(r.mensagem||'Baixa registrada.');aposGravar()}
  catch(x){bt.disabled=false;bt.textContent='Dar baixa';$('#b-erro').innerHTML='<div class="erro">'+esc(x.message)+'</div>'}
}
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
    if(b.id==='so-acao'){estado.acao=b.checked;cache.pedidos=null;render();carregarPedidos();e.stopPropagation();return}
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
    abrirAnexar(lista,b.dataset.anexarParc?[b.dataset.anexarParc]:lista.filter(function(x){return p.parc.some(function(y){return y.id===x.id&&(y.sit==='V'||y.sit==='N'||y.prox7)})}).map(function(x){return x.id}),'Pedido '+p.num+'.');
    return;
  }
  if(b.dataset.baixaParc){var pp=fichaAtual.pedido,xx=pp.parc.filter(function(y){return y.id===b.dataset.baixaParc})[0];abrirBaixa([{id:xx.id,num:pp.num,un:pp.un,n:xx.n,de:xx.de,valor:xx.valor,bOmie:xx.bOmie}]);return}
  if(b.id==='baixa-sel'){abrirBaixa(selecionadas());return}
  if(b.id==='ed-pedido'){abrirEditarPedido();return}
  if(b.id==='canc-pedido'){abrirCancelar('pedido',fichaAtual.pedido.id,'Cancelar pedido '+fichaAtual.pedido.num,'O pedido continua no sistema, marcado como cancelado, com o motivo. Só o administrador pode reabrir.');return}
  if(b.id==='reabrir-pedido'){if(confirm('Reabrir o pedido '+fichaAtual.pedido.num+'?')){api('reabrir_pedido',{pedido_id:fichaAtual.pedido.id}).then(function(r){avisar(r.mensagem);aposGravar()}).catch(function(x){avisar(x.message)})}return}
  if(b.id==='nova-parc'){abrirParcela(null);return}
  if(b.dataset.edParc){abrirParcela(b.dataset.edParc);return}
  if(b.dataset.cancParc){var xp=fichaAtual.pedido.parc.filter(function(y){return y.id===b.dataset.cancParc})[0];abrirCancelar('parcela',xp.id,'Cancelar parcela '+xp.n+'/'+xp.de+' — '+fichaAtual.pedido.num,'A parcela continua no sistema, marcada como cancelada, e deixa de ser cobrada. Parcela com comprovante ligado não pode ser cancelada.');return}
  if(b.id==='ed-itens'){abrirItens();return}
  if(b.id==='it-mais'){$('#it-corpo').insertAdjacentHTML('beforeend',linhaItem({produto_id:'',qtd:'',preco:''}));return}
  if(b.classList.contains('it-rem')){b.closest('tr').remove();totalItens();return}
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
  if(b.id==='limpar-filtros'){estado.sit='';estado.lab='';estado.acao=false;estado.pUn='';estado.pDe='';estado.pAte='';estado.pPag='';estado.busca='';estado.especial='';cache.pedidos=null;render();carregarPedidos();return}
  if(b.id==='limpar-g'){estado.unid='';estado.gLab='';estado.gForma='';estado.gDe='';estado.gAte='';estado.gBusca='';render();return}
  if(b.id==='maisPed'){b.disabled=true;b.textContent='Carregando…';carregarPedidos(true);return}
  if(b.dataset.g){var id=b.dataset.g;var cur=b.getAttribute('aria-expanded')==='true';estado.abertos[id]=!cur;render();return}
  if(b.dataset.mais){estado.abertos['lim'+b.dataset.mais]=(estado.abertos['lim'+b.dataset.mais]||25)+50;render();return}
  if(b.dataset.p!==undefined){abrirFicha(b.dataset.p);return}
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){if($('#dlg').classList.contains('on'))fecharDlg();else fecharFicha();return}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('.pl[data-p],tr.lp[data-p]')){e.preventDefault();abrirFicha(e.target.dataset.p)}
});
$('#veu').addEventListener('click',fecharFicha);
$('#dlg').addEventListener('click',function(e){if(e.target.id==='dlg')fecharDlg()});
document.addEventListener('submit',function(e){
  var id=e.target.id;
  if(id==='f-login')entrar(e); else if(id==='f-senha')salvarSenha(e); else if(id==='f-mfa')confirmarMfa(e);
  else if(id==='f-receber')enviarReceber(e); else if(id==='f-baixa')enviarBaixa(e); else if(id==='f-edped')enviarEditarPedido(e); else if(id==='f-canc')enviarCancelar(e); else if(id==='f-parc')enviarParcela(e); else if(id==='f-itens')enviarItens(e); else if(id==='f-anexo')enviarAnexo(e);
});
var tBuscaG;
document.addEventListener('input',function(e){
  if(e.target.classList&&(e.target.classList.contains('it-qtd')||e.target.classList.contains('it-preco'))){totalItens();return}
  if(e.target.id==='g-busca'){estado.gBusca=e.target.value;clearTimeout(tBuscaG);tBuscaG=setTimeout(function(){var pos=e.target.selectionStart;render();var n=$('#g-busca');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}},250);return}
  if(e.target.id==='busca'){estado.busca=e.target.value;clearTimeout(tBusca);tBusca=setTimeout(function(){
    var pos=e.target.selectionStart;cache.pedidos=null;carregarPedidos().then(function(){var n=$('#busca');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}})},300)}
});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.id==='unid'){estado.unid=t.value;render();return}
  if(t.classList&&t.classList.contains('it-prod')){var o=t.selectedOptions[0],pi=t.closest('tr').querySelector('.it-preco');if(o&&o.dataset.preco!==''&&o.dataset.preco!=null)pi.value=valBR(Number(o.dataset.preco));totalItens();return}
  if(t.dataset.pf){estado[t.dataset.pf]=t.value;cache.pedidos=null;render();carregarPedidos();return}
  if(t.dataset.gf){estado[t.dataset.gf]=t.value;render();return}
});

/* tema */
var TEMAS=['auto','light','dark'],NOME_T={auto:'automático',light:'claro',dark:'escuro'},tema='auto';
try{tema=localStorage.getItem('dh-tema')||'auto'}catch(e){}
function aplicaTema(){if(tema==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',tema);$('#tema').textContent='Tema: '+NOME_T[tema]}
function trocaTema(){tema=TEMAS[(TEMAS.indexOf(tema)+1)%3];try{localStorage.setItem('dh-tema',tema)}catch(e){}aplicaTema()}
aplicaTema();

sb.auth.onAuthStateChange(function(ev){if(ev==='SIGNED_OUT'){EU=null;topoUsuario()}});
iniciar();
})();
