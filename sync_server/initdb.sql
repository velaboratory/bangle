
PRAGMA foreign_keys=ON;

CREATE TABLE device (
    id text PRIMARY KEY, -- probably a mac address
    last_data_sync text, -- a date time of the last upload from the device
    target_config_json text -- a configuration string to update the device to
);

CREATE TABLE station (
    id text PRIMARY key -- probably a mac address
);

CREATE TABLE data_sync (
    uuid text PRIMARY KEY, 
    from_time text, 
    dt text, -- the time this sync happened
    device_id text, -- the device doing the syncing
    station_id text, -- the station doing the syncing
    data text, -- the data (json) from the device syncing
    config_json text, -- the configuration of this device when data was uploaded
    complete int default 0, -- 0 until the sync is complete (comes in chunks)
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
