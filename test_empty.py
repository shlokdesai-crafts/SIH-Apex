import urllib.request
import urllib.error
import json
from pathlib import Path

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = []
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="crop_maize.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8'))
# Send corrupt file
body.append(b'this is not a valid image file, it is just some random bytes'*100)
body.append(f'\r\n--{boundary}--\r\n'.encode('utf-8'))

data = b''.join(body)

req = urllib.request.Request(
    "http://localhost:8000/api/scan",
    data=data,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

try:
    with urllib.request.urlopen(req) as response:
        print(response.status)
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode('utf-8'))
