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
#include <AsyncTCP.h> //Library for establishing a captive portal
#include <ESPAsyncWebServer.h> //Library for establishing a captive portal
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
String server_root = "https://bbs.ugavel.com/";
String discover_route = server_root + "discovered";
String sync_route = server_root + "sync";
String update_route = server_root + "getapp";
String station_mac = "none";
Preferences preferences;

DNSServer dnsServer;
AsyncWebServer server(80);
const IPAddress localIP(192, 168, 4, 1);
const String IPURL = "http://192.168.4.1";
String ssid;
String password;
String username;
HTTPClient http;
const byte DNS_PORT = 53;

//WebServer server(80); 
//DNSServer dnsServer;

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
void setUpDNSServer(DNSServer &dnsServer, const IPAddress localIP) {
  // Set the TTL for DNS response and start the DNS server
  dnsServer.setTTL(3600);
  dnsServer.start(53, "*", localIP);
}
/*
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
*/
void doWifiWifiSetup(AsyncWebServer &server){

  
  WiFi.mode(WIFI_AP);
  WiFi.softAP("watchconfig", "password");

  IPAddress apIP = WiFi.softAPIP();
  
  server.on("/connecttest.txt", [](AsyncWebServerRequest *request) { request->redirect("http://logout.net"); }); //Windows
  server.on("/wpad.dat", [](AsyncWebServerRequest *request) { request->send(404); }); //Windows
  server.on("/generate_204", [](AsyncWebServerRequest *request) { request->redirect(IPURL); }); //Android
  server.on("/redirect", [](AsyncWebServerRequest *request) { request->redirect(IPURL); }); //Microsoft
  server.on("/hotspot-detect.html", [](AsyncWebServerRequest *request) { request->redirect(IPURL); }); //Apple
  server.on("/canonical.html", [](AsyncWebServerRequest *request) { request->redirect(IPURL); }); //Firefox
  server.on("/success.txt", [](AsyncWebServerRequest *request) { request->send(200); }); //Firefox
  server.on("/ncsi.txt", [](AsyncWebServerRequest *request) { request->redirect(IPURL); });// windows call home??
  
  server.on("/", HTTP_ANY, [](AsyncWebServerRequest *request) {
    String HTML = "<!DOCTYPE html>\
    <html>\
    <head>\
    <meta charset=\"UTF-8\">\
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\
  <title>University of Georgia Survey</title>\
    <style>\
    body {\
      font-family: Arial, sans-serif;\
      background-color: #f4f4f4;\
      margin: 0;\
      font-size: 5%;\
      padding: 0;\
    }\
    .container {\
      max-width: 600px;\
      margin: 0 auto;\
      padding: 20px;\
      background-color: #ffffff;\
      border-radius: 5px;\
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);\
    }\
    .logo {\
      text-align: center;\
      margin-bottom: 20px;\
    }\
    .logo img {\
      max-width: 100px;\
    }\
    .survey-form {\
      margin-bottom: 20px;\
    }\
    .survey-form label {\
      display: block;\
      margin-bottom: 10px;\
      font-weight: bold;\
    }\
    .survey-form input[type=\"text\"],\
    .survey-form textarea {\
      width: 100%;\
      padding: 10px;\
      border: 1px solid #ccc;\
      border-radius: 5px;\
      font-size: 16px;\
      margin-bottom: 15px;\
    }\
    .survey-form button {\
      background-color: #007a72;\
      color: #ffffff;\
      border: none;\
      padding: 10px 20px;\
      border-radius: 5px;\
      font-size: 16px;\
      cursor: pointer;\
    }\
    </style>\
    </head>\
    <body>\
    <header>\
    <div class=\"container\">\
    <h1>Bangle.JS Basestation WIFI Setup<h1/>\
    <form action=\"post\" method=\"post\">\
    SSID<br>";
    int n = WiFi.scanNetworks();
    Serial.println(n);
    for(int i=0;i<n;i++){
      String ssid = WiFi.SSID(i);
      HTML = HTML + "<input type=\"radio\" id=\"ssid\" name=\"ssid\" value= \"" + ssid + "\">"+ssid+"<br>";
    }
    HTML = HTML + "<label for=\"password\">Password</label>\
    <input type=\"text\" id=\"password\"name=\"password\"><br>\
    <label for=\"username\">Username</label>\
    <input type=\"text\" id=\"username\" name=\"username\"><br>\
    <input type=\"submit\">\
    </div>\
    </body>\
    </html>";
    AsyncWebServerResponse *response = request->beginResponse(200, "text/html", HTML);
    response->addHeader("Cache-Control", "public,max-age=31536000");  // save this file to cache for 1 year (unless you refresh)
    request->send(response);
    Serial.println("Served Basic HTML Page");
  });

  server.on("/post", HTTP_POST, [] (AsyncWebServerRequest *request) {
    String param1 = "ssid";
    String param2 = "password";
    String param3 = "username";
    String sssid = "none";
    String spassword = "none";
    String susername = "none";
    if (request->hasParam("ssid", true)) {
      sssid = request->getParam("ssid", true)->value();
    }
    if (request->hasParam(param2, true)) {
      spassword = request->getParam(param2, true)->value();
    }
    if (request->hasParam(param3, true)) {
      susername = request->getParam(param3, true)->value();
    }
    ssid = sssid;
    password = spassword;
    username = susername;
    Serial.println(sssid);
    Serial.println(spassword);
    Serial.println(susername);
  });
  
  server.onNotFound([](AsyncWebServerRequest *request) {
    //List all parameters
int params = request->params();
for(int i=0;i<params;i++){
  AsyncWebParameter* p = request->getParam(i);
  if(p->isFile()){ //p->isPost() is also true
    Serial.printf("FILE[%s]: %s, size: %u\n", p->name().c_str(), p->value().c_str(), p->size());
  } else if(p->isPost()){
    Serial.printf("POST[%s]: %s\n", p->name().c_str(), p->value().c_str());
  } else {
    Serial.printf("GET[%s]: %s\n", p->name().c_str(), p->value().c_str());
  }
}
  Serial.println(request->methodToString());
    request->redirect(IPURL);
    Serial.print("onnotfound ");
    Serial.print(request->host());
    Serial.print(" ");
    Serial.print(request->url());
    Serial.print(" sent redirect to " + IPURL + "\n");
  });

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

/*
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
*/

//the root form, scans for ssids and displays a form to allow entry
/*void handle_root(){
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
*/
void setup() {
  M5.begin();
  preferences.begin("my-app", false); 

  M5.Lcd.setCursor(7, 20, 2);
  M5.Lcd.fillScreen(0);
  M5.Lcd.println("Connect to wifi");
  M5.Lcd.println("\"watchconfig\"");
  M5.Lcd.println("through an external device");
  delay(2000);

  setUpDNSServer(dnsServer, localIP);
  server.begin();
  
  if(digitalRead(37)==LOW){
    //doBluetoothWifiSetup()
    doWifiWifiSetup(server);
  }
  
  connectWifi();  //from flash

  Serial.println("Scanning...");
  
  NimBLEDevice::setScanFilterMode(CONFIG_BTDM_SCAN_DUPL_TYPE_DEVICE);

  NimBLEDevice::setScanDuplicateCacheSize(10);

  NimBLEDevice::init("basestation");
  NimBLEDevice::setMTU(517);

  pBLEScan = NimBLEDevice::getScan(); //create new scan

  pBLEScan->setActiveScan(false); // Set active scanning, this will get more data from the advertiser.
  pBLEScan->setInterval(0x20); // How often the scan occurs / switches channels; in milliseconds,
  pBLEScan->setWindow(0x20);  // How long to scan during the interval; in milliseconds.
  pBLEScan->setMaxResults(0xFF); // do not store the scan results, use callback only.
}

bool connectWifi(){

  station_mac = WiFi.macAddress();
  Serial.println(station_mac);
 //String username=preferences.getString("username","");
  //String password=preferences.getString("password","");
  //String ssid = preferences.getString("ssid","");
  //bool is_eap = preferences.getBool("eap",false);

  M5.Lcd.setCursor(7, 20, 2);
  M5.Lcd.fillScreen(0);
  M5.Lcd.println("connecting to wifi");
  M5.Lcd.println(ssid);

  WiFi.mode(WIFI_STA);
  
 
  if(username != NULL){
    esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)"", 0);
    esp_wifi_sta_wpa2_ent_set_username((uint8_t *)username.c_str(), username.length());
    esp_wifi_sta_wpa2_ent_set_password((uint8_t *)password.c_str(), password.length());
    esp_wifi_sta_wpa2_ent_enable();
    
    WiFi.begin(ssid.c_str()); //connect to wifi
  }else{
   WiFi.begin(ssid.c_str(), password.c_str());
  }

  int num_attempts = 0;
  while (WiFi.status() != WL_CONNECTED ) {
    Serial.print('.');
    delay(1000);
    num_attempts++;

    if(num_attempts > 60){
      ESP.restart();
    }
  }
  
  Serial.println(WiFi.localIP());
  return true;

}


