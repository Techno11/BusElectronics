#include <Adafruit_ADS1X15.h>
#include "FastLED.h"

/*** Library Breakdown
 *  Adafruit_ADS1X15 - For Current Sensor
 *  FastLED - For Individually Adressable LEDs
 */

// Debug Toggle
// #define DEBUG 1

#ifdef DEBUG
  #define DEBUG_PRINT(x)  Serial.print (x)
  #define DEBUG_PRINTLN(x) Serial.println (x)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
#endif

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
 * 00 => 01 - Shower Button
 * 01 => 00 - Closet Door Switches
 * 02 => 16 - Emergency Window
 * 03 => 17 - Emergency Window
 * 04 => 18 - [Left 2nd-to-Bottom]
 * 05 => 19 - [Right 2nd-to-Bottom]
 * 06 => 20 - [Left Bottom]
 * 07 => 21 - [Right Bottom]
 * 
 ****** Analog Inputs ******
 * 00 => 15 - Main Water Tank Sensor
 * 01 => 14 - Propane Tank 1
 * 02 => 13 - Propane Tank 2
 * 03 => 12 - Shore Water Pressure
 * 04 => 11 - AC Voltage
 * 
 ****** Digital Inturrupts ******
 * 00 => 02 - Water Flow Rate
 */

/* VERSION */
#define VERSION 3

/* Water Pump State */
#define WATER_PUMP_AUTO 0
#define WATER_PUMP_MANUAL 1

/* Relay Control Modes */
#define RELAY_CTRL_AUTO 0
#define RELAY_CTRL_MANUAL 1

/* How often to send status packets */
#define SEND_STAUS_EVERY_MILLISECONDS 2000

/* Water Pressure AUto-Switch Threshold (PSI) */
#define WATER_PRESSURE_THRESHOLD 10

/* Water Flow is a Hall-Effect Sensor */
#define WATER_FLOW_PIN 2
#define FLOW_SENSOR_CALI_FACTOR 10

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
#define PROPANE_TANK_ONE 1
#define PROPANE_TANK_TWO 2
#define SHORE_WATER_PRESSURE 3
#define AC_VOLTAGE 4

/* Analog Pin-Map */
#define NUM_ANALOG 5
const int analogPins[NUM_ANALOG] = {15, 14, 13, 12, 11};

/* Digital Inputs */
#define SHOWER_BUTTON 0
#define CLOSET_DOOR_SWITCHES 1

#define NUM_INPUTS 8
const int inputPins[NUM_INPUTS] = {1, 0, 16, 17, 18, 19, 20, 21};

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
#define NUM_LEDS_0_PASS 35
#define NUM_LEDS_0_REAR 85
const int ledCount[NUM_LED_STRIPS] = {NUM_LEDS_0, NUM_LEDS_1, NUM_LEDS_2, NUM_LEDS_3};
CRGB leds0[NUM_LEDS_0];
CRGB leds1[NUM_LEDS_1];
CRGB leds2[NUM_LEDS_2];
CRGB leds3[NUM_LEDS_3];

// Dimmer Animations
// Each dimmer is has a corresponding "animation" (for fading) in this array.
// The arrays are stored as follows: {currentBrightness, desiredBrightness, stepsToAnimate}
// Shorthand Labels
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
volatile int flowFrequency = 0;

// Flow sensor variables
unsigned long flowLoopTime = millis();

