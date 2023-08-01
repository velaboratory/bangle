from bleak import BleakClient, BleakScanner # get button state from the m5stickc
import asyncio

done = False
# attempt a connection to the bluetooth device
def callback(sender,data:bytearray):
    global done
    print(data)
    # if data[0] == 2:
    #     print("Got commit")
    #     done = True
    # if data[0] == 0:
    #     print("Got last of the data:",data)
    #     done = True

async def run():
    global done
    devices = await BleakScanner.discover(3) # short discovery time so it starts quickly
    for d in devices:
        if d.name == "Bangle.js e4d1": # this approach should work on windows or mac
            
            print("discovered")
            async with BleakClient(d) as client:
                
                data = bytearray([7])
                await asyncio.sleep(1)
                print("writing packet")
                await client.write_gatt_char("0000ABC3-0000-1000-8000-00805F9B34FB",data,False)
                await asyncio.sleep(1)
                


asyncio.run(run())

