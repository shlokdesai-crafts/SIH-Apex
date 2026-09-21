import urllib.request
import json

req = urllib.request.Request("https://data.mendeley.com/api/datasets/g46dvrcvwn/2", headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    text = resp.read().decode('utf-8')
    print("Length of response:", len(text))
    print(text[:2000])