void setup() {
  // Initilize Sensor (Input) Pins
  for(int i = 0; i < NUM_INPUTS; i++) { pinMode(inputPins[i], INPUT_PULLUP); }
  
  // Initilize Output (Dimmer) pins
  for(int i = 0; i < NUM_DIMMERS; i++) { pinMode(dimmerPins[i], OUTPUT); analogWrite(dimmerPins[i], 0);}
  
  // Initilize Relay pins
  for(int i = 0; i < NUM_RELAYS; i++) { pinMode(relayPins[i], OUTPUT); setRelay(i, true);}
  
  // Initlize LEDS
  FastLED.addLeds<WS2811, LED_PIN_0, BRG>(leds0, ledCount[0]);
  FastLED.addLeds<WS2811, LED_PIN_1, BRG>(leds1, ledCount[1]);
  FastLED.addLeds<WS2811, LED_PIN_2, BRG>(leds2, ledCount[2]);
  FastLED.addLeds<WS2811, LED_PIN_3, BRG>(leds3, ledCount[3]);

  // Serial Debugging
  Serial.begin(115200);

  // Communication to pi
  Serial3.begin(115200);

  // Setup Flow Sensor Inturrupt
  pinMode(WATER_FLOW_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(WATER_FLOW_PIN), measureFlow, RISING); 

  // Setup animations
  setupAnimation(FRONT_AISLE_DIMMER, 255, 2);
  setupAnimation(REAR_AISLE_DIMMER, 255, 2);

  // Setup ADS (for AC current sensor)
  ads.setGain(GAIN_FOUR);      // +/- 1.024V 1bit = 0.5mV
  ads.begin();
}

// Sensor States
float currentACCurrent = 0.0; // amps
float currentACVoltage = 0.0; // AC volts
float currentWaterPercent = 0.0; // percent
float currentPropanePressure[2] = {0.0, 0.0}; // psi
float currentWaterPressure = 0.0; // psi
float currentWaterFlow = 0.0; // gallons per minute
int lastButtonReads[] = {1, 1, 1, 1, 1, 1, 1, 1};
boolean relayStates[NUM_RELAYS] = {false, false, false, false, false, false, false, false};
int waterPumpRunState = 0;

// Track status updates
long lastStatusSent = 0;

void loop() {
  // Process digital inputs
  readDIO();

  // Get Current AC Draw
  readCurrent();

  // Read AC Voltage
  readACVoltage();

  // Read Main Tank
  readMainWater();

  // Read shore water pressure
  readShoreWaterPressure();

  // Read propane pressures
  readPropane();

  // Process the flow sensor data
  processFlow();

  // Run LEDs
  FastLED.show(); 

  // "Asyncronously" run animations, 1 "step" per loop
  runAnimations();

  // Serial Read
  doSerial();

  // If it's been the configured time since the last status message was sent, send another
  if(millis() - lastStatusSent > SEND_STAUS_EVERY_MILLISECONDS){
    sendStatus();
    lastStatusSent = millis();
  }
}

// Toggle Relay
void setRelay(int relay, boolean state) {
  // Relay is already at requested state
  if(relayStates[relay] == state) return;
  // Set to requested state
  if(state) {
    digitalWrite(relayPins[relay], HIGH);
  } else {
    digitalWrite(relayPins[relay], LOW);
  }
  // Update state
  relayStates[relay] = state;
}

// Process water pressure
void processWaterPressure() {
  // If water pump run state is auto
  if(waterPumpRunState == WATER_PUMP_AUTO) {
    setRelay(WATER_PUMP_RELAY, currentWaterPressure >= WATER_PRESSURE_THRESHOLD);
  }
}

// Read DIO pins
void readDIO() {
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
}

/* Serial bits for a "command" are in this order:
* 0 - Command Type (0 = Intensity, 1 = Color, 2 = Relay)
* 1 - Device (0 = Mosfet, 1 = Relay, 2 = LED, 3 = Digital, 4 = Analog)
* 2 - Fixture
* 3 - 0 = Off, 1 = On
* 4 - Data 1 (Intensity, Red, RelayControlMode)
* 5 - Data 2 (Green)
* 6 - Data 3 (Blue)
* ...
* 
* RelayControlMode:
* 0 = Auto
* 1 = Manual
 */
