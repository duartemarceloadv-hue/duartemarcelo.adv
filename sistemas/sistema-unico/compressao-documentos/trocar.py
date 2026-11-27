import json,subprocess,os,sys,hashlib
U='https://xqxjmeioodmdhxhivyqu.supabase.co'
TOK=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'token.txt')).read().strip()
def fn(body):
    r=subprocess.run(['curl','-s','-X','POST',U+'/functions/v1/apoio-compressao-teste','-H','x-teste-token: '+TOK,'-H','content-type: application/json','--data',json.dumps(body)],capture_output=True,text=True)
    return json.loads(r.stdout)
loja=sys.argv[1]; lim=int(sys.argv[2]) if len(sys.argv)>2 else 10**9
f=f'lojas/{loja}/resultado.json'; res=json.load(open(f)); feitos=0
for r in res:
    if not r['trocar'] or r.get('trocado') or feitos>=lim: continue
    c=r['orig'].replace('/orig/','/comp/'); hc=hashlib.sha256(open(c,'rb').read()).hexdigest()
    up=fn({'acao':'trocar','path':r['path']})
    if 'signedUrl' not in up: print('ERRO upload-url',r['path'],up); continue
    p=subprocess.run(['curl','-s','-w','%{http_code}','-o','/dev/null','-X','PUT',up['signedUrl'],'-H','content-type: application/pdf','-H','x-upsert: true','--data-binary','@'+c],capture_output=True,text=True)
    if p.stdout.strip()!='200': print('ERRO put',p.stdout,r['path']); continue
    l=fn({'paths':[r['path']]})[0]; u=l['signedURL']; u=u if u.startswith('http') else U+'/storage/v1'+u
    subprocess.run(['curl','-s','-f','-o','/tmp/volta.pdf',u],check=True)
    hv=hashlib.sha256(open('/tmp/volta.pdf','rb').read()).hexdigest()
    r['trocado']= hv==hc; feitos+=1
    print('OK' if r['trocado'] else 'DIFERENTE', round(r['s']/1048576,2),'->',round(r['sc']/1048576,2),'MB', r['path'].split('/')[-1][14:60])
json.dump(res,open(f,'w'),indent=1)
