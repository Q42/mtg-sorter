

#include <Adafruit_NeoPixel.h>
#include <Stepper.h>
#include <ESP32Servo.h>
#include <Shell.h>

#define STEPS_PER_REV     200

#define PIN_VAC_PUMP      19

// Create the Neopixel indicator
Adafruit_NeoPixel neoIndicator( 1, 0, NEO_GRB + NEO_KHZ800);

// Create the steppers
Stepper stepperPlate( STEPS_PER_REV, 15, 33, 27, 12 );
Stepper stepperArm( STEPS_PER_REV, 22, 20, 14, 32 );

ESP32PWM servoEnd;


typedef struct sShellArgToken
{
    const char *pcszToken;
    long        lValue;
} sShellArgToken;


int cmd_help( int argc, char** argv  )
{
  if( argc == 1 )
  {
    shell_print_commands();
  }
  else if( argc == 2 )
  {
    shell_print_command_help( argv[1] );
  }
  else
  {
    return SHELL_RET_FAILURE;
  }

  return SHELL_RET_SUCCESS;
}


shell_command_entry     sHelpCommand =
{
    "help",
    cmd_help,
    "help or ? - Display help information.",
    "Usage: help [command]\r\n"
    "Arguments: command - [Optional] display more details about the specified command",
    NULL
};

shell_command_entry     sHelpShortcut =
{
    "?",
    cmd_help,
    NULL,
    NULL,
    NULL
};



static int cmd_vac_pump( int argc, char** argv  );



/******************************************************************************
 * Local data
 *****************************************************************************/
shell_command_entry     sPumpCommand =
{
    "vac",
    cmd_vac_pump,
    "vac - Control the vacuum pump.",
    "Usage: vac <state>\r\n"
    "Arguments: state - Pump state, either 0 or 1",
    NULL
};



void setup()
{
  Serial.begin(115200);
  Serial.println("Stepper test!");

  neoIndicator.begin();
  stepperPlate.setSpeed(30);
  stepperArm.setSpeed(60);

  ESP32PWM::allocateTimer(0);
  servoEnd.attachPin( 21, 50, 10 ); // 50Hz 10 bits

  pinMode( PIN_VAC_PUMP, OUTPUT );
  digitalWrite( PIN_VAC_PUMP, HIGH );    // Active Low

  shell_init(shell_reader, shell_writer, 0);

  shell_register_command( &sHelpCommand );
  shell_register_command( &sHelpShortcut );
  shell_register_command( &sPumpCommand );
}

void loop()
{
  shell_task();

#if 0
  neoIndicator.setPixelColor(0, neoIndicator.Color(0, 150, 0));
  neoIndicator.show();
  Serial.println( "Forward" );
  stepperPlate.step( STEPS_PER_REV );
  stepperArm.step( STEPS_PER_REV );

  neoIndicator.setPixelColor(0, neoIndicator.Color(0, 0, 150));
  neoIndicator.show();
  Serial.println( "Backward" );
  stepperPlate.step( -STEPS_PER_REV );
  stepperArm.step( -STEPS_PER_REV );
#endif
}

/**
 * Function to read data from serial port
 * Functions to read from physical media should use this prototype:
 * int my_reader_function(char * data)
 */
int shell_reader(char * data)
{
  // Wrapper for Serial.read() method
  if (Serial.available()) {
    *data = Serial.read();
    return 1;
  }
  return 0;
}

/**
 * Function to write data to serial port
 * Functions to write to physical media should use this prototype:
 * void my_writer_function(char data)
 */
void shell_writer(char data)
{
  // Wrapper for Serial.write() method
  Serial.write(data);
}



int cmd_vac_pump( int argc, char** argv  )
{
    uint8_t     u8PumpVal = 0;


    if( argc != 2 )
    {
        shell_println(" Command: vac <state>");

        // print usage info
        return SHELL_RET_SUCCESS;
    }

        // Get value to write
    u8PumpVal = (uint8_t)lEvaluateArg( argv[1], 0, 1, NULL );
    if( errno )
    {
        shell_printf( " Error: \'%s\' not understood. Expecting a pump state, either 0 or 1.", argv[1] );
        return SHELL_RET_FAILURE;
    }

    digitalWrite(PIN_VAC_PUMP, !u8PumpVal);   // active LOW

    return SHELL_RET_SUCCESS;
}


/******************************************************************************
 * Global functions
 *****************************************************************************/
long lEvaluateArg( const char *pszArg, long lMin, long lMax, const sShellArgToken *pArgTokens )
{
    char    *pszEnd;
    long    lVal;


    errno = 0;
    lVal = strtol( pszArg, &pszEnd, 0 );

    if( errno )
    {       // Should be ERANGE due to number being outwith LONG_MIN - LONG_MAX
        return 0;
    }

    if( pszEnd == pszArg )
    {       // When end pointer is same as input, no conversion happened.
        if( pArgTokens )
        {
                // Check for matching string token
            for(; pArgTokens->pcszToken != NULL; pArgTokens++ )
            {
                if( strcasecmp( pszArg, pArgTokens->pcszToken ) == 0 )
                {
                    return pArgTokens->lValue;
                }
            }
        }

        errno = ENOMSG;
        return 0;
    }

    if( (lMin || lMax) &&       // No range check performed if lMin and lMax = 0
        ((lVal < lMin) || (lVal > lMax)))
    {
        errno = ERANGE;
        return 0;
    }

    return lVal;
}

long lEvaluateArgPrompt( const char *pszArg, long lMin, long lMax, const sShellArgToken *pArgTokens )
{
    long    lVal = lEvaluateArg( pszArg, lMin, lMax, pArgTokens );

    if( errno )
    {
        shell_printf( " Error: \'%s\' not understood.", pszArg );

        if( pArgTokens )
        {
            shell_print( " Expecting one of: " );

            for(; pArgTokens->pcszToken != NULL; pArgTokens++ )
            {
                shell_print( pArgTokens->pcszToken );

                if( (pArgTokens+1)->pcszToken )
                {
                    shell_print( ", " );
                }
                else
                {
                    shell_println( "." );
                }
            }
        }
        else
        {
            shell_printf( " Expecting a number between %d and %d.\r\n", lMin, lMax );
        }
    }

    return lVal;
}