bool waiting_for_time = false;
bool updating = false;
bool syncing = false;
bool confirming = false;
bool configurating = false;
bool send_next_packet = true;
bool sync_success = false;
unsigned long from_time = 0;
#define BUFF_LEN 40000
uint8_t buffer[BUFF_LEN]; 
int buffer_index = 0;
String sync_id="";
String device_mac="";
String device_name="";
uint8_t device_battery = 0;
String config_to_upload = "";
int device_rssi = 0;
String app_name="";
long app_version=-1;
String target_app_name="";
long target_app_version=-1;
StaticJsonDocument<5000> doc;
char* search_string = "code_base64\": \"";
bool getSoftwareUpdates(){
  updating = true;
  String urlEncoded = "name="+target_app_name+"&version="+target_app_version; 
  http.begin((update_route+"?"+urlEncoded).c_str());
  int httpResponseCode = http.GET();
  if(httpResponseCode==200){
    Serial.println(http.getSize());
    WiFiClient * stream = http.getStreamPtr();
    buffer_index = 0;
    while(true){
      int b = stream->read();
      if(b < 0){
        buffer[buffer_index+1] = 0;
        http.end();
        //we need to find the beginning and the end of the program if the result is successful
        Serial.println((char*)buffer);
        if(strstr((char*)buffer,search_string)){
          return true;
        }
        return false;
      }else{
        buffer[buffer_index++] = b;
      }
    }
  }
  Serial.println("failed to download software");
  http.end();
  return false;

}
ServerResponseDiscovered sendServerDiscovered(){
  http.begin(discover_route.c_str());
  http.addHeader("Content-Type", "application/x-www-form-urlencoded", false, true);
  String urlEncoded = "name=" + device_name + "&battery=" + device_battery + "&rssi="+String(device_rssi)+"&station_id="+station_mac+"&device_id="+device_mac; //todo, set station id correctly
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
    ESP.restart();
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
    M5.Lcd.println("fail server");
  }
  // Free resources
  http.end();
  return res;

}

