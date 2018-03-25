#include <nRF5x_BLE_API.h>
#include "setting.h"

BLEDevice ble;
uint8_t sid[] = {0x6F, 0xFE};
uint8_t sdata[] = {0x6F, 0xFE, 0x02, 0x01, 0xDE, 0xAD, 0xBE, 0xEF, 0x7F, 0x00};
uint8_t hwid[] = HWID;
int cnt = 0;

void advertising() {
  ble.init(); 
  // set advertisement
  ble.accumulateAdvertisingPayload(GapAdvertisingData::BREDR_NOT_SUPPORTED | GapAdvertisingData::LE_GENERAL_DISCOVERABLE);
  ble.accumulateAdvertisingPayload(GapAdvertisingData::COMPLETE_LIST_16BIT_SERVICE_IDS , sid, sizeof(sid));
  ble.accumulateAdvertisingPayload(GapAdvertisingData::SERVICE_DATA , sdata, sizeof(sdata));
  // set advertise type  
  //  ADV_CONNECTABLE_UNDIRECTED
  //  ADV_CONNECTABLE_DIRECTED
  //  ADV_SCANNABLE_UNDIRECTED
  //  ADV_NON_CONNECTABLE_UNDIRECTED
  ble.setAdvertisingType(GapAdvertisingParams::ADV_NON_CONNECTABLE_UNDIRECTED);
  ble.setAdvertisingInterval(160);   // 100ms; in multiples of 0.625ms
  ble.setAdvertisingTimeout(5);      // 単位は秒
  ble.startAdvertising();
  ble.waitForEvent();
  ble.stopAdvertising();
  ble.shutdown();
  delay(150);
}
void setup() {
  Serial.begin(9600);

  // put your setup code here, to run once
  // close peripheral power
  NRF_POWER->DCDCEN = 0x00000001;

  pinMode(LED, OUTPUT);
  pinMode(D2, INPUT_PULLUP);

  memcpy(&sdata[3], hwid, 5);
  for (int i = 0; i < 10; i++) {  // 10秒間ウエイト
    digitalWrite(LED, HIGH);      // LED ON
    delay(500);
    digitalWrite(LED, LOW);       // LED OFF    
    delay(500);
  }
}

void loop() {
  int data = digitalRead(D2);
  if (data) {
    if (++cnt & 0x1) {
      digitalWrite(LED, HIGH);
    } else {
      digitalWrite(LED, LOW);      
    }
    if (cnt > 30 ) {        // 3秒間
      digitalWrite(LED, HIGH);
      advertising();        // チャックが開いている時だけ通信
    }
  } else {
    cnt = 0;
    digitalWrite(LED, LOW);
  }
  Serial.println(data, HEX);
  delay(100);
}

