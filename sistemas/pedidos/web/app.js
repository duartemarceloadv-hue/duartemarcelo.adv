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

// 5 cores de situação (kit): n neutro, i informação, s sucesso, a atenção, d perigo — sempre com texto
var SIT_P={E:['Enviado ao laboratório, aguardando produção','i'],L:['Confirmado pelo laboratório','i'],C:['A caminho da unidade','a'],R:['Recebido na unidade','s'],X:['Cancelado','n'],D:['Rascunho','n']};
var SIT_PC={
  V:['Vencida e sem pagamento','d','Pagar — vencidas de verdade','Pagar esta parcela','--red'],
  A:['A vencer','i','Pagar no vencimento','Pagar esta parcela','--blue'],
  P:['Falta baixa na Omie','a','Pedir ao laboratório a baixa na Omie','Pedir baixa','--amber'],
  N:['Falta nossa baixa no sistema','a','Dar baixa no sistema (comprovante ou sem comprovante)','Dar baixa','--amber'],
  B:['Falta baixa na planilha do laboratório','a','Pedir ao laboratório atualizar a planilha','Pedir atualização','--amber'],
  Q:['Finalizada — 3 baixas','s','Nada a fazer','','--green'],
  X:['Cancelada','n','Nada a fazer','','--gray']};
var FORMA={cartao:'Cartão',pix:'PIX',boleto:'Boleto',outro:'Outra forma'};
function marca(d,exige){if(exige===false)return '<span class="fraco">não se aplica</span>';return d?'<span class="ok">'+dt(d)+'</span>':'<span class="nao">falta</span>'}
function tag(t){return '<span class="selo '+t[1]+'">'+esc(t[0])+'</span>'}

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
var estado={tela:'inicio',busca:'',sit:'',lab:'',acao:false,especial:'',grupo:'',abertos:{},sel:{},pDe:'',pAte:'',pPag:'',pOrdem:'urgencia',pEtapa:'',pNf:'',pAtraso:'',gBusca:'',gLab:'',gForma:'',gDe:'',gAte:'',gOmie:'',gPlan:'',gSis:'',
  unidade:'',fichaId:'',voltar:'pedidos'};
var cache={inicio:null,pedidos:null,pag:null};
var fichaAtual=null, UNIDADES=[];
// unidade escolhida no cabeçalho: vale em todas as telas e fica guardada neste navegador (o servidor continua decidindo o acesso)
var CH_UN='dh-pedidos-unidade';
try{estado.unidade=localStorage.getItem(CH_UN)||''}catch(e){estado.unidade=''}
function guardaUnidade(){try{if(estado.unidade)localStorage.setItem(CH_UN,estado.unidade);else localStorage.removeItem(CH_UN)}catch(e){}}
function nomeUnidade(id){var u=UNIDADES.filter(function(x){return x.id===id})[0];return u?u.nome:''}

