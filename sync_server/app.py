
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

        if not all([station_id, device_id]):
             return failure("Invalid Request")
        station_id = station_id.lower()
        device_id = device_id.lower()

        df_station = pd.read_sql("select * from station where id=?",con, params=(station_id,))
        if len(df_station) == 0:
            con.execute("insert into station (id) values (?)", (station_id,))

        df_device = pd.read_sql(
            "select * from device where id=?", con, params=(device_id,))
        
        if len(df_device) == 0:
            return failure("Not found")
        else:
            # determine if it's been long enough
            device = df_device.iloc[0]
            now = datetime.now(timezone.utc)
            last_sync = datetime.strptime(device.last_data_sync, 
                                          "%Y-%m-%d %H:%M:%S")  # stored in Y:m:d H:M:S
            last_sync = pytz.utc.localize(last_sync)
            if (now-last_sync).total_seconds() > 15*60:
                return success({"sync": 1, "server_unixtime":int(now.timestamp())})
            return success({"sync":0, "server_unixtime":int(now.timestamp())}) #sync not needed

@app.route("/sync", methods=["POST"])
def sync():
    station_id = request.values.get("station_id", None)
    device_id = request.values.get("device_id", None)
    data = request.values.get("data", None)
    sync_id = request.values.get("sync_id", None)
    complete = request.values.get("complete", 0, type=int)
    config_json = request.values.get("config_json", None)
    if not all([station_id, device_id, data, config_json]):
        return {"success": False, "reason": "Invalid request"}
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
            params = (insert_id, now, device_id, station_id, data, config_json, complete)
            print(params)
            con.execute("insert into data_sync (uuid, dt,device_id,station_id,data,config_json,complete) values (?,?,?,?,?,?,?)",
                    params)


        return success({"sync_id": insert_id})
    

@app.route("/confirm", methods=["POST"])
def confirm():
    station_id = request.values.get("station_id", None)
    sync_id = request.values.get("sync_id", None)
    if not all([station_id, sync_id]):
        return failure("Invalid request")
    station_id = station_id.lower()
    with dbConnection() as con:
        con.execute("update data_sync set confirmed=1 where uuid=?", (sync_id,))
        cur = con.execute("select device_id from data_sync where uuid=?",(sync_id,))
        device_id = cur.fetchone()[0]
        con.execute("update device set last_data_sync = ? where id=?",(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),device_id))
    return success({})

@app.route("/update_config", methods=["POST"])
def updates():
    device_id = request.values.get("device_id", None)
    if not all([device_id]):
        return failure("Invalid request")
    device_id = device_id.lower()

    with dbConnection() as con:
        device_df = pd.read_sql("select target_config_json from device where id=?",
                                con, params=(device_id,))
        if len(device_df) == 0:
            return failure("no device by that name")
        
        return success({"config_json": base64.b64encode(device_df.iloc[0].target_config_json.encode()).decode()})

if __name__ == "__main__":
    app.run(host = "0.0.0.0",port=5000, debug=True)