void sendSyncDataToServer(bool complete){


  String urlEncoded = "?from_time="+String(from_time)+"&station_id="+station_mac+"&device_id="+device_mac+"&app_name="+app_name+"&app_version="+app_version+"&complete=" + (complete?"1":"0");
  
  if(sync_id != ""){
    urlEncoded += "&sync_id="+sync_id;
  } 
  http.begin((sync_route + urlEncoded).c_str());
  http.addHeader("Content-Type", "application/octet-stream", false, true);
  int httpResponseCode = http.POST(buffer, buffer_index);
  ServerResponseDiscovered res;

  if (httpResponseCode==200) {
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
        String payload = http.getString();
        Serial.println(payload);
        deserializeJson(doc, payload);
        if(doc["success"]){
          const char * sid = doc["sync_id"];
          
          sync_id = String(sid);
          if(complete){
              const char* config = doc["config_json"];
              config_to_upload = config;
              const char* name = doc["target_app_name"];
              target_app_name = name;
              target_app_version = doc["target_app_version"].as<unsigned long>();
              sync_success = true;
          }
        }else{
          Serial.print("restarting");
          delay(1000);
          ESP.restart(); //not successful, just restart
        }
       
  }
  else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
    M5.Lcd.println("fail server");
    ESP.restart();
  }
  // Free resources
  http.end();
  
  if(complete){
    syncing = false;
  }else{
    send_next_packet = true; //signal that the packet has been uploaded
  }
  buffer_index = 0;
}

