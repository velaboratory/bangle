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
pause=False
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
        return None,"invalid javascript"
    
    to_return = {"minified":res.text, "base64":base64.b64encode(res.text.encode()).decode()}
    if len(to_return["base64"]) > 40000:
        return None,"too big"
    return to_return, "success"

async def run():
    
    while True:
        try:
            devices = await BleakScanner.discover(5,return_adv=True) # short discovery time so it starts quickly
            for d,adv in devices.values():
                print(d.name)
                if d.name and ("VELWATCH" in d.name): # this approach should work on windows or mac
                    print(d.name)
                    # # check with the server
                    # data={"station_id":get_mac_address().lower(),"device_id":d.address.lower(),"config_id":config_id}
                    # print(data)
                    # res = requests.post(server+"discovered",data=data).json()
                    # sync_complete = False
                    # confirming_delete = False
                    # uploading_config = False
                    # packet_available = False
                    # if not res["success"]:
                    #     print("failed to check id")
                    #     continue
                    # if res["sync"] == 0:
                    #     print("sync not needed")
                    #     #continue
                    
                    # we should sync
                    async with BleakClient(d) as client:
                        print("starting sync")
                        await client.start_notify(UUID_NORDIC_RX,callback)
                        #now = res["server_unixtime"]
                        #print(now)
                        #data = bytearray([1])+struct.pack('>I', now)
                        #print("writing start data:",data)
                        #await client.write_gatt_char(UUID_NORDIC_TX,data,False)
                        print("waiting for data")
                        #await asyncio.sleep(1)

                        # make a connection to the server to upload data
                        #failure = False
                        #sync_id = None
                        while True:
                            # if packet_available:
                            #     print("packet downloaded, uploading to server")
                            #     # packet downloaded, let's upload to the server
                            #     data = {"station_id":get_mac_address().lower(),"config_id":config_id,"data":packet}
                            #     if sync_id:
                            #         data["sync_id"] = sync_id
                            #     res = requests.post(server+"sync",data=data).json()
                            #     if not res["success"]:
                            #         print("failed to upload:", res["reason"])
                            #         failure = True
                            #         break
                            #     sync_id = res["sync_id"]
                            #     packet_available = False
                            #     if sync_complete:
                            #         break
                                
                            #     print("waiting for more data")
                            #     await client.write_gatt_char(UUID_NORDIC_TX,data,False) #send more data
                            print("hello")
                            await client.write_gatt_char(UUID_NORDIC_TX,bytearray([4]))
                            print("here")
                            js_data = open("watch2.js").read()
                            data, reason = validate_and_minify(js_data)
                            if not data:
                                print(reason)
                                break
                            encoded = data["base64"]+"\n" 
                            print(encoded)
                            for i in range(0, len(encoded), 100):
                                 print(i)
                                 while pause:
                                     await asyncio.sleep(.05) #seems good enough
                                 
                                 await client.write_gatt_char(UUID_NORDIC_TX,encoded[i:i+100].encode())

                                 
                            return
                        
        except:
            pass

asyncio.run(run())