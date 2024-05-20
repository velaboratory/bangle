
from bleak import BleakClient, BleakScanner
import asyncio
import struct
import matplotlib.pyplot as plt
import math
PMD_CONTROL = "FB005C81-02E7-F387-1CAD-8ACD2D8DF0C8"
PMD_DATA = "FB005C82-02E7-F387-1CAD-8ACD2D8DF0C8"
HR_DATA = "00002A37-0000-1000-8000-00805F9B34FB"

async def callback_hr(sender, data:bytearray):
    print("heart rate, bpm: ", struct.unpack(">H",data))
          
async def callback_control(sender,data:bytearray):
    print("got control data" + str(data))

ppg_data = []
acc_data = []
gyro_data = []
mag_data = []
async def callback_data(sender,data:bytearray):
    
    if data[0]==1: # ppg
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
        print("time",v)
        print("ppg frame_delta", data[9] & 0x80) 
        print("ppg frame_type",data[9]& 0x7F) # frame type 
        #next 12 bytes are reference samples
        reference_sample = [0,0,0,0]
        for i in range(0,4):
            start_index = 10+i*3 #10
            end_index = 10+i*3+3 #13
            reference_sample[i] = int.from_bytes(data[start_index:end_index],'little',signed=True)
        #next byte is bit depth of deltas
        next_index = 22
        sample_index = 0
        curr_sample = [0,0,0,0]
        all_samples = [reference_sample]
        while next_index < len(data):
            bit_depth = data[next_index]
            num_samples = data[next_index+1]
            num_bytes = math.ceil(num_samples*4*bit_depth/8)
            next_index+=2
            bit_buffer = ""
            for b in range(next_index,next_index+num_bytes):
                for bit in range(0,8):
                    bit_buffer = ("1" if (1<<bit) & data[b] else "0") + bit_buffer
                    if len(bit_buffer) == bit_depth:
                        n = int(bit_buffer,base=2)
                        p = n - (n >> (bit_depth-1) << bit_depth)
                        curr_sample[sample_index] = all_samples[-1][sample_index] + p
                        sample_index+=1
                        if sample_index > 3:
                            sample_index = 0
                            all_samples.append(curr_sample.copy())
                        
                        bit_buffer = ""
            next_index += num_bytes

        ppg_data.extend(all_samples)
        print("ppg_data len: ", len(ppg_data))
    elif data[0]==2: # acc
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
        print("time",v)
        print("acc frame_delta", data[9] & 0x80) 
        print("acc frame_type",data[9]& 0x7F) # frame type 
        #next 6 bytes are reference samples (16bits / channel)
        reference_sample = [0,0,0]
        for i in range(0,3):
            start_index = 10+i*2 
            end_index = 10+(i+1)*2
            reference_sample[i] = int.from_bytes(data[start_index:end_index],'little',signed=True)
        #next byte is bit depth of deltas
        next_index = 16
        sample_index = 0
        curr_sample = [0,0,0]
        all_samples = [reference_sample]
        while next_index < len(data):
            bit_depth = data[next_index]
            num_samples = data[next_index+1]
            num_bytes = math.ceil(num_samples*3*bit_depth/8) 
            next_index+=2 # we read bit_depth and num_samples
            bit_buffer = "" 
            for b in range(next_index,next_index+num_bytes):
                for bit in range(0,8): # read bits one by one into the bit buffer
                    bit_buffer = ("1" if (1<<bit) & data[b] else "0") + bit_buffer
                    if len(bit_buffer) == bit_depth: # if we reach the bit depth
                        n = int(bit_buffer,base=2) # convert it using magic
                        p = n - (n >> (bit_depth-1) << bit_depth) # more magic
                        curr_sample[sample_index] = all_samples[-1][sample_index] + p # add to the last sample, then append that value
                        sample_index+=1
                        if sample_index > 2: # we read 3 values
                            sample_index = 0
                            all_samples.append(curr_sample.copy())
                        bit_buffer = "" # clear the bit buffer for the next value
            next_index += num_bytes

        acc_data.extend(all_samples)
        print("acc_data len: ", len(acc_data))

    elif data[0]==3: # ppi
        # ppi data
        actual_data = data[10:]
        tuples = struct.iter_unpack("<BHHB",actual_data)
        print("PPI (HR, RRI, ?, ?):", list(tuples))
    elif data[0]==5: # gyro
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
        print("time",v)
        print("gyro frame_delta", data[9] & 0x80) 
        print("gryo frame_type",data[9]& 0x7F) # frame type 
        #next 6 bytes are reference samples (16bits / channel)
        reference_sample = [0,0,0]
        for i in range(0,3):
            start_index = 10+i*2 
            end_index = 10+(i+1)*2
            reference_sample[i] = int.from_bytes(data[start_index:end_index],'little',signed=True)
        #next byte is bit depth of deltas
        next_index = 16
        sample_index = 0
        curr_sample = [0,0,0]
        all_samples = [reference_sample]
        while next_index < len(data):
            bit_depth = data[next_index]
            num_samples = data[next_index+1]
            num_bytes = math.ceil(num_samples*3*bit_depth/8) 
            next_index+=2 # we read bit_depth and num_samples
            bit_buffer = "" 
            for b in range(next_index,next_index+num_bytes):
                for bit in range(0,8): # read bits one by one into the bit buffer
                    bit_buffer = ("1" if (1<<bit) & data[b] else "0") + bit_buffer
                    if len(bit_buffer) == bit_depth: # if we reach the bit depth
                        n = int(bit_buffer,base=2) # convert it using magic
                        p = n - (n >> (bit_depth-1) << bit_depth) # more magic
                        curr_sample[sample_index] = all_samples[-1][sample_index] + p # add to the last sample, then append that value
                        sample_index+=1
                        if sample_index > 2: # we read 3 values
                            sample_index = 0
                            all_samples.append(curr_sample.copy())
                        bit_buffer = "" # clear the bit buffer for the next value
            next_index += num_bytes

        gyro_data.extend(all_samples)
        print("gryo_data len: ", len(gyro_data))
    elif data[0]==6: # mag
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
        print("time",v)
        print("mag frame_delta", data[9] & 0x80) 
        print("mag frame_type",data[9]& 0x7F) # frame type 
        #next 6 bytes are reference samples (16bits / channel)
        reference_sample = [0,0,0]
        for i in range(0,3):
            start_index = 10+i*2 
            end_index = 10+(i+1)*2
            reference_sample[i] = int.from_bytes(data[start_index:end_index],'little',signed=True)
        #next byte is bit depth of deltas
        next_index = 16
        sample_index = 0
        curr_sample = [0,0,0]
        all_samples = [reference_sample]
        while next_index < len(data):
            bit_depth = data[next_index]
            num_samples = data[next_index+1]
            num_bytes = math.ceil(num_samples*3*bit_depth/8) 
            next_index+=2 # we read bit_depth and num_samples
            bit_buffer = "" 
            for b in range(next_index,next_index+num_bytes):
                for bit in range(0,8): # read bits one by one into the bit buffer
                    bit_buffer = ("1" if (1<<bit) & data[b] else "0") + bit_buffer
                    if len(bit_buffer) == bit_depth: # if we reach the bit depth
                        n = int(bit_buffer,base=2) # convert it using magic
                        p = n - (n >> (bit_depth-1) << bit_depth) # more magic
                        curr_sample[sample_index] = all_samples[-1][sample_index] + p # add to the last sample, then append that value
                        sample_index+=1
                        if sample_index > 2: # we read 3 values
                            sample_index = 0
                            all_samples.append(curr_sample.copy())
                        bit_buffer = "" # clear the bit buffer for the next value
            next_index += num_bytes

        mag_data.extend(all_samples)
        print("mag_data len: ", len(mag_data))
    else:
        print("got a different frame: ", data[0])

    #three_tuples = [(data[i],data[i+1],data[i+2]) for i in range(10,len(data)-2,3)]
    #for i in three_tuples:
    #    reading = int.from_bytes(i,'little',signed=True)
   #     print(reading," ")
    #    ecg_data.append(reading)

