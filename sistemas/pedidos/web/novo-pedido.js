/* Laboratórios › Pedidos › Novo pedido (módulo em arquivo próprio, carregado pela casca).
   Pedido nasce em rascunho: unidade, laboratório, receita do mês (o Centro Paulista exige) e itens.
   "Confirmar envio" grava a data de envio (hoje), gera o número e registra no histórico.
   Ambiente de teste: o pedido não vai ao laboratório e recebe número TST-AAAA-NNNN. */
(function(){
"use strict";
var D=window.DH, M=D.MOD, $=function(s,r){return (r||document).querySelector(s)}, esc=D.esc;
var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
function nomeMes(m){var p=String(m||'').split('-');return p.length<2?m:MESES[+p[1]-1]+'/'+p[0]}
function qtd(v){return v==null?'—':Number(v).toLocaleString('pt-BR')}
function r2(v){return Math.round(v*100)/100}
function valBR(v){return (v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}
var ST_REC={rascunho:'Rascunho',gerada:'Gerada',enviada_rt:'Enviada ao RT',cancelada:'Cancelada'};
var est={op:null,rec:null,esc:{un:'',lab:'',rec:''},d:null,linhas:[],sujo:false,enviando:false};
function aviso(){return '<div class="alerta" id="np-teste"><b>Ambiente de teste — o pedido não é enviado ao laboratório.</b> Ele fica marcado como teste, com número TST, e será apagado antes da virada.</div>'}
function migalha(t){return '<nav class="migalha" aria-label="Caminho"><button type="button" data-ir="pedidos">Pedidos</button><span aria-hidden="true">›</span><span>'+esc(t)+'</span></nav>'}

/* ---------- 1) escolher unidade, laboratório e receita ---------- */
function telaEscolha(){
  var o=est.op, h=migalha('Novo pedido')+D.titulo('Novo pedido','','O pedido nasce em rascunho. Nada vai para o laboratório até você confirmar o envio.');
  if(!o) return h+'<p class="vazio">Carregando…</p>';
  if(o.teste) h+=aviso();
  if(!o.pode_criar) return h+'<p class="vazio">Nesta fase, quem cria pedido é a central (Operações).</p>';
  var e=est.esc, lab=o.laboratorios.filter(function(l){return l.id===e.lab})[0];
  var recs=est.rec||[];
  var opRec=D.opt('','Sem receita',e.rec)+recs.map(function(r){return '<option value="'+esc(r.id)+'"'+(r.id===e.rec?' selected':'')+(r.status==='rascunho'?' disabled':'')+'>'+esc(r.nome+' — '+(ST_REC[r.status]||r.status)+(r.pedidos?' — já tem '+D.plural(r.pedidos,'pedido','pedidos'):''))+'</option>'}).join('');
  h+='<section class="sec"><div class="sh"><h2>Para quem e de onde</h2></div><form id="f-np" class="cp" novalidate>'+
    '<div class="duas">'+D.campoD('Unidade','<select class="ent" id="np-un">'+D.opt('','— escolha —',e.un)+o.unidades.map(function(u){return D.opt(u.id,u.nome,e.un)}).join('')+'</select>')+
    D.campoD('Laboratório','<select class="ent" id="np-lab">'+D.opt('','— escolha —',e.lab)+o.laboratorios.map(function(l){return D.opt(l.id,l.nome,e.lab)}).join('')+'</select>')+'</div>'+
    (o.receitas?D.campoD('Receita do mês',e.un&&e.lab?'<select class="ent" id="np-rec">'+opRec+'</select>':'<select class="ent" id="np-rec" disabled><option>Escolha a unidade e o laboratório</option></select>',lab&&lab.exige_receita?'o Centro Paulista exige; os itens vêm do saldo da receita':'opcional'):'')+
    (lab&&lab.exige_receita&&est.rec&&!recs.some(function(r){return r.status!=='rascunho'})?'<div class="alerta">Esta unidade não tem receita do mês gerada (assinada pelo RT do termo). Dá para criar o rascunho, mas o envio só é liberado com a receita ligada.</div>':'')+
    '<div id="np-erro"></div><div class="acoes-f"><button type="submit" class="botao" id="np-criar">Criar rascunho</button><button type="button" class="botao sec" data-ir="pedidos">Voltar</button></div></form></section>';
  return h;
}
async function carregaReceitas(){
  var e=est.esc; est.rec=null;
  if(!e.un||!e.lab||!est.op.receitas){desenha();return}
  desenha();
  try{est.rec=(await D.api('np_receitas',{unidade_id:e.un,laboratorio_id:e.lab})).receitas||[]}catch(x){est.rec=[]}
  var boa=est.rec.filter(function(r){return r.status!=='rascunho'})[0];
  if(!e.rec&&boa) e.rec=boa.id;
  desenha();
}
async function abrirNovo(sem,pre){
  D.estado.tela='novo-pedido'; D.estado.menu='pedidos'; D.marcaMenu();
  if(!sem) D.navega('#novo-pedido');
  est.d=null; est.esc={un:(pre&&pre.un)||D.estado.unidade||'',lab:(pre&&pre.lab)||'',rec:(pre&&pre.rec)||''};
  $('#tela').innerHTML=telaEscolha(); window.scrollTo(0,0);
  try{est.op=await D.api('np_opcoes');if(!est.esc.lab&&est.op.laboratorios.length)est.esc.lab=est.op.laboratorios[0].id;carregaReceitas()}
  catch(x){if(x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
}
async function criar(e){
  e.preventDefault();
  var s=est.esc, bt=$('#np-criar'), out=$('#np-erro');
  if(!s.un){out.innerHTML='<div class="erro">Escolha a unidade.</div>';return}
  if(!s.lab){out.innerHTML='<div class="erro">Escolha o laboratório.</div>';return}
  bt.disabled=true; bt.textContent='Criando…';
  try{var r=await D.api('np_criar',{unidade_id:s.un,laboratorio_id:s.lab,receita_id:s.rec||null});D.avisar(r.mensagem);abrirRascunho(r.pedido_id)}
  catch(x){bt.disabled=false;bt.textContent='Criar rascunho';out.innerHTML='<div class="erro">'+esc(x.message)+'</div>'}
}

/* ---------- 2) rascunho: dados, itens, envio ---------- */
function saldoDe(pid){var r=est.d&&est.d.receita;if(!r)return null;var s=r.saldo.filter(function(x){return x.produto_id===pid})[0];return s?s.saldo:0}
function precoDe(pid){var p=est.d.produtos.filter(function(x){return x.id===pid})[0];return p&&p.preco!=null?p.preco:null}
function linhaHtml(l,i){
  var d=est.d, pr=l.produto_id?precoDe(l.produto_id):null, q=D.numBR(l.qtd), tot=(pr!=null&&!isNaN(q))?r2(pr*q):null, sal=l.produto_id?saldoDe(l.produto_id):null;
  var ops='<option value="">— escolha —</option>'+d.produtos.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===l.produto_id?' selected':'')+'>'+esc(p.descricao)+'</option>'}).join('');
  var passa=sal!=null&&!isNaN(q)&&q>sal+0.001;
  return '<tr data-np-l="'+i+'"><td class="c1"><select class="ent np-prod" aria-label="Produto da linha '+(i+1)+'">'+ops+'</select></td>'+
    '<td class="cl"><span class="rot-m">Quantidade </span><input class="ent num np-qtd" inputmode="decimal" value="'+esc(l.qtd===''?'':String(l.qtd).replace('.',','))+'" aria-label="Quantidade da linha '+(i+1)+'"></td>'+
    (d.receita?'<td class="cl r num np-sal'+(passa?' vermelho':'')+'"><span class="rot-m">Saldo da receita </span>'+(sal==null?'—':qtd(sal))+'</td>':'')+
    '<td class="cl r num"><span class="rot-m">Preço </span>'+(pr==null?'<span class="nao">sem preço</span>':D.R(pr))+'</td>'+
    '<td class="c2 r num np-tot">'+(tot==null?'—':D.R(tot))+'</td>'+
    '<td class="cl r"><button type="button" class="link perigo" data-np-rem="'+i+'">remover</button></td></tr>';
}
function subtotal(){return r2(est.linhas.reduce(function(t,l){var p=l.produto_id?precoDe(l.produto_id):null,q=D.numBR(l.qtd);return t+(p!=null&&!isNaN(q)?p*q:0)},0))}
function telaRascunho(){
  var d=est.d, p=d.pedido, pode=d.pode_gravar&&!p.cancelado;
  var h=migalha('Rascunho do pedido');
  var acs=pode?'<button type="button" class="btn pri" id="np-enviar">Confirmar envio</button><button type="button" class="btn perigo" id="np-cancelar">Cancelar rascunho</button>':'';
  h+='<section class="fcab"><div class="l1"><h1>Rascunho do pedido</h1>'+D.tag(p.cancelado?['Cancelado','n']:['Rascunho','n'])+(d.teste?D.tag(['Teste','a']):'')+(acs?'<div class="ac">'+acs+'</div>':'')+'</div>'+
    '<span class="nota">Criado por '+esc(p.criado_por||'—')+' em '+D.dtHora(p.criado_em)+'. Forma de pagamento e parcelas vêm depois, do laboratório (como no sistema antigo).</span></section>';
  if(d.teste) h+=aviso();
  if(d.falta.length) h+='<section class="falta" aria-label="O que falta"><h2>O que falta</h2><ul>'+d.falta.map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ul></section>';
  var dis=pode?'':' disabled';
  var recOp='';
  if(d.ver_receitas){
    var recs=est.rec||[];
    if(d.receita&&!recs.some(function(r){return r.id===d.receita.id}))recs=[{id:d.receita.id,nome:d.receita.nome,status:d.receita.status,pedidos:0}].concat(recs);
    recOp=D.campoD('Receita do mês','<select class="ent" id="npr-rec"'+dis+'>'+D.opt('','Sem receita',d.receita?d.receita.id:'')+recs.map(function(r){return '<option value="'+esc(r.id)+'"'+(d.receita&&r.id===d.receita.id?' selected':'')+(r.status==='rascunho'?' disabled':'')+'>'+esc(r.nome+' — '+(ST_REC[r.status]||r.status))+'</option>'}).join('')+'</select>',p.exige_receita?'exigida pelo Centro Paulista':'opcional');
  }
  h+='<section class="sec" id="np-dados"><div class="sh"><h2>Dados do pedido</h2></div><div class="cp">'+
    '<div class="duas">'+D.campoD('Unidade','<select class="ent" id="npr-un"'+dis+'>'+(est.op?est.op.unidades:[{id:p.unidade_id,nome:p.un}]).map(function(u){return D.opt(u.id,u.nome,p.unidade_id)}).join('')+'</select>')+
    D.campoD('Laboratório','<input class="ent" value="'+esc(p.labNome)+'" disabled>')+'</div>'+
    '<div class="duas">'+recOp+(d.receita&&d.receita.prescritor?D.campoD('Quem assinou a receita','<input class="ent" value="'+esc(d.receita.prescritor)+'" disabled>'):'<span></span>')+'</div>'+
    '<div class="duas">'+D.campoD('Frete (R$)','<input class="ent num" id="npr-frete" inputmode="decimal" value="'+esc(valBR(p.frete||0))+'"'+dis+'>','opcional; o laboratório confirma')+'<span></span></div>'+
    D.campoD('Observação','<textarea class="ent" id="npr-obs" maxlength="1000"'+dis+'>'+esc(p.obs||'')+'</textarea>','opcional')+'</div></section>';
  var cab='<th>Produto</th><th>Quantidade</th>'+(d.receita?'<th class="r">Saldo da receita</th>':'')+'<th class="r">Preço (tabela de hoje)</th><th class="r">Total</th><th></th>';
  h+='<section class="sec" id="np-itens"><div class="sh"><h2>Itens</h2><span class="q" id="np-n">'+D.plural(est.linhas.filter(function(l){return l.produto_id}).length,'produto','produtos')+'</span>'+(pode?'<button type="button" class="botao mini sec" id="np-mais">Incluir produto</button>':'')+'</div>'+
    '<div class="tabela cartoes"><table><thead><tr>'+cab+'</tr></thead><tbody id="np-corpo">'+(est.linhas.length?est.linhas.map(linhaHtml).join(''):'<tr><td colspan="6" class="vazio">Nenhum produto. Use “Incluir produto”.</td></tr>')+'</tbody>'+
    '<tfoot><tr><td class="c1" colspan="'+(d.receita?4:3)+'">Produtos</td><td class="c2 r num" id="np-sub">'+D.R(subtotal())+'</td><td></td></tr></tfoot></table></div>'+
    (d.receita&&d.receita.saldo.length?'<div class="cp"><span class="nota">Saldo = receita menos o que outros pedidos não cancelados desta receita já pediram. Passar do saldo só gera aviso; mudar o que veio da receita pede justificativa.</span></div>':'')+
    (pode?'<div class="cp">'+(d.receita?D.campoD('Justificativa','<textarea class="ent" id="npr-just" maxlength="500" placeholder="Obrigatória se os itens ficarem diferentes do saldo da receita"></textarea>'):'')+
      '<div id="np-erro"></div><div class="acoes-f"><button type="button" class="botao" id="np-salvar">Salvar rascunho</button></div></div>':'')+'</section>';
  return h;
}
function desenha(){var y=window.scrollY;$('#tela').innerHTML=est.d?telaRascunho():telaEscolha();window.scrollTo(0,y)}
async function abrirRascunho(id,sem){
  D.estado.tela='novo-pedido'; D.estado.menu='pedidos'; D.estado.fichaId=id; D.marcaMenu();
  if(!sem) D.navega('#novo-pedido/'+id);
  $('#tela').innerHTML='<p class="vazio">Carregando o rascunho…</p>'; window.scrollTo(0,0);
  try{
    var r=await Promise.all([D.api('np_rascunho',{pedido_id:id}),est.op?Promise.resolve(est.op):D.api('np_opcoes')]);
    if(r[0].enviado){D.abrirFicha(id);return}
    est.d=r[0]; est.op=r[1]; est.sujo=false;
    est.linhas=est.d.itens.map(function(i){return {produto_id:i.produto_id,qtd:i.qtd}});
    est.rec=null;
    if(est.d.ver_receitas){try{est.rec=(await D.api('np_receitas',{unidade_id:est.d.pedido.unidade_id,laboratorio_id:est.d.pedido.lab})).receitas||[]}catch(x){est.rec=[]}}
    if(D.estado.tela==='novo-pedido') $('#tela').innerHTML=telaRascunho();
  }catch(x){if(x.status!==401&&x.status!==403)$('#tela').innerHTML='<p class="vazio">'+esc(x.message)+'</p>'}
}
function corpoSalvar(){
  var d=est.d, itens=[], erro='';
  est.linhas.forEach(function(l,i){
    if(!l.produto_id&&String(l.qtd||'')==='')return;
    var q=D.numBR(l.qtd);
    if(!l.produto_id)erro=erro||('Linha '+(i+1)+': escolha o produto.');else if(isNaN(q)||q<=0)erro=erro||('Linha '+(i+1)+': quantidade inválida.');
    itens.push({produto_id:l.produto_id,qtd:q})});
  var fr=D.numBR($('#npr-frete').value); if($('#npr-frete').value.trim()==='')fr=0;
  if(isNaN(fr)||fr<0) erro=erro||'Frete inválido.';
  if(erro) return {erro:erro};
  var rec=$('#npr-rec');
  return {pedido_id:d.pedido.id,unidade_id:$('#npr-un').value,receita_id:rec?(rec.value||null):(d.receita?d.receita.id:null),itens:itens,frete:fr,obs:$('#npr-obs').value,justificativa:$('#npr-just')?$('#npr-just').value:''};
}
async function salvar(depois){
  var c=corpoSalvar(), out=$('#np-erro'), bt=$('#np-salvar');
  if(c.erro){if(out)out.innerHTML='<div class="erro">'+esc(c.erro)+'</div>';return false}
  if(bt){bt.disabled=true;bt.textContent='Gravando…'}
  try{var r=await D.api('np_salvar',c);if(!depois)D.avisar(r.mensagem);await abrirRascunho(c.pedido_id,true);return true}
  catch(x){if(bt){bt.disabled=false;bt.textContent='Salvar rascunho'}var o=$('#np-erro');if(o)o.innerHTML='<div class="erro">'+esc(x.message)+'</div>';return false}
}
function abrirEnvio(exced){
  var d=est.d, p=d.pedido, hoje=d.hoje;
  D.abrirDlg('Confirmar envio do pedido','<form id="f-np-env" novalidate><div class="dlg-corpo">'+
    (d.teste?'<div class="alerta"><b>Ambiente de teste — o pedido não é enviado ao laboratório.</b></div>':'')+
    '<p style="margin:0 0 10px">Ao confirmar, o sistema grava a data de envio ('+D.dt(hoje)+'), gera o número'+(d.teste?' de teste (TST)':' DH')+' e registra no histórico. A previsão de saída fica em branco até o laboratório informar.</p>'+
    (exced&&exced.length?'<div class="alerta"><b>Passa do saldo da receita:</b><ul class="lista-simples">'+exced.map(function(x){return '<li>'+esc(x.texto)+'</li>'}).join('')+'</ul></div><label class="campo chk"><input type="checkbox" id="np-ciente"><span>Estou ciente e quero enviar assim mesmo</span></label>':'')+
    D.rodapeDlg('Confirmar envio'));
}
async function enviar(e){
  e.preventDefault();
  var ck=$('#np-ciente'), bt=$('#f-np-env button[type=submit]');
  if(ck&&!ck.checked){D.erroDlg('Marque que está ciente de que passa do saldo da receita.');return}
  bt.disabled=true; bt.textContent='Enviando…';
  try{
    var r=await D.api('np_enviar',{pedido_id:est.d.pedido.id,ciente_saldo:!!(ck&&ck.checked)});
    D.fecharDlg(); D.avisar(r.mensagem); est.d=null; D.abrirFicha(r.pedido_id);
  }catch(x){
    if(x.corpo&&x.corpo.codigo==='saldo'){abrirEnvio(x.corpo.excedidos);return}
    bt.disabled=false; bt.textContent='Confirmar envio'; D.erroDlg(x);
  }
}
function atualizaLinha(tr){
  var i=+tr.dataset.npL, l=est.linhas[i];
  var pr=l.produto_id?precoDe(l.produto_id):null, q=D.numBR(l.qtd), t=tr.querySelector('.np-tot');
  if(t) t.textContent=(pr!=null&&!isNaN(q))?D.R(r2(pr*q)):'—';
  var s=tr.querySelector('.np-sal'), sal=l.produto_id?saldoDe(l.produto_id):null;
  if(s) s.classList.toggle('vermelho',sal!=null&&!isNaN(q)&&q>sal+0.001);
  var sub=$('#np-sub'); if(sub) sub.textContent=D.R(subtotal());
}

/* ---------- registro na casca ---------- */
D.abrirRascunho=function(id){abrirRascunho(id)};
D.novoPedido=function(pre){abrirNovo(false,pre)};
M.telas['novo-pedido']={render:desenha,abrir:function(){abrirNovo(true)}};
M.rotas.push([/^novo-pedido\/([0-9a-f-]{36})$/i,function(m,sem){abrirRascunho(m[1],sem)}]);
M.rotas.push([/^novo-pedido$/,function(m,sem){abrirNovo(sem)}]);
M.cliques.push(function(b){
  if(b.id==='np-mais'){est.linhas.push({produto_id:'',qtd:''});desenha();var u=document.querySelectorAll('.np-prod');if(u.length)u[u.length-1].focus();return true}
  if(b.dataset.npRem!==undefined){est.linhas.splice(+b.dataset.npRem,1);est.sujo=true;desenha();return true}
  if(b.id==='np-salvar'){salvar(false);return true}
  if(b.id==='np-enviar'){salvar(true).then(function(ok){if(ok&&est.d&&!est.d.pedido.cancelado)abrirEnvio(est.d.excedidos&&est.d.excedidos.length?est.d.excedidos.map(function(x){return {texto:x.descricao+': pedido '+qtd(x.pedido)+', saldo '+qtd(x.saldo)}}):null)});return true}
  if(b.id==='np-cancelar'){D.abrirDlg('Cancelar rascunho','<form id="f-np-canc" novalidate><div class="dlg-corpo"><p style="margin:0 0 10px">O rascunho continua no sistema, marcado como cancelado, com o motivo.</p>'+D.campoD('Motivo','<textarea class="ent" id="np-mot" maxlength="500" placeholder="Ex.: criado em duplicidade"></textarea>')+D.rodapeDlg('Cancelar rascunho'));return true}
  return false;
});
M.envios.push(function(e){
  if(e.target.id==='f-np'){criar(e);return true}
  if(e.target.id==='f-np-env'){enviar(e);return true}
  if(e.target.id==='f-np-canc'){e.preventDefault();var m=$('#np-mot').value.trim();if(m.length<5){D.erroDlg('Escreva o motivo (pelo menos 5 letras).');return true}
    var bt=$('#f-np-canc button[type=submit]');bt.disabled=true;
    D.api('cancelar_pedido',{pedido_id:est.d.pedido.id,motivo:m}).then(function(r){D.fecharDlg();D.avisar(r.mensagem);abrirRascunho(est.d.pedido.id,true)}).catch(function(x){bt.disabled=false;D.erroDlg(x)});return true}
  return false;
});
M.mudancas.push(function(t){
  if(t.id==='np-un'){est.esc.un=t.value;est.esc.rec='';carregaReceitas()}
  else if(t.id==='np-lab'){est.esc.lab=t.value;est.esc.rec='';carregaReceitas()}
  else if(t.id==='np-rec'){est.esc.rec=t.value;desenha()}
  else if(t.classList&&t.classList.contains('np-prod')){var tr=t.closest('tr');est.linhas[+tr.dataset.npL].produto_id=t.value;est.sujo=true;desenha()}
  else if(t.id==='npr-un'||t.id==='npr-rec'){est.sujo=true}
});
document.addEventListener('input',function(e){
  var t=e.target;
  if(t.classList&&t.classList.contains('np-qtd')){var tr=t.closest('tr');est.linhas[+tr.dataset.npL].qtd=t.value;est.sujo=true;atualizaLinha(tr)}
});
})();
