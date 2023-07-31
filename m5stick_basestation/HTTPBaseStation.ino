
#include <M5StickCPlus.h>
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>

WiFiMulti wifiMulti;
HTTPClient http;

void setup() {
    M5.begin();
    M5.Lcd.setRotation(3);             
    wifiMulti.addAP("motorola one 5G ace 2936", "hello135"); 
                                       
    M5.Lcd.print("\nConnecting Wifi...\n");  
                                            
}

void loop() {
    M5.Lcd.setCursor(0, 0);  
    if ((wifiMulti.run() ==
         WL_CONNECTED)) {  //
        M5.Lcd.print("[HTTP] begin...\n");
        http.begin(
            "https://vn.ugavel.com/ugasmartwatch/");
                                               
        M5.Lcd.print("[HTTP] GET...\n");
        int httpCode = http.GET();  
                                    
        if (httpCode >
            0) {  
            Serial.printf("[HTTP] GET... code: %d\n", httpCode);
            M5.Lcd.print("Please see Serial.");
            if (httpCode ==
                HTTP_CODE_OK) { 
                String payload = http.getString();
                Serial.println(payload);
                                         
            }
        } else {
            M5.Lcd.printf("[HTTP] GET... failed, error: %s\n",
                          http.errorToString(httpCode).c_str());
        }
        http.end();
    } else {
        M5.Lcd.print("connect failed");
    }
    delay(5000);
    M5.Lcd.fillRect(0, 0, 160, 80, BLACK);
}