void onRX(NimBLERemoteCharacteristic* pRemoteCharacteristic, uint8_t* pData, size_t length, bool isNotify){
  Serial.println(buffer_index);
  if(waiting_for_time){
    Serial.println("Got RX in time");
    Serial.println(pData[0]);
    if(pData[0] == 7){
      uint8_t converter[4] = {pData[4],pData[3],pData[2],pData[1]};
      uint8_t converter2[4] = {pData[8],pData[7],pData[6],pData[5]};
      uint8_t app_name_converter[11];
      for(int i=0;i<10;i++){
        
        app_name_converter[i] = pData[9+i];
        if(pData[i] == 0){
           break;
        }
      }
      pData[19] = 0; //ensure nul terminated
      app_name = String((char*)(pData+9));
      app_version = *((unsigned long*)converter2);
      from_time = *((long*)converter);
      waiting_for_time = false;
    }else if(pData[0] == 8){
      //back off
      waiting_for_time = false;
      from_time = 0; //signal that we should wait
    }

  }else if(syncing){
    Serial.println("Got RX in syncing");
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
    Serial.println("Got RX in confirming");
    if(pData[0] == 2){
      confirming = false;
    }
  }else if(configurating){
    Serial.println("Got RX in configurating");
    if(pData[0] == 3){
      configurating = false;
    }
  }else if(updating){
    Serial.println("Got RX in updating");
    if(pData[0] == 4){
      updating = false;
    }
  }
}

