# Devolve o ORIGINAL para cada caminho da lista (arquivo JSON com lista de paths) e confere o hash.
import json,subprocess,os,sys,hashlib
U='https://xqxjmeioodmdhxhivyqu.supabase.co'
TOK=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'token.txt')).read().strip()
def fn(body):
    r=subprocess.run(['curl','-s','-X','POST',U+'/functions/v1/apoio-compressao-teste','-H','x-teste-token: '+TOK,'-H','content-type: application/json','--data',json.dumps(body)],capture_output=True,text=True)
    return json.loads(r.stdout)
alvo=set(json.load(open(sys.argv[1])))
for slug in ['Moinhos']+[f[0] for f in json.load(open('fila.json'))]:
    f=f'lojas/{slug}/resultado.json'; res=json.load(open(f)); mud=False
    for r in res:
        if r['path'] not in alvo or not r.get('trocado'): continue
        o=r['orig']; ho=hashlib.sha256(open(o,'rb').read()).hexdigest()
        assert ho==r['sha'], 'original local alterado?!'
        up=fn({'acao':'trocar','path':r['path']})
        if 'signedUrl' not in up: print('ERRO url',r['path'],up); continue
        p=subprocess.run(['curl','-s','-w','%{http_code}','-o','/dev/null','-X','PUT',up['signedUrl'],'-H','content-type: application/pdf','-H','x-upsert: true','--data-binary','@'+o],capture_output=True,text=True)
        if p.stdout.strip()!='200': print('ERRO put',p.stdout,r['path']); continue
        l=fn({'paths':[r['path']]})[0]; u=l['signedURL']; u=u if u.startswith('http') else U+'/storage/v1'+u
        subprocess.run(['curl','-s','-f','-o','/tmp/volta.pdf',u],check=True)
        ok=hashlib.sha256(open('/tmp/volta.pdf','rb').read()).hexdigest()==ho
        if ok: r['trocado']=False; r['restaurado']=True; mud=True
        print('ORIGINAL DEVOLVIDO' if ok else 'FALHA', slug, r['path'].split('/')[-1][14:70])
    if mud: json.dump(res,open(f,'w'),indent=1)