async def enable_verity_rri(client):
    
    await client.write_gatt_char(PMD_CONTROL, bytearray([0x01, 0x03]))
    await asyncio.sleep(1)
    await client.write_gatt_char(PMD_CONTROL, bytearray([0x02, 0x03]))
    await asyncio.sleep(1)

async def enable_verity_ppg(client):
    await client.write_gatt_char(PMD_CONTROL, bytearray([0x01, 0x01]))
    await asyncio.sleep(1)
    await client.write_gatt_char(PMD_CONTROL, bytearray([0x02, 0x01, 0x00, 0x01, 0x37, 0x00, 0x01, 0x01, 0x16, 0x00, 0x04, 0x01, 0x04]))
    await asyncio.sleep(1)
    await asyncio.sleep(1)
async def enable_verity_acc(client):
    await client.write_gatt_char(PMD_CONTROL, bytearray([0x01, 0x02]))
    await asyncio.sleep(1)
    await client.write_gatt_char(PMD_CONTROL, bytearray([0x02, 0x02, 0x00, 0x01, 0x34, 0x00, 0x01, 0x01, 0x10, 0x00, 0x02, 0x01, 0x08, 0x00, 0x04, 0x01, 0x03]))
    await asyncio.sleep(1)
async def enable_verity_gyro(client):
    await client.write_gatt_char(PMD_CONTROL, bytearray([0x01, 0x05]))
    await asyncio.sleep(1)
    await client.write_gatt_char(PMD_CONTROL, bytearray([0x02, 0x05, 0x00, 0x01, 0x34, 0x00, 0x01, 0x01, 0x10, 0x00, 0x02, 0x01, 0xd0, 0x07, 0x04, 0x01, 0x03]))
    await asyncio.sleep(1)
