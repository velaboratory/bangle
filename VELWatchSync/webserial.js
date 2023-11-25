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
        //Requests the digital port that will be used for the serial communication from the navigator class
        navigator.serial.requestPort({}).then(function(port) {
            console.log(1, "Connecting to serial port");
            serialPort = port;
            //Opens the port with a baudrate of 115200
            return port.open({ baudRate: 115200 });
        }).then(function () {
            //Saves the stream that will read data over the port than proceeds to update the already read data
            function readLoop() {
                var reader = serialPort.readable.getReader();
                reader.read().then(function ({ value, done }) {
                    reader.releaseLock();
                    //Saves the read stream as data in the case that it is specified as such
                    if (value) {
                        var str = ab2str(value.buffer);
                        console.log(3, "Received "+JSON.stringify(str));
                        connection.emit('data', str);
                    }
                    //Closes the connection if the serial port is done being used
                    if (done) {
                        disconnected();
                    }
                    //Reiterates the function to perpetually read values from the readable stream
                    else {
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
        //Used to close the digital port in the case of a disconnection
        connection.close = function(callback) {
            if (serialPort) {
                serialPort.close();
                serialPort = undefined;
            }
            disconnected();
        };
        //Creates a Writer on the serial port to send data over the tx channel
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