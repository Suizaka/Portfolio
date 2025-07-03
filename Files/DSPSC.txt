#define F_CPU 16000000UL
#include <avr/io.h>
#include <util/delay.h>
#include <string.h>

// LCD Pins (PORTA)
#define LCD_RS PA0
#define LCD_RW PA1
#define LCD_EN PA2
#define LCD_D4 PA3
#define LCD_D5 PA4
#define LCD_D6 PA5
#define LCD_D7 PA6

// LED & Buzzer (PORTC)
#define GREEN_LED PC0
#define RED_LED PC1  // Red LED & Buzzer both at PC1

// Correct Password
const char correct_password[] = "1234";
uint8_t wrong_attempts = 0; // Counter for wrong password attempts

// Keypad Mapping (PORTD)
const char keypad[4][4] = {
	{'1', '2', '3', 'A'},
	{'4', '5', '6', 'B'},
	{'7', '8', '9', 'C'},
	{'*', '0', '#', 'D'}
};

// LCD Command Function
void LCD_Command(uint8_t cmd) {
	PORTA = (PORTA & 0x87) | ((cmd & 0xF0) >> 1);
	PORTA &= ~(1 << LCD_RS);
	PORTA &= ~(1 << LCD_RW);
	PORTA |= (1 << LCD_EN);
	_delay_us(1);
	PORTA &= ~(1 << LCD_EN);
	_delay_us(100); // Ensure proper command execution

	PORTA = (PORTA & 0x87) | ((cmd << 3) & 0x78);
	PORTA |= (1 << LCD_EN);
	_delay_us(1);
	PORTA &= ~(1 << LCD_EN);
	_delay_ms(2);
}

// LCD Character Function
void LCD_Char(uint8_t data) {
	PORTA = (PORTA & 0x87) | ((data & 0xF0) >> 1);
	PORTA |= (1 << LCD_RS);
	PORTA &= ~(1 << LCD_RW);
	PORTA |= (1 << LCD_EN);
	_delay_us(1);
	PORTA &= ~(1 << LCD_EN);
	_delay_us(100);

	PORTA = (PORTA & 0x87) | ((data << 3) & 0x78);
	PORTA |= (1 << LCD_EN);
	_delay_us(1);
	PORTA &= ~(1 << LCD_EN);
	_delay_ms(2);
}

// LCD Initialization
void LCD_Init(void) {
	DDRA |= 0x7F; // Set PA0-PA6 as output
	_delay_ms(50);
	LCD_Command(0x33);
	LCD_Command(0x32);
	LCD_Command(0x28);
	LCD_Command(0x0C);
	LCD_Command(0x06);
	LCD_Command(0x01);
}

// Display a String on LCD
void LCD_String(const char *str) {
	while (*str) {
		LCD_Char(*str++);
	}
}

// Keypad Scanning Function (Port D)
char getKey(void) {
	DDRD = 0xF0;  // PD4-PD7 as outputs (Columns), PD0-PD3 as inputs (Rows)
	PORTD = 0xFF; // Enable internal pull-ups

	for (uint8_t col = 0; col < 4; col++) {
		PORTD = ~(1 << (col + 4)); // Set one column LOW
		_delay_us(10); // Short debounce

		uint8_t rowState = PIND & 0x0F;   // Read row state
		if (rowState != 0x0F) {           // If a key is pressed
			for (uint8_t row = 0; row < 4; row++) {
				if (!(rowState & (1 << row))) { // Check which row is LOW
					_delay_ms(30); // Small debounce
					while (!(PIND & (1 << row))); // Wait for key release
					return keypad[row][col]; // Return pressed key
				}
			}
		}
	}
	return '\0'; // No key pressed
}

// Main Function
int main(void) {
	char entered_password[5] = ""; // To store entered password (4 chars + null terminator)
	uint8_t index = 0;

	DDRC |= (1 << GREEN_LED) | (1 << RED_LED); // Set PC0, PC1 as output
	PORTC &= ~((1 << GREEN_LED) | (1 << RED_LED)); // Ensure all OFF initially

	LCD_Init();

	// Display "Hello"
	LCD_Command(0x80);
	LCD_String("Hello!");
	_delay_ms(100); // Short delay for visibility

	// Display "Please Enter Key"
	LCD_Command(0x01); // Clear LCD
	LCD_String("Enter Key");

	while (1) {
		char key = getKey();
		if (key != '\0') {  // If a key is detected
			if (index < 4) { // Only accept 4 digits
				LCD_Command(0xC0 + index); // Move cursor to second line
				LCD_Char(key); // Display the key on LCD
				entered_password[index++] = key;
			}

			if (index == 4) { // After 4 digits entered
				entered_password[4] = '\0'; // Null terminate the string

				if (strcmp(entered_password, correct_password) == 0) {
					PORTC |= (1 << GREEN_LED); // Turn ON Green LED
					LCD_Command(0x01); // Clear LCD
					LCD_String("Access");
					LCD_Command(0xC0);
					LCD_String("Granted");

					_delay_ms(500); // Visible LED time
					PORTC &= ~(1 << GREEN_LED); // Turn OFF LED
					wrong_attempts = 0; // Reset wrong attempts

					} else {
					wrong_attempts++; // Increment wrong attempt count
					LCD_Command(0x01); // Clear LCD
					LCD_String("Access Denied");

					if (wrong_attempts >= 3) { // If 3 wrong attempts
						PORTC |= (1 << RED_LED); // Turn ON Red LED (PC1) & Buzzer
						_delay_ms(500); // Buzzer & LED ON for 100ms
						PORTC &= ~(1 << RED_LED); // Turn OFF Red LED & Buzzer
					}
				}

				_delay_ms(100); // Hold message for a moment
				index = 0; // Reset index for new input
				LCD_Command(0x01); // Clear LCD
				LCD_String("Enter Key");
			}
		}
	}
}