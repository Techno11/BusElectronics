#include <Adafruit_ADS1X15.h>
#include "FastLED.h"

/*** Library Breakdown
 *  Adafruit_ADS1X15 - For Current Sensor
 *  FastLED - For Individually Adressable LEDs
 */

/*** Input/Outputs ([Array Position] => [Physical Pin])
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
 * 00 => 44 - "Bedroom" LEDs Passenger and Rear
 * 01 => 45 - "Bedroom" LEDs Driver
 * 02 => 46 - 
 * 03 => 47 - 
 ****** Digital Inputs ******
 * 00 => 14 - Shower Button
 * 01 => 15 - Closet Door Switches
 * 02 => 16 - Emergency Window
 * 03 => 17 - Emergency Window
 * 04 => 18 - [Left 2nd-to-Bottom]
 * 05 => 19 - [Right 2nd-to-Bottom]
 * 06 => 20 - [Left Bottom]
 * 07 => 21 - [Right Bottom]
 * 
 ****** Analog Inputs ******
 * 00 => 15 - Main Water Tank Sensor
 */

/* How often to send status packets */
#define SEND_STAUS_EVERY_MILLISECONDS 2000

/* Dimmer Shorthand */
#define SHOWER_DIMMER 4
#define CLOSET_DIMMER 5
#define ENTRY_DIMMER 6
#define FRONT_AISLE_DIMMER 7
#define SHOE_BOX_DIMMER 8
#define REAR_AISLE_DIMMER 9

/* Dimmer Pin-Map */
#define NUM_DIMMERS 10
const int dimmerPins[NUM_DIMMERS] = {3, 4, 5, 6, 7, 8, 9, 10, 11, 12};

/* Relay Shorthand */
#define WATER_PUMP_RELAY 0
#define PROPANE_VALVE_RELAY 1

/* Relay Pin-Map */
#define NUM_RELAYS 8
const int relayPins[NUM_RELAYS] = {26, 27, 28, 29, 30, 31, 32, 33};

/* Analog Shorthand */ 
#define MAIN_WATER_TANK_INPUT 0

/* Analog Pin-Map */
#define NUM_ANALOG 1
const int analogPins[NUM_ANALOG] = {15};

/* Digital Inputs */
#define SHOWER_BUTTON 0
#define CLOSET_DOOR_SWITCHES 1

#define NUM_INPUTS 8
const int inputPins[NUM_INPUTS] = {14, 15, 16, 17, 18, 19, 20, 21};


// LED Config
#define NUM_LED_STRIPS 4
#define LED_PIN_0 44
#define LED_PIN_1 45
#define LED_PIN_2 46
#define LED_PIN_3 47
#define NUM_LEDS_0 120
#define NUM_LEDS_1 120
#define NUM_LEDS_2 120
#define NUM_LEDS_3 120
#define NUM_LEDS_0_PASS 60
#define NUM_LEDS_0_REAR 60
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

// Current Sensor Configuration
Adafruit_ADS1115 ads;
const float CS_FACTOR = 100; //100A/1V from the CT
const float CS_MULTIPLIER = 0.00005;

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

  // Serial Debugging
  Serial.begin(115200);

  // Communication to pi
  // Serial1.begin(115200);

  // Setup animations
  setupAnimation(FRONT_AISLE_DIMMER, 255, .25);
  setupAnimation(REAR_AISLE_DIMMER, 255, .25);

  // Setup ADS (for current sensor)
  ads.setGain(GAIN_FOUR);      // +/- 1.024V 1bit = 0.5mV
  ads.begin();
}

// Sensor States
float currentCurrent = 0.0;
float currentWaterPercent = 0.0;
int lastButtonReads[] = {1, 1, 1, 1, 1, 1, 1, 1};

// Track status updates
long lastStatusSent = 0;

void loop() {
  for(int i = 0; i < NUM_INPUTS; i++) {
    int newRead = digitalRead(inputPins[i]);
      if (lastButtonReads[i] != newRead) {
        lastButtonReads[i] = newRead;
        // TODO: Handle Button Presses

        /* Bathroom Button Pressed  */
        if(i == SHOWER_BUTTON) {
          setupAnimation(SHOWER_DIMMER, 255, .25);
        }
      }
  }
  for (int i = 0; i < NUM_LED_STRIPS; i++) {
    for(int j = 0; j < ledCount[i]; j++) {
      ledStrips[i][j] = CRGB::White;
    }
  }

  // Run LEDs
  FastLED.show(); 

  // "Asyncronously" run animations, 1 "step" per loop
  runAnimations();

  // Get Current AC Draw
  readCurrent();

  // Read Main Tank
  readMainWater();

  // Serial Read
  doSerial();

  // If it's been the configured time since the last status message was sent, send another
  if(millis() - lastStatusSent > SEND_STAUS_EVERY_MILLISECONDS){
    // sendStatus();
    lastStatusSent = millis();
  }
}

/* Serial bits for a "command" are in this order:
* 0 - Command Type (0 = Intensity, 1 = Color)
* 1 - Device (0 = Mosfet, 1 = Relay, 2 = LED, 3 = Digital, 4 = Analog)
* 2 - Fixture
* 3 - 0 = Off, 1 = On
* 4 - Data 1 (Intensity, Red)
* 5 - Data 2 (Green)
* 6 - Data 3 (Blue)
* ...
 */
