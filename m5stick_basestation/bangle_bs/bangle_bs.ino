#include <M5StickCPlus.h>
#include "NimBLEDevice.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include "esp_wpa2.h" //wpa2 library for connections to Enterprise networks
#include <Preferences.h>
#include <DNSServer.h>
#include <ArduinoJson.h>
#include <UrlEncode.h>
NimBLEScan* pBLEScan;
bool setupComplete = true;
NimBLECharacteristic *pCharacteristic_ssid;
NimBLECharacteristic *pCharacteristic_username;
NimBLECharacteristic *pCharacteristic_password;
NimBLECharacteristic *pCharacteristic_eap;
NimBLECharacteristic *pCharacteristic_complete;

#define UUID_NORDIC_UART "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define UUID_NORDIC_TX "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
#define UUID_NORDIC_RX "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
String server_root = "http://192.168.68.131:5000/";
String discover_route = server_root + "discovered";
String sync_route = server_root + "sync";
String confirm_route = server_root + "confirm";
String config_route = server_root + "update_config";
String station_mac = "none";
Preferences preferences;

WebServer server(80);
HTTPClient http;
const byte DNS_PORT = 53; 
DNSServer dnsServer;
//this is used if you are setting up wifi with bluetooth (see below)
class CharacteristicCallbacks: public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic){
      if(pCharacteristic == pCharacteristic_complete){
        setupComplete = true;
        preferences.end();
      }else if(pCharacteristic == pCharacteristic_username){
        preferences.putString("username",pCharacteristic->getValue().c_str());
      }else if(pCharacteristic == pCharacteristic_ssid){
        preferences.putString("ssid",pCharacteristic->getValue().c_str());
      }else if(pCharacteristic == pCharacteristic_password){
        preferences.putString("password",pCharacteristic->getValue().c_str());
      }else if(pCharacteristic == pCharacteristic_eap){ //this is written to finish and reboot
        preferences.putBool("eap",pCharacteristic->getValue()[0]==1);
      }
    };
};

class ServerResponseDiscovered {
  public:
    bool success;
    String reason;
    long timestamp;
    bool sync;
};

class ServerResponseConfig {
  public:
    bool success;
    String reason;
    String config_json;
};

static CharacteristicCallbacks chrCallbacks;

//this is called if you want to launch bluetooth-based wifi setup.  It'll restart when complete.
void doBluetoothWifiSetup(){
  setupComplete = false;
  M5.Lcd.setCursor(7, 20, 2);
  M5.Lcd.fillScreen(0);
  M5.Lcd.println("bluetooth setup");
  //we were holding the front button, go into bluetooth setup mode
  NimBLEDevice::init("BasestationSetup");
  NimBLEServer *pServer = NimBLEDevice::createServer();
  NimBLEService *pService = pServer->createService("ABCD");
  pCharacteristic_ssid = pService->createCharacteristic("1234");
  pCharacteristic_username = pService->createCharacteristic("1235");
  pCharacteristic_password = pService->createCharacteristic("1236");
  pCharacteristic_eap = pService->createCharacteristic("1237");
  pCharacteristic_complete = pService->createCharacteristic("1238");
  
  pCharacteristic_ssid->createDescriptor("2901",NIMBLE_PROPERTY::READ)->setValue("ssid");
  pCharacteristic_username->createDescriptor("2901",NIMBLE_PROPERTY::READ)->setValue("username");
  pCharacteristic_password->createDescriptor("2901",NIMBLE_PROPERTY::READ)->setValue("password");
  pCharacteristic_eap->createDescriptor("2901",NIMBLE_PROPERTY::READ)->setValue("eap");
  pCharacteristic_complete->createDescriptor("2901",NIMBLE_PROPERTY::READ)->setValue("complete");

  M5.Lcd.println("bt: BasestationSetup");
  pCharacteristic_ssid->setCallbacks(&chrCallbacks);
  pCharacteristic_username->setCallbacks(&chrCallbacks);
  pCharacteristic_password->setCallbacks(&chrCallbacks);
  pCharacteristic_eap->setCallbacks(&chrCallbacks);
  pCharacteristic_complete->setCallbacks(&chrCallbacks);
  NimBLEAdvertising *pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID("ABCD"); 
  pService->start();
  pAdvertising->start(); 

  while(!setupComplete){
    delay(1000);
  }
  preferences.end();
  ESP.restart(); //done, just restart
}