void doSerial() {
  while (Serial3.available() > 0){
    // Create a place to hold the incoming command
    static int command[7] = {0, 0, 0, 0, 0, 0, 0};
    static unsigned int commandPos = 0; 

    // Read the next available byte in the serial receive buffer
    char inByte = Serial3.read();

    // Message coming in (check not terminating character) and guard for over message size
    if ( inByte != '\n' && (commandPos < 7) ){
      
      // Add the incoming byte to our command
      command[commandPos] = inByte;
      commandPos++;
    } else {
      DEBUG_PRINT("Recieved Command: ");
      for(int i = 0; i < 7; i++) { DEBUG_PRINT(command[i]); }
      DEBUG_PRINTLN();
      
      // Start processing command
      int fixture = command[2];
      int mode = command[0];
      boolean on = command[3] == 1;
      if(mode == 0) {         // "Intensity" Command
        // If "on" we want the requested intensity, otherwise we set 0 for off
        int desired = on ? command[4] : 0;
        // Command desired fixture to go to desired intensity immediately
        setupAnimation(fixture, desired, 0);
      } else if (mode == 1) {   // "Color" Command
        processLeds(fixture, command[4], command[5], command[6], on);
      } else if (mode == 2) {   // "Relay" Command
        processRelay(fixture, on, command[4]);
      }

      //Reset for the next message
      commandPos = 0;
    }
  }
}

// Process a relay command
void processRelay(int fixture, boolean on, int ctrlMode) {
  if(fixture == WATER_PUMP_RELAY){
    if(ctrlMode == RELAY_CTRL_AUTO) {
      // We're commanding automatic control, if pressure is above threshold, enable relay
      setRelay(WATER_PUMP_RELAY, currentWaterPressure >= WATER_PRESSURE_THRESHOLD);
      // Set control state
      waterPumpRunState = WATER_PUMP_AUTO;
    } else {
      // We're commanding manual control, if toggle is 1 (on) then enable relay
      setRelay(WATER_PUMP_RELAY, on);
      // Set control state
      waterPumpRunState = WATER_PUMP_MANUAL;
    }
  } else {
    setRelay(fixture, on);
  }
}

// Process a LED command
void processLeds(int fixture, int red, int green, int blue, boolean on) {
  CRGB color = on ? CRGB(red, green, blue) : CRGB(0, 0, 0);
  if(fixture > 0 && fixture < 4) {
    CRGB leds[ledCount[fixture]] = fixture == 1 ? leds1 : fixture == 2 ? leds2 : leds3;
    for(int i = 0; i < ledCount[fixture]; i++) {
      leds[i] = color;
    }
  } else if(fixture == 0) { // First n leds are for passenger
    for(int i = 0; i < NUM_LEDS_0_PASS; i++) {
      leds0[i] = color;
    }
  } else if(fixture == 4) { // Second n leds are for rear
    for(int i = NUM_LEDS_0_PASS; i < NUM_LEDS_0_PASS + NUM_LEDS_0_REAR; i++) {
      leds0[i] = color;
    }
  }
}

