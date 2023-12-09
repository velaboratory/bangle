
if (typeof navigator == "undefined"){

}var isBusy = false;
var d = new Date();
//instantiating the web bluetooth handler to take care of tx and rx communications and maintain the connection
function start(){
    writei()
}
var WebBluetooth = {
    name : "Web Bluetooth",
    description : "Bluetooth LE devices",
    connect : function(connection, callback) {
        //Defining general variables and the serial service specific to the bangle.js firmware
        var NORDIC_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
        var NORDIC_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
        var NORDIC_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
        var btServer = undefined;
        var btService;
        var connectionDisconnectCallback;
        var txCharacteristic;
        var rxCharacteristic;
        //Queue used to handle the data that will be sent on the tx channel
        var flowControlXOFF = false;
        var chunkSize = 20;

        //Function used to close the bluetooth connection on the site side (makes sure all the variables are set to undefined essentially allowing for a fresh start if needed)
        connection.close = function (callback) {
            connection.isOpening = false;
            if (connection.isOpen) {
                connection.isOpen = false;
                connection.emit('close');
            } else {
                if (callback) callback(null);
            }
            if (btServer) {
                btServer.disconnect();
                btServer = undefined;
                txCharacteristic = undefined;
                rxCharacteristic = undefined;
            }
        };

        //Function that handles the writing of the data on the tx channel (used after the server variable has been instantiated and the txCharacteristic has been set)
        connection.write = function (callback) {
            console.log("write");
            //Adds data used to the txqueue to be sent
            if (connection.isOpen && !connection.txInProgress){
                writeChunk(1);
                setTimeout(() => { writeChunk(1); }, 20000);
            }

            function writeChunk(data) {
                //Prevents the writing of data if Flow control is set to off (will wait 50 then retry to check if Flow Control has been turned on)
                if (flowControlXOFF) { // flow control - try again later
                    setTimeout(writeChunk, 50);
                    return;
                }
                //Prevents the writing of data and ends the write process if there is nothing in the queue

                //If the next item can be written in one chunk it is set to be sent
                chunk = data;
                data = undefined;
                //Ensures the rest of the program can recognize that the program is sending data over tx, so it does not start any processes that could sabotage the writing
                connection.txInProgress = true;
                console.log(2, "Sending " + JSON.stringify(chunk));
                //Writes the saved chunk to the bluetooth server on the corresponding device in the form of an array buffer
                txCharacteristic.writeValueWithResponse(str2ab(chunk)).then(function () {
                    console.log(3, "Sent");
                    connection.txInProgress = false;
                }).catch(function (error) {
                    console.log(1, 'SEND ERROR: ' + error);
                    connection.close();
                });
            }
        };
        //Searches for external bluetooth devices with the specified parameters
        navigator.bluetooth.requestDevice({
            filters:[
                { namePrefix: 'VELWatch' },
                { services: [ NORDIC_SERVICE ] }
            ], optionalServices: [ NORDIC_SERVICE ]}).then(function(device) {
            console.log(1, 'Device Name:       ' + device.name);
            console.log(1, 'Device ID:         ' + device.id);
            //Calls the close function in the event of a gatt server disconnection
            device.addEventListener('gattserverdisconnected', function() {
                console.log(1, "Disconnected (gattserverdisconnected)");
                connection.close();
            });
            //Attempts to connect to the bluetooth server on the chosen device
            return device.gatt.connect();
        }).then(function(server) {
            console.log(1, "Connected");
            btServer = server;
            return server.getPrimaryService(NORDIC_SERVICE);
        }).then(function(service) {
            console.log(2, "Got service");
            btService = service;
            //Saves the RX Characteristic used in the connection with the server in order to receive on the RX channel for the site
            return btService.getCharacteristic(NORDIC_RX);
        }).then(function (characteristic) {
            rxCharacteristic = characteristic;
            console.log(2, "RX characteristic:"+JSON.stringify(rxCharacteristic));
            //Will execute on the reading of a packet in order to parse it for the pause signal to stop the process
            rxCharacteristic.addEventListener('characteristicvaluechanged', function(event) {
                console.log("rx change")
                var dataview = event.target.value;
                const buffer = [];
                    for (var i=0;i<dataview.byteLength;i++) {
                        var ch = dataview.getUint8(i);
                        if(ch==1){
                            console.log("packet");
                            console.log(dataview);
                            buffer.push(dataview);
                        }
                        if(ch==2){
                            console.log("finished sync");
                            const file = JSON.stringify(dataview);
                            buffer.push(dataview);
                        }
                        if (ch==17) { // XON
                            console.log(2,"XON received => resume upload");
                            flowControlXOFF = false;
                        }
                        if (ch==19) { // XOFF
                            console.log(2,"XOFF received => pause upload");
                            flowControlXOFF = true;
                        }
                    }
                var str = ab2str(dataview.buffer);
                    //send to server
                console.log(3, "Received "+JSON.stringify(str));
                connection.emit('data', str);
            });
            return rxCharacteristic.startNotifications();
        }).then(function() {
            //Saves the TX Characteristic, so it can be used to send packets in the write function of the connection
            return btService.getCharacteristic(NORDIC_TX);
        }).then(function (characteristic) {
            txCharacteristic = characteristic;
            console.log(2, "TX characteristic:"+JSON.stringify(txCharacteristic));
            //Readies the connection to begin the writing process
        }).then(function() {
            connection.txInProgress = false;
            connection.isOpen = true;
            connection.isOpening = false;
            isBusy = false;
            queue = [];
            console.log(callback.name);
            callback(connection);
            connection.emit('open');
            // if we had any writes queued, do them now
            connection.write();
        }).catch(function(error) {
            console.log(1, 'ERROR: ' + error);
            connection.close();
        });
        return connection;
    }
};
//Used to convert from arraybuffer to string
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}
//Used to convert from string to arraybuffer
function str2ab(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++)
        bufView[i] = str.charCodeAt(i);
    return buf;
}
    function writei(data, callback, callbackNewline) {
        if (isBusy) {
            setTimeout(writei(data, callback, callbackNewline), 50);
            return;
        }

        var cbTimeout;

        function onWritten() {
            if (callbackNewline) {
                connection.cb = function (d) {
                    var newLineIdx = connection.received.indexOf("\n");
                    if (newLineIdx >= 0) {
                        var l = connection.received.substr(0, newLineIdx);
                        connection.received = connection.received.substr(newLineIdx + 1);
                        connection.cb = undefined;
                        if (cbTimeout) clearTimeout(cbTimeout);
                        cbTimeout = undefined;
                        if (callback)
                            callback(l);
                        isBusy = false;
                    }
                };
            }
            // wait for any received data if we have a callback...
            var maxTime = 300; // 30 sec - Max time we wait in total, even if getting data
            var dataWaitTime = callbackNewline ? 100/*10 sec  if waiting for newline*/ : 3/*300ms*/;
            var maxDataTime = dataWaitTime; // max time we wait after having received data
            cbTimeout = setTimeout(function timeout() {
                cbTimeout = undefined;
                if (maxTime) maxTime--;
                if (maxDataTime) maxDataTime--;
                if (connection.hadData) maxDataTime = dataWaitTime;
                if (maxDataTime && maxTime) {
                    cbTimeout = setTimeout(timeout, 100);
                } else {
                    connection.cb = undefined;
                    if (callbackNewline)
                        log(2, "write waiting for newline timed out");
                    if (callback)
                        callback(connection.received);
                    isBusy = false;
                    connection.received = "";
                }
                connection.hadData = false;
            }, 100);
        }


        connection = connect(function () {
            connection.received = "";
            connection.on('data', function (d) {
                connection.received += d;
                connection.hadData = true;
                if (connection.cb) connection.cb(d);
            });
            connection.on('close', function (d) {
                connection = undefined;
            });
            isBusy = true;
            connection.write(onWritten);
        });
    }
function connect(callback) {
    var connection = {
        on : function(evt,cb) { this["on"+evt]=cb; },
        emit : function(evt,data) { if (this["on"+evt]) this["on"+evt](data)
            console.log("emit"); },
        isOpen : false,
        isOpening : true,
        txInProgress : false
    };
    connection = WebBluetooth.connect(connection, callback);
    return connection;
}