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

done = False
buffer = ""
server = "http://localhost:5000/"
packet = []
def callback(sender,data:bytearray):
    global done
    global buffer
    global packet
    s = data.decode()
    if "\n" in s:
        parts = s.split("\n")
        buffer += parts[0]
        packet = buffer
        
        # for dt,steps in struct.iter_unpack(">IH",packet):
        #     utc_dt = datetime.datetime.utcfromtimestamp(dt)
        #     print(f"{utc_dt}:{steps}")
        buffer = parts[1]
        done = True
    else:
        buffer += s
        print(".",end="",flush=True)

async def run():
    global done
    global packet
    while True:
        try:
            devices = await BleakScanner.discover(1,return_adv=True) # short discovery time so it starts quickly
            for d,adv in devices.values():
                print("discovered",d)
                if "Bangle.js" in d.name: # this approach should work on windows or mac
                    # check with the server
                    data={"station_id":get_mac_address().lower(),"device_id":d.address.lower(),"config_id":1}
                    print(data)
                    req = requests.post(server+"discovered",data=data)
                    print(req)
                    res = req.json()
                    if res["success"] and (res["sync"] == 1):
                        async with BleakClient(d) as client:
                            
                            await client.start_notify(UUID_NORDIC_RX,callback)
                            data = bytearray([1])
                            await asyncio.sleep(1)
                            print("writing packet")
                            await client.write_gatt_char(UUID_NORDIC_TX,data,False)
                            #now wait for all data to be received
                            done = False
                            while not done:
                                await asyncio.sleep(1)
                            # packet downloaded, let's upload to the server
                            data = {"station_id":get_mac_address().lower(),"config_id":1,"data":packet}
                            req = requests.post(server+"sync",data=data)
                            print(req.json())
                        
        except:
            pass

asyncio.run(run())

