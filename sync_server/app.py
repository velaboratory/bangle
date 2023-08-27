
from flask import Flask,app,request,render_template
import sqlite3
import pandas as pd
import os
from datetime import datetime
import uuid
import json
app = Flask(__name__)

def dbConnection():
    con = sqlite3.connect("app.db")
    con.execute("PRAGMA foreign_keys=ON;")
    return con

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
                print(type(test_firmware_id))
                con.execute("insert into firmware (uuid,type,version,data) values (?,?,?,?)",(test_firmware_id,"test",1,""))
                test_mac = "e5:cc:1d:bb:e4:d1"
                con.execute("insert into device (id, last_data_sync) values (?,?)", (test_mac, "1970-01-01 00:00:00"))
                test_config = {}
                con.execute("insert into config (device_id, firmware_uuid, data) values (?,?,?)",(test_mac, test_firmware_id, json.dumps(test_config)))
                con.commit()
            except Exception as e:
                print(e)        
    return app.redirect("/")

@app.route("/discovered", methods=["POST"])
def discovered():
    with dbConnection() as con:
        station_id = request.values.get("station_id", None)
        device_id = request.values.get("device_id",None)
        config_id = request.values.get("config_id",None)

        if not all(station_id,device_id,config_id):
            return {"success": False, "reason": "Invalid request"}

        df_device = pd.read_sql("select * from device where device_id=?",con,params=(device_id,))
        if len(df_device) == 0:
            return {"success": False, "reason": "Not found"}
        else:
            if df_device[0].target_config_id != config_id:
                return {"success": True, "sync": 1}
            last_sync = datetime.strptime(df_device.last_data_sync,"%Y-%m-%d %H:%M:%S") # stored in Y:m:d H:M:S
            now = datetime.utcnow()
            if (now-last_sync).total_seconds > 15*60:
                return {"success": True, "sync": 1}

@app.route("/sync", methods=["POST"])
def sync():
    station_id = request.values.get("station_id", None)
    config_id = request.values.get("config_id",None)
    data = request.values.get("data",None)
    if not all(station_id,config_id, data):
        return {"success": False, "reason": "Invalid request"}
    
    with dbConnection() as con:
        #first verify that the config is there
        df_config = pd.read_sql("select * from config where id=?",con,parames=(config_id,))
        if len(df_config) == 0:
            return {"success": False, "reason": "Config not found"}
        
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        # now create a data sync
        insert_id = uuid.uuid4().hex
        con.execute("insert into data_sync (id, dt,device_id,station_id,data,config_id) values (?,?,?,?,?,?)",
                    (insert_id,now,df_config[0].device_id,data,df_config[0].config_id))
        
        device = pd.read_sql("select * from device where id=?",con, params=(df_config[0].device_id,))[0]
        target_config = pd.read_sql("select * from config where device_id = ? order by id desc limit 1",con,params=(device.id,))[0]
        if target_config.id != config_id:
            #also send the config (todo, firmware update)
            config_data = {"id": target_config.id, "data": target_config.data}
            return {"success": True, "sync_id": insert_id, "config": config_data}
        else:
            return {"success": True, "sync_id": insert_id}
        
@app.route("/confirm")
def confirm():
    station_id = request.values.get("station_id", None)
    sync_id = request.values.get("sync_id",None)
    if not all(station_id,sync_id):
        return {"success": False, "reason": "Invalid request"}

    with dbConnection() as con:
        con.execute("update data_sync set confirmed=1 where id=?",(sync_id,))
    
    return {"success": True}

if __name__=="__main__":
    app.run(port=5000,debug=True)

