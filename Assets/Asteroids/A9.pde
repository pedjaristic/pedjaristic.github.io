//Pedja Ristic//

//Instructions

//Defend the earth by moving your mouse left to right and shooting your laser to destroy the asteroids before
//they reach earth!

//MOUSE TO MOVE, CLICK TO SHOOT, ENJOY!


//initialise score variable
int score; //score variable
int astSize = 75; //size of asteroids
boolean shoot = false; //if shot is fired

//Initialise gameOver variable
int gameOver = 0;

float speed = 2;

//int startGame;
int randomX()

// score;
{
  return int(random(600));
}

//random location of asteroids each time
int[] astx = { randomX(), randomX(), randomX(), randomX(), randomX()}; 
//asteroids always start at the top
int[] asty = {0, 0, 0, 0, 0};

//assign image names
PImage ast;
PImage earth;
PImage ship;

void setup() {
  //Size
  size (900, 700);
  imageMode(CENTER);
  noCursor();
  textSize(20);
  
  //load images
  ast = loadImage("asteroid.png");
  earth = loadImage("Earth.png");
  ship = loadImage("spaceship.png");
  
}

void draw() {

  background (0);
  fill(255);
  stroke (255);
  
  stars(); //stars in space
  
  difficulty(); // increaes speed of asteroids
  
  image(ship,mouseX, 500, 70,70); //spaceshipp image, follow mousx, y is fixed
  
  // display score
  fill(255);
  text(score, 20, 20);
  
  //calls the laser shot and makes it go to the ships location
  if (shoot) {
    cannon(mouseX); 
    shoot = false;
  }
  
  image(earth,width/2,height+300,1200,900); //earth image
  astFalling(); //runs the asteroids
  gameFinish(); // runs end of game if asteroids reach earth

}
  
  
//Play the game
void mousePressed() {

  shoot = true; //the laser shot
}

void astFalling()
{ 
  for (int i = 0; i < 5; i++) { //5 asteroids on screen looped, the array changes their locations

    image(ast, astx[i], asty[i]+=speed, astSize, astSize); //the asteroids, the +=2 controls speed
  }
}

void cannon(int shotX){
  
  boolean strike = false; //you haven't hit one yet
  //5 asteroids on screen at once, adds one if one is destroyed
  for (int i = 0; i < 5; i++){ 
    
    //if you hit an asteroid
    if ((shotX >= (astx[i]-astSize/2)) && (shotX <= (astx[i]+astSize/2))) {
      strike = true;
      
      fill(#F02929);
      stroke(#F02929);
      strokeWeight(6);
      line(mouseX, 500, mouseX, asty[i]); //too lazy to make projectile...so here's a line instead
      noStroke();
      ellipse(mouseX,470,20,20); //muzzle flash of lazer shot
      fill(255);
      ellipse(astx[i], asty[i], astSize+25, astSize+25); //explosion when hit asteroid
      astx[i] = randomX(); //new asteroid appears at random x location
      asty[i] = 0; //new asteroid appears at top always


      // update score when hit
      score++;
      
    }
  }

  if (strike == false){
    fill(#F02929);
    strokeWeight(6);
    stroke(#F02929);
    ellipse(mouseX,470,20,20); //muzzle flash of lazer shot
    line(mouseX, 500, mouseX, 0); //if you miss a laser line still appears
  }
}


//GameOver
void gameFinish(){
  
  for (int i=0; i< 5; i++){
    
    if (asty[i]==630){ //if asteroids get to earth you lose

      fill(color(255, 0, 0));
      fill(255, 0, 0);
      textAlign(CENTER);
      textSize(30);
      text("Mission Failed: ", width/2, height/2);
      text(score, width/2, height/2 + 50);

      noLoop(); //stops the game when asteroids reach earth
    }
  }
}

void stars() {
  // add random stars
for (int i = 0; i < 100; i++) {
  stroke(255);
  float starx = random(0, width);
  float stary = random(0, height);
  strokeWeight(random(0, 3));
  point(starx,stary);
  
}
}

//asteroids get faster as you progress, increases difficulty
void difficulty() {
  if (score > 25) {
    speed = 3;
  }
  else if (score > 60) {
     speed = 4;
  }
}

