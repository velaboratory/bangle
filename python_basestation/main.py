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
config_id = 1
packet_available = False
def callback(sender,data:bytearray):
    
    global uploading_config
    global confirming_delete
    global buffer
    global packet
    global packet_available
    global sync_complete

   
    if not sync_complete: 
        s = data.decode()
        #tack the message onto the buffer
        if "\x02" in s: #end of upload
            parts = s.split("\x02")
            buffer += parts[0]
            packet = buffer
            packet_available = True
            sync_complete = True
        elif "\x01" in s: #end of packet
            parts = s.split("\x01")
            buffer += parts[0]
            packet = buffer
            packet_available = True
        else:
            buffer += s
            print(".",end="",flush=True)

    elif confirming_delete:
        if data[0] == 2:
            print("delete confirmed")
            confirming_delete = False

    elif uploading_config:
        
        if data[0] == 3:
            print("upload config confirmed")
            uploading_config = False


async def run():
    global packet_available
    global sync_complete
    global uploading_config
    global confirming_delete
    global packet
    while True:
        try:
            devices = await BleakScanner.discover(5,return_adv=True) # short discovery time so it starts quickly
            for d,adv in devices.values():
                if d.name and ("Bangle.js" in d.name): # this approach should work on windows or mac
                    # check with the server
                    data={"station_id":get_mac_address().lower(),"device_id":d.address.lower(),"config_id":config_id}
                    print(data)
                    res = requests.post(server+"discovered",data=data).json()
                    sync_complete = False
                    confirming_delete = False
                    uploading_config = False
                    packet_available = False
                    if not res["success"]:
                        print("failed to check id")
                        continue
                    if res["sync"] == 0:
                        print("sync not needed")
                        #continue
                    
                    # we should sync
                    async with BleakClient(d) as client:
                        print("starting sync")
                        await client.start_notify(UUID_NORDIC_RX,callback)
                        now = res["server_unixtime"]
                        print(now)
                        data = bytearray([1])+struct.pack('>I', now)
                        print("writing start data:",data)
                        await client.write_gatt_char(UUID_NORDIC_TX,data,False)
                        print("waiting for data")
                        #await asyncio.sleep(1)

                        # make a connection to the server to upload data
                        failure = False
                        sync_id = None
                        while True:
                            if packet_available:
                                print("packet downloaded, uploading to server")
                                # packet downloaded, let's upload to the server
                                data = {"station_id":get_mac_address().lower(),"config_id":config_id,"data":packet}
                                if sync_id:
                                    data["sync_id"] = sync_id
                                res = requests.post(server+"sync",data=data).json()
                                if not res["success"]:
                                    print("failed to upload:", res["reason"])
                                    failure = True
                                    break
                                sync_id = res["sync_id"]
                                packet_available = False
                                if sync_complete:
                                    break
                                
                                print("waiting for more data")
                                await client.write_gatt_char(UUID_NORDIC_TX,data,False) #send more data
                                    
                            await asyncio.sleep(.1)

                        if failure:
                            continue;            
                        
                        #server has the data, tell the device to delete
                        data = bytearray([2])
                        confirming_delete = True
                        await client.write_gatt_char(UUID_NORDIC_TX, data, False)
                        print("confirming delete")

                        while confirming_delete:
                            await asyncio.sleep(.1)

                        if "config" in res:
                            print("configurating")
                            data = bytearray([3])+struct.pack('<I', res["config"]["id"])
                            uploading_config = True
                            await client.write_gatt_char(UUID_NORDIC_TX, data, False)
                            print("writing config")
                            data = (res["config"]["data"]+"\n").encode()
                            await client.write_gatt_char(UUID_NORDIC_TX, data, False)
                            print("wrote config data")
                            while uploading_config:
                                await asyncio.sleep(.1)
                        
                        res = requests.post(server+"confirm",{"station_id":get_mac_address().lower(),"sync_id":res["sync_id"]}).json()

                        if res["success"]:
                            print("successful sync!")
                        
                        


                                
                            
                        
                        
        except:
            pass

asyncio.run(run())

