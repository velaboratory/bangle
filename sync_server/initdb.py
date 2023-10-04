import sqlite3

def dbConnection():
    con = sqlite3.connect("app.db")
    con.execute("PRAGMA foreign_keys=ON;")
    return con

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
    print("db initialized")
initdb()
