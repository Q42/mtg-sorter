

#include <Adafruit_NeoPixel.h>

#include <Stepper.h>



#define STEPS_PER_REV     200


// Create the Neopixel indicator
Adafruit_NeoPixel neoIndicator( 1, 0, NEO_GRB + NEO_KHZ800);

// Create the steppers
Stepper stepperPlate( STEPS_PER_REV, 15, 33, 27, 12 );
Stepper stepperArm( STEPS_PER_REV, 22, 20, 14, 32 );

int stepCount = 0;  // number of steps the motor has taken


void setup()
{
  Serial.begin(115200);
  Serial.println("Stepper test!");

  neoIndicator.begin();
  stepperPlate.setSpeed(30);
  stepperArm.setSpeed(30);
}


void loop()
{
  if (Serial.available() > 0) {  
    String receivedString = "";
    while (Serial.available() > 0) {
      receivedString += char(Serial.read ());
    }
    Serial.println(receivedString);
    if(receivedString == "1") {
      neoIndicator.setPixelColor(0, neoIndicator.Color(0, 150, 0));
      neoIndicator.show();
      Serial.println( "Forward" );
      stepperPlate.step( STEPS_PER_REV );
    }
    else if (receivedString == "2") {
      neoIndicator.setPixelColor(0, neoIndicator.Color(0, 0, 150));
      neoIndicator.show();
      Serial.println( "Backward" );
      stepperPlate.step( -STEPS_PER_REV );
    }
  }
}
