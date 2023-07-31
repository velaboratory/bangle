#include <M5StickCPlus.h>
#include "NimBLEDevice.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include "esp_wpa2.h" //wpa2 library for connections to Enterprise networks
#include <Preferences.h>

NimBLEScan* pBLEScan;
bool setupComplete = true;
NimBLECharacteristic *pCharacteristic_ssid;
NimBLECharacteristic *pCharacteristic_username;
NimBLECharacteristic *pCharacteristic_password;
NimBLECharacteristic *pCharacteristic_eap;
NimBLECharacteristic *pCharacteristic_complete;

Preferences preferences;

WebServer server(80);

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
  M5.Lcd.println("wifi setup");
  M5.Lcd.println("Connect Wifi to");
  M5.Lcd.println("watchconfig and go to");
  M5.Lcd.println(WiFi.softAPIP());
  server.on("/",handle_root);
  server.on("/set",handle_form);
  server.begin();

  while(true){
    server.handleClient();
  }
}

//the root form, scans for ssids and displays a form to allow entry
void handle_root(){
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
  pBLEScan->setMaxResults(10); // do not store the scan results, use callback only.
}

bool connectWifi(){

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

void sendServerDiscoveries(){
  HTTPClient http;
  http.begin("http://bbs.ugavel.com/");

  int httpResponseCode = http.GET();
  if (httpResponseCode>0) {
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
        String payload = http.getString();
        Serial.println(payload);
        if(httpResponseCode==200){
          M5.Lcd.println("sync");
        }
  }
  else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
    M5.Lcd.println("fail server");
  }
  // Free resources
  http.end();

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
      sendServerDiscoveries(); //get back sync data
      //connect to the bangle
      NimBLEClient *pClient = NimBLEDevice::createClient();
        
      if(pClient->connect(&device)) {
        M5.Lcd.println("connect");
        delay(3000);
        //get synced data and send to server

        sendServerDiscoveries();
        
      } else {
        M5.Lcd.println("fail connect");
      }

      NimBLEDevice::deleteClient(pClient);
    }
  }

}