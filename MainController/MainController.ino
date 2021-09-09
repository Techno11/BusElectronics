#include "FastLED.h"

/*** Input/Outputs
 ****** Mosfet Dimmers ******
 * 04 - 
 * 05 - 
 * 06 - 
 * 07 - 
 * 08 - 
 * 09 - 
 * 10 - 
 * 11 - 
 * 12 - 
 * 13 - 
 ****** LED Strips ******
 * 44 - "Bedroom" LEDs
 * 45 - 
 * 46 - 
 * 47 - 
 ****** Inputs ******
 * 14 - 
 * 15 - 
 * 16 - 
 * 17 - 
 * 18 - 
 * 19 - 
 * 20 - 
 * 21 - 
 */

#define NUM_DIMMERS 10
#define NUM_INPUTS 8
const int inputPins[NUM_INPUTS] = {14, 15, 16, 17, 18, 19, 20, 21};
const int dimmerPins[NUM_DIMMERS] = {4, 5, 6, 7, 8, 9, 10, 11, 12, 13};


// LED Config
#define NUM_LED_STRIPS 4
#define LED_PIN_0 44
#define LED_PIN_1 45
#define LED_PIN_2 46
#define LED_PIN_3 47
#define NUM_LEDS_0 60
#define NUM_LEDS_1 60
#define NUM_LEDS_2 60
#define NUM_LEDS_3 60
const int ledCount[NUM_LED_STRIPS] = {NUM_LEDS_0, NUM_LEDS_1, NUM_LEDS_2, NUM_LEDS_3};
CRGB ledStrips[][NUM_LED_STRIPS] = {new CRGB[NUM_LEDS_0], new CRGB[NUM_LEDS_1], new CRGB[NUM_LEDS_2], new CRGB[NUM_LEDS_3]};

void setup() {
  // Initilize Sensor (Input) Pins
  for(int i = 0; i < NUM_INPUTS; i++) { pinMode(inputPins[i], INPUT_PULLUP); }
  // Initilize Output (Dimmer) pins
  for(int i = 0; i < NUM_DIMMERS; i++) { pinMode(dimmerPins[i], OUTPUT); analogWrite(dimmerPins[i], 0);}
  // Initlize LEDS
  FastLED.addLeds<NEOPIXEL, LED_PIN_0>(ledStrips[0], ledCount[0]);
  FastLED.addLeds<NEOPIXEL, LED_PIN_1>(ledStrips[1], ledCount[1]);
  FastLED.addLeds<NEOPIXEL, LED_PIN_2>(ledStrips[2], ledCount[2]);
  FastLED.addLeds<NEOPIXEL, LED_PIN_3>(ledStrips[3], ledCount[3]);
  Serial.begin(115200);
}

char* curVal = "";
int lastButtonReads[] = {1, 1, 1, 1, 1, 1, 1, 1};

void loop() {
  for(int i = 0; i < NUM_INPUTS; i++) {
    int newRead = digitalRead(inputPins[i]);
      if (lastButtonReads[i] != newRead) {
        lastButtonReads[i] = newRead;
        // TODO: Handle Button Presses
        
      }
  }
  for (int i = 0; i < NUM_LED_STRIPS; i++) {
    for(int j = 0; j < ledCount[i]; j++) {
      ledStrips[i][j] = CRGB::White;
    }
  }
  FastLED.show(); 

 // Turn on All lights
  for(int i = 0; i < NUM_DIMMERS; i++){
    analogWrite(dimmerPins[i], 255);
  }
}
