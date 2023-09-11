
from bleak import BleakClient, BleakScanner
import asyncio
import struct
import matplotlib.pyplot as plt
PMD_CONTROL = "FB005C81-02E7-F387-1CAD-8ACD2D8DF0C8"
PMD_DATA = "FB005C82-02E7-F387-1CAD-8ACD2D8DF0C8"


async def callback_control(sender,data:bytearray):
    print("got control data" + str(data))

ecg_data = []
async def callback_data(sender,data:bytearray):
    
    print("got data" + str(data))
    d0 = data[1]
    d1 = data[2]
    d2 = data[3]
    d3 = data[4]
    d4 = data[5]
    d5 = data[6]
    d6 = data[7]
    d7 = data[8]
    v = d0 + (d1 << 8) + (d2 << 16) + (d3 << 24) + \
        (d4 << 32) + (d5 << 40) + (d6 << 48) + (d7 << 56)
    print(data[9]) # frame type
    #next 12 bytes are reference samples
    #next byte is bit depth of deltas
    print(data[22])
    #three_tuples = [(data[i],data[i+1],data[i+2]) for i in range(10,len(data)-2,3)]
    #for i in three_tuples:
    #    reading = int.from_bytes(i,'little',signed=True)
   #     print(reading," ")
    #    ecg_data.append(reading)

async def run():
    while True:

        try:
            devices = await BleakScanner.discover(5,return_adv=True) # short discovery time so it starts quickly
            for d,adv in devices.values():
                print(d.name)
                if d.name and ("Polar Sense" in d.name): # this approach should work on windows or mac
                    async with BleakClient(d) as client:
                        print(client.mtu_size)
                        data = await client.read_gatt_char(PMD_CONTROL) #not sure why this is necessary
                        print(str(data))
                        await client.start_notify(PMD_DATA, callback_data)
                        await client.start_notify(PMD_CONTROL, callback_control)
                        await client.write_gatt_char(PMD_CONTROL, bytearray([0x01, 0x01]))
                        await asyncio.sleep(1) #unclear why this is necessary, but it is
                        await client.write_gatt_char(PMD_CONTROL, bytearray([0x02, 0x01]))
                        await asyncio.sleep(1) #unclear why this is necessary, but it is
                        #await client.write_gatt_char(PMD_DATA, bytearray([0x01, 0x00])) #this appears to not be necessary
                        #await client.write_gatt_char(PMD_CONTROL, bytearray([0x02, 0x00, 0x00, 0x01, 0x82, 0x00, 0x01, 0x01, 0x0E, 0x00]))
                        await client.write_gatt_char(PMD_CONTROL, bytearray([0x02, 0x01, 0x00, 0x01, 0x37, 0x00, 0x01, 0x01, 0x16, 0x00, 0x04, 0x01, 0x04]))
                        #await client.write_gatt_char(PMD_CONTROL, bytearray([0x02, 0x01, 0x00, 0x01, 0x32, 0x00, 0x01, 0x01, 0x10, 0x00, 0x02, 0x01, 0x08, 0x00, 0x04, 0x01, 0x03]))

                        
                        while True:
                            if len(ecg_data) > 5000:
                                plt.plot(ecg_data[1000:])
                                plt.show()

                            await asyncio.sleep(.1)
        except:
                pass
            
asyncio.run(run())