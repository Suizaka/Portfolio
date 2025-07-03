//define pins
const int trigpin=9;
const int echopin=10;
const int buzzer=11;
const int ledpin=12;

//define variables
long duration;
int distance;
int safeDistance;

void setup(){
  pinMode(trigpin, OUTPUT);
  pinMode(echopin, INPUT);
  pinMode(buzzer, OUTPUT);
  pinMode(ledpin, OUTPUT);
  Serial.begin(9600);
}

void loop(){
  //Clears the trigpin
  digitalWrite(trigpin, LOW);
  delayMicroseconds(2);

  //Sets the trigpin on HIGH state for 10 micro seconds
  digitalWrite(trigpin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigpin, LOW);

  //Sets the echopin, returns the sound wave travel time in microseconds
  duration=pulseIn(echopin, HIGH);

  //Calculating the ditance
  distance=duration*0.0099/2;  //change the value 0.0099 so as to chnge the measurable distance

  safeDistance = distance;
  if(safeDistance<=5){
    digitalWrite(buzzer, HIGH);
    digitalWrite(ledpin,HIGH);
  }
  else{
    digitalWrite(buzzer,LOW);
    digitalWrite(ledpin, LOW);
  }
}