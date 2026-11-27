import sys,os,hashlib,json
slug=sys.argv[1]; d=os.path.abspath(f'lojas/partes/{slug}')
for f in sorted(os.listdir(d)):
    p=os.path.join(d,f); print(json.dumps({'titulo':f,'tamanho':os.path.getsize(p),'ref':'sha256:'+hashlib.sha256(open(p,'rb').read()).hexdigest()+':'+p}))
