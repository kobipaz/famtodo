# Builds the site into _site/ (run by GitHub Actions on every push)
import re, json, os, shutil, glob, time, io, tarfile, urllib.request
os.makedirs('_site', exist_ok=True)
# version = commit id (set by GitHub Actions); the app compares it with version.json to offer updates
VERSION = (os.environ.get('GITHUB_SHA') or format(int(time.time()), 'x'))[:7]
style = open('src/style.css', encoding='utf-8').read()
for extra in sorted(glob.glob('src/style-*.css')):
    style += '\n' + open(extra, encoding='utf-8').read()
logo = re.sub(r'\s*\n\s*', ' ', open('src/logo.svg', encoding='utf-8').read().strip())
html = open('src/app.template.html', encoding='utf-8').read().replace('/*@@STYLE@@*/', style).replace('<!--@@LOGO@@-->', logo)
# add-on scripts (src/app-*.js) run after the main script and may override its functions
js = ''.join(open(f, encoding='utf-8').read() + '\n' for f in sorted(glob.glob('src/app-*.js')))
if js:
    html = html.replace('</body>', '<script>\n' + js + '</script>\n</body>')

# fixed emoji images: Twemoji 15.0.0 (pinned) -> _site/emoji/*.svg
EMOJI_PKG = 'https://registry.npmjs.org/@twemoji/svg/-/svg-15.0.0.tgz'
os.makedirs('_site/emoji', exist_ok=True)
with tarfile.open(fileobj=io.BytesIO(urllib.request.urlopen(EMOJI_PKG).read()), mode='r:gz') as tf:
    for m in tf.getmembers():
        if m.isfile() and m.name.endswith('.svg'):
            open('_site/emoji/' + os.path.basename(m.name), 'wb').write(tf.extractfile(m).read())

html = html.replace('@@VERSION@@', VERSION).replace('@@EMOJI@@', 'emoji/')
open('_site/index.html', 'w', encoding='utf-8').write(html)
json.dump({'v': VERSION}, open('_site/version.json', 'w'))
for f in ('config.js', 'firebase-messaging-sw.js'):
    shutil.copy(f, '_site/' + f)
json.dump({"name": "FamToDo", "short_name": "FamToDo", "lang": "he", "dir": "rtl", "start_url": "./", "scope": "./",
           "display": "standalone", "background_color": "#f3f7fc", "theme_color": "#f3f7fc",
           "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
                     {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"}]},
          open('_site/manifest.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('built', VERSION, len(html), len(os.listdir('_site/emoji')), 'emoji')