/* ---------- casca: menu, cabeçalho, barra inferior ---------- */
function casca(logado){
  $('#menu').hidden=!logado; $('#barinf').hidden=!logado;
  if(!logado){$('#unid-box').hidden=true}
}
function montaUnidades(){
  var box=$('#unid-box'), s=$('#unid-sel');
  if(estado.unidade&&!UNIDADES.some(function(u){return u.id===estado.unidade})){estado.unidade='';guardaUnidade()}
  if(UNIDADES.length<=1){box.hidden=true;estado.unidade='';return}
  s.innerHTML=opt('','Todas as unidades',estado.unidade)+UNIDADES.map(function(u){return opt(u.id,u.nome,estado.unidade)}).join('');
  box.hidden=false; box.classList.toggle('rest',!!estado.unidade);
}
var GRUPO_TELA={inicio:'lab',pedidos:'lab',pagamentos:'lab',receitas:'lab',termos:'lab',unidades:'cad',pessoas:'cad',pendencias:'cad'};
function marcaMenu(){
  var t=estado.menu||(estado.tela==='pedido'?estado.voltar:estado.tela), g=GRUPO_TELA[t]||'lab';
  document.querySelectorAll('.sub a[data-ir],.barinf a[data-ir]').forEach(function(a){var on=a.dataset.ir===t||!!(a.dataset.grupo&&a.dataset.grupo===g&&!document.querySelector('.barinf a[data-ir="'+t+'"]'));a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  document.querySelectorAll('.mi[data-grupo]').forEach(function(mi){var on=mi.dataset.grupo===g;mi.classList.toggle('on',on);if(on&&(t==='inicio'||t==='unidades'))mi.setAttribute('aria-current','page');else mi.removeAttribute('aria-current')});
}
// mostra no menu só o que o acesso permite (o servidor continua barrando)
function menuPorAcesso(){
  var cad=!!(EU&&EU.cadastros), rec=!!(EU&&EU.receitas);
  document.querySelectorAll('[data-acesso=cadastros]').forEach(function(e){e.hidden=!cad});
  document.querySelectorAll('[data-acesso=receitas]').forEach(function(e){e.hidden=!rec});
}
function iniciais(n){var p=String(n||'?').trim().split(/\s+/);return ((p[0]||'?')[0]+(p.length>1?p[p.length-1][0]:'')).toUpperCase()}

/* ---------- acesso: login, troca de senha, autenticador ---------- */
function telaAcesso(h){
  casca(false); fecharDlg();
  $('#tela').innerHTML='<section class="acesso">'+h+'</section>';
  var f=$('#tela input'); if(f) f.focus();
}
var PAPEL={operacoes:'Operações',admin:'Administrador',central:'Central',financeiro:'Financeiro',leitura:'Somente leitura',unidade:'Unidade',socio:'Sócio'};
function topoUsuario(){
  var u=$('#usuario');
  if(!EU){u.hidden=true;u.innerHTML='';return}
  u.hidden=false;
  u.innerHTML='<button type="button" class="usr" id="usr-btn" aria-haspopup="true" aria-expanded="false" aria-label="Menu do usuário: '+esc(EU.nome)+'">'+esc(iniciais(EU.nome))+'</button>'+
    '<div class="usrpop" id="usr-pop" hidden><div class="nm">'+esc(EU.nome)+'</div><div class="pf">'+esc(PAPEL[EU.papel]||EU.papel||'')+(EU.email?' · '+esc(EU.email):'')+'</div>'+
    '<button type="button" id="tema2">'+esc($('#tema').textContent)+'</button><button type="button" id="sair">Sair</button></div>';
}
function mostrarLogin(msg){
  EU=null; topoUsuario();
  telaAcesso('<h1>Entrar</h1><p>Use o e-mail e a senha do Sistema de Pedidos.</p>'+(msg?'<div class="alerta">'+esc(msg)+'</div>':'')+
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
  telaAcesso('<h1>Troque a senha temporária</h1><p>Por segurança, crie a sua senha antes de usar o sistema. Use pelo menos 10 caracteres, com letras e números.</p>'+
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
    telaAcesso('<h1>Código do autenticador</h1><p>Abra o aplicativo autenticador no celular e digite o código de 6 números de “Pedidos Dr. Hair”.</p>'+formCodigo());
    return;
  }
  // remove cadastros começados e não concluídos
  var pend=(l.data.all||[]).filter(function(f){return f.status!=='verified'});
  for(var i=0;i<pend.length;i++){await sb.auth.mfa.unenroll({factorId:pend[i].id})}
  var en=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'Pedidos Dr. Hair'});
  if(en.error){telaAcesso('<div class="erro">Não foi possível iniciar o cadastro do autenticador ('+esc(en.error.message)+'). Saia e entre de novo.</div><button class="botao grande" type="button" id="sair">Sair</button>');return}
  mfaFator=en.data.id;
  var qr=svgQr(en.data.totp.qr_code||'');
  telaAcesso('<h1>Cadastre o autenticador</h1><p>Quem cuida do financeiro entra com senha <b>e</b> um código do celular. É feito uma vez só.</p>'+
    '<ol class="passos"><li>Instale no celular um aplicativo autenticador (Google Authenticator ou Microsoft Authenticator).</li><li>No aplicativo, toque em “adicionar” e leia o código abaixo com a câmera.</li><li>Digite o código de 6 números que aparecer.</li></ol>'+
    '<div class="qr"><img alt="Código QR para cadastrar o autenticador" src="'+esc(qr)+'"></div>'+
    '<div style="font-size:12px;color:var(--muted);margin-bottom:4px">Sem câmera? Digite esta chave no aplicativo:</div><div class="segredo">'+esc(en.data.totp.secret)+'</div>'+formCodigo());
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
async function sair(){await sb.auth.signOut().catch(function(){});cache={inicio:null,pedidos:null,pag:null};EU=null;menuPorAcesso();mostrarLogin()}

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
  try{UNIDADES=(await api('unidades')).unidades||[]}
  catch(x){try{UNIDADES=(await api('pedidos',{limite:1})).unidades||[]}catch(y){UNIDADES=[]}} // API antiga sem a ação 'unidades'
  casca(true); montaUnidades(); menuPorAcesso();
  rota(true);
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
function titulo(t,ac,linha){return '<div class="tit"><h1>'+esc(t)+'</h1>'+(ac?'<div class="ac">'+ac+'</div>':'')+'</div>'+(linha?'<p class="atual">'+linha+'</p>':'')}
function escopoTxt(){return estado.unidade?esc(nomeUnidade(estado.unidade)):(UNIDADES.length>1?'todas as unidades':'')}
function telaInicio(d){
  var h=titulo('Laboratórios — o que fazer','','Cada cartão mostra quantos itens pedem ação e quanto dinheiro envolve'+(escopoTxt()?' ('+escopoTxt()+')':'')+'. Clique para ver a lista.');
  if(!d) return h+'<p class="vazio">Carregando os números…</p>';
  defCartoes(d).forEach(function(g){
    h+='<section class="grupo"><h2>'+g.g+'</h2><div class="cards">';
    g.itens.forEach(function(c){
      var val=c.semValor?'total ainda não calculado':R(c.r.v);
      h+='<button type="button" class="card'+(c.r.n?'':' zero')+'" style="--c:var('+c.c+')" data-card="'+c.ir[0]+':'+c.ir[1]+'">'+
         '<span class="ac">'+esc(c.acao)+'</span><span class="nums"><span class="v">'+c.r.n+'</span><span class="val">'+val+'</span></span>'+
         '<span class="det">'+esc(c.det)+'</span></button>';
    });
    h+='</div></section>';
  });
  var o=d.onde, ordem=['E','L','C'], max=Math.max(1,o.E,o.L,o.C), cor={E:'--blue',L:'--blue',C:'--amber'};
  h+='<section class="grupo"><h2>Onde estão os pedidos em aberto</h2><div class="painel"><div class="barras">';
  ordem.forEach(function(s){
    h+='<button type="button" class="barra" data-sit="'+s+'" style="--c:var('+cor[s]+')"><span>'+esc(SIT_P[s][0])+'</span><span class="trilho"><span class="ench" style="width:'+(o[s]/max*100)+'%"></span></span><span class="n">'+o[s]+'</span></button>';
  });
  h+='</div><p class="nota-rodape">'+o.abertos+' pedidos em aberto, dos quais '+o.atrasados+' já passaram do prazo do laboratório. Recebidos: '+o.recebidos+' · Cancelados: '+o.cancelados+'.</p></div></section>';
  return h;
}

/* ---------- Pedidos ---------- */
function filtrosPedidos(){return {busca:estado.busca,sit:estado.sit,lab:estado.lab,so_acao:estado.acao,especial:estado.especial,unidade_id:estado.unidade,de:estado.pDe,ate:estado.pAte,pag:estado.pPag,ordem:estado.pOrdem,etapa:estado.pEtapa,nf:estado.pNf,atrasado:estado.pAtraso}}
function opt(v,t,cur){return '<option value="'+esc(v)+'"'+(String(v)===String(cur||'')?' selected':'')+'>'+esc(t)+'</option>'}
function campo(rot,html,cls){return '<label class="campo'+(cls?' '+cls:'')+'"><span>'+esc(rot)+'</span>'+html+'</label>'}
function filtrosAtivos(){return !!(estado.sit||estado.lab||estado.acao||estado.pDe||estado.pAte||estado.pPag||estado.busca||estado.especial||estado.pEtapa||estado.pNf||estado.pAtraso)}
function limpaFiltrosPed(){estado.sit='';estado.lab='';estado.acao=false;estado.pDe='';estado.pAte='';estado.pPag='';estado.busca='';estado.especial='';estado.pEtapa='';estado.pNf='';estado.pAtraso=''}
// etapa da planilha do laboratório vem em maiúsculas: mostra só a 1ª letra maiúscula
function etapaTxt(e){e=String(e||'').toLowerCase();return e.charAt(0).toUpperCase()+e.slice(1)}

var SIT_CURTA={E:'No laboratório',L:'Confirmado pelo lab.',C:'A caminho',R:'Recebido',X:'Cancelado',D:'Rascunho'};
function telaPedidos(d){
  var comUn=!estado.unidade;
  var h=titulo('Pedidos','<button type="button" class="btn" id="novo" aria-disabled="true" title="Ainda não faz parte desta versão">Novo pedido <span class="selo n">em breve</span></button>',
    d?plural(d.qtd,'pedido','pedidos')+' · total '+R(d.total)+(escopoTxt()?' · '+escopoTxt():''):'');
  if(estado.especial) h+='<div class="filtros"><span class="fraco">Vindo do Início:</span><button type="button" class="botao sec mini" data-f="esp" data-v="">'+esc(FILTRO_NOME[estado.especial])+' — tirar filtro</button></div>';
  h+='<div class="filtros">'+
   campo('Buscar','<input class="busca" id="busca" type="search" placeholder="Nº DH, nº do laboratório, unidade ou rastreio" value="'+esc(estado.busca)+'">','c-busca')+
   campo('Laboratório','<select class="sel" data-pf="lab">'+opt('','Todos',estado.lab)+opt('CP','Centro Paulista',estado.lab)+opt('INJ','Injemed',estado.lab)+'</select>')+
   campo('Situação','<select class="sel" data-pf="sit">'+opt('','Todas',estado.sit)+opt('E','No laboratório',estado.sit)+opt('L','Confirmado pelo lab.',estado.sit)+opt('C','A caminho',estado.sit)+opt('R','Recebidos',estado.sit)+opt('X','Cancelados',estado.sit)+'</select>')+
   campo('Etapa no laboratório','<select class="sel" data-pf="pEtapa">'+opt('','Todas',estado.pEtapa)+opt('sem','Sem etapa informada',estado.pEtapa)+((d&&d.etapas)||(estado.pEtapa&&estado.pEtapa!=='sem'?[estado.pEtapa]:[])).map(function(e){return opt(e,etapaTxt(e),estado.pEtapa)}).join('')+'</select>')+
   campo('Nota fiscal','<select class="sel" data-pf="pNf">'+opt('','Todos',estado.pNf)+opt('com','Com NF',estado.pNf)+opt('sem','Sem NF',estado.pNf)+'</select>')+
   campo('Atraso','<select class="sel" data-pf="pAtraso">'+opt('','Todos',estado.pAtraso)+opt('sim','Atrasados',estado.pAtraso)+opt('nao','Sem atraso',estado.pAtraso)+'</select>')+
   campo('Pagamento','<select class="sel" data-pf="pPag">'+opt('','Todos',estado.pPag)+opt('V','Com parcela vencida',estado.pPag)+opt('aberto','Com parcela a pagar',estado.pPag)+opt('P','Falta baixa na Omie',estado.pPag)+opt('B','Falta baixa na planilha',estado.pPag)+opt('N','Falta nossa baixa',estado.pPag)+opt('sem','Sem parcelas',estado.pPag)+'</select>')+
   campo('Enviado de','<input class="sel" type="date" data-pf="pDe" value="'+esc(estado.pDe||'')+'">')+
   campo('até','<input class="sel" type="date" data-pf="pAte" value="'+esc(estado.pAte||'')+'">')+
   campo('Ordenar por','<select class="sel" data-pf="pOrdem">'+opt('urgencia','Mais urgente primeiro',estado.pOrdem)+opt('recentes','Envio mais recente',estado.pOrdem)+opt('antigos','Envio mais antigo',estado.pOrdem)+opt('atraso','Mais dias de atraso',estado.pOrdem)+opt('valor','Maior valor',estado.pOrdem)+opt('unidade','Unidade (A–Z)',estado.pOrdem)+'</select>')+
   '<label class="campo chk"><input type="checkbox" id="so-acao"'+(estado.acao?' checked':'')+'><span>Só os que precisam de ação</span></label>'+
   (filtrosAtivos()?'<button type="button" class="botao sec mini" id="limpar-filtros">Limpar filtros</button>':'')+
   '</div>';
  if(!d) return h+'<div class="tabela"><div class="vazio">Carregando os pedidos…</div></div>';
  // uma informação por coluna (para filtrar e ordenar): nada empilhado na mesma célula
  var nc=comUn?13:12;
  h+='<div class="tabela cartoes t12"><table><thead><tr><th>Nº DH</th>'+(comUn?'<th>Unidade</th>':'')+'<th>Lab.</th><th>Nº no lab.</th><th>NF</th><th>Enviado</th><th>Prazo</th><th class="r">Atraso</th><th>Situação</th><th>Etapa no lab.</th><th class="r">Total</th><th class="r">Falta pagar</th><th>Próxima ação</th></tr></thead><tbody>';
  if(!d.itens.length) h+='<tr><td colspan="'+nc+'" class="vazio">Nenhum pedido com esses filtros.</td></tr>';
  d.itens.forEach(function(p){
    var a=p.acoes[0], canc=p.sit==='X', aberto=!canc&&!p.rec;
    var nf=p.nf.length?esc(p.nf.slice(0,2).join(', '))+(p.nf.length>2?' +'+(p.nf.length-2):''):'';
    var et=p.etapa&&aberto?esc(etapaTxt(p.etapa)):'';
    var falta=!canc&&p.parc.n&&p.parc.falta>0?R(p.parc.falta):'';
    h+='<tr class="lp'+(canc?' canc':'')+'" data-p="'+esc(p.id)+'" tabindex="0">'+
     '<td class="c1"><b class="dh">'+esc(p.num)+'</b></td>'+
     (comUn?'<td class="cl"><span class="rot-m">Unidade </span>'+esc(p.un)+'</td>':'')+
     '<td class="cl"><span class="rot-m">Laboratório </span>'+esc(p.lab==='CP'?'C. Paulista':p.labNome)+'</td>'+
     '<td class="cl num'+(p.numLab?'':' vz')+'"><span class="rot-m">Nº no laboratório </span>'+esc(p.numLab||'—')+'</td>'+
     '<td class="cl num'+(nf?'':' vz')+'"><span class="rot-m">NF </span>'+(nf||'<span class="fraco">—</span>')+'</td>'+
     '<td class="cl num'+(p.env?'':' vz')+'"><span class="rot-m">Enviado </span>'+dt(p.env)+'</td>'+
     '<td class="cl num'+(aberto&&p.prazo?'':' vz')+'"><span class="rot-m">Prazo </span>'+(aberto&&p.prazo?(p.atraso>0?'<b class="vermelho">'+dt(p.prazo)+'</b>':dt(p.prazo)):'<span class="fraco">—</span>')+'</td>'+
     '<td class="cl r num'+(aberto&&p.atraso>0?'':' vz')+'"><span class="rot-m">Dias de atraso </span>'+(aberto&&p.atraso>0?'<b class="vermelho">'+p.atraso+'</b>':'<span class="fraco">—</span>')+'</td>'+
     '<td class="cl"><span class="rot-m">Situação </span>'+tag([SIT_CURTA[p.sit]||'—',(SIT_P[p.sit]||SIT_P.E)[1]])+'</td>'+
     '<td class="cl'+(et?'':' vz')+'"><span class="rot-m">Etapa no laboratório </span>'+(et||'<span class="fraco">—</span>')+'</td>'+
     '<td class="c2 r num">'+(p.sub===0&&!canc?'<span class="fraco">sem itens</span>':R(p.total))+'</td>'+
     '<td class="cl r num'+(falta?'':' vz')+'"><span class="rot-m">Falta pagar </span>'+(falta||'<span class="fraco">—</span>')+'</td>'+
     '<td class="cl acao">'+(a?'<b style="--c:var('+a.cor+')">'+esc(a.txt)+'</b>'+(p.acoes.length>1?' <span class="fraco">+'+(p.acoes.length-1)+'</span>':''):'<span class="fraco">nada a fazer</span>')+'</td>'+
     '</tr>';
  });
  h+='</tbody></table></div>';
  var resta=d.qtd-d.itens.length;
  if(resta>0) h+='<button type="button" class="mais" id="maisPed">Mostrar mais '+Math.min(100,resta)+' de '+resta+' restantes</button>';
  return h;
}
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
// nossa baixa em duas colunas: data da baixa no sistema e se tem comprovante
function comComp(x){return x.nossa&&x.pago>=x.valor-0.01}
function nossaData(x){return x.nossa?'<span class="ok">'+dt(comComp(x)?(x.pagoEm||x.bSis):x.bSis)+'</span>':'<span class="nao">falta</span>'}
function compTxt(x){return comComp(x)?'Com comprovante':(x.nossa?'Sem comprovante':(x.pago?'Pagamento parcial':'—'))}
function filtraBaixa(f,d,exige){return !f||(f==='na'?exige===false:(exige!==false&&(f==='feita')===!!d))}
function telaPagamentos(d){
  if(!d) return titulo('Pagamentos','','Parcelas cobradas pelos laboratórios, agrupadas pelo que precisa ser feito.')+'<p class="vazio">Carregando as parcelas…</p>';
  var bq=(estado.gBusca||'').trim().toLowerCase(), comUn=!estado.unidade;
  var base=d.parcelas.filter(function(x){
    if(estado.unidade&&x.unidade_id!==estado.unidade) return false;
    if(estado.gLab&&x.lab!==estado.gLab) return false;
    if(estado.gForma&&x.forma!==estado.gForma) return false;
    if(estado.gDe&&x.venc<estado.gDe) return false;
    if(estado.gAte&&x.venc>estado.gAte) return false;
    if(bq&&(x.num+' '+(x.numLab||'')+' '+x.un).toLowerCase().indexOf(bq)<0) return false;
    if(!filtraBaixa(estado.gOmie,x.bOmie,x.exOmie)||!filtraBaixa(estado.gPlan,x.bPlan,x.exPlan)) return false;
    if(estado.gSis&&(estado.gSis==='falta'?x.nossa:(!x.nossa||(estado.gSis==='comp')!==comComp(x)))) return false;
    return true});
  var pode=d.pode_gravar;
  var h=titulo('Pagamentos','','Parcelas cobradas pelos laboratórios, agrupadas pelo que precisa ser feito'+(escopoTxt()?' ('+escopoTxt()+')':'')+'.'+(pode?' Marque as parcelas pagas com o mesmo comprovante e clique em “Anexar comprovante”.':''))+
   '<div class="filtros">'+
   campo('Buscar','<input class="busca" id="g-busca" type="search" placeholder="Nº DH, nº do laboratório ou unidade" value="'+esc(estado.gBusca)+'">','c-busca')+
   campo('Laboratório','<select class="sel" data-gf="gLab">'+opt('','Todos',estado.gLab)+opt('CP','Centro Paulista',estado.gLab)+opt('INJ','Injemed',estado.gLab)+'</select>')+
   campo('Forma','<select class="sel" data-gf="gForma">'+opt('','Todas',estado.gForma)+opt('boleto','Boleto',estado.gForma)+opt('pix','PIX',estado.gForma)+opt('cartao','Cartão',estado.gForma)+opt('outro','Outra',estado.gForma)+'</select>')+
   campo('Baixa na Omie','<select class="sel" data-gf="gOmie">'+opt('','Todas',estado.gOmie)+opt('feita','Feita',estado.gOmie)+opt('falta','Falta',estado.gOmie)+opt('na','Não se aplica',estado.gOmie)+'</select>')+
   campo('Baixa na planilha','<select class="sel" data-gf="gPlan">'+opt('','Todas',estado.gPlan)+opt('feita','Feita',estado.gPlan)+opt('falta','Falta',estado.gPlan)+opt('na','Não se aplica',estado.gPlan)+'</select>')+
   campo('Nossa baixa','<select class="sel" data-gf="gSis">'+opt('','Todas',estado.gSis)+opt('comp','Com comprovante',estado.gSis)+opt('semcomp','Sem comprovante',estado.gSis)+opt('falta','Falta',estado.gSis)+'</select>')+
   campo('Vence de','<input class="sel" type="date" data-gf="gDe" value="'+esc(estado.gDe)+'">')+
   campo('até','<input class="sel" type="date" data-gf="gAte" value="'+esc(estado.gAte)+'">')+
   ((estado.gLab||estado.gForma||estado.gDe||estado.gAte||estado.gBusca||estado.gOmie||estado.gPlan||estado.gSis)?'<button type="button" class="botao sec mini" id="limpar-g">Limpar filtros</button>':'')+
   '<span class="contagem">'+plural(base.length,'parcela','parcelas')+' · '+R(base.reduce(function(t,x){return t+x.valor},0))+'</span></div>';
  GRUPOS.forEach(function(g){
    var s=SIT_PC[g.id]||SIT_PC.A;
    var nome=g.nome||s[0], acao=g.acao||s[2], cor=g.cor||s[4];
    var l=base.filter(g.f).sort(function(a,b){return a.venc<b.venc?-1:a.venc>b.venc?1:0});
    var aberto=estado.abertos[g.id]!==undefined?estado.abertos[g.id]:(estado.grupo?estado.grupo===g.id:(g.id==='V'||g.id==='A7'));
    var lim=estado.abertos['lim'+g.id]||25;
    var txt=g.id==='A7'?'Ainda não venceram, mas vencem até '+dt(d.h7)+'.':GRUPO_TXT[g.id];
    h+='<section class="gp'+(l.length?'':' vazio-g')+'" id="g-'+g.id+'" style="--c:var('+cor+')">'+
     '<button type="button" class="gp-cab" data-g="'+g.id+'" aria-expanded="'+aberto+'"><span class="t"><b class="gn">'+esc(nome)+'</b><span>'+esc(txt)+'</span><span class="faz">'+esc(acao)+'</span></span>'+
     '<span class="tot"><b>'+R(l.reduce(function(t,x){return t+x.valor},0))+'</b><span>'+plural(l.length,'parcela','parcelas')+' · '+(aberto?'ocultar':'ver lista')+'</span></span></button>';
    if(aberto&&l.length){
      h+='<div class="gp-corpo">';
      if(g.cob) h+='<div class="gp-acoes">'+(estado.unidade?'<button type="button" class="botao mini" data-cob-un="'+esc(estado.unidade)+'">Gerar mensagem ao laboratório desta unidade</button><span>Pede a baixa na Omie e/ou na planilha, com datas e valores. Nada é enviado.</span>':'<span>Para gerar a mensagem ao laboratório, escolha a unidade no alto da tela (ou abra um pedido).</span>')+'</div>';
      if(g.sel&&pode) h+='<div class="gp-acoes"><span>Marque as parcelas pagas com um mesmo comprovante (todas da mesma unidade).</span></div>';
      h+='<div class="tabela sem-borda cartoes com-sel t12"><table><thead><tr><th class="sel-c"></th><th>Nº DH</th><th>Parcela</th>'+(comUn?'<th>Unidade</th>':'')+'<th>Lab.</th><th>Vencimento</th><th class="r">Atraso</th><th class="r">Valor</th><th>Baixa Omie</th><th>Baixa planilha</th><th>Nossa baixa</th><th>Comprovante</th><th>Forma</th></tr></thead><tbody>';
      l.slice(0,lim).forEach(function(x){
        var marcavel=g.sel&&pode&&x.livre>0, ct=compTxt(x);
        h+='<tr class="lp" data-p="'+esc(x.pedido_id)+'" tabindex="0"><td class="sel-c">'+(marcavel?'<input type="checkbox" data-selp="'+esc(x.id)+'" aria-label="Marcar parcela '+x.n+'/'+x.de+' do pedido '+esc(x.num)+'"'+(estado.sel[x.id]?' checked':'')+'>':'')+'</td>'+
         '<td class="c1"><b class="dh">'+esc(x.num)+'</b></td>'+
         '<td class="cl num"><span class="rot-m">Parcela </span>'+x.n+'/'+x.de+'</td>'+
         (comUn?'<td class="cl"><span class="rot-m">Unidade </span>'+esc(x.un)+'</td>':'')+
         '<td class="cl"><span class="rot-m">Laboratório </span>'+esc(x.lab==='CP'?'C. Paulista':x.labNome)+'</td>'+
         '<td class="cl num"><span class="rot-m">Vence </span>'+dt(x.venc)+'</td>'+
         '<td class="cl r num'+(x.atrasoDias>0?'':' vz')+'"><span class="rot-m">Dias de atraso </span>'+(x.atrasoDias>0?'<b class="vermelho">'+x.atrasoDias+'</b>':'<span class="fraco">—</span>')+'</td>'+
         '<td class="c2 r num"><b>'+R(x.valor)+'</b></td>'+
         '<td class="cl"><span class="rot-m">Baixa na Omie </span>'+marca(x.bOmie,x.exOmie)+'</td>'+
         '<td class="cl"><span class="rot-m">Baixa na planilha </span>'+marca(x.bPlan,x.exPlan)+'</td>'+
         '<td class="cl"><span class="rot-m">Nossa baixa </span>'+nossaData(x)+'</td>'+
         '<td class="cl'+(ct==='—'?' vz':'')+'"><span class="rot-m">Comprovante </span>'+(ct==='—'?'<span class="fraco">—</span>':esc(ct))+'</td>'+
         '<td class="cl"><span class="rot-m">Forma </span>'+esc(FORMA[x.forma]||x.forma)+'</td></tr>';
      });
      h+='</tbody></table></div>';
      if(l.length>lim) h+='<div class="gp-acoes"><button type="button" class="botao sec mini" data-mais="'+g.id+'">Mostrar mais ('+(l.length-lim)+' restantes)</button></div>';
      h+='</div>';
    }
    h+='</section>';
  });
  var sl=selecionadas();
  if(sl.length){
    var uns=new Set(sl.map(function(x){return x.unidade_id}));
    h+='<div class="lote" id="barra-sel"><span>'+plural(sl.length,'parcela marcada','parcelas marcadas')+' · falta pagar '+R(sl.reduce(function(t,x){return t+x.livre},0))+(uns.size>1?' · <b>atenção: unidades diferentes</b>':'')+'</span>'+
      '<button type="button" class="botao sec mini" id="limpar-sel">Desmarcar</button>'+(sl.every(function(x){return x.bOmie})?'<button type="button" class="botao sec mini" id="baixa-sel">Dar baixa sem comprovante</button>':'')+'<button type="button" class="botao mini" id="anexar-sel"'+(uns.size>1?' disabled':'')+'>Anexar comprovante</button></div>';
  }
  return h;
}
async function carregarPagamentos(){
  try{cache.pag=await api('pagamentos');if(estado.tela==='pagamentos'){render();if(estado.grupo){var g=$('#g-'+estado.grupo);if(g)g.scrollIntoView({block:'start'})}}}
  catch(x){if(estado.tela==='pagamentos'&&x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
}

/* ---------- ficha do pedido (página própria) ----------
   Regra "uma informação, um lugar só":
   cabeçalho = número, unidade, laboratório, situação e valor total; Entrega = envio, previsão, saída, rastreio e recebimento;
   Pagamento = parcelas com boleto e comprovante; Notas fiscais = DANFE, XML, Portal Omie e conferência;
   Outros anexos = o que não apareceu antes; Do sistema antigo = só o que não existe no sistema novo; Histórico por último. */
var API_HIST=SUPA_URL+'/functions/v1/pedidos-historico';
// aceita '2026-11-27 01:37:25.123+00' (texto do Postgres) e ISO
function quando(s){return new Date(String(s||'').trim().replace(' ','T').replace(/([+-]\d{2})$/,'$1:00'))}
function dtHora(s){if(!s)return '—';var d=quando(s);return isNaN(d)?esc(s):d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function secao(id,tit,q,ac,corpo){return '<section class="sec" id="'+id+'"><div class="sh"><h2>'+esc(tit)+'</h2>'+(q?'<span class="q">'+q+'</span>':'')+(ac||'')+'</div>'+corpo+'</section>'}
function kvi(k,v,cls){return '<div><dt>'+esc(k)+'</dt><dd'+(cls?' class="'+cls+'"':'')+'>'+v+'</dd></div>'}
var ALVO_ACAO=[[/^(Pagar|Pedir baixa|Dar baixa|Pedir atualiza|Cobrar baixa|Anexar)/,'sec-pag'],[/^(Cobrar laborat|Confirmar receb)/,'sec-entrega'],[/^Completar itens/,'sec-itens']];
function ficha(d,hist){
  var p=d.pedido, lab=d.lab, pode=d.pode_gravar, canc=p.sit==='X', ed=pode&&!canc;
  var H=hist||{}, ant=(H.tem&&H.campos)||{};
  var porId={}; p.arq.forEach(function(a){porId[a.id]=a});
  var usados={}, datas={};
  var ver=function(s){if(s)datas[String(s).slice(0,10)]=1;return dt(s)};
  var abre=function(a,rot){usados[a.id]=1;return a.abre?'<button type="button" class="link" data-abrir="'+esc(a.id)+'">'+esc(rot||'abrir')+'</button>':'<span class="fraco">(no sistema antigo)</span>'};
  var arqLi=function(a){usados[a.id]=1;return '<li><span class="nm">'+esc(a.nome)+(a.subst?' <span class="selo n">substituído</span>':'')+'</span><span class="mt">'+esc(a.cat)+'</span>'+abre(a)+'</li>'};
  var arqPor=function(cods){return p.arq.filter(function(a){return cods.indexOf(a.cod)>=0&&!usados[a.id]})};

  // ----- cabeçalho
  var h='<nav class="migalha" aria-label="Caminho"><button type="button" data-ir="'+esc(estado.voltar)+'">'+esc(estado.voltar==='pagamentos'?'Pagamentos':(estado.voltar==='inicio'?'Início':'Pedidos'))+'</button><span aria-hidden="true">›</span><span>Ficha do pedido</span></nav>';
  var acs=(ed?'<button type="button" class="btn" id="ed-pedido">Editar dados</button><button type="button" class="btn perigo" id="canc-pedido">Cancelar pedido</button>':'')+(canc&&d.pode_admin?'<button type="button" class="btn" id="reabrir-pedido">Reabrir pedido</button>':'');
  h+='<section class="fcab"><div class="l1"><h1>'+esc(p.num)+'</h1>'+tag(SIT_P[p.sit]||SIT_P.E)+(p.tipo?'<span class="selo n">'+(p.tipo==='mae'?'Pedido mãe':'Remessa de pedido mãe')+'</span>':'')+(acs?'<div class="ac">'+acs+'</div>':'')+'</div>'+
    '<dl class="kv">'+kvi('Unidade',esc(p.un))+kvi('Laboratório',esc(lab.nomeLongo||lab.nome))+kvi(lab.numNome||'Nº no laboratório',esc(p.numLab||'—'))+kvi('Valor total',p.sub===0&&!canc?'<span class="fraco">sem itens</span>':R(p.total),'valor')+'</dl>'+
    (canc?'<div class="cancelado"><b>Cancelado:</b> '+esc(p.cancMot||'motivo não informado')+'</div>':'')+
    (p.obs?'<div><span class="nota">Observação</span><div>'+esc(p.obs)+'</div></div>':'')+'</section>';

  // ----- o que falta
  if(p.acoes.length){
    h+='<section class="falta" aria-label="O que falta"><h2>O que falta</h2><ul>'+p.acoes.map(function(a){
      var alvo='';ALVO_ACAO.forEach(function(x){if(!alvo&&x[0].test(a.txt))alvo=x[1]});
      return '<li>'+(alvo?'<button type="button" class="link" data-ancora="'+alvo+'">'+esc(a.txt)+'</button>':esc(a.txt))+'</li>'}).join('')+'</ul></section>';
  }

  // ----- itens
  var sItens=p.itens.length?'<div class="tabela cartoes"><table><thead><tr><th>Produto</th><th class="r">Qtd</th><th class="r">Preço</th><th class="r">Total</th></tr></thead><tbody>'+
     p.itens.map(function(it){return '<tr><td class="c1">'+esc(it.prod)+'</td><td class="cl r num"><span class="rot-m">Qtd </span>'+Number(it.qtd).toLocaleString('pt-BR')+'</td><td class="cl r num"><span class="rot-m">Preço </span>'+R(it.preco)+'</td><td class="c2 r num">'+R(it.total)+'</td></tr>'}).join('')+
     '</tbody><tfoot><tr><td colspan="3" class="c1">Produtos</td><td class="c2 r num">'+R(p.sub)+'</td></tr><tr><td colspan="3" class="c1">Frete</td><td class="c2 r num">'+R(p.frete)+'</td></tr></tfoot></table></div>'
    :'<div class="cp"><span class="fraco">Nenhum item cadastrado. No sistema antigo este pedido não tinha os produtos lançados.</span>'+(p.frete?'<span>Frete: '+R(p.frete)+'</span>':'')+'</div>';
  sItens+='<div class="cp"><span class="nota">Itens e preços '+(p.origem==='migracao'?'migrados do sistema antigo':'lançados no sistema')+' (preço congelado na data do pedido).</span></div>';

  // ----- entrega
  var podeReceber=pode&&['E','L','C'].indexOf(p.sit)>=0;
  var rastSit=p.rastSit||(ant.quality?ant.quality+' (sistema antigo)':'');
  var et=[
    {k:'Enviado ao laboratório',v:ver(p.env),c:p.env?'ok':''},
    {k:'No laboratório',v:p.conf?ver(p.conf):(p.etapa?esc(p.etapa.charAt(0)+p.etapa.slice(1).toLowerCase()):'—'),e:p.conf?'confirmado pelo laboratório'+(p.etapa?' · etapa na planilha: '+esc(p.etapa.toLowerCase()):''):(p.etapa?'etapa na planilha do laboratório':''),c:p.exp||p.rec?'ok':(p.conf||p.etapa?'at':'')},
    {k:p.prev?'Previsão de saída':'Prazo do laboratório',v:ver(p.prazo),e:(p.atraso>0?'<span class="vermelho">'+plural(p.atraso,'dia','dias')+' além do prazo</span>':(p.prev?'informada pelo laboratório':(p.env?lab.prazo+' dias corridos do envio':'')))+(p.etapaPrev&&p.etapaPrev!==p.prev?' · planilha: '+ver(p.etapaPrev):''),c:p.atraso>0?'ru':(p.exp||p.rec?'ok':'')},
    {k:'Saiu do laboratório',v:ver(p.exp),e:(p.rast?'rastreio '+esc(p.rast):'')+(rastSit?(p.rast?' · ':'')+esc(rastSit):'')+(p.diasCaminho?' · há '+p.diasCaminho+' dias':''),c:p.exp?(p.diasCaminho>7?'at':'ok'):''},
    {k:'Recebido na unidade',v:ver(p.rec),e:(p.rec&&p.recPor?'confirmado por '+esc(p.recPor):'')+(p.recObs?(p.rec&&p.recPor?' · ':'')+esc(p.recObs):''),c:p.rec?'ok':''}];
  if(canc) et.forEach(function(x){if(x.c!=='ok')x.c='x'});
  var sEnt='<div class="cp"><ol class="etapas">'+et.map(function(x){return '<li class="'+x.c+'"><span class="k">'+esc(x.k)+'</span><span class="v">'+x.v+'</span>'+(x.e?'<span class="e">'+x.e+'</span>':'')+'</li>'}).join('')+'</ol>'+
    '<span class="nota">'+(p.origem==='migracao'?'Datas migradas do sistema antigo':'Datas lançadas no sistema')+(p.etapa||p.prev?'; etapa e previsão vêm da planilha do laboratório':'')+'; rastreio consultado na Quality pelo robô diário.</span></div>'+
    (podeReceber?'<div id="f-receber-box"></div>':'');

  // ----- pagamento (boleto e comprovante ficam na própria parcela)
  var livres=p.parc.filter(function(x){return x.livre>0});
  var temP=p.parc.some(function(x){return x.sit==='P'||x.sit==='B'});
  var compVisto={}, bolVisto={};
  var sPag='<div class="parcs">'+(p.parc.length?'':'<div class="cp"><span class="fraco">Nenhuma parcela cadastrada.</span></div>');
  p.parc.forEach(function(x){
    var s=SIT_PC[x.sit]||SIT_PC.A, rot=x.n+'/'+x.de;
    var btn='';
    if(pode&&x.livre>0) btn+='<button type="button" class="botao mini'+(x.sit==='V'||x.sit==='N'?'':' sec')+'" data-anexar-parc="'+esc(x.id)+'">'+(x.sit==='V'||x.sit==='A'?'Pagar esta parcela':'Anexar comprovante')+'</button>';
    if(pode&&!x.nossa&&x.bOmie&&x.sit!=='X') btn+='<button type="button" class="botao mini sec" data-baixa-parc="'+esc(x.id)+'">Baixar sem comprovante</button>';
    if(ed&&x.sit!=='X') btn+='<button type="button" class="link" data-ed-parc="'+esc(x.id)+'">editar parcela</button><button type="button" class="link perigo" data-canc-parc="'+esc(x.id)+'">cancelar parcela</button>';
    var nos=x.nossa?(x.pago>=x.valor-0.01?'<span class="ok">comprovante</span>':'<span class="ok">sem comprovante, '+ver(x.bSis)+'</span>'+(x.bSisPor?' por '+esc(x.bSisPor):'')):'<span class="nao">falta</span>';
    var bol=x.boleto?(porId[x.boleto]||null):null, lb='';
    if(bol){lb=bolVisto[bol.id]?'mesmo boleto da parcela '+bolVisto[bol.id]:esc(bol.nome)+' '+abre(bol);bolVisto[bol.id]=bolVisto[bol.id]||rot}
    else if(x.forma==='boleto') lb='<span class="fraco">não ligado a esta parcela</span>';
    if(x.bolNum) lb+=(lb?' · ':'')+'nº '+esc(x.bolNum);
    if(x.bolLinha) lb+=(lb?' · ':'')+'linha digitável '+esc(x.bolLinha);
    var comp=(x.pagamentos||[]).map(function(g){
      var a=porId[g.arquivo_id]||{id:g.arquivo_id,nome:g.arquivo,abre:g.abre};
      var t=R(g.valor)+' ('+esc(FORMA[g.forma]||g.forma)+')';
      if(compVisto[a.id]) return t+' — mesmo comprovante da parcela '+compVisto[a.id];
      compVisto[a.id]=rot; return t+' pago em '+ver(g.pago_em)+' · '+esc(a.nome||'comprovante')+' '+abre(a);
    }).join('<br>');
    sPag+='<div class="parc'+(x.sit==='X'?' canc':'')+'"><div><b>Parcela '+x.n+' de '+x.de+'</b> · vence '+ver(x.venc)+' · '+esc(FORMA[x.forma]||x.forma)+'</div><div class="v num">'+R(x.valor)+'</div>'+
      '<div class="tres"><span><b>Omie</b> '+(x.exOmie===false?'<span class="fraco">não se aplica</span>':(x.bOmie?'<span class="ok">'+ver(x.bOmie)+'</span>':'<span class="nao">falta</span>'))+'</span>'+
      '<span><b>Planilha</b> '+(x.exPlan===false?'<span class="fraco">não se aplica</span>':(x.bPlan?'<span class="ok">'+ver(x.bPlan)+'</span>':'<span class="nao">falta</span>'))+'</span><span><b>Nosso sistema</b> '+nos+'</span></div>'+
      (lb?'<div class="d"><b>Boleto:</b> '+lb+'</div>':'')+
      '<div class="d"><b>Comprovante:</b> '+(comp||(x.bSis?'<span class="fraco">baixa sem comprovante (Omie conferida)</span>':'<span class="fraco">nenhum</span>'))+'</div>'+
      (x.bSisObs?'<div class="d"><b>Obs. da baixa:</b> '+esc(x.bSisObs)+'</div>':'')+(x.cancMot?'<div class="d"><b>Cancelada:</b> '+esc(x.cancMot)+'</div>':'')+
      '<div class="a">'+tag(x.prox7?['Vence em até 7 dias','i']:s)+btn+'</div></div>';
  });
  sPag+='</div>';
  var bolSoltos=arqPor(['boleto']).filter(function(a){return !bolVisto[a.id]});
  if(bolSoltos.length) sPag+='<div class="sub-t">Boletos sem parcela indicada <span class="nota">(vieram do sistema antigo assim)</span></div><ul class="arqs">'+bolSoltos.map(arqLi).join('')+'</ul>';
  var compSoltos=arqPor(['comprovante']).filter(function(a){return !compVisto[a.id]});
  if(compSoltos.length) sPag+='<div class="sub-t">Comprovantes sem parcela indicada</div><ul class="arqs">'+compSoltos.map(arqLi).join('')+'</ul>';
  if(p.parc.length){var origs={};p.parc.forEach(function(x){origs[x.orig]=1});sPag+='<div class="cp"><span class="nota">A parcela só finaliza com as 3 baixas: Omie, planilha do laboratório e nosso sistema. Origem das parcelas: '+esc(Object.keys(origs).join('; '))+'.</span></div>'}
  var acPag=(ed?'<button type="button" class="botao mini sec" id="nova-parc">Lançar parcela</button>':'')+(pode&&livres.length?'<button type="button" class="botao mini sec" data-anexar-ped="1">Anexar comprovante</button>':'')+(temP?'<button type="button" class="botao mini sec" data-cob-ped="'+esc(p.id)+'">Mensagem ao laboratório</button>':'');

  // ----- notas fiscais (DANFE, XML, Portal Omie, conferência)
  var links=(H.tem&&H.links)||[], linkUsado={};
  p.nf.forEach(function(n){if(n.link)linkUsado[n.link]=1});
  var sNf='';
  if(p.nf.length){
    sNf+='<div class="tabela cartoes"><table><thead><tr><th>Número</th><th>Emissão</th><th>Situação na Omie</th><th class="r">Frete</th><th class="r">Total</th><th>Arquivos</th></tr></thead><tbody>'+p.nf.map(function(n){
      var pdf=n.danfe_id?(porId[n.danfe_id]||{id:n.danfe_id,abre:n.d_abre}):null, xml=n.xml_id?(porId[n.xml_id]||{id:n.xml_id,abre:n.x_abre}):null;
      var lk=n.link||'';
      if(!lk){var m=links.filter(function(l){return !linkUsado[l.url]&&new RegExp('\\b'+String(n.num).replace(/\W/g,'')+'\\b').test(l.rotulo)})[0];if(m){lk=m.url}}
      if(lk) linkUsado[lk]=1;
      var arqs=[];
      if(pdf) arqs.push(pdf.abre?'<button type="button" class="link" data-abrir="'+esc(pdf.id)+'">DANFE</button>':'DANFE <span class="fraco">(no sistema antigo)</span>'), usados[pdf.id]=1;
      if(xml) arqs.push(xml.abre?'<button type="button" class="link" data-abrir="'+esc(xml.id)+'">XML</button>':'XML <span class="fraco">(no sistema antigo)</span>'), usados[xml.id]=1;
      if(lk) arqs.push('<a class="link" href="'+esc(lk)+'" target="_blank" rel="noopener noreferrer">Portal Omie</a>');
      return '<tr><td class="c1"><b>NF '+esc(n.num)+'</b>'+(n.canc?' '+tag(['Cancelada','n']):'')+'</td><td class="cl num"><span class="rot-m">Emissão </span>'+ver(n.emis)+'</td><td class="cl"><span class="rot-m">Omie </span>'+esc(n.sit_omie||'—')+'</td><td class="cl r num"><span class="rot-m">Frete </span>'+R(n.frete)+'</td><td class="c2 r num">'+R(n.total)+'</td><td class="cl">'+(arqs.join(' · ')||'<span class="fraco">—</span>')+'</td></tr>'}).join('')+'</tbody></table></div>';
  } else sNf+='<div class="cp"><span class="fraco">Nenhuma nota fiscal ligada a este pedido.</span></div>';
  var nfSoltas=arqPor(['nota_fiscal','xml_nf']);
  if(nfSoltas.length) sNf+='<div class="sub-t">Arquivos de nota sem número ligado</div><ul class="arqs">'+nfSoltas.map(arqLi).join('')+'</ul>';
  var linksSoltos=links.filter(function(l){return !linkUsado[l.url]});
  if(linksSoltos.length) sNf+='<div class="sub-t">Portal Omie</div><ul class="arqs">'+linksSoltos.map(function(l){return '<li><span class="nm">'+esc(l.rotulo)+'</span><a class="link" href="'+esc(l.url)+'" target="_blank" rel="noopener noreferrer">abrir</a></li>'}).join('')+'</ul>';
  var cf=H.tem&&H.conf;
  if(cf) sNf+='<div class="sub-t">Conferência pedido × nota fiscal <span class="nota">('+esc(cf.nfs||'')+(cf.em?' · '+ver(cf.em):'')+', feita no sistema antigo)</span></div><div class="cp">'+
      (cf.ok?'<span class="ok">Confere</span>':'<ul class="lista-simples">'+cf.diverg.map(function(x){return '<li class="vermelho">'+esc(x)+'</li>'}).join('')+'</ul>')+
      (cf.avisos.length?'<ul class="lista-simples">'+cf.avisos.map(function(x){return '<li class="fraco">'+esc(x)+'</li>'}).join('')+'</ul>':'')+'</div>';

  // ----- outros anexos (receita, pedido de venda, termo e demais que não apareceram acima)
  var outros=p.arq.filter(function(a){return !usados[a.id]});
  var sOut=outros.length?'<ul class="arqs">'+outros.map(arqLi).join('')+'</ul>':'<div class="cp"><span class="fraco">Nenhum.</span></div>';
  if(p.arq.some(function(a){return !a.abre})) sOut+='<div class="cp"><span class="nota">Arquivos marcados “no sistema antigo” ainda não foram copiados para o sistema novo.</span></div>';

  // ----- do sistema antigo: só campos preenchidos que não existem no sistema novo
  var sAnt='', campos=[];
  if(H.tem){
    var nomes={}; p.arq.forEach(function(a){nomes[a.nome]=1});
    var temPV=p.arq.some(function(a){return a.cod==='pedido_venda'});
    var v=function(x){return x!=null&&x!==''&&x!==false};
    if(v(ant.prescritor)) campos.push(['Prescritor',esc(ant.prescritor)]);
    if(v(ant.crbm)) campos.push(['CRBM',esc(ant.crbm)]);
    if(v(ant.dataReceita)&&!datas[String(ant.dataReceita).slice(0,10)]) campos.push(['Data da receita',ver(ant.dataReceita)]);
    if(v(ant.pedidoVenda)&&!nomes[ant.pedidoVenda]&&!temPV) campos.push(['Pedido de venda',esc(ant.pedidoVenda)]);
    if(v(ant.pendPV)){var pv=ant.pendPV;campos.push(['Pendência no pedido de venda',typeof pv==='object'?esc((pv.itens||[]).join('; ')||'sim')+(pv.em&&!datas[String(pv.em).slice(0,10)]?' (em '+ver(pv.em)+')':''):esc(pv)])}
    if(v(ant.obsLab)&&ant.obsLab!==p.obs) campos.push(['Observação do laboratório',esc(ant.obsLab)]);
    if(ant.foraPlanilha) campos.push(['Fora da planilha do laboratório','sim']);
    if(!p.parc.length){
      if(v(ant.sitPag)) campos.push(['Situação de pagamento',esc(ant.sitPag)]);
      if(v(ant.forma)) campos.push(['Forma de pagamento',esc(ant.forma)]);
    }
    [['dataPag','Data de pagamento'],['dataPagLab','Data de pagamento na planilha do laboratório']].forEach(function(c){var x=ant[c[0]];if(v(x)&&!datas[String(x).slice(0,10)])campos.push([c[1],ver(x)])});
    if(campos.length) sAnt='<div class="cp"><dl class="kv kv3">'+campos.map(function(c){return kvi(c[0],c[1])}).join('')+'</dl></div>';
  }

  // ----- histórico: sistema novo e sistema antigo mesclados por data (mais recente primeiro)
  var ev=(H.novos||[]).map(function(x){return {em:x.em,por:x.por,t:x.texto}}).concat(((H.tem&&H.historico)||[]).map(function(x){return {em:x.em,por:x.por+(x.auto&&x.auto!==x.por?' ('+x.auto+')':''),t:x.texto,ant:1}}));
  ev.sort(function(a,b){return (quando(b.em).getTime()||0)-(quando(a.em).getTime()||0)});
  var sHist=H.erro?'<div class="cp"><span class="vermelho">'+esc(H.erro)+'</span></div>':(ev.length?'<ul class="hist">'+ev.map(function(x){return '<li><span class="q">'+dtHora(x.em)+'</span><span class="t">'+esc(x.t)+'</span><span class="o">'+esc(x.por||'?')+(x.ant?' · <span class="selo n">sistema antigo</span>':'')+'</span></li>'}).join('')+'</ul>':'<div class="cp"><span class="fraco">Nenhuma alteração registrada.</span></div>');
  sHist+='<div class="cp"><span class="nota">A carga inicial vinda do sistema antigo não aparece como alteração.</span></div>';

  // ----- montagem em ordem fixa
  var secs=[['sec-itens','Itens'],['sec-entrega','Entrega'],['sec-pag','Pagamento'],['sec-nf','Notas fiscais'],['sec-anexos','Outros anexos']];
  if(sAnt) secs.push(['sec-antigo','Do sistema antigo']);
  secs.push(['sec-hist','Histórico']);
  h+='<nav class="ancoras" aria-label="Seções da ficha">'+secs.map(function(s){return '<button type="button" class="link" data-ancora="'+s[0]+'">'+s[1]+'</button>'}).join('')+'</nav>';
  h+=secao('sec-itens','Itens',plural(p.itens.length,'produto','produtos'),ed?'<button type="button" class="botao mini sec" id="ed-itens">'+(p.itens.length?'Editar itens':'Completar itens')+'</button>':'',sItens);
  h+=secao('sec-entrega','Entrega','',podeReceber?'<button type="button" class="botao mini" id="b-receber">Confirmar recebimento</button>':'',sEnt);
  h+=secao('sec-pag','Pagamento',R(p.parc.filter(function(x){return x.sit!=='X'}).reduce(function(t,x){return t+x.valor},0))+' cobrados'+(lab.cond&&lab.cond!=='—'?' · condição padrão: '+esc(lab.cond):''),acPag,sPag);
  h+=secao('sec-nf','Notas fiscais',plural(p.nf.length,'nota','notas'),'',sNf);
  h+=secao('sec-anexos','Outros anexos',plural(outros.length,'arquivo','arquivos'),'',sOut);
  if(sAnt) h+=secao('sec-antigo','Do sistema antigo','nº '+esc(H.id)+' · somente leitura','',sAnt);
  h+=secao('sec-hist','Histórico',plural(ev.length,'registro','registros'),'',sHist);
  return h;
}
var seqFicha=0;
async function abrirFicha(id,semHistorico){
  if(estado.tela!=='pedido') estado.voltar=estado.tela||'pedidos';
  var mesmo=estado.tela==='pedido'&&estado.fichaId===id, y=window.scrollY;
  estado.tela='pedido'; estado.fichaId=id; marcaMenu();
  if(!semHistorico) navega('#pedido/'+id);
  var meu=++seqFicha;
  if(!mesmo){$('#tela').innerHTML='<p class="vazio">Carregando a ficha do pedido…</p>';window.scrollTo(0,0)}
  try{
    var r=await Promise.all([api('pedido',{pedido_id:id}),api('historico',{pedido_id:id},API_HIST).catch(function(x){return {erro:'Histórico indisponível: '+x.message}})]);
    if(meu!==seqFicha||estado.tela!=='pedido') return;
    fichaAtual=r[0];
    $('#tela').innerHTML=ficha(r[0],r[1]);
    if(mesmo) window.scrollTo(0,y); else {var h=$('#tela h1');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true})}}
  }catch(x){if(meu===seqFicha&&x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
}
function aposGravar(){
  cache.inicio=null; cache.pag=null; cache.pedidos=null; estado.sel={};
  if(estado.tela==='pedido'&&estado.fichaId) abrirFicha(estado.fichaId,true);
  else ir(estado.tela,true);
}

/* confirmar recebimento (dentro da ficha, seção Entrega) */
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

/* ---------- janelas (ficam na própria página, que rola inteira) ---------- */
var dlgFoco=null;
function abrirDlg(titulo,corpo){
  var d=$('#dlg'); if(!d.classList.contains('on')) dlgFoco=document.activeElement;
  d.innerHTML='<div class="dlg"><div class="dlg-cab"><h2 id="dlg-titulo">'+esc(titulo)+'</h2><button type="button" class="fechar" id="dlg-fechar" aria-label="Fechar">×</button></div>'+corpo+'</div>';
  d.style.top=(window.scrollY+72)+'px';
  d.classList.add('on'); $('#dlg-fundo').classList.add('on');
  var f=$('.dlg input:not([type=checkbox]),.dlg textarea,.dlg button.botao',d); (f||$('#dlg-fechar')).focus({preventScroll:true});
}
function fecharDlg(){var d=$('#dlg');if(!d.classList.contains('on'))return;d.classList.remove('on');$('#dlg-fundo').classList.remove('on');d.innerHTML='';if(dlgFoco&&dlgFoco.focus&&document.contains(dlgFoco))dlgFoco.focus({preventScroll:true})}
function ajustaTextos(){document.querySelectorAll('.txt-cob').forEach(function(t){t.style.height='auto';t.style.height=(t.scrollHeight+4)+'px'})}

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
    '<p style="margin:0 0 10px;color:var(--muted)">'+esc(contexto)+' Cada comprovante vale para uma unidade (CNPJ). O valor é distribuído nas parcelas marcadas, da que vence primeiro para a última.</p>'+
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
  var h='<form id="f-baixa" novalidate><div class="dlg-corpo"><p style="margin:0 0 10px;color:var(--muted)">Use quando a Omie do laboratório já baixou e você não tem o comprovante. Fica registrado quem deu a baixa e quando.</p>'+
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
    else h+='<p style="margin:0 0 12px;color:var(--muted)">Confira, copie e envie ao laboratório pelo canal de costume (e-mail ou WhatsApp). <b>O sistema não envia nada sozinho.</b></p>'+
      r.textos.map(function(t,i){return '<h3>'+esc(t.lab)+' · '+plural(t.qtd,'parcela','parcelas')+' · '+R(t.total)+'</h3><textarea class="txt-cob" id="cob-'+i+'" readonly>'+esc(t.texto)+'</textarea><div class="acoes-f" style="margin:0 0 16px"><button type="button" class="botao mini" data-copiar="cob-'+i+'">Copiar mensagem</button></div>'}).join('');
    h+='</div><div class="dlg-pe"><button type="button" class="botao sec" id="dlg-cancela">Fechar</button></div>';
    $('#dlg .dlg').innerHTML=$('#dlg .dlg-cab').outerHTML+h; ajustaTextos();
  }catch(x){if($('#dlg .dlg-corpo'))$('#dlg .dlg-corpo').innerHTML='<div class="erro">'+esc(x.message)+'</div>'}
}
async function copiar(id,bt){
  var t=$('#'+id); var ok=false;
  try{await navigator.clipboard.writeText(t.value);ok=true}catch(e){try{t.focus();t.select();ok=document.execCommand('copy')}catch(e2){}}
  bt.textContent=ok?'Copiado':'Selecione o texto e copie (Ctrl+C)'; setTimeout(function(){bt.textContent='Copiar mensagem'},2500);
}
async function abrirArquivo(id){
  try{var r=await api('abrir_arquivo',{arquivo_id:id});window.open(r.url,'_blank','noopener')}catch(x){avisar(x.message)}
}

/* ---------- navegação ---------- */
var tAviso;
function avisar(t){var a=$('#aviso');a.textContent=t;a.classList.add('on');clearTimeout(tAviso);tAviso=setTimeout(function(){a.classList.remove('on')},4200)}
var TELAS=['inicio','pedidos','pagamentos'];
/* módulos em arquivo próprio (receitas.js, cadastros.js) se registram aqui: telas, rotas de ficha, cliques e formulários */
var MOD={telas:{},rotas:[],cliques:[],envios:[],mudancas:[]};
function navega(h){try{if(location.hash!==h)history.pushState(null,'',h)}catch(e){}}
function render(){
  var t=estado.tela, el=$('#tela');
  marcaMenu();
  if(t==='pedido') return;
  if(MOD.telas[t]){MOD.telas[t].render();return}
  if(t==='pedidos') el.innerHTML=telaPedidos(cache.pedidos);
  else if(t==='pagamentos') el.innerHTML=telaPagamentos(cache.pag);
  else el.innerHTML=telaInicio(cache.inicio);
}
async function ir(t,recarregar){
  if(TELAS.indexOf(t)<0&&!MOD.telas[t]) t='inicio';
  estado.menu=''; estado.tela=t; fichaAtual=null; navega('#'+t);
  if(MOD.telas[t]){marcaMenu();if(!recarregar)window.scrollTo(0,0);MOD.telas[t].abrir(recarregar);return}
  render(); if(!recarregar) window.scrollTo(0,0);
  if(t==='pedidos'){cache.pedidos=null;render();carregarPedidos()}
  else if(t==='pagamentos'){if(!cache.pag||recarregar)carregarPagamentos();else if(estado.grupo){var g=$('#g-'+estado.grupo);if(g)g.scrollIntoView({block:'start'})}}
  else{try{var d=await api('inicio',{unidade_id:estado.unidade});cache.inicio=d;if(estado.tela==='inicio')render()}catch(x){if(estado.tela==='inicio'&&x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}}
}
function rota(){
  var h=(location.hash||'').slice(1), m=/^pedido\/([0-9a-f-]{36})$/i.exec(h);
  fecharDlg();
  if(m){abrirFicha(m[1],true);return}
  for(var i=0;i<MOD.rotas.length;i++){var mm=MOD.rotas[i][0].exec(h);if(mm){MOD.rotas[i][1](mm,true);return}}
  ir(TELAS.indexOf(h)>=0||MOD.telas[h]?h:'inicio');
}
window.addEventListener('popstate',function(){if(EU&&!$('#menu').hidden)rota()});
function fechaPops(exceto){['#usr-pop'].forEach(function(s){var p=$(s);if(p&&p.id!==exceto&&!p.hidden){p.hidden=true;var b=$('#usr-btn');if(b)b.setAttribute('aria-expanded','false')}})}
var tBusca;
document.addEventListener('click',function(e){
  var b=e.target.closest('button,a[data-ir],[data-p],[data-rec],[data-uni],[data-pes],input[type=checkbox]');
  if(!e.target.closest('.uwrap')) fechaPops();
  if(!b) return;
  if(b.matches('input[type=checkbox]')){
    if(b.id==='so-acao'){estado.acao=b.checked;cache.pedidos=null;render();carregarPedidos();e.stopPropagation();return}
    if(b.dataset.selp){estado.sel[b.dataset.selp]=b.checked;var y=window.scrollY;render();window.scrollTo(0,y)}
    else if(b.dataset.anx) atualizaValorAnexo();
    e.stopPropagation(); return;
  }
  if(b.dataset.ir){e.preventDefault();estado.especial='';estado.grupo='';ir(b.dataset.ir);return}
  for(var mi=0;mi<MOD.cliques.length;mi++){if(MOD.cliques[mi](b,e))return}
  if(b.id==='usr-btn'){var pp=$('#usr-pop');pp.hidden=!pp.hidden;b.setAttribute('aria-expanded',String(!pp.hidden));return}
  if(b.id==='sair'){sair();return}
  if(b.id==='recarregar'){iniciar();return}
  if(b.id==='tema'||b.id==='tema2'){trocaTema();return}
  if(b.id==='dlg-fechar'||b.id==='dlg-cancela'){fecharDlg();return}
  if(b.id==='a-mesmo'){anexo.repetidoOk=true;enviarAnexo();return}
  if(b.dataset.copiar){copiar(b.dataset.copiar,b);return}
  if(b.dataset.abrir){abrirArquivo(b.dataset.abrir);return}
  if(b.dataset.ancora){var s=$('#'+b.dataset.ancora);if(s)s.scrollIntoView({block:'start'});return}
  if(b.id==='b-receber'){formReceber();return}
  if(b.id==='r-cancela'){$('#f-receber-box').innerHTML='';return}
  if(b.dataset.cobPed){abrirCobranca({pedido_id:b.dataset.cobPed});return}
  if(b.dataset.cobUn){abrirCobranca({unidade_id:b.dataset.cobUn});return}
  if(b.dataset.anexarParc||b.dataset.anexarPed){
    var p=fichaAtual.pedido, lista=p.parc.filter(function(x){return x.livre>0}).map(function(x){return {id:x.id,num:p.num,un:p.un,unidade_id:p.unidade_id,n:x.n,de:x.de,venc:x.venc,valor:x.valor,livre:x.livre,forma:x.forma}});
    abrirAnexar(lista,b.dataset.anexarParc?[b.dataset.anexarParc]:lista.filter(function(x){return p.parc.some(function(y){return y.id===x.id&&(y.sit==='V'||y.sit==='N'||y.prox7)})}).map(function(x){return x.id}),'Pedido '+p.num+'.');
    return;
  }
  if(b.dataset.baixaParc){var pp2=fichaAtual.pedido,xx=pp2.parc.filter(function(y){return y.id===b.dataset.baixaParc})[0];abrirBaixa([{id:xx.id,num:pp2.num,un:pp2.un,n:xx.n,de:xx.de,valor:xx.valor,bOmie:xx.bOmie}]);return}
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
  if(b.id==='novo'){avisar('Novo pedido ainda não faz parte desta versão. Vem na próxima etapa.');return}
  if(b.dataset.card){var c=b.dataset.card.split(':');
    if(c[0]==='pedidos'){limpaFiltrosPed();estado.especial=c[1];ir('pedidos')}
    else{estado.grupo=c[1];estado.abertos={};ir('pagamentos')}
    return}
  if(b.dataset.sit&&b.classList.contains('barra')){limpaFiltrosPed();estado.sit=b.dataset.sit;ir('pedidos');return}
  if(b.dataset.f==='esp'){estado.especial='';cache.pedidos=null;render();carregarPedidos();return}
  if(b.id==='limpar-filtros'){limpaFiltrosPed();cache.pedidos=null;render();carregarPedidos();return}
  if(b.id==='limpar-g'){estado.gLab='';estado.gForma='';estado.gDe='';estado.gAte='';estado.gBusca='';estado.gOmie='';estado.gPlan='';estado.gSis='';render();return}
  if(b.id==='maisPed'){b.disabled=true;b.textContent='Carregando…';carregarPedidos(true);return}
  if(b.dataset.g){var id=b.dataset.g;var cur=b.getAttribute('aria-expanded')==='true';estado.abertos[id]=!cur;render();return}
  if(b.dataset.mais){estado.abertos['lim'+b.dataset.mais]=(estado.abertos['lim'+b.dataset.mais]||25)+50;render();return}
  if(b.dataset.p!==undefined){abrirFicha(b.dataset.p);return}
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){if($('#dlg').classList.contains('on'))fecharDlg();else fechaPops();return}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('tr.lp[data-p]')){e.preventDefault();abrirFicha(e.target.dataset.p)}
});
$('#dlg-fundo').addEventListener('click',fecharDlg);
document.addEventListener('submit',function(e){
  var id=e.target.id;
  if(id==='f-login')entrar(e); else if(id==='f-senha')salvarSenha(e); else if(id==='f-mfa')confirmarMfa(e);
  else if(MOD.envios.some(function(f){return f(e)})){}
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
  if(t.id==='unid-sel'){
    estado.unidade=t.value; guardaUnidade(); montaUnidades(); estado.sel={}; cache.inicio=null; cache.pedidos=null;
    ir(estado.tela==='pedido'||estado.menu?(estado.menu||estado.voltar):estado.tela,true); return}
  if(t.classList&&t.classList.contains('it-prod')){var o=t.selectedOptions[0],pi=t.closest('tr').querySelector('.it-preco');if(o&&o.dataset.preco!==''&&o.dataset.preco!=null)pi.value=valBR(Number(o.dataset.preco));totalItens();return}
  if(t.dataset.pf){estado[t.dataset.pf]=t.value;cache.pedidos=null;render();carregarPedidos();return}
  if(t.dataset.gf){estado[t.dataset.gf]=t.value;render();return}
  MOD.mudancas.forEach(function(f){f(t,e)});
});

/* tema */
var TEMAS=['auto','light','dark'],NOME_T={auto:'automático',light:'claro',dark:'escuro'},tema='auto';
try{tema=localStorage.getItem('dh-tema')||'auto'}catch(e){}
function aplicaTema(){if(tema==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',tema);$('#tema').textContent='Tema: '+NOME_T[tema];var t2=$('#tema2');if(t2)t2.textContent='Tema: '+NOME_T[tema]}
function trocaTema(){tema=TEMAS[(TEMAS.indexOf(tema)+1)%3];try{localStorage.setItem('dh-tema',tema)}catch(e){}aplicaTema()}
aplicaTema();

sb.auth.onAuthStateChange(function(ev){if(ev==='SIGNED_OUT'){EU=null;topoUsuario()}});
/* o que os módulos usam da casca */
window.DH={MOD:MOD,api:api,esc:esc,R:R,dt:dt,dtHora:dtHora,plural:plural,numBR:numBR,titulo:titulo,campo:campo,campoD:campoD,opt:opt,secao:secao,kvi:kvi,tag:tag,
  abrirDlg:abrirDlg,fecharDlg:fecharDlg,erroDlg:erroDlg,avisar:avisar,navega:navega,rodapeDlg:rodapeDlg,inData:inData,marcaMenu:marcaMenu,ir:ir,
  estado:estado,eu:function(){return EU},unidades:function(){return UNIDADES},nomeUnidade:nomeUnidade,escopoTxt:escopoTxt,hoje:function(){return HOJE}};
document.addEventListener('DOMContentLoaded',function(){iniciar()});
if(document.readyState!=='loading') setTimeout(iniciar,0);
})();
