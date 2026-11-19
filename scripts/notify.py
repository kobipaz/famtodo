"""FamToDo notifications — runs on GitHub Actions every ~10 minutes (.github/workflows/notify.yml).
 1. New task that Kobi or Orit added for someone else -> push to the list's members (except the creator)
 2. Morning reminder (from 07:00)                  -> tasks due today / overdue
 3. After-school reminder (from 14:30)             -> tasks due today / overdue + open tasks without a date
                                                     + "📝 מחר מבחן" for a kid with an exam tomorrow (exam board)
 4. Task with a time (e.g. 15:00) due today        -> reminder at that time (personal list: its owner; group list: its members)
 5. Recycle bin: tasks deleted more than 14 days ago are removed for good
Times are Israel time. Needs the secret FIREBASE_SA (service-account JSON)."""
import os, json, time, datetime
from zoneinfo import ZoneInfo
import firebase_admin
from firebase_admin import credentials, firestore, messaging

APP_URL = 'https://kobipaz.github.io/famtodo/'
ICON = APP_URL + 'icon-192.png'
TZ = ZoneInfo('Asia/Jerusalem')
MORNING = (7, 0)          # first run after this time sends the morning reminder
AFTER_SCHOOL = (14, 30)   # first run after this time sends the after-school reminder
EARLY_MIN = 5             # time reminders go out up to 5 min early (runs every ~5 min) so they land on time

NAMES = {'kobi': 'קובי', 'orit': 'אורית', 'aviv': 'אביב', 'yuval': 'יובל', 'omer': 'עומר'}
FEMALE = {'orit', 'aviv', 'yuval'}
MEMBERS = {p: [p] for p in NAMES}
MEMBERS.update({'family': list(NAMES), 'parents': ['kobi', 'orit'], 'kids': ['aviv', 'yuval', 'omer']})
ADMINS = ('kobi', 'orit')
def recips(t):
    """Who a task belongs to: an exam (exam board) belongs only to its kid; otherwise the list's members."""
    if t.get('exam') and t.get('kid') in NAMES:
        return [t['kid']]
    if t.get('chug'):                       # activities board: only the person it belongs to
        return [t['who']] if t.get('who') in NAMES else []
    return MEMBERS.get(t.get('list'), [])


LIST_NAMES = dict(NAMES, family='משפחתי', parents='אורית וקובי', kids='ילדים')

firebase_admin.initialize_app(credentials.Certificate(json.loads(os.environ['FIREBASE_SA'])))
db = firestore.client()


def tokens_of(person):
    return [d for d in db.collection('tokens').where('person', '==', person).stream()]


def push(person, title, body):
    docs = tokens_of(person)
    if not docs:
        return 0
    msgs = [messaging.Message(
        token=d.id,
        webpush=messaging.WebpushConfig(
            notification=messaging.WebpushNotification(title=title, body=body, icon=ICON, badge=ICON, language='he', direction='rtl'),
            fcm_options=messaging.WebpushFCMOptions(link=APP_URL)))
        for d in docs]
    res = messaging.send_each(msgs)
    for d, r in zip(docs, res.responses):
        if not r.success:
            code = getattr(r.exception, 'code', '') or ''
            print('  send failed', person, code, r.exception)
            if 'UNREGISTERED' in str(code).upper() or 'NOT_FOUND' in str(code).upper() or 'INVALID_ARGUMENT' in str(code).upper():
                d.reference.delete()
    return res.success_count


def added_verb(p):
    return 'הוסיפה' if p in FEMALE else 'הוסיף'


def short(tasks, n=4):
    lines = ['• ' + t['title'] for t in tasks[:n]]
    if len(tasks) > n:
        lines.append(f'ועוד {len(tasks) - n}…')
    return '\n'.join(lines)


meta_ref = db.document('meta/notify')
state = (meta_ref.get().to_dict() or {})
now_ms = int(time.time() * 1000)
now = datetime.datetime.now(TZ)
today = now.strftime('%Y-%m-%d')
tomorrow = (now + datetime.timedelta(days=1)).strftime('%Y-%m-%d')

