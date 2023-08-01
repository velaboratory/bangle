import asyncio
import struct
import datetime
from bleak import discover
from bleak import BleakClient, BleakScanner
import base64
address = "dd:0c:e4:29:32:ab"
UUID_NORDIC_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
UUID_NORDIC_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"



from bleak import BleakClient, BleakScanner # get button state from the m5stickc
import asyncio

done = False
buffer = ""

def callback(sender,data:bytearray):
    global buffer
    s = data.decode()
    if "\n" in s:
        parts = s.split("\n")
        buffer += parts[0]
        packet = base64.b64decode(buffer)
        for dt,steps in struct.iter_unpack(">IH",packet):
            utc_dt = datetime.datetime.utcfromtimestamp(dt)
            print(f"{utc_dt}:{steps}")
        buffer = parts[1]
    else:
        buffer += s
        print(".",end="",flush=True)

async def run():
    while True:
        try:
            devices = await BleakScanner.discover(5) # short discovery time so it starts quickly
            for d in devices:
                if d.name == "Bangle.js e4d1": # this approach should work on windows or mac
                    
                    print("discovered")
                    async with BleakClient(d) as client:
                        
                        await client.start_notify(UUID_NORDIC_RX,callback)
                        data = bytearray([1])
                        await asyncio.sleep(1)
                        print("writing packet")
                        await client.write_gatt_char(UUID_NORDIC_TX,data,False)
                        await asyncio.sleep(10)
                        
        except:
            pass

asyncio.run(run())