void loop() {
 if(ssid != NULL){
  if ((WiFi.status() != WL_CONNECTED)) {
    connectWifi();
  }
 }

  M5.Lcd.setCursor(7, 20, 2);
  M5.Lcd.fillScreen(0);
  M5.Lcd.println("starting discovery");
  //scan for 10 seconds
  NimBLEScanResults results = pBLEScan->start(10);
  for(int i = 0; i < results.getCount(); i++) {
    NimBLEAdvertisedDevice device = results.getDevice(i);
    if(device.getName() != ""){
      Serial.print("Found: ");
      Serial.println(device.getName().c_str());
    }
    if(strstr(device.getName().c_str(),"VELWATCH")){
      M5.Lcd.println(device.getName().c_str());
      device_name = String(device.getName().c_str());
      device_mac = String(device.getAddress().toString().c_str());
      device_rssi = device.getRSSI();
      device_battery = device.getServiceData<uint8_t>(0);

      ServerResponseDiscovered res = sendServerDiscovered(); //get back sync data
      if(!res.sync){
        continue;  //recently synced, just continue
      }
      //connect to the bangle
      NimBLEClient *pClient = NimBLEDevice::createClient(); //must be deleted after this point!
      pClient->setConnectionParams(6,6,0,15); 
      pClient->setConnectTimeout(5); 
      if(pClient->connect(&device)) {
        M5.Lcd.println("connected");
        
        NimBLERemoteService *pService = pClient->getService(UUID_NORDIC_UART);
        NimBLERemoteCharacteristic *rx = pService->getCharacteristic(UUID_NORDIC_RX);
        rx->subscribe(true,onRX);
        NimBLERemoteCharacteristic *tx = pService->getCharacteristic(UUID_NORDIC_TX);
        waiting_for_time = false;
        sync_id = "";
        buffer_index = 0;
        syncing = false;
        send_next_packet = false;
        confirming = false;
        sync_success = false;

        uint8_t TIME[] = {7,0,0,0,0}; //probably a more efficient way to do this
        long v = res.timestamp;
        uint8_t* temp = (uint8_t*)&v;
        for(int b =0;b<4;b++){
          TIME[b+1] = temp[3-b]; //big endian is needed
        }
        tx->writeValue(TIME,5);
        Serial.println("Sent time");
        waiting_for_time = true;
        while(waiting_for_time && pClient->isConnected()){
          delay(1);
        }



        if(!pClient->isConnected() || from_time == 0){ //if from_time is 0, then we shouldn't sync
          NimBLEDevice::deleteClient(pClient);
          continue;
        }


      
        syncing = true;
        send_next_packet=true;

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
        Serial.println("confirming");
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
        Serial.println("configurating");
        configurating = true;
        uint8_t CONFIGURE[] = {3};
        tx->writeValue(CONFIGURE,1);
        const char * config_json = config_to_upload.c_str();
        buffer_index = 0;
        for(int b=0;b < config_to_upload.length();b++){
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
        Serial.print("updating: Found ");
        Serial.print(app_name);
        Serial.print(".v");
        Serial.print(app_version);
        Serial.print(" Target ");
        Serial.print(target_app_name);
        Serial.print(".v");
        Serial.println(target_app_version);
        if(app_name != target_app_name || app_version != target_app_version){
          if(getSoftwareUpdates()){

            Serial.println("Got software, sending");
            uint8_t START_UPDATE[1];
            START_UPDATE[0] = 4;
            delay(10);
            tx->writeValue(START_UPDATE,1);
            delay(10);
            int sent = 0;
            uint8_t small_buffer[50];
            char * start_string = strstr((char*)buffer,search_string) +strlen(search_string); //actual start *
            int start_loc = start_string-(char*)buffer; //the start loc in the buffer of the data
            char * end_string = strstr(start_string,"\""); //the actual end location
            int end_loc = end_string-(char*)buffer; //end location in the buffer
            Serial.println(start_loc);
            Serial.println(end_loc);
            for(int b=start_loc;b < end_loc;b++){
              small_buffer[sent++] = buffer[b];
              Serial.print((char)buffer[b]);
              if(sent == 50 || (b+1) >= end_loc){
                delay(20);
                tx->writeValue(small_buffer,sent);
                sent = 0;
              }
            }
            delay(20);
            Serial.println("updating");
            START_UPDATE[0] = 10; //finish with a \n
            tx->writeValue(START_UPDATE,1);

            while(updating && pClient->isConnected()){ //wait for a 4
              delay(1);
            }

            Serial.println("restarting");
            delay(20);
            START_UPDATE[0] = 5;
            tx->writeValue(START_UPDATE,1);
          }
        }
        
        
        Serial.println("Complete!");
        
      } else {
        M5.Lcd.println("fail connect");
      }

      NimBLEDevice::deleteClient(pClient);
    }else if(strstr(device.getName().c_str(),"Bangle")){
      M5.Lcd.println(device.getName().c_str());
      device_name = String(device.getName().c_str());
      device_mac = String(device.getAddress().toString().c_str());
      device_rssi = device.getRSSI();
      device_battery = 0;
      ServerResponseDiscovered res = sendServerDiscovered(); //get back sync data
    }
  }
   dnsServer.processNextRequest();
   delay(30);
}
