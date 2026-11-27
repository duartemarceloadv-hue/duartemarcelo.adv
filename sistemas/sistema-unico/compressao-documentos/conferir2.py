import json,subprocess,os,tempfile,shutil
from PIL import Image, ImageChops, ImageStat
from concurrent.futures import ThreadPoolExecutor
def pages(f,d):
    subprocess.run(['pdftoppm','-r','25','-gray','-png',f,d+'/p'],capture_output=True)
    return [Image.open(os.path.join(d,x)).convert('L') for x in sorted(os.listdir(d))]
def ink(i): return sum(i.point(lambda v:255 if v<200 else 0).histogram()[255:])/ (i.width*i.height)
def txtlen(f):
    r=subprocess.run(['pdftotext',f,'-'],capture_output=True,text=True,errors='ignore'); return len(''.join(r.stdout.split()))
def chk(a):
    slug,r=a; o=r['orig']; c=o.replace('/orig/','/comp/')
    d1=tempfile.mkdtemp(); d2=tempfile.mkdtemp()
    try:
        A=pages(o,d1); B=pages(c,d2)
        if len(A)!=len(B) or not A: return dict(slug=slug,path=r['path'],motivo='paginas',worst=999)
        worst=0; inkdrop=0
        for x,y in zip(A,B):
            if x.size!=y.size: y=y.resize(x.size)
            worst=max(worst,ImageStat.Stat(ImageChops.difference(x,y)).mean[0])
            ix,iy=ink(x),ink(y)
            if ix>0.002: inkdrop=max(inkdrop,(ix-iy)/ix)
        to,tc=txtlen(o),txtlen(c)
        tdrop=(to-tc)/to if to>30 else 0
        return dict(slug=slug,path=r['path'],worst=round(worst,2),inkdrop=round(inkdrop,3),tdrop=round(tdrop,3),pag=len(A))
    finally: shutil.rmtree(d1); shutil.rmtree(d2)
jobs=[]
for slug in ['Moinhos']+[f[0] for f in json.load(open('fila.json'))]:
    for r in json.load(open(f'lojas/{slug}/resultado.json')):
        if r.get('trocado'): jobs.append((slug,r))
with ThreadPoolExecutor(10) as ex: res=list(ex.map(chk,jobs))
json.dump(res,open('conferencia2.json','w'))
sus=[x for x in res if x.get('motivo') or x['worst']>4 or x['inkdrop']>0.15 or x['tdrop']>0.02]
print('conferidos',len(res),'suspeitos',len(sus))
for x in sorted(sus,key=lambda x:-(x.get('inkdrop',1)))[:40]: print(x['slug'],x.get('worst'),x.get('inkdrop'),x.get('tdrop'),x['path'].split('/')[-1][14:60])
