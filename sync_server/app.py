
from flask import Flask, app, request, render_template,jsonify
import sqlite3
import pandas as pd
import os
from datetime import datetime
import uuid
import json
import numpy as np
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
    os.remove("app.db")
    with dbConnection() as con:
        with open('initdb.sql') as script:
            try:
                con.executescript(script.read())
                test_firmware_id = uuid.uuid4().hex
                con.execute("insert into firmware (uuid,type,version,data) values (?,?,?,?)",
                            (test_firmware_id, "test", 1, ""))
                test_mac = "e5:cc:1d:bb:e4:d1"
                con.execute("insert into device (id, last_data_sync) values (?,?)",
                            (test_mac, "1970-01-01 00:00:00"))
                test_config = {}
                con.execute("insert into config (device_id, firmware_uuid, data) values (?,?,?)",
                            (test_mac, test_firmware_id, json.dumps(test_config)))
                test_station_id = "80:3f:5d:04:7b:ee"
                con.execute("insert into station (id) values (?)",(test_station_id,))
                con.commit()
            except Exception as e:
                print(e)
    return app.redirect("/")


@app.route("/discovered", methods=["POST"])
def discovered():
    with dbConnection() as con:
        station_id = request.values.get("station_id", None)
        device_id = request.values.get("device_id", None)
        config_id = request.values.get("config_id", None, type=int)

        if not all([station_id, device_id, config_id]):
             return failure("Invalid Request")

        df_device = pd.read_sql(
            "select * from device where id=?", con, params=(device_id,))
        if len(df_device) == 0:
            return failure("Not found")
        else:
            device = df_device.iloc[0]
            #now get the target config
            target_config = pd.read_sql(
            "select * from config where device_id = ? order by id desc limit 1", con, params=(device.id,)).iloc[0]
            if target_config.id != config_id:
                return success({"sync": 1})
            last_sync = datetime.strptime(
                device.last_data_sync, "%Y-%m-%d %H:%M:%S")  # stored in Y:m:d H:M:S
            now = datetime.utcnow()
            if (now-last_sync).total_seconds() > 15*60:
                return success({"sync": 1})
            return success({"sync":0}) #sync not needed

@app.route("/sync", methods=["POST"])
def sync():
    station_id = request.values.get("station_id", None)
    config_id = request.values.get("config_id", None, type=int)
    data = request.values.get("data", None)
    if not all([station_id, config_id, data]):
        return {"success": False, "reason": "Invalid request"}

    with dbConnection() as con:
        # first verify that the config is there
        df_config = pd.read_sql(
            "select * from config where id=?", con, params=(config_id,))
        if len(df_config) == 0:
            return failure("Config not found")
        config = df_config.iloc[0]
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        # now create a data sync
        insert_id = uuid.uuid4().hex
        params = (insert_id, now, config.device_id, station_id, data, config_id)
        print(params)
        con.execute("insert into data_sync (uuid, dt,device_id,station_id,data,config_id) values (?,?,?,?,?,?)",
                    params)

        device = pd.read_sql("select * from device where id=?",
                             con, params=(config.device_id,)).iloc[0]
        target_config = pd.read_sql(
            "select * from config where device_id = ? order by id desc limit 1", con, params=(device.id,)).iloc[0]
        if target_config.id != config_id:
            # also send the config (todo, firmware update)
            config_data = {"id": target_config.id, "data": target_config.data}
            return success({"sync_id": insert_id, "config": config_data})
        else:
            return success({"sync_id": insert_id})


@app.route("/confirm", methods=["POST"])
def confirm():
    station_id = request.values.get("station_id", None)
    sync_id = request.values.get("sync_id", None)
    if not all([station_id, sync_id]):
        return failure("Invalid request")

    with dbConnection() as con:
        con.execute("update data_sync set confirmed=1 where uuid=?", (sync_id,))
        cur = con.execute("select device_id from data_sync where uuid=?",(sync_id,))
        device_id = cur.fetchone()[0]
        con.execute("update device set last_data_sync = ? where id=?",(datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),device_id))
    return success({})


if __name__ == "__main__":
    app.run(port=5000, debug=True)
