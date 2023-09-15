
from flask import Flask, app, request, render_template,jsonify, Response,redirect
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
import requests

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
    print(data)
    return json.dumps(data,cls=NumpyEncoder)

def failure(reason):
    data = {"success":False, "reason":reason};
    
    print(data)
    return json.dumps(data,cls=NumpyEncoder)
@app.route("/")
def root():
    with dbConnection() as con:
        query = '''
WITH last_syncs AS (
    SELECT MAX(dt) as last_sync, device_id, app_name, app_version
	FROM data_sync
	GROUP BY device_id
)
SELECT id, label, last_sync, app_name, app_version, target_app_name, target_app_version 
FROM device LEFT JOIN last_syncs ON device.id = last_syncs.device_id'''
        devices = json.loads(pd.read_sql(query, con).to_json(orient="records"))
        return render_template('home.html', devices=devices, apps=json.loads(pd.read_sql("select name,version from app order by name asc,version desc", con).to_json(orient="records")))

@app.route("/show_discoveries")
def show_discoveries():
    with dbConnection() as con:
        return render_template("discoveries.html",discoveries = json.loads(pd.read_sql("select dt,station_id,device_id,data from discovery_log order by dt desc limit 1000",con).to_json(orient="records")))
@app.route("/app_upload", methods=["GET"])
def apps():
    with dbConnection() as con:
        return render_template("appupload.html", apps=json.loads(pd.read_sql("select name,max(version) as version from app group by name", con).to_json(orient="records")))

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

@app.route("/app_upload", methods=["POST"])
def app_upload():
    # this should minify and then base64
    version = request.form.get("version",0,type=int)
    app_name = request.form.get("app_name",None)
    if not app_name:
        return "app cannot be blank"
    if version == 0:
        return "version cannot be blank and must be a whole number"
    #check the version
    with dbConnection() as con:
        if not len(pd.read_sql("select name from app where name=? and version >= ?",con,params=(app_name, version)))==0:
            return None,"App version not high enough"
        
    js_file = request.files.get("jsFile",None)
    if not js_file:
        return "file cannot be empty"
    #validate the javascript file
    js_data = request.files["jsFile"].read()
    #minify
    to_return, reason = validate_and_minify(js_data)
    if not to_return:
        return reason
    
    #we are good, add it
    with dbConnection() as con:
        con.execute("insert into app (name,version,code_base64) values (?,?,?)",(app_name,version,to_return["base64"]))

    return redirect("/")

@app.route("/add_device", methods=["POST"])
def add_device():
    device_id = request.values.get("device_id", None)
    app_name_version = request.values.get("app_name_version")
    device_label = request.values.get("device_label",None)
    if not all([device_id,app_name_version, device_label]):
        return failure("invalid request")
    name,version = app_name_version.split(",")
    with dbConnection() as con:
        df = pd.read_sql("select id from device where id=?",con, params=(device_id,))
        if len(df) == 0: con.execute('insert into device (id, label, last_data_sync, target_config_json, target_app_name, target_app_version) values (?,?,?,"{}",?,?)',(device_id, device_label, None,name,version))
        else: return failure("device already exists")
        return redirect("/")
@app.route("/create_app", methods=["POST"])
def create_app():
    new_app_name = request.form.get("new_app_name",None)
    if not new_app_name:
        return "new app name cannot be blank"
    js_data = request.files["jsFile"].read()
    #minify
    to_return, reason = validate_and_minify(js_data)
    if not to_return:
        return reason
    
    with dbConnection() as con:
        con.execute("insert into app (name, version, code_base64) values (?,?,?)",(new_app_name, 1, to_return["base64"]))

    return redirect("/app_upload")
@app.route("/change_app", methods=["POST"])
def change_app():
    name = request.form.get("app_name",None)
    if not name: return "No app name provided"
    id,name,version = (x for x in name.split(","))
    if request.form.get("action",None) == "Delete":
        with dbConnection() as con:
            con.execute("delete from device where id = ?",(id,))
    else:
        with dbConnection() as con:
            con.execute("update device set wants_sync=1,target_app_name=?,target_app_version=? where id = ?",(name,version,id))

    return redirect("/")
@app.route("/discovered", methods=["POST"])
def discovered():
    with dbConnection() as con:
        device_name = request.values.get("name", None)
        station_id = request.values.get("station_id", None) # probably add to the list if found
        device_id = request.values.get("device_id", None) 
        rssi = request.values.get("rssi", None)
        battery = request.values.get("battery", None)
        if not all([station_id, device_id, rssi, device_name]):
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
            con.execute("insert into discovery_log (dt,station_id,device_id,data) values (?,?,?,?)",(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),station_id,device_id,json.dumps({"battery":battery,"rssi":rssi, "name":device_name})))

            # determine if it's been long enough
            device = df_device.iloc[0]
            now = datetime.now(timezone.utc)
            try:
                last_sync = datetime.strptime(device.last_data_sync, 
                                            "%Y-%m-%d %H:%M:%S")  # stored in Y:m:d H:M:S
            except:
                last_sync = datetime.utcfromtimestamp(0)
                
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
        if len(df) == 0: return failure("no device by that id")
        con.execute("update device set target_config_json=?, wants_sync=1 where id=?",(config_json,device_id))
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
    app_name = request.values.get("app_name", None)
    if not all([device_id,app_name]):
        return failure("invalid request")
    with dbConnection() as con:
        df = pd.read_sql("select uuid, from_time as dt_start,dt as dt_sync, device_id, station_id, data from data_sync where device_id = ? and from_time > ? and app_name = ? and complete=1", con = con, params = (device_id, from_time,app_name))
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
    app_name = request.values.get("app_name", None)
    app_version = request.values.get("app_version", -1, type=int)
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
            
            con.execute("insert into data_sync (uuid, from_time, dt,device_id,station_id,data,app_name, app_version, complete) values (?,?,?,?,?,?,?,?,?)",
                    params)
        if complete == 1:
            #update the last sync for the device
            con.execute("update device set last_data_sync = ?, wants_sync = 0 where id=?",(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),device_id))
            #retrieve the new configuration for the watch
            device_df = pd.read_sql("select target_config_json, target_app_name, target_app_version from device where id=?",
                                con, params=(device_id,))
            return success({"sync_id": insert_id, "config_json": base64.b64encode(device_df.iloc[0].target_config_json.encode()).decode(), "target_app_name": device_df.iloc[0].target_app_name, "target_app_version":device_df.iloc[0].target_app_version})
        else:
            return success({"sync_id": insert_id})

if __name__ == "__main__":
    app.run(host = "0.0.0.0",port=8083, debug=True)
