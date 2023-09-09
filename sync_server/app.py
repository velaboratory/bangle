
from flask import Flask, app, request, render_template,jsonify
import sqlite3
import pandas as pd
import os
from datetime import datetime, timezone
import uuid
import json
import numpy as np
import pytz
import base64
import hashlib
import js2py

app = Flask(__name__)
sqlite3.register_adapter(np.int64, lambda val: int(val))
class NumpyEncoder(json.JSONEncoder):
    """ Custom encoder for numpy data types """
    def default(self, obj):
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
                            np.int16, np.int32, np.int64, np.uint8,
                            np.uint16, np.uint32, np.uint64)):

            return int(obj)

        elif isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
            return float(obj)

        elif isinstance(obj, (np.complex_, np.complex64, np.complex128)):
            return {'real': obj.real, 'imag': obj.imag}

        elif isinstance(obj, (np.ndarray,)):
            return obj.tolist()

        elif isinstance(obj, (np.bool_)):
            return bool(obj)

        elif isinstance(obj, (np.void)): 
            return None

        return json.JSONEncoder.default(self, obj)
    
def dbConnection():
    con = sqlite3.connect("app.db")
    con.execute("PRAGMA foreign_keys=ON;")
    return con

def success(data):
    data["success"] = True
    return json.dumps(data,cls=NumpyEncoder)

def failure(reason):
    return json.dumps({"success":False, "reason":reason},cls=NumpyEncoder)
@app.route("/")
def root():
    return "Hello world"


@app.route("/initdb")
def initdb():
    with dbConnection() as con:
        with open('initdb.sql') as script:
            try:
                con.executescript(script.read())
                test_mac = "e5:cc:1d:bb:e4:d1"
                con.execute("insert into device (id, last_data_sync, target_config_json) values (?,?,?)",
                            (test_mac, "1970-01-01 00:00:00", "{}"))
                con.commit()
            except Exception as e:
                print(e)
    return app.redirect("/")



@app.route("/discovered", methods=["POST"])
def discovered():
    with dbConnection() as con:
        station_id = request.values.get("station_id", None) # probably add to the list if found
        device_id = request.values.get("device_id", None) 
        rssi = request.values.get("rssi", None)
        battery = request.values.get("battery", None)
        if not all([station_id, device_id, rssi]):
             return failure("Invalid Request")
        station_id = station_id.lower()
        device_id = device_id.lower()
        print(rssi)
        df_station = pd.read_sql("select * from station where id=?",con, params=(station_id,))
        if len(df_station) == 0:
            con.execute("insert into station (id) values (?)", (station_id,))

        df_device = pd.read_sql(
            "select * from device where id=?", con, params=(device_id,))
        
        if len(df_device) == 0:
            return failure("Not found")
        else:

            #add the discovery
            con.execute("insert into discovery_log (dt,station_id,device_id,data) values (?,?,?,?)",(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),station_id,device_id,json.dumps({"battery":battery,"rssi":rssi})))

            # determine if it's been long enough
            device = df_device.iloc[0]
            now = datetime.now(timezone.utc)
            last_sync = datetime.strptime(device.last_data_sync, 
                                          "%Y-%m-%d %H:%M:%S")  # stored in Y:m:d H:M:S
            last_sync = pytz.utc.localize(last_sync)
            if device.wants_sync == 1:
                return success({"sync": 1, "server_unixtime":int(now.timestamp())})
            elif ((now-last_sync).total_seconds() > 15*60):
                return success({"sync": 1, "server_unixtime":int(now.timestamp())})
            return success({"sync":0, "server_unixtime":int(now.timestamp())}) #sync not needed

@app.route("/setconfig", methods = ["GET"])
def set_config():
    device_id = request.values.get("device_id", None)
    config_json = request.values.get("config_json", None)
    if not all([device_id, config_json]):
        return failure("invalid request")
    with dbConnection() as con:
        df = pd.read_sql("select id from device where id=?",con, params=(device_id,))
        if len(df) == 0: con.execute("insert into device (id, last_data_sync, target_config_json) values (?,?,?)",(device_id, None, config_json))
        else: con.execute("update device set config_json=? where id=?",(config_json,device_id))
        return success({})
@app.route("/forcesync", methods=["GET"])
def force_sync():
    device_id = request.values.get("device_id", None)
    if not all([device_id]):
        return failure("invalid request")
    with dbConnection() as con:
        df = pd.read_sql("select id from device where id=?",con, params=(device_id,))
        if len(df) == 0: return failure("no device")
        else: con.execute("update device set wants_sync=1 where id=?",(device_id,))
        return success({})
    
