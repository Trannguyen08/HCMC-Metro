import urllib.request, json, re

req = urllib.request.Request('http://localhost:8000/api/auth/login/', data=json.dumps({'identifier': 'admin@metrohcm.vn', 'password': 'admin123'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
token = json.loads(res.read())['access']
try:
    req2 = urllib.request.Request('http://localhost:8000/api/admin/news/', headers={'Authorization': 'Bearer ' + token})
    urllib.request.urlopen(req2)
except Exception as e:
    html = e.read().decode('utf-8')
    match = re.search(r'(?si)<textarea\s+id="traceback_area".*?>(.*?)</textarea>', html)
    if match:
        tb = match.group(1).replace('&quot;', '"').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&').replace('&#x27;', "'")
        print(tb)
    else:
        print('No traceback found inside textarea')