//this is called if you want to do the wifi setup thing (webpage to configure)
void doWifiWifiSetup(){
  M5.Lcd.setCursor(7, 20, 2);
  M5.Lcd.fillScreen(0);

  
  WiFi.mode(WIFI_AP);
  WiFi.softAP("watchconfig", "password");

  IPAddress apIP = WiFi.softAPIP();

  M5.Lcd.println("wifi setup");
  M5.Lcd.println("Connect Wifi to");
  M5.Lcd.println("watchconfig and go to");
  
  M5.Lcd.println(apIP);

  dnsServer.setErrorReplyCode(DNSReplyCode::NoError); 
  dnsServer.start(DNS_PORT, "*", apIP);

  server.on("/",handle_root);
  server.on("/generate_204", handle_root);
  server.on("/hotspot-detect.html", handle_root);
  server.on("/success.txt", handle_root);
  server.on("/connecttest.txt", handle_root);
  server.on("/wpad.dat", handle_root);
  server.onNotFound(handle_root);
  server.on("/set",handle_form);
  server.begin();

  while(true){
    dnsServer.processNextRequest();
    server.handleClient();
  }
}

boolean isIp(String str) {
  for (size_t i = 0; i < str.length(); i++) {
    int c = str.charAt(i);
    if (c != '.' && (c < '0' || c > '9')) {
      return false;
    }
  }
  return true;
}

String toStringIp(IPAddress ip) {
  String res = "";
  for (int i = 0; i < 3; i++) {
    res += String((ip >> (8 * i)) & 0xFF) + ".";
  }
  res += String(((ip >> 8 * 3)) & 0xFF);
  return res;
}


boolean captivePortal() {
  if (!isIp(server.hostHeader())) {
    Serial.println("Request redirected to captive portal");
    server.sendHeader("Location", String("http://192.168.4.1"), true);
    server.send(302, "text/plain", "");   
    server.client().stop(); 
    return true;
  }
  return false;
}

//the root form, scans for ssids and displays a form to allow entry
void handle_root(){
  if (captivePortal()) { 
    return;
  }
    String HTML = "<!DOCTYPE html>\
<html>\
<body>\
<form action=\"/set\" method=\"POST\">";

  int n = WiFi.scanNetworks();
  for(int i=0;i<n;i++){
    String ssid = WiFi.SSID(i);
    HTML = HTML + "<input type=\"radio\" name=\"ssid\" value=\"" + ssid + "\">"+ssid+"<br>"; 
  }
HTML = HTML + "password<input type=\"text\" name=\"password\"/><br>\
username (only if enterprise, blank otherwise)<input type=\"text\" name=\"username\"/><br>\
<input type=\"submit\">\
</body>\
</html>";
    server.send(200,"text/html",HTML);
}
//handler for the form, resets 
void handle_form(){
   String ssid = server.arg("ssid");
   String password = server.arg("password");
   String username = server.arg("username");
   bool use_eap=false;
   if(username != ""){
     use_eap=true;
   }

  preferences.putString("username",username);
  preferences.putString("ssid",ssid);
  preferences.putString("password",password);
  preferences.putBool("eap",use_eap);

  String HTML = "<!DOCTYPE html>\
<html>\
<body>\
<p>Success.  Disconnecting</p>\
</body>\
</html>";

  server.send(200,"text/html",HTML);
  preferences.end();
  ESP.restart();
}

void setup() {
  M5.begin();
  preferences.begin("my-app", false); 

  M5.Lcd.setCursor(7, 20, 2);
  M5.Lcd.fillScreen(0);
  M5.Lcd.println("Hold button for Wifi Config");

  delay(2000);

  if(digitalRead(37)==LOW){
    //doBluetoothWifiSetup()
    doWifiWifiSetup();
  }
  
  connectWifi();  //from flash

  Serial.println("Scanning...");
  
  NimBLEDevice::setScanFilterMode(CONFIG_BTDM_SCAN_DUPL_TYPE_DEVICE);

  NimBLEDevice::setScanDuplicateCacheSize(10);

  NimBLEDevice::init("basestation");

  pBLEScan = NimBLEDevice::getScan(); //create new scan

  pBLEScan->setActiveScan(false); // Set active scanning, this will get more data from the advertiser.
  pBLEScan->setInterval(0x80); // How often the scan occurs / switches channels; in milliseconds,
  pBLEScan->setWindow(0x20);  // How long to scan during the interval; in milliseconds.
  pBLEScan->setMaxResults(0xFF); // do not store the scan results, use callback only.
}