# ---------- 1. new tasks for someone else ----------
last = state.get('lastNew') or now_ms          # first run: start from now (no flood of old tasks)
per_person = {}
for d in db.collection('tasks').where('createdAt', '>', last).stream():
    t = d.to_dict()
    if t.get('archived') or t.get('done') or t.get('deleted'):
        continue
    creator = t.get('createdBy')
    if creator not in ADMINS:       # only Kobi/Orit adding for others triggers a "new task" alert
        continue
    for r in recips(t):
        if r != creator:
            per_person.setdefault(r, []).append(t)
for person, ts in per_person.items():
    ts.sort(key=lambda x: x.get('createdAt', 0))
    if len(ts) == 1:
        t = ts[0]
        lst = t.get('list')
        where = '' if lst == person else f' ב{LIST_NAMES.get(lst, "")}'
        title = f'🆕 {NAMES.get(t.get("createdBy"), "מישהו")} {added_verb(t.get("createdBy"))} משימה{where}'
        body = t['title']
    else:
        title = f'🆕 {len(ts)} משימות חדשות בשבילך'
        body = short(ts)
    print('new ->', person, push(person, title, body))
state['lastNew'] = now_ms

# ---------- 2+3. daily reminders ----------
def digest(kind):
    open_tasks = [d.to_dict() for d in db.collection('tasks').where('done', '==', False).stream()]
    open_tasks = [t for t in open_tasks if not t.get('archived') and not t.get('deleted')]
    for person in NAMES:
        mine = [t for t in open_tasks if person in recips(t)]
        due = sorted([t for t in mine if t.get('due') and t['due'] <= today], key=lambda t: t['due'])
        late = [t for t in due if t['due'] < today]
        undated = [t for t in mine if not t.get('due') and t.get('list') in (person, 'kids') and not t.get('exam')]
        exams_tmrw = [t for t in mine if t.get('exam') and t.get('due') == tomorrow]
        if kind == 'morning':
            if not due:
                continue
            title = '☀️ בוקר טוב, ' + NAMES[person] + '!'
            body = f'{len(due)} משימות להיום' + (f' ({len(late)} באיחור)' if late else '') + '\n' + short(due)
        else:
            items = due + undated
            if not items and not exams_tmrw:
                continue
            if exams_tmrw:                                 # day-before exam reminder
                push(person, '📝 מחר מבחן!', '\n'.join('• ' + (t.get('subject') or t['title']) for t in exams_tmrw))
            if not items:
                continue
            title = '🎒 משימות אחרי בית הספר' if person in ('aviv', 'yuval', 'omer') else '🕒 תזכורת צהריים'
            body = f'{len(items)} משימות מחכות לך\n' + short(items)
        print(kind, '->', person, push(person, title, body))

if (now.hour, now.minute) >= MORNING and now.hour < 12 and state.get('morning') != today:
    digest('morning'); state['morning'] = today
if (now.hour, now.minute) >= AFTER_SCHOOL and now.hour < 20 and state.get('afternoon') != today:
    digest('afternoon'); state['afternoon'] = today

# ---------- 4. reminder at the task's time ----------
now_min = now.hour * 60 + now.minute
for d in db.collection('tasks').where('due', '==', today).stream():
    t = d.to_dict()
    tm = t.get('time') or ''
    if not tm or t.get('done') or t.get('archived') or t.get('deleted'):
        continue
    key = today + ' ' + tm
    try:
        tmin = int(tm[:2]) * 60 + int(tm[3:5])
    except ValueError:
        continue
    if tmin - EARLY_MIN > now_min or t.get('remindedFor') == key:
        continue
    if now_min - tmin <= 60:          # don't remind about times that passed long ago
        where = LIST_NAMES.get(t.get('list'), '')
        for r in recips(t):
            print('time ->', r, push(r, f'⏰ {tm} · {t["title"]}', f'ברשימה: {where}'))
    d.reference.update({'remindedFor': key})

# ---------- 5. empty the recycle bin after 14 days ----------
TRASH_DAYS = 14
cutoff = now_ms - TRASH_DAYS * 86400000
for d in db.collection('tasks').where('deleted', '==', True).stream():
    if (d.to_dict().get('deletedAt') or 0) < cutoff:
        d.reference.delete(); print('bin: removed', d.id)

meta_ref.set(state)
print('done', now.isoformat())
