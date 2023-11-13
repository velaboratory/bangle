
function func() {
    console.log('working');
    navigator.bluetooth.requestDevice({acceptAllDevices: true})
        .then(device => {
            // Human-readable name of the device.
            console.log(device.name);

            // Attempts to connect to remote GATT Server.
            return device.gatt.connect();
        })
        .catch(error => {
            console.error(error);
        });
}