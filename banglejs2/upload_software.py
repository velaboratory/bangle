import asyncio
import struct
import datetime
from getmac import get_mac_address
from bleak import BleakClient, BleakScanner
import requests
import base64

UUID_NORDIC_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
UUID_NORDIC_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
import asyncio
import json
import base64
import json_minify
import js2py
pause=False
minify=True
file = "watch_hrv_study.js"
address = "e5:cc:1d:bb:e4:d1"
def callback(sender,data:bytearray):
    if data[0] == 19:
        pause = True
    if data[0] == 17:
        pause = False

def validate_and_minify(js_data):
    #minify
    

    res = requests.post("https://www.toptal.com/developers/javascript-minifier/api/raw",{"input":js_data})
    try:
        f = js2py.parse_js(res.text)
    except:
        pass
        #return None,"invalid javascript"
    
    to_return = None
    if minify:
        return res.text 
    
    return js_data

async def run():
    
    while True:
        try:
            devices = await BleakScanner.discover(5,return_adv=True) # short discovery time so it starts quickly
            for d,adv in devices.values():
                print(d.name)
                if d.name and ("VELWATCH" in d.name) and (d.address.lower() == address.lower()): # this approach should work on windows or mac
                    print(d.name)

                    async with BleakClient(d) as client:
                        print("starting sync")
                        await client.start_notify(UUID_NORDIC_RX,callback)
 
                        print("waiting for data")

                        while True:
                            
                            print("hello")
                            await client.write_gatt_char(UUID_NORDIC_TX,bytearray([4]))
                            print("here")
                            js_data = open(file).read()
                            data = validate_and_minify(js_data).replace("\n","").strip() + "\n" #only 1 newline allowed
                            print(data)
                            mtu_size = 50
                            for i in range(0, len(data), mtu_size):
                                 print(i)
                                 while pause:
                                     await asyncio.sleep(.05) 
                                 
                                 await client.write_gatt_char(UUID_NORDIC_TX,data[i:i+mtu_size].encode())

                            await asyncio.sleep(1)
                            await client.write_gatt_char(UUID_NORDIC_TX,bytearray([5]))
                            return
                        
        except:
            pass

asyncio.run(run())