// Pseudo-json
void sendStatus() {
  const long start = millis();
  Serial3.print("{\"water_percent\":");
  Serial3.print(currentWaterPercent);
  Serial3.print(",\"version\":");
  Serial3.print(VERSION);
  Serial3.print(",\"current\":");
  Serial3.print(currentACCurrent);
  Serial3.print(",\"ac_voltage\":");
  Serial3.print(currentACVoltage);
  Serial3.print(",\"propane_0\":");
  Serial3.print(currentPropanePressure[0]);
  Serial3.print(",\"propane_1\":");
  Serial3.print(currentPropanePressure[1]);
  Serial3.print(",\"shore_water_pressure\":");
  Serial3.print(currentWaterPressure);
  Serial3.print(",\"water_pump_run_state\":");
  Serial3.print(waterPumpRunState);
  Serial3.print(",\"water_flow\":");
  Serial3.print(currentWaterFlow);
  Serial3.print(",\"digital_inputs\":[");
  Serial3.print(lastButtonReads[0]);
  Serial3.print(",");
  Serial3.print(lastButtonReads[1]);
  Serial3.print(",");
  Serial3.print(lastButtonReads[2]);
  Serial3.print(",");
  Serial3.print(lastButtonReads[3]);
  Serial3.print(",");
  Serial3.print(lastButtonReads[4]);
  Serial3.print(",");
  Serial3.print(lastButtonReads[5]);
  Serial3.print(",");
  Serial3.print(lastButtonReads[6]);
  Serial3.print(",");
  Serial3.print(lastButtonReads[7]);
  Serial3.print("],\"relays\":[");
  Serial3.print(relayStates[0]);
  Serial3.print(",");
  Serial3.print(relayStates[1]);
  Serial3.print(",");
  Serial3.print(relayStates[2]);
  Serial3.print(",");
  Serial3.print(relayStates[3]);
  Serial3.print(",");
  Serial3.print(relayStates[4]);
  Serial3.print(",");
  Serial3.print(relayStates[5]);
  Serial3.print(",");
  Serial3.print(relayStates[6]);
  Serial3.print(",");
  Serial3.print(relayStates[7]);
  Serial3.print("],\"dimmers\":[");
  Serial3.print(dimmerAnimations[0][CURRENT_BRIGHTNESS]);
  Serial3.print(",");
  Serial3.print(dimmerAnimations[1][CURRENT_BRIGHTNESS]);
  Serial3.print(",");
  Serial3.print(dimmerAnimations[2][CURRENT_BRIGHTNESS]);
  Serial3.print(",");
  Serial3.print(dimmerAnimations[3][CURRENT_BRIGHTNESS]);
  Serial3.print(",");
  Serial3.print(dimmerAnimations[4][CURRENT_BRIGHTNESS]);
  Serial3.print(",");
  Serial3.print(dimmerAnimations[5][CURRENT_BRIGHTNESS]);
  Serial3.print(",");
  Serial3.print(dimmerAnimations[6][CURRENT_BRIGHTNESS]);
  Serial3.print(",");
  Serial3.print(dimmerAnimations[7][CURRENT_BRIGHTNESS]);
  Serial3.print(",");
  Serial3.print(dimmerAnimations[8][CURRENT_BRIGHTNESS]);
  Serial3.print(",");
  Serial3.print(dimmerAnimations[9][CURRENT_BRIGHTNESS]);
  Serial3.print("]}");
  Serial3.flush();
  Serial3.println(""); // Tells Pi that we're done
  
  // Debug
  DEBUG_PRINT("JSON Status Sent, Done in ");
  DEBUG_PRINT((millis() - start) / 1000.0);
  DEBUG_PRINTLN(" seconds.");
}

// Method to setup animations
void setupAnimation(int i, int desired, float animationSpeed) {
  
  // If we're requesting the brightness that is currently set, ignore
  if(desired == dimmerAnimations[i][CURRENT_BRIGHTNESS]) return;
  
  // If animation speed is 0, instantly set brightness
  if (animationSpeed == 0) {
    analogWrite(dimmerPins[i], desired);
    dimmerAnimations[i][CURRENT_BRIGHTNESS] = desired;
  // If we're lowering the brightness, but the animation speed is positive, we need to undo that
  } else if(desired < dimmerAnimations[i][CURRENT_BRIGHTNESS] && animationSpeed > 0) {
    animationSpeed = -animationSpeed;
  }

  // Update state
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
    if(delta > dimmerAnimations[i][ANIMATION_STEPS]) {
      float newBrightness = dimmerAnimations[i][CURRENT_BRIGHTNESS] + dimmerAnimations[i][ANIMATION_STEPS];
      analogWrite(dimmerPins[i], (int)newBrightness);
      dimmerAnimations[i][CURRENT_BRIGHTNESS] = newBrightness;
    
    // If delta is less than a step, just go there
    } else if (delta <= dimmerAnimations[i][ANIMATION_STEPS]) {
      analogWrite(dimmerPins[i], dimmerAnimations[i][DESIRED_BRIGHTNESS]);
      dimmerAnimations[i][CURRENT_BRIGHTNESS] = dimmerAnimations[i][DESIRED_BRIGHTNESS];
    }
  }
}