void doSerial() {
  while (Serial.available() > 0){
    // Create a place to hold the incoming command
    static int command[8] = {0, 0, 0, 0, 0, 0, 0, 0};
    static unsigned int commandPos = 0; 

    // Read the next available byte in the serial receive buffer
    char inByte = Serial.read();

    // Message coming in (check not terminating character) and guard for over message size
    if ( inByte != '\n' && (commandPos < 8) ){
      
      // Add the incoming byte to our command
      command[commandPos] = inByte;
      commandPos++;
    } else {
      // Start processing command
      if(command[0] == 0) {           // "Intensity" Command
        // Command desired fixture to go to desired intensity immediately
        setupAnimation(command[2], command[4], 255);
      } else if (command[0] == 1) {   // "Color" Command
        processLeds(command[2], command[4], command[5], command[6]);
      }

      //Reset for the next message
      commandPos = 0;
    }
  }
}

void processLeds(int fixture, int red, int green, int blue) {
  if(fixture > 1 && fixture < 4) {
    for(int i = 0; i < ledCount[fixture]; i++) {
      ledStrips[fixture][i] = CRGB(red, green, blue);
    }
  } else if(fixture == 0) { // First n leds are for passenger
    for(int i = 0; i < NUM_LEDS_0_PASS; i++) {
      ledStrips[0][i] = CRGB(red, green, blue);
    }
  } else if(fixture == 4) { // Second n leds are for rear
    for(int i = NUM_LEDS_0_PASS; i < NUM_LEDS_0_PASS + NUM_LEDS_0_REAR; i++) {
      ledStrips[0][i] = CRGB(red, green, blue);
    }
  }
}

void sendStatus() {
  Serial.print("{\"water_percent\":");
  Serial.print(currentWaterPercent);
  Serial.print(",\"current\":");
  Serial.print(currentCurrent);
  Serial.print(",\"digital_inputs\":[");
  Serial.print(lastButtonReads[0]);
  Serial.print(",");
  Serial.print(lastButtonReads[1]);
  Serial.print(",");
  Serial.print(lastButtonReads[2]);
  Serial.print(",");
  Serial.print(lastButtonReads[3]);
  Serial.print(",");
  Serial.print(lastButtonReads[4]);
  Serial.print(",");
  Serial.print(lastButtonReads[5]);
  Serial.print(",");
  Serial.print(lastButtonReads[6]);
  Serial.print(",");
  Serial.print(lastButtonReads[7]);
  Serial.print("],\"dimmers\":[");
  Serial.print(dimmerAnimations[0][CURRENT_BRIGHTNESS]);
  Serial.print(",");
  Serial.print(dimmerAnimations[1][CURRENT_BRIGHTNESS]);
  Serial.print(",");
  Serial.print(dimmerAnimations[2][CURRENT_BRIGHTNESS]);
  Serial.print(",");
  Serial.print(dimmerAnimations[3][CURRENT_BRIGHTNESS]);
  Serial.print(",");
  Serial.print(dimmerAnimations[4][CURRENT_BRIGHTNESS]);
  Serial.print(",");
  Serial.print(dimmerAnimations[5][CURRENT_BRIGHTNESS]);
  Serial.print(",");
  Serial.print(dimmerAnimations[6][CURRENT_BRIGHTNESS]);
  Serial.print(",");
  Serial.print(dimmerAnimations[7][CURRENT_BRIGHTNESS]);
  Serial.print(",");
  Serial.print(dimmerAnimations[8][CURRENT_BRIGHTNESS]);
  Serial.print(",");
  Serial.print(dimmerAnimations[9][CURRENT_BRIGHTNESS]);
  Serial.print("]}");
  Serial.print("\n"); // Tells Pi that we're done
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
  int delta = 0;
  for(int i = 0; i < NUM_DIMMERS; i++){
    // Continue if desired equals current
    if(dimmerAnimations[i][CURRENT_BRIGHTNESS] == dimmerAnimations[i][DESIRED_BRIGHTNESS]) continue;
    
    // Calculate Delta
    delta = abs(dimmerAnimations[i][CURRENT_BRIGHTNESS] - dimmerAnimations[i][DESIRED_BRIGHTNESS]);
    
    // If the difference of the current and the desired is more than 1 step away
    if(delta >= dimmerAnimations[i][ANIMATION_STEPS]) {
      float newBrightness = dimmerAnimations[i][CURRENT_BRIGHTNESS] + dimmerAnimations[i][ANIMATION_STEPS];
      analogWrite(dimmerPins[i], (int)newBrightness);
      dimmerAnimations[i][CURRENT_BRIGHTNESS] = newBrightness;
    
    // If delta is less than a step, just go there
    } else if (delta < dimmerAnimations[i][ANIMATION_STEPS]) {
      analogWrite(dimmerPins[i], dimmerAnimations[i][DESIRED_BRIGHTNESS]);
      dimmerAnimations[i][CURRENT_BRIGHTNESS] = dimmerAnimations[i][DESIRED_BRIGHTNESS];
    }
  }
}


float sum = 0;
long time_check = millis();
int counter = 0;

// Method to read the Current Sensor and get current AC Draw
void readCurrent() {
  float voltage;
  float current;

  if (millis() - time_check < 1000) {
    voltage = ads.readADC_Differential_0_1() * CS_MULTIPLIER;
    current = voltage * CS_FACTOR;
    // current /= 1000.0;

    sum += sq(current);
    counter = counter + 1;
  } else {
    currentCurrent = sqrt(sum / counter);
    sum = 0;
    time_check = millis();
    counter = 0;
  }
}

// Method to read the current percentage of water in the tank
float readMainWater() {
  int raw = analogRead(analogPins[0]);
  currentWaterPercent = raw / 1024.0;
}
