import asyncio
import struct
import datetime
from getmac import get_mac_address
from bleak import BleakClient, BleakScanner
import requests
import base64
address = "dd:0c:e4:29:32:ab"
UUID_NORDIC_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
UUID_NORDIC_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
import asyncio
import json
import base64
import json_minify
import js2py

received_data = ""
def callback(sender,data:bytearray):
    global received_data
    received_data += data.decode()

def validate_and_minify(js_data):
    #minify
    res = requests.post("https://www.toptal.com/developers/javascript-minifier/api/raw",{"input":js_data})
    try:
        f = js2py.parse_js(res.text)
    except:
        return None,"invalid javascript"
    
    to_return = {"minified":res.text, "base64":base64.b64encode(res.text.encode()).decode()}
    if len(to_return["base64"]) > 40000:
        return None,"too big"
    return to_return, "success"

async def run():
    global received_data
    while True:

        try:
            devices = await BleakScanner.discover(5,return_adv=True) # short discovery time so it starts quickly
            for d,adv in devices.values():
                received_data = ""
                print(d.name)
                if d.name and ("Bangle.js" in d.name): # this approach should work on windows or mac
                    async with BleakClient(d) as client:
                        print("starting sync")
                        await client.start_notify(UUID_NORDIC_RX,callback)
                        
                        await asyncio.sleep(3) # wait for prompt

                        print(received_data)
                        
                        if not ("Terminal" in received_data):
                            print("here")
                            break

                        # now we can send the data

                        js_data = open("watch.js").read()
                        data, reason = validate_and_minify(js_data)
                        if not data:
                            print(reason)
                            break

                        #print("E.setBootCode("+json.dumps(data["minified"])+");load()\n")

                        to_send = "E.setBootCode("+json.dumps(data["minified"])+");load()\n"

                        for r in range(0,len(to_send),50):
                            print(to_send[r:r+50])
                            await client.write_gatt_char(UUID_NORDIC_TX,to_send[r:r+50].encode())
                            await asyncio.sleep(.02) #seems good enough

                        while True:
                            if client.is_connected:
                                await asyncio.sleep(.1) #seems good enough
                            else:
                                await asyncio.sleep(.1) #seems good enough
                                break
        except:
            pass



asyncio.run(run())