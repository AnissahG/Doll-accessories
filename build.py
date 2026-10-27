import json, os
# Doll accessories Pattern Studio: src/ -> dist/index.html (same layout as Doll sew). Run: py build.py
os.chdir(os.path.dirname(os.path.abspath(__file__)))
SRC='src'; OUT='dist'
os.makedirs(OUT, exist_ok=True)
def rd(p): return open(p, encoding='utf-8').read()
order=json.load(open(f'{SRC}/order.json', encoding='utf-8'))['engine']+['app.js','platform.js','sync.js']
js='\n;\n'.join(rd(f'{SRC}/{f}') for f in order)
css=rd(f'{SRC}/style.css')
tmpl=rd(f'{SRC}/index.tmpl.html')
html=tmpl.replace('/*__CSS__*/',css).replace('/*__JS__*/',js)
open(f'{OUT}/index.html','w', encoding='utf-8', newline='\n').write(html)
print('index.html', len(html)//1024, 'KB')