// Read AC Voltage. Not sure if this is correct, but it works....
void readACVoltage() {
  int raw = analogRead(analogPins[AC_VOLTAGE]);
  // Voltage is read as a percentage of 250vac, offset 40
  currentACVoltage = ((raw - 40) / 1000.0) * 250;
}

// Current Variables
float sum = 0;
int counter = 0;
long lastCurrentCheck = millis();

// Method to read the Current Sensor and get current AC Draw
void readCurrent() {
  float voltage;
  float current;

  if (millis() - lastCurrentCheck < 1000) {
    voltage = ads.readADC_Differential_0_1() * CS_MULTIPLIER;
    current = voltage * CS_FACTOR;

    sum += sq(current);
    counter = counter + 1;
  } else {
    currentACCurrent = sqrt(sum / counter);
    sum = 0;
    counter = 0;
    lastCurrentCheck = millis();
  }
}

// Method to read the current percentage of water in the tank. Measured as a percent of 1024
float readMainWater() {
  int raw = analogRead(analogPins[MAIN_WATER_TANK_INPUT]);
  currentWaterPercent = raw / 1024.0;
}

/* Method to read the current propane PSI. 150psi == 1024
 * Max Pressure = 150 psi
 */
float readPropane() {
  // Read Raw Values
  int raw1 = analogRead(analogPins[PROPANE_TANK_ONE]);
  int raw2 = analogRead(analogPins[PROPANE_TANK_TWO]);

  // Convert Analog to PSI (These sensor's max at 150 PSI)
  currentPropanePressure[0] = translatePressure(150, raw1);
  currentPropanePressure[1] = translatePressure(150, raw2);
}

/* Method to read the current shore water PSI
 * Max Pressure = 100psi
 */
float readShoreWaterPressure() {
  // Read Pressure
  int raw = analogRead(analogPins[SHORE_WATER_PRESSURE]);

  // Convert Analog to PSI (This sensor's max is 100psi)
  currentWaterPressure = translatePressure(100, raw);
}

// Water flow interrupt function
void measureFlow () {
   flowFrequency++;
}

// Process flow pulses
void processFlow() {
  // Calculate GPM every second
  if(millis() >= flowLoopTime + 1000) {    
    // Disable the interrupt while calculating flow rate
    detachInterrupt(digitalPinToInterrupt(WATER_FLOW_PIN));

    // Because this loop may not complete in exactly 1 second intervals we calculate the number of milliseconds that have passed 
    // since the last execution and use that to scale the output. We also apply the calibration factor to scale the output based 
    // on the number of pulses per second per units of measure (litres/minute) coming from the sensor.
    currentWaterFlow = ((1000.0 / (millis() - flowLoopTime)) * flowFrequency) / FLOW_SENSOR_CALI_FACTOR; // Liters per minute

    // Convert to freedom units (1 lmp == ~0.2642 gpm)
    currentWaterFlow = currentWaterFlow * 0.2642;

    // Reset the counter
    flowFrequency = 0;

    // Reattach innturrupt to start counting again
    attachInterrupt(digitalPinToInterrupt(WATER_FLOW_PIN), measureFlow, RISING); 
  }
}

/* Analog Pressure Sensor Analog Translation
 *  The operating voltage of these Amazon sensors is 0.5v to 4.5v
 *  Translated to analog values, thats 102.4 to 921.6
 */
float translatePressure(int maxPsi, int raw) {
  // Constants
  const float zeroReading = 102.4; // Analog Reading @ 0 psi
  const float maxReading = 921.6; // Analog Reading @ Max psi
  
  // Translate our raw analog reading to PSI
  float calc = ((raw - zeroReading) * maxPsi) / (maxReading - zeroReading);

  // Ensure value doesn't read below 0
  if(calc < 0) { calc = 0.0; }

  // Return
  return calc;
}
