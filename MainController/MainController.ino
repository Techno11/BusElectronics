#include "FastLED.h"

/*** Input/Outputs (Array Position => Physical Pin)
 ****** Mosfet Dimmers ******
 * 00 => 03 - ?
 * 01 => 04 - 
 * 02 => 05 - 
 * 03 => 06 - 
 * 04 => 07 - Shower Light
 * 05 => 08 - Closet Light
 * 06 => 19 - Entry Light
 * 07 => 10 - Front Aisle
 * 08 => 11 - Shoe Box (By Door)
 * 09 => 12 - Rear Aisle Lights
 * Don't use D13... It controls the RX/TX LED!
 ****** Relays ******
 * 00 => 26 - Water Pump
 * 01 => 27 - Propane Valve
 * 02 => 28 - [Relay 3]
 * 03 => 29 - [Relay 4]
 * 04 => 30 - [Relay 5]
 * 05 => 31 - [Relay 6]
 * 06 => 32 - [Relay 7]
 * 07 => 33 - [Relay 8]
 ****** LED Strips ******
 * 00 => 44 - "Bedroom" LEDs
 * 01 => 45 - 
 * 02 => 46 - 
 * 03 => 47 - 
 ****** Inputs ******
 * 00 => 14 - Shower Button
 * 01 => 15 - Closet Door Switches
 * 02 => 16 - Emergency Window
 * 03 => 17 - Emergency Window
 * 04 => 18 - [Left 2nd-to-Bottom]
 * 05 => 19 - [Right 2nd-to-Bottom]
 * 06 => 20 - [Left Bottom]
 * 07 => 21 - [Right Bottom]
 */

#define NUM_DIMMERS 10
#define NUM_INPUTS 8
#define NUM_RELAYS 8
const int inputPins[NUM_INPUTS] = {14, 15, 16, 17, 18, 19, 20, 21};
const int dimmerPins[NUM_DIMMERS] = {3, 4, 5, 6, 7, 8, 9, 10, 11, 12};
const int relayPins[NUM_RELAYS] = {26, 27, 28, 29, 30, 31, 32, 33};


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

// Dimmer Animations
// Each dimmer is has a corresponding "animation" (for fading) in this array.
// The arrays are stored as follows: {currentBrightness, desiredBrightness, stepsToAnimate}
#define CURRENT_BRIGHTNESS 0
#define DESIRED_BRIGHTNESS 1
#define ANIMATION_STEPS 2
float dimmerAnimations[NUM_DIMMERS][3] = {
  {0.0, 0.0, 0.0},
  {0.0, 0.0, 0.0},  
  {0.0, 0.0, 0.0}, 
  {0.0, 0.0, 0.0}, 
  {0.0, 0.0, 0.0}, 
  {0.0, 0.0, 0.0}, 
  {0.0, 0.0, 0.0}, 
  {0.0, 0.0, 0.0}, 
  {0.0, 0.0, 0.0}, 
  {0.0, 0.0, 0.0}
};

void setup() {
  // Initilize Sensor (Input) Pins
  for(int i = 0; i < NUM_INPUTS; i++) { pinMode(inputPins[i], INPUT_PULLUP); }
  // Initilize Output (Dimmer) pins
  for(int i = 0; i < NUM_DIMMERS; i++) { pinMode(dimmerPins[i], OUTPUT); analogWrite(dimmerPins[i], 0);}
  // Initilize Relay pins
  for(int i = 0; i < NUM_RELAYS; i++) { pinMode(relayPins[i], OUTPUT); digitalWrite(relayPins[i], HIGH);}
  // Initlize LEDS
  FastLED.addLeds<NEOPIXEL, LED_PIN_0>(ledStrips[0], ledCount[0]);
  FastLED.addLeds<NEOPIXEL, LED_PIN_1>(ledStrips[1], ledCount[1]);
  FastLED.addLeds<NEOPIXEL, LED_PIN_2>(ledStrips[2], ledCount[2]);
  FastLED.addLeds<NEOPIXEL, LED_PIN_3>(ledStrips[3], ledCount[3]);
  Serial.begin(115200);

  // Setup animations
  setupAnimation(7, 255, .25);
  setupAnimation(9, 255, .25);
}

char* curVal = "";
int lastButtonReads[] = {1, 1, 1, 1, 1, 1, 1, 1};

// State Variables
int bathroomLightState = 0;

void loop() {
  for(int i = 0; i < NUM_INPUTS; i++) {
    int newRead = digitalRead(inputPins[i]);
      if (lastButtonReads[i] != newRead) {
        lastButtonReads[i] = newRead;
        // TODO: Handle Button Presses

        /* Bathroom Button Pressed  */
        if(i == 0) {
          bathroomLightState = 255;
          analogWrite(dimmerPins[4], bathroomLightState);
        }
      }
  }
  for (int i = 0; i < NUM_LED_STRIPS; i++) {
    for(int j = 0; j < ledCount[i]; j++) {
      ledStrips[i][j] = CRGB::White;
    }
  }
  FastLED.show(); 

  // "Asyncronously" run animations, 1 "step" per loop
  runAnimations();
}

// Method to setup animations
void setupAnimation(int i, int desired, float animationSpeed) {
  // If we're lowering the brightness, but the animation speed is positive, we need to undo that
  if(dimmerAnimations[i][CURRENT_BRIGHTNESS] > desired && animationSpeed > 0) {
    animationSpeed = -animationSpeed;
  }

  dimmerAnimations[i][DESIRED_BRIGHTNESS] = desired;
  dimmerAnimations[i][ANIMATION_STEPS] = animationSpeed;
}

// Method to handle active animations
void runAnimations() {
  for(int i = 0; i < NUM_DIMMERS; i++){
    // If the difference of the current and the desired is more than 1 step away
    if(abs(dimmerAnimations[i][CURRENT_BRIGHTNESS] - dimmerAnimations[i][DESIRED_BRIGHTNESS]) >= dimmerAnimations[i][ANIMATION_STEPS]) {
      float newBrightness = dimmerAnimations[i][CURRENT_BRIGHTNESS] + dimmerAnimations[i][ANIMATION_STEPS];
      analogWrite(dimmerPins[i], (int)newBrightness);
      dimmerAnimations[i][CURRENT_BRIGHTNESS] = newBrightness;
    }
  }
}
