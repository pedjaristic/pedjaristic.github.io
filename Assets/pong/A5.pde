//Peda Ristic

//Instructions
//click to start
//move mouse up and down to move paddle
//click to pause
//move mouse left to decrease difficulty (aka speed of ball)
//move mouse right to increase difficulty (aka speed of ball)

//Global Variables
boolean gameStart = false; //unpauses game

float x = 365;
float y = 150;
float speedX = 3;
float speedY = 3;
int rectSize = 100;
float diamHit; //colour flash when hit


void setup() {
  size(500, 500);
  noStroke();
  ellipseMode(CENTER);
}

void draw() {
  background(#FFFFFF);

  //ball
  fill(#8B8B8B);
  ellipse(x, y, 20, 20);

  //speedbar
  fill(#8B8B8B);
  noStroke();
  float bar = map(mouseX, 0, -width, 0, 99);
  rect(155, 10, -bar, 10);

  //paddle and wall
  fill(#D84848);
  rect(0, 0, 20, height);
  fill(#5ED2E8);
  rect(width-30, mouseY-rectSize/2, 10, rectSize);


  if (gameStart) {

    x = x + speedX*mouseX/100;//speed of x increases with mouseX
    y = y + speedY*mouseX/100;//^same thing but with Y

    // if ball hits movable bar, invert X direction and apply effects
    if ( x > width-30 && x < width -20 && y > mouseY-rectSize/2 && y < mouseY+rectSize/2 ) {
      speedX = speedX * -1;
      x = x + speedX;
      fill(#5ED2E8);
      diamHit = random(75, 150);
      ellipse(x, y, diamHit, diamHit); //when ball hits paddle, blue circle flash
    }

    // if ball hits wall, change direction of X
    else if (x < 25) {
      speedX = speedX * -1;
      x = x + speedX;
      fill(#D84848);
      diamHit = random(75, 150);
      ellipse(x, y, diamHit, diamHit);//when ball hits wall, red circle flash
    }

    // resets things if you lose
    if (x > width) {
      gameStart = false;
      x = 365;
      y = mouseY;
      speedX = 3;
      speedY = 3;
      rectSize = 100;
    }


    // if ball hits up or down, change direction of Y  
    if ( y > height || y < 0 ) {
      speedY = speedY * -1;
      y = y + speedY;
    }
  }
}
void mousePressed() {
  gameStart = !gameStart; //click to pause the game
}


