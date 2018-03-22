#include <nRF5x_BLE_API.h>
#include "setting.h"

BLEDevice ble;

void setup() {
  Serial.begin(9600);
  uint8_t da[] = {0x6F, 0xFE};
  uint8_t data[] = {0x6F, 0xFE, 0x02, 0x01, 0xDE, 0xAD, 0xBE, 0xEF, 0x7F, 0x00};
//  uint8_t hwid[] = {0x01, 0x0e, 0xd7, 0x8c, 0xd3};
  uint8_t hwid[] = HWID;

  // put your setup code here, to run once
  // close peripheral power
  NRF_POWER->DCDCEN = 0x00000001;
  
  pinMode(LED, OUTPUT);
  digitalWrite(LED, HIGH);
  
  ble.init(); 
  // set advertisement
  ble.accumulateAdvertisingPayload(GapAdvertisingData::BREDR_NOT_SUPPORTED | GapAdvertisingData::LE_GENERAL_DISCOVERABLE);
//  ble.accumulateAdvertisingPayload(GapAdvertisingData::MANUFACTURER_SPECIFIC_DATA, beaconPayload, sizeof(beaconPayload));
  ble.accumulateAdvertisingPayload(GapAdvertisingData::COMPLETE_LIST_16BIT_SERVICE_IDS , da, sizeof(da));
  ble.accumulateAdvertisingPayload(GapAdvertisingData::SERVICE_DATA , data, sizeof(data));
//  ble.accumulateAdvertisingPayload(GapAdvertisingData::COMPLETE_LIST_16BIT_SERVICE_IDS, uuid16_list, sizeof(uuid16_list));
  // set advertise type  
  //  ADV_CONNECTABLE_UNDIRECTED
  //  ADV_CONNECTABLE_DIRECTED
  //  ADV_SCANNABLE_UNDIRECTED
  //  ADV_NON_CONNECTABLE_UNDIRECTED
  ble.setAdvertisingType(GapAdvertisingParams::ADV_NON_CONNECTABLE_UNDIRECTED);
  ble.setAdvertisingInterval(160);   // 100ms; in multiples of 0.625ms
  ble.setAdvertisingTimeout(10);         // 10秒
  ble.startAdvertising();
}

void loop() {
  Serial.println("aaa");
  // put your main code here, to run repeatedly:
  ble.waitForEvent();
  Serial.println("bbb");
}

