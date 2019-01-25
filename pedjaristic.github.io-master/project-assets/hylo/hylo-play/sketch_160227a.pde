//import ddf.minim.*;
//import ddf.minim.signals.*;
//import ddf.minim.*;
//import ddf.minim.effects.*;

//Minim minim;
//AudioPlayer mysound;
//AudioMetaData meta;

PImage bg;

float position = 0;
float speed = 50;
float ell_size = 300;
float velocity = position+speed;
int y = 0;
int points = 0;
color c;

color[] colarray = new color[3];

color bottomElipseColor = color(255,99);
color topElipseColor = color(255,99);

Ball mainBall;
Block[] blocks;

void setup() {

  size(1000, 1778);
//  size(100, 450);
  //background(255);
  colorMode(RGB);
  
  bg = loadImage("background.png");
  
  
//  minim = new Minim(this);
//  mysound = minim.loadFile("Mangata.mp3", 300);
//  meta = mysound.getMetaData();
//  mysound.loop();
  
  int col;
  
  colarray[0] = #b0fff5;
  colarray[1] = #c2bdee;
  colarray[2] = #ffcdb8;
  
  topElipseColor = colarray[(int)random(0,3)];

  mainBall = new Ball(width/2, height-150, color(255, 0, 0));
  blocks = new Block[6];
  for (int i = 0; i < blocks.length; i++) {
    col = colarray[(int)random(0,3)];
    blocks[i] = new Block(int(random(10)+5), width/2-200, i*130+550, col);
  }
}

void draw() {
  
  //scale(0.4);
  background(0);
  tint(255, 240);
  image(bg,0,0);
  fill(255, 130);
  textSize(150);
  text(points,width/2-55,height/2);
  noStroke();
  if (mainBall.isAtTop()) {
    if (bottomElipseColor == color(255,99)) {
      //set color
      bottomElipseColor = colarray[(int)random(0,3)];
      topElipseColor = color(255,99);
    } else {
      // do nothing
    }
  } else if (mainBall.isAtBottom()) {
    if (topElipseColor == color(255,99)) {
      //set color
      topElipseColor = colarray[(int)random(0,3)];
      bottomElipseColor = color(255,99);
    } else {
      // do nothing
    }
  }
  fill(topElipseColor);
  ellipse(width/2, 140, 150, 150);
  fill(bottomElipseColor);
  ellipse(width/2, height-148, 150, 150);
  
  // step();
  mainBall.draw();
  mainBall.step();
  color targetColor = topElipseColor;
  if (targetColor == color(255,99)){
    targetColor = bottomElipseColor;
  }
  for (int i = 0; i < blocks.length; i++) {
    blocks[i].draw();
    blocks[i].step();
   
    if (blocks[i].intersects(mainBall)) {
      if (targetColor == blocks[i].c) {
         
       //SOMETHING HAPPENS HERE WHEN IT HITS A SUCCESSFUL BLOCK
       //onlly 1 frame for some reason
      
      //for (int f = 0; f < 6; f++) {  
        //fill(blocks[i].c, 150);
        //ellipse(random(mainBall.x/(f+1),mainBall.x*f),mainBall.y, 30, 30);
      //}
      
        blocks[i].x = -500;
        blocks[i].c = colarray[(int)random(0,3)];
        
        
        
        // Do something with the block
        // Move the block offscreen

        points = points += 1;
      } else {
         mainBall.reset();
         points = 0;
      }
    }
  }
  
}

//void stop(){
//
//  mysound.close();
//  minim.stop();
//  
//  super.stop();
//
//}

//color getRandomColor

void mousePressed() {
  mainBall.startMoving();
  //println("click");
}

//void step()
//{
//  position=(position+speed);
//  ellipse(512,position,100,100);
//}
class Ball {
  
 int x;
 int y;
 color c;
 boolean up;
 boolean moving;
 
 Ball(int startx, int starty, color startc) {
  x = startx;
  y = starty;
  c = startc;
  up = true;
  moving = false;
 }
 
 void draw(){
  fill(255);
  noStroke();
  ellipse(x,y,35,35);
 
    for (int i = 0; i < 5; i++){
   if (up && moving){
     fill(255, 200/(i+1));
   ellipse(x, (y+40) + i*20, 15, 15);
   }
   else if (moving){
     fill(255, 200/(i+1));
    ellipse(x, (y-40) - i*20, 15, 15); 
   }
  }
 
  
 }
 
 boolean isGoingDown() {
   return up == false;
 }
 
 boolean isAtTop() {
   if ( y < 150) {
     return true;
   } else{
     return false;
   }
 }
 
 boolean isAtBottom() {
   
   if ( y > height-150) {
     return true;
   } else{
     return false;
   }
   
 }
 
 int generateNextIncrement() {
   int distanceToDest = 0;
   if (up) {
     distanceToDest = abs(y - 150);
   } else {
     distanceToDest = abs(y - (height - 150));
   }
    return int(40 - 15 * float(height - distanceToDest) / height);
 }
 
 void step(){
   if (moving) {
     if (up) {
       y -= generateNextIncrement();
     } else {
       y += generateNextIncrement();
     }
   }
   
   if (up && y <= 150) {
     moving = false;
     up = false;
   } else if (isGoingDown() && y >= height-150) {
     moving = false;
     up = true;
   }
   
 }
 
 void startMoving() {
   moving = true; 
 }
 
 void reset() {
   
   if (isGoingDown()) {
    y = 140;
   up = false;
  moving = false; 
   }
   
  else { 
   y=height-148;
   up = true;
   moving = false;
   
  }
   
 }
  
}
class Block {
  
 int x;
 int y;
 color c;
 boolean left;
 int speed;
 int trail = 0;
 
 Block(int startSpeed, int startx, int starty, color startc) {
  x = startx;
  y = starty;
  c = startc;
  speed = startSpeed;
  left = true;
 }
 
 void draw(){
  fill(c);
  noStroke();
  rect(x,y,100,30, 10);
 
  for (int i = 0; i < 20; i++){
   if (isGoingRight()){
     fill(c, 70-5*i);
   rect(x - i*10, y, 70, 30, 10);
   }
   else{
     fill(c, 70-5*i);
    rect(x + i*10, y, 70, 30, 10); 
   }
  }

 }
 
 boolean isGoingRight() {
   return left == false;
 }
 
 void step(){
 
     if (left) {
       x -= speed;
     } else {
       x += speed;
     }
   
   
   if (left && x < -200) {
   
     left = false;
   } else if (isGoingRight() && x > width+200) {
   
     left = true;
   }
   
 }
 
 boolean sameColor(Ball aBall) {
  if (c == aBall.c) return true;
 else return false; 
 }
 
 boolean intersects(Ball aBall) {
   int ballCenterX = 35/2+aBall.x;
   int ballCenterY = 35/2+aBall.y;
   
   if (ballCenterX > x && ballCenterX < x+100 && ballCenterY > y && ballCenterY < y+100){
     return true;
     
   }else {
     return false;
   }
   
 }
  
}

