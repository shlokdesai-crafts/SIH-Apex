import urllib.request
import uuid

file_path = r'c:\Users\d0in\OneDrive\Documents\Desktop\SIH\public\images\crop_healthy_leaf.jpg'
boundary = uuid.uuid4().hex

body = (
    b'--' + boundary.encode() + b'\r\n'
    b'Content-Disposition: form-data; name="file"; filename="crop_healthy_leaf.jpg"\r\n'
    b'Content-Type: image/jpeg\r\n\r\n'
    + open(file_path, 'rb').read() + b'\r\n'
    b'--' + boundary.encode() + b'--\r\n'
)

req = urllib.request.Request(
    'http://localhost:8000/api/scan',
    data=body,
    headers={'Content-Type': 'multipart/form-data; boundary=' + boundary}
)

try:
    res = urllib.request.urlopen(req)
    print(res.read().decode())
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