bool connectWifi(){

  station_mac = WiFi.macAddress();
  Serial.println(station_mac);
  String username=preferences.getString("username","");
  String password=preferences.getString("password","");
  String ssid = preferences.getString("ssid","");
  bool is_eap = preferences.getBool("eap",false);

  M5.Lcd.setCursor(7, 20, 2);
  M5.Lcd.fillScreen(0);
  M5.Lcd.println("connecting to wifi");
  M5.Lcd.println(ssid);

  WiFi.mode(WIFI_STA);
  
 
  if(is_eap){
    esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)"", 0);
    esp_wifi_sta_wpa2_ent_set_username((uint8_t *)username.c_str(), username.length());
    esp_wifi_sta_wpa2_ent_set_password((uint8_t *)password.c_str(), password.length());
    esp_wifi_sta_wpa2_ent_enable();
    
    WiFi.begin(ssid.c_str()); //connect to wifi
  }else{
   WiFi.begin(ssid.c_str(), password.c_str());
  }

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }
  
  Serial.println(WiFi.localIP());
  return true;

}


bool syncing = false;
bool confirming = false;
bool configurating = false;
bool send_next_packet = true;
bool sync_success = false;
#define BUFF_LEN 10000
uint8_t buffer[BUFF_LEN]; 
int buffer_index = 0;
String sync_id="";
String device_mac="";

ServerResponseDiscovered sendServerDiscovered(){
  
  http.begin(discover_route.c_str());
  http.addHeader("Content-Type", "application/x-www-form-urlencoded", false, true);
  String urlEncoded = "station_id="+station_mac+"&device_id="+device_mac; //todo, set station id correctly
  int httpResponseCode = http.POST(urlEncoded);
  ServerResponseDiscovered res;
  res.success=false;
  res.reason="unknown fail";
  res.sync = false;
  Serial.print("HTTP Response code: ");
  Serial.println(httpResponseCode);
  if (httpResponseCode==200) {
        
        String payload = http.getString();
        Serial.println(payload);
        if(httpResponseCode==200){
          StaticJsonDocument<1000> doc;
          deserializeJson(doc, payload);
          res.success = doc["success"];
          res.timestamp = doc["server_unixtime"];
          res.sync = doc["sync"]==1?true:false;
          M5.Lcd.println("sync");
        }
        else{
          res.reason = "status bad";
        }
  }
  else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
    M5.Lcd.println("fail server");
  }
  // Free resources
  http.end();
  return res;

}

void sendSyncDataToServer(bool complete){

  buffer[buffer_index] = 0; //string end
  http.begin(sync_route.c_str());
  http.addHeader("Content-Type", "application/x-www-form-urlencoded", false, true);
  String data = urlEncode((char*)buffer);
  String config_json = urlEncode("{}"); //todo, get from watch
  Serial.println(data);
  String urlEncoded = "station_id="+station_mac+"&device_id="+device_mac+"&config_json="+ config_json + "&data="+data+"&complete=" + (complete?"1":"0");
  if(sync_id != ""){
    urlEncoded += "&sync_id="+sync_id;
  } 
  int httpResponseCode = http.POST(urlEncoded);
  ServerResponseDiscovered res;

  if (httpResponseCode==200) {
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
        String payload = http.getString();
        Serial.println(payload);
        StaticJsonDocument<1000> doc;
        deserializeJson(doc, payload);
        const char * sid = doc["sync_id"];
        sync_id = String(sid);
  }
  else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
    M5.Lcd.println("fail server");
  }
  // Free resources
  http.end();
  if(complete){
    Serial.println("done syncing");
    syncing = false;
    sync_success = true;
  }else{
    send_next_packet = true; //signal that the packet has been uploaded
  }
  buffer_index = 0;
}

void sendConfirmToServer(){
  http.begin(confirm_route.c_str());
  http.addHeader("Content-Type", "application/x-www-form-urlencoded", false, true);
  String urlEncoded = "station_id="+station_mac+"&sync_id="+sync_id;
  int httpResponseCode = http.POST(urlEncoded);
  if (httpResponseCode==200) {
    Serial.println("confirmed");
  }else{
    Serial.println("failed");
  }
  http.end();
}

ServerResponseConfig getConfigFromServer(){
  http.begin(config_route.c_str());
  http.addHeader("Content-Type", "application/x-www-form-urlencoded", false, true);
  String urlEncoded = "device_id="+device_mac;
  int httpResponseCode= http.POST(urlEncoded);
  ServerResponseConfig res;
  res.success=false;
  res.reason="unknown";
  if(httpResponseCode==200){
    StaticJsonDocument<1000> doc;
    deserializeJson(doc, http.getString());
    res.success = doc["success"];
    const char * config_json = doc["config_json"];
    res.config_json = String(config_json);
  }
  http.end();
  return res;
}


