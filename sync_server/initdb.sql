
PRAGMA foreign_keys=ON;

CREATE TABLE device (
    id text PRIMARY KEY, -- probably a mac address
    label text,
    last_data_sync text, -- a date time of the last upload from the device
    target_config_json text,
    wants_sync int default 0, -- a configuration string to update the device to
    target_app_name text default "test", --the app that should be downloaded
    target_app_version int default -1,
    should_reset int default 0 --latest
);

CREATE TABLE station (
    id text PRIMARY key -- probably a mac address
);

CREATE TABLE data_sync (
    uuid text PRIMARY KEY, 
    from_time int, 
    dt text, -- the time this sync happened
    device_id text, -- the device doing the syncing
    station_id text, -- the station doing the syncing
    data BLOB, -- the data (json) from the device syncing
    app_name text,
    app_version int,
    complete int default 0, -- 0 until the sync is complete (comes in chunks)
    foreign key (station_id) references station(id) on delete cascade on update cascade,
    foreign key (device_id) references device(id) on delete cascade on update cascade
);

CREATE TABLE discovery_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dt text,
    station_id text,
    device_id text,
    data text, -- 0 until the sync is complete (comes in chunks)
    foreign key (station_id) references station(id) on delete cascade on update cascade,
    foreign key (device_id) references device(id) on delete cascade on update cascade
);

-- this table holds a list of all of the requests made to the service
CREATE TABLE request_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dt text,
    type text, -- device found, download confirmed, upload confirmed
    data text,
    station_id text
);

--this table holds software that can be downloaded
CREATE TABLE app (
    name TEXT,
    version int,
    code_base64 TEXT,
    primary key(name,version)
);