async def enable_verity_mag(client):
    await client.write_gatt_char(PMD_CONTROL, bytearray([0x01, 0x06]))
    await asyncio.sleep(1)
    await client.write_gatt_char(PMD_CONTROL, bytearray([0x02, 0x06, 0x00, 0x01, 0x32, 0x00, 0x01, 0x01, 0x10, 0x00, 0x02, 0x01, 0x32, 0x00, 0x04, 0x01, 0x03]))
    await asyncio.sleep(1)

async def run():
    while True:

        try:
            devices = await BleakScanner.discover(5,return_adv=True) # short discovery time so it starts quickly
            for d,adv in devices.values():
                print(d.name)
                if d.name and ("Polar Sense" in d.name): # this approach should work on windows or mac
                    async with BleakClient(d) as client:
                        print(client.mtu_size)
                        
                        await client.start_notify(PMD_CONTROL, callback_control)
                        await client.start_notify(PMD_DATA, callback_data)
                        await client.start_notify(HR_DATA, callback_hr)

                        #await enable_verity_rri(client)
                        #await enable_verity_ppg(client)
                        #await enable_verity_acc(client)
                        #await enable_verity_gyro(client)
                        #await enable_verity_mag(client)
                        
                        
                        while True:
                            if len(ppg_data) > 1000:
                                to_plot = [x[0] for x in ppg_data]
                                plt.plot(to_plot)
                                to_plot = [x[1] for x in ppg_data]
                                plt.plot(to_plot)
                                to_plot = [x[2] for x in ppg_data]
                                plt.plot(to_plot)
                                plt.show()
                                exit()
                            if len(acc_data) > 1000:
                                to_plot = [x[0] for x in acc_data]
                                plt.plot(to_plot)
                                to_plot = [x[1] for x in acc_data]
                                plt.plot(to_plot)
                                to_plot = [x[2] for x in acc_data]
                                plt.plot(to_plot)
                                plt.show()
                                exit()
                            if len(gyro_data) > 1000:
                                to_plot = [x[0] for x in gyro_data]
                                plt.plot(to_plot)
                                to_plot = [x[1] for x in gyro_data]
                                plt.plot(to_plot)
                                to_plot = [x[2] for x in gyro_data]
                                plt.plot(to_plot)
                                plt.show()
                                exit()
                            if len(mag_data) > 1000:
                                to_plot = [x[0] for x in mag_data]
                                plt.plot(to_plot)
                                to_plot = [x[1] for x in mag_data]
                                plt.plot(to_plot)
                                to_plot = [x[2] for x in mag_data]
                                plt.plot(to_plot)
                                plt.show()
                                exit()

                            await asyncio.sleep(.1)
        except:
                pass
            
asyncio.run(run())