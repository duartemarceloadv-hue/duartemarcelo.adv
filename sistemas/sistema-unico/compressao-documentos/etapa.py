import json,subprocess,os,sys,hashlib
U='https://xqxjmeioodmdhxhivyqu.supabase.co'
TOK=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'token.txt')).read().strip()
def fn(body):
    r=subprocess.run(['curl','-s','-X','POST',U+'/functions/v1/apoio-compressao-teste','-H','x-teste-token: '+TOK,'-H','content-type: application/json','--data',json.dumps(body)],capture_output=True,text=True)
    return json.loads(r.stdout)
def pages(f):
    r=subprocess.run(['pdfinfo',f],capture_output=True,text=True)
    for l in r.stdout.splitlines():
        if l.startswith('Pages:'): return int(l.split()[1])
    return None
loja,uid=sys.argv[1],sys.argv[2]
paths=json.load(open(f'lojas/{loja}.paths.json'))
base=f'lojas/{loja}'; os.makedirs(base+'/orig',exist_ok=True); os.makedirs(base+'/comp',exist_ok=True)
res=[]
for i in range(0,len(paths),50):
    for x in fn({'paths':paths[i:i+50]}):
        p=x['path']; u=x['signedURL']; u=u if u.startswith('http') else U+'/storage/v1'+u
        loc=base+'/orig/'+p[len(uid)+1:].replace('/','__')
        subprocess.run(['curl','-s','-f','-o',loc,u],check=True)
        res.append({'path':p,'orig':loc,'s':os.path.getsize(loc),'sha':hashlib.sha256(open(loc,'rb').read()).hexdigest()})
for r in res:
    c=r['orig'].replace('/orig/','/comp/'); r['pag']=pages(r['orig'])
    if r['orig'].lower().endswith('.pdf') and r['pag']:
        subprocess.run(['gs','-q','-dNOPAUSE','-dBATCH','-dSAFER','-sDEVICE=pdfwrite','-dCompatibilityLevel=1.5','-dPDFSETTINGS=/ebook','-dDetectDuplicateImages=true','-dColorImageResolution=150','-dGrayImageResolution=150','-dMonoImageResolution=300','-sOutputFile='+c,r['orig']],capture_output=True)
        if os.path.exists(c):
            r['sc']=os.path.getsize(c); r['pagc']=pages(c)
    ok = r.get('pagc') is not None and r.get('pagc')==r['pag'] and r.get('sc',10**12) < r['s']*0.9
    r['trocar']=ok
json.dump(res,open(base+'/resultado.json','w'),indent=1)
t=sum(r['s'] for r in res); n=sum(r['sc'] if r['trocar'] else r['s'] for r in res)
print(loja,len(res),'arquivos', round(t/1048576,1),'MB ->',round(n/1048576,1),'MB; trocar',sum(r['trocar'] for r in res))
