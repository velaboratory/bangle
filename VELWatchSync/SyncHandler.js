
var WebBluetooth = {
    name : "Web Bluetooth",
    description : "Bluetooth LE devices",
    connect : function(connection, callback) {
        var NORDIC_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
        var NORDIC_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
        var NORDIC_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
        var DEFAULT_CHUNKSIZE = 20;

        var btServer = undefined;
        var btService;
        var connectionDisconnectCallback;
        var txCharacteristic;
        var rxCharacteristic;
        var txDataQueue = [];
        var flowControlXOFF = false;
        var chunkSize = DEFAULT_CHUNKSIZE;

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

        connection.write = function (data, callback) {
            if (data) txDataQueue.push({data: data, callback: callback, maxLength: data.length});
            if (connection.isOpen && !connection.txInProgress) writeChunk();

            function writeChunk() {
                if (flowControlXOFF) { // flow control - try again later
                    setTimeout(writeChunk, 50);
                    return;
                }
                var chunk;
                if (!txDataQueue.length) {
                    uart.writeProgress();
                    return;
                }
                var txItem = txDataQueue[0];
                uart.writeProgress(txItem.maxLength - txItem.data.length, txItem.maxLength);
                if (txItem.data.length <= chunkSize) {
                    chunk = txItem.data;
                    txItem.data = undefined;
                } else {
                    chunk = txItem.data.substr(0, chunkSize);
                    txItem.data = txItem.data.substr(chunkSize);
                }
                connection.txInProgress = true;
                log(2, "Sending " + JSON.stringify(chunk));
                txCharacteristic.writeValue(str2ab(chunk)).then(function () {
                    console.log(3, "Sent");
                    if (!txItem.data) {
                        txDataQueue.shift(); // remove this element
                        if (txItem.callback)
                            txItem.callback();
                    }
                    connection.txInProgress = false;
                    writeChunk();
                }).catch(function (error) {
                    console.log(1, 'SEND ERROR: ' + error);
                    txDataQueue = [];
                    connection.close();
                });
            }
        };
        navigator.bluetooth.requestDevice({
            filters:[
                { namePrefix: 'VELWatch' },
                { services: [ NORDIC_SERVICE ] }
            ], optionalServices: [ NORDIC_SERVICE ]}).then(function(device) {
            console.log(1, 'Device Name:       ' + device.name);
            console.loglog(1, 'Device ID:         ' + device.id);
            device.addEventListener('gattserverdisconnected', function() {
                console.log(1, "Disconnected (gattserverdisconnected)");
                connection.close();
            });
            return device.gatt.connect();
        }).then(function(server) {
            console.log(1, "Connected");
            btServer = server;
            return server.getPrimaryService(NORDIC_SERVICE);
        }).then(function(service) {
            console.log(2, "Got service");
            btService = service;
            return btService.getCharacteristic(NORDIC_RX);
        }).then(function (characteristic) {
            rxCharacteristic = characteristic;
            console.log(2, "RX characteristic:"+JSON.stringify(rxCharacteristic));
            rxCharacteristic.addEventListener('characteristicvaluechanged', function(event) {
                var dataview = event.target.value;
                if (dataview.byteLength > chunkSize) {
                    console.log(2, "Received packet of length " + dataview.byteLength + ", increasing chunk size");
                    chunkSize = dataview.byteLength;
                }
                    for (var i=0;i<dataview.byteLength;i++) {
                        var ch = dataview.getUint8(i);
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
                console.log(3, "Received "+JSON.stringify(str));
                connection.emit('data', str);
            });
            return rxCharacteristic.startNotifications();
        }).then(function() {
            return btService.getCharacteristic(NORDIC_TX);
        }).then(function (characteristic) {
            txCharacteristic = characteristic;
            console.log(2, "TX characteristic:"+JSON.stringify(txCharacteristic));
        }).then(function() {
            connection.txInProgress = false;
            connection.isOpen = true;
            connection.isOpening = false;
            isBusy = false;
            queue = [];
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
var WebSerial = {
    name : "Web Serial",
    description : "USB connected devices",
    connect : function(connection, callback) {
        var serialPort;
        function disconnected() {
            connection.isOpening = false;
            if (connection.isOpen) {
                console.log(1, "Disconnected");
                connection.isOpen = false;
                connection.emit('close');
            }
        }
        navigator.serial.requestPort({}).then(function(port) {
            console.log(1, "Connecting to serial port");
            serialPort = port;
            return port.open({ baudRate: 115200 });
        }).then(function () {
            function readLoop() {
                var reader = serialPort.readable.getReader();
                reader.read().then(function ({ value, done }) {
                    reader.releaseLock();
                    if (value) {
                        var str = ab2str(value.buffer);
                        console.log(3, "Received "+JSON.stringify(str));
                        connection.emit('data', str);
                    }
                    if (done) {
                        disconnected();
                    } else {
                        readLoop();
                    }
                });
            }
            readLoop();
            console.log(1,"Serial connected. Receiving data...");
            connection.txInProgress = false;
            connection.isOpen = true;
            connection.isOpening = false;
            callback(connection);
        }).catch(function(error) {
            console.log(0, 'ERROR: ' + error);
            disconnected();
        });
        connection.close = function(callback) {
            if (serialPort) {
                serialPort.close();
                serialPort = undefined;
            }
            disconnected();
        };
        connection.write = function(data, callback) {
            var writer = serialPort.writable.getWriter();
            writer.write(str2ab(data)).then(function() {
                callback();
            }).catch(function(error) {
                console.log(0,'SEND ERROR: ' + error);
                closeSerial();
            });
            writer.releaseLock();
        };

        return connection;
    }
};
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}
function str2ab(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++)
        bufView[i] = str.charCodeAt(i);
    return buf;
}