@app.route("/getdevices", methods= ["GET"])
def get_devices():
    with dbConnection() as con:
        return success({"devices":json.loads(pd.read_sql("select * from device", con).to_json(orient="records"))})
@app.route("/getsyncs", methods = ["GET"])
def get_syncs():
    from_time = request.values.get("from_time", 0,type=int) #utc timestamp
    device_id = request.values.get("device_id", None)
    if not all([device_id]):
        return failure("invalid request")
    with dbConnection() as con:
        df = pd.read_sql("select from_time as dt_start,dt as dt_sync, device_id, station_id, data from data_sync where device_id = ? and from_time >= ? and complete=1", con = con, params = (device_id, from_time))
    to_return = json.loads(df.to_json(orient="records"))
    return success({"syncs":to_return})

@app.route("/setapp", methods=["GET"])
def set_app():
    name = request.values.get("name", None)
    version = request.values.get("version", -1, type=int)
    code_base64 = request.values.get("code_base64", None)
    code = base64.b64decode(code_base64).decode()
    try:
        f = js2py.parse_js(code)
    except:
        return "invalid javascript"
    if name == None or code_base64 == None:
        return failure("must have the name of the app and the code")
    try:
        base64.b64decode(code_base64)
    except:
        return failure("invalid code")
    
    with dbConnection() as con:
        if version == -1:
            # new app version, increment
            df = pd.read_sql("select version from app where name = ? order by version desc limit 1",con,params=(name,))
            if len(df) == 0:
                con.execute("insert into app (name, version, code_base64) values (?,?,?)",(name, version, code_base64))
            else:
                version = df.iloc[0].version + 1
                con.execute("insert into app(name, version, code_base64) values (?,?,?)",(name, version, code_base64))
        else:
            df = pd.read_sql("select * from app where name = ? and version = ?",con,params=(name, version))
            if len(df) == 0:
                con.execute("insert into app(name,version,code_base64) values (?,?,?)", (name, version, code_base64))
            else:
                #update
                con.execute("update app set code_base64 = ? where name = ? and version = ?", (code_base64, name, version))
        return success({"name": name, "version":version})

@app.route("/getapp", methods=["GET"])
def get_app():
    name = request.values.get("name", None)
    version = request.values.get("version", -1, type=int)

    if name:
        with dbConnection() as con:
            if version != -1:
                df = pd.read_sql("select * from app where name = ? and version = ?",con,params=(name,version))
                if len(df) > 0:
                    return success({"code_base64":df.iloc[0].code_base64})
                return failure("no app, or bad version")
            else:
                df = pd.read_sql("select * from app where name = ? order by version desc",con,params=(name,))
                if len(df) > 0:
                     return success({"code_base64":df.iloc[0].code_base64, "version": df.iloc[0].version})
                else:
                    return failure("no app by that name")
    return failure("invalid request")
                
@app.route("/sync", methods=["POST"])
def sync():
    from_time = request.values.get("from_time", None) #the combo of this and the device_id must be unique.  
    station_id = request.values.get("station_id", None)
    device_id = request.values.get("device_id", None)
    sync_id = request.values.get("sync_id", None)
    app_name = request.values.get("app_name", None) #need to add these to the sync request
    app_version = request.values.get("version", -1, type=int)
    complete = request.values.get("complete", 0, type=int)
    data = request.data
    print(data)
    if not all([station_id, device_id, data, from_time]):
        return {"success": False, "reason": "Invalid request"}
    print(from_time)
    station_id = station_id.lower()

    with dbConnection() as con:
        
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        # now create a data sync
        if sync_id:
            con.execute("update data_sync set data = data || ?, complete = ? where uuid=?", (data,complete,sync_id))
            insert_id = sync_id
            print("appended data")
        else:
            insert_id = uuid.uuid4().hex
            params = (insert_id, from_time, now, device_id, station_id, data, app_name, app_version, complete)
            
            con.execute("insert into data_sync (uuid, from_time, dt,device_id,station_id,data,app_name, app_version, complete) values (?,?,?,?,?,?,?)",
                    params)
        if complete == 1:
            #update the last sync for the device
            con.execute("update device set last_data_sync = ?, wants_sync = 0 where id=?",(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),device_id))
            #retrieve the new configuration for the watch
            device_df = pd.read_sql("select target_config_json, target_app_name, target_app_version from device where id=?",
                                con, params=(device_id,))
            return success({"sync_id": insert_id, "config_json": base64.b64encode(device_df.iloc[0].target_config_json.encode()).decode(), "target_app_name": device_df.iloc[0].target_app_name, "target_version":device_df.iloc[0].target_version})
        else:
            return success({"sync_id": insert_id})

if __name__ == "__main__":
    app.run(host = "0.0.0.0",port=8083, debug=True)
