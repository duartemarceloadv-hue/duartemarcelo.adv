set -u
python3 -c "import json;[print(f[0],f[2]) for f in json.load(open('fila.json'))]" | while read slug uid; do
  if [ ! -f lojas/$slug/resultado.json ]; then python3 etapa.py $slug $uid || echo "FALHA $slug"; fi
  if [ ! -f partes/$slug.ok ] && [ -f lojas/$slug/resultado.json ]; then
    rm -rf lojas/partes/$slug; mkdir -p lojas/partes/$slug
    (cd lojas/$slug/orig && 7z a -bd -mx=1 -v3000k ../../partes/$slug/$slug-originais.7z . >/dev/null)
    rm -rf /tmp/jx; 7z x -bd -o/tmp/jx lojas/partes/$slug/$slug-originais.7z.001 >/dev/null
    a=$(cd /tmp/jx && sha256sum * | sort | sha256sum); b=$(cd lojas/$slug/orig && sha256sum * | sort | sha256sum)
    if [ "$a" = "$b" ]; then mkdir -p partes; touch partes/$slug.ok; echo "PACOTE OK $slug $(ls lojas/partes/$slug | wc -l) partes"; else echo "PACOTE DIFERENTE $slug"; fi
    rm -rf /tmp/jx
  fi
done
echo FIM
