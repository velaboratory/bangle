
PRAGMA foreign_keys=ON;

CREATE TABLE firmware (
    uuid text PRIMARY KEY, 
    type text, -- this is likely something like bangle_vfb
    version int, -- this is a version number of the firmware
    data text -- this is probably the js code
);

--this table holds a target setting data for a device with a specific firmware
CREATE TABLE config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id text,
    firmware_uuid text,
    data text, -- json data for the configuration
    foreign key (firmware_uuid) references firmware(uuid) on delete cascade on update cascade,
    foreign key (device_id) references device(id) on delete cascade on update cascade
);

CREATE TABLE device (
    id text PRIMARY KEY, -- probably a mac address
    last_data_sync text -- a date time of the last upload from the device
);

CREATE TABLE station (
    id text PRIMARY key -- probably a mac address
);

CREATE TABLE data_sync (
    uuid text PRIMARY KEY, 
    dt text, -- the time this sync happened
    device_id text, -- the device doing the syncing
    station_id text, -- the station doing the syncing
    data text, -- the data (json) from the device syncing
    config_id text, -- the config that describe the data
    confirmed int default 0, -- 0 until the sync is confirmed
    foreign key (station_id) references station(id) on delete cascade on update cascade,
    foreign key (config_id) references config(rowid) on delete cascade on update cascade,
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
