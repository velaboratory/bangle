import base64
data = "ZMeqmger"
print(data)
decoded = base64.b64decode(data)
print(decoded)
import struct

for dt,steps in struct.iter_unpack(">IH",decoded):
    print(f"{dt}:{steps}")