void onRX(NimBLERemoteCharacteristic* pRemoteCharacteristic, uint8_t* pData, size_t length, bool isNotify){
  
  Serial.println("Got data");

  
  if(syncing){
    for(int i=0;i<length;i++){
      if(pData[i] == 1){  //packet to send, but there's more
        sendSyncDataToServer(false);
        break; 
      }else if(pData[i] == 2){ //packet to send, and we're done
        sendSyncDataToServer(true);
        break; 
      }else{
        //add the byte to the buffer
        buffer[buffer_index++] = pData[i];
      }
    }
  }else if(confirming){
    if(pData[0] == 2){
      confirming = false;
    }
  }else if(configurating){
    if(pData[0] == 3){
      configurating = false;
    }
  }
}

void loop() {

  if ((WiFi.status() != WL_CONNECTED)) {
    connectWifi();
  }


  M5.Lcd.setCursor(7, 20, 2);
  M5.Lcd.fillScreen(0);
  M5.Lcd.println("starting discovery");
  //scan for 10 seconds
  NimBLEScanResults results = pBLEScan->start(10);
  for(int i = 0; i < results.getCount(); i++) {
    NimBLEAdvertisedDevice device = results.getDevice(i);

    if(strstr(device.getName().c_str(),"Bangle.js")){
      M5.Lcd.println(device.getName().c_str());
      device_mac = String(device.getAddress().toString().c_str());
      ServerResponseDiscovered res = sendServerDiscovered(); //get back sync data
      if(!res.sync){
        continue;  //recently synced, just continue
      }
      //connect to the bangle
      NimBLEClient *pClient = NimBLEDevice::createClient(); //must be deleted after this point!
        
      if(pClient->connect(&device)) {
        M5.Lcd.println("connected");
        
        NimBLERemoteService *pService = pClient->getService(UUID_NORDIC_UART);
        NimBLERemoteCharacteristic *rx = pService->getCharacteristic(UUID_NORDIC_RX);
        rx->subscribe(true,onRX);
        NimBLERemoteCharacteristic *tx = pService->getCharacteristic(UUID_NORDIC_TX);

        uint8_t TIME[] = {7,0,0,0,0}; //probably a more efficient way to do this
        long v = res.timestamp;
        uint8_t* temp = (uint8_t*)&v;
        for(int b =0;b<4;b++){
          TIME[b+1] = temp[3-b]; //big endian is needed
        }
        tx->writeValue(TIME,5);

        sync_id = "";
        buffer_index = 0;
        syncing = true;
        send_next_packet = true;
        confirming = false;
        sync_success = false;
        configurating = false;

        while(syncing && pClient->isConnected()){
          if(send_next_packet){
              uint8_t SYNC[1] = {1};
              tx->writeValue(SYNC,1);
              send_next_packet = false;
          }
          delay(1);
        }

        if(!sync_success || !pClient->isConnected()){
          NimBLEDevice::deleteClient(pClient);
          continue;
        }


        confirming = true;
        uint8_t CONFIRM[] = {2};
        tx->writeValue(CONFIRM,1);

        while(confirming && pClient->isConnected()){
          delay(1);
        }

        if(!pClient->isConnected()){
          NimBLEDevice::deleteClient(pClient);
          continue;
        }

        sendConfirmToServer();
        ServerResponseConfig config = getConfigFromServer();

        if(!config.success){
          NimBLEDevice::deleteClient(pClient);
          continue;
        }

        configurating = true;
        uint8_t CONFIGURE[] = {3};
        tx->writeValue(CONFIGURE,1);

        Serial.println(config.config_json);

        const char * config_json = config.config_json.c_str();
        buffer_index = 0;
        for(int b=0;b < config.config_json.length();b++){
           buffer[buffer_index++] = config_json[b];
           if(buffer_index == 20){
              tx->writeValue(buffer,20);
              buffer_index = 0;
              
           }
        }
        if(buffer_index > 0){ //send whatever is left
          tx->writeValue(buffer, buffer_index);
        }
        
        buffer[0] = 10; //send a newline to indicate the end
        tx->writeValue(buffer,1);
        
        while(configurating && pClient->isConnected()){
          delay(1);
        }
        
        Serial.println("Complete!");
        
      } else {
        M5.Lcd.println("fail connect");
      }

      NimBLEDevice::deleteClient(pClient);
    }
  }

}