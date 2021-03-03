// Globals
let canvas = {
  e: null, // Canvas element

  w: null, // Canvas width
  h: null, // Canvas height
};

let key = {
  shift: 16,
  space: 32,
};

let mouseMemory = {
  firstWallPos: null,
  continue: false,
};

let debug = {
  drawWalls: false,
  drawMouse: false,
};

let colors = {};

let walls = [];

let mouseAction = `none`;

// Classes
class Vector2 {
  constructor (x, y) {
    this.x = x;
    this.y = y;
  }

  static fromMouse () {
    return new Vector2(mouseX, mouseY);
  }

  static Zero () {
    return new Vector2(0, 0);
  }

  copy () {
    return new Vector2(this.x, this.y);
  }

  getCoords () {
    return [this.x, this.y];
  }

  isWithin (other) {
    if (other instanceof LineSegment) {
      return (
        this.x < Math.max(other.p1.x, other.p2.x) && this.x > Math.min(other.p1.x, other.p2.x) &&
        this.y < Math.max(other.p1.y, other.p2.y) && this.y > Math.min(other.p1.y, other.p2.y)
      );
    } else console.error(`Don't know how to handle this "other" type.`);
  }

  getAnglesToVertices () {
    let vertices = getAllVertices();

    let angles = [];
    for (let vertex of vertices) {
      let angle = Math.atan2(vertex.y - this.y, vertex.x - this.x);

      angles.push(angle - 0.00001, angle, angle + 0.00001);
    }

    return angles.sort((a, b) => a - b);
  }

  getRaysToVertices () {
    let angles = this.getAnglesToVertices();

    angles = angles.map(angle => {
      let dx = Math.cos(angle);
      let dy = Math.sin(angle);

      return new LineSegment(this, new Vector2(this.x + dx, this.y + dy));
    });

    return angles;
  }
}

class LineSegment {
  constructor (p1, p2) {
    // p1: Vector2
    // p2: Vector2

    // Type Checking
    if (!p1 instanceof Vector2) console.error(`Supplied "p1" should be Vector2.`);
    if (!p2 instanceof Vector2) console.error(`Supplied "p2" should be Vector2.`);

    // Value Setting
    this.p1 = p1;
    this.p2 = p2;

    // Default
    this.doDraw = true;
  }

  static fromCoords (x1, y1, x2, y2) {
    // Creates a new LineSegment from 4 coordinates. 
    
    return new LineSegment(
      new Vector2(x1, y1),
      new Vector2(x2, y2)
    );
  }

  dontDraw () {
    this.doDraw = false;

    return this;
  }

  draw () {
    if (this.doDraw) line(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
  }

  getCollision (other) {
    if (other instanceof LineSegment) {
      // Ray (this one) variables.
      let rpx = this.p1.x;
      let rpy = this.p1.y;
      let rdx = this.p2.x - this.p1.x;
      let rdy = this.p2.y - this.p1.y;

      // LineSegment (other one) variables.
      let spx = other.p1.x;
      let spy = other.p1.y;
      let sdx = other.p2.x - other.p1.x;
      let sdy = other.p2.y - other.p1.y;

      // If parallel, no intersect.
      let rm = Math.sqrt(rdx * rdx + rdy * rdy);
      let sm = Math.sqrt(sdx * sdx + sdy * sdy);
      if (rdx / rm === sdx / sm && rdy / rm === sdy / sm) return null;

      // Solve for T1 & T2
      let T2 = (rdx * (spy - rpy) + rdy * (rpx - spx)) / (sdx * rdy - sdy * rdx);
      let T1 = (spx + sdx * T2 - rpx) / rdx;

      // Final checking to see if intersection actually exists on the other LineSegment.
      if (T1 < 0) return null;
      if (T2 < 0 || T2 > 1) return null;

      return { point: new Vector2(rpx + rdx * T1, rpy + rdy * T1), mag: T1 };
    } else console.error(`Can't get collision for that type and LineSegment!`);
  }

  calculateClosestCollision () {
    // With this LineSegment acting as a ray, returns the closest intersection point.
    // If there is none, returns null.
    
    let results = [];
    for (let wall of walls) {
      const result = this.getCollision(wall);

      if (result !== null) results.push(result);
    }

    if (results.length > 0) {
      const result = results.sort((a, b) => a.mag - b.mag)[0].point;

      return result;
    } else return null;
  }
}

// p5 Functions
function setup () {
  // Canvas
  canvas.e = createCanvas();
  canvas.e.parent(`canvas`);
  windowResized();

  // Variables
  colors = {
    black: color(0),
    gray: color(128),
    white: color(255),

    green: color(0, 255, 0),
    blue: color(0, 0, 255),
    red: color(255, 0, 0),
  };

  importWalls(`[{"p1":{"x":694,"y":53},"p2":{"x":649,"y":65}},{"p1":{"x":649,"y":65},"p2":{"x":698,"y":82}},{"p1":{"x":698,"y":82},"p2":{"x":694,"y":53}},{"p1":{"x":811,"y":121},"p2":{"x":812,"y":222}},{"p1":{"x":812,"y":222},"p2":{"x":902,"y":280}},{"p1":{"x":902,"y":280},"p2":{"x":900,"y":42}},{"p1":{"x":900,"y":42},"p2":{"x":811,"y":121}},{"p1":{"x":68,"y":415},"p2":{"x":155,"y":521}},{"p1":{"x":155,"y":521},"p2":{"x":272,"y":421}},{"p1":{"x":272,"y":421},"p2":{"x":329,"y":417}},{"p1":{"x":329,"y":417},"p2":{"x":259,"y":358}},{"p1":{"x":259,"y":358},"p2":{"x":68,"y":415}},{"p1":{"x":78,"y":137},"p2":{"x":179,"y":256}},{"p1":{"x":179,"y":256},"p2":{"x":253,"y":22}},{"p1":{"x":253,"y":22},"p2":{"x":27,"y":132}},{"p1":{"x":27,"y":132},"p2":{"x":78,"y":137}},{"p1":{"x":713,"y":508},"p2":{"x":790,"y":384}},{"p1":{"x":790,"y":384},"p2":{"x":985,"y":381}},{"p1":{"x":985,"y":381},"p2":{"x":909,"y":500}},{"p1":{"x":909,"y":500},"p2":{"x":713,"y":508}},{"p1":{"x":421,"y":549},"p2":{"x":426,"y":514}},{"p1":{"x":426,"y":514},"p2":{"x":461,"y":510}},{"p1":{"x":461,"y":510},"p2":{"x":476,"y":449}},{"p1":{"x":476,"y":449},"p2":{"x":419,"y":442}},{"p1":{"x":419,"y":442},"p2":{"x":553,"y":416}},{"p1":{"x":553,"y":416},"p2":{"x":493,"y":480}},{"p1":{"x":493,"y":480},"p2":{"x":545,"y":513}},{"p1":{"x":545,"y":513},"p2":{"x":488,"y":573}},{"p1":{"x":488,"y":573},"p2":{"x":471,"y":538}},{"p1":{"x":471,"y":538},"p2":{"x":421,"y":549}}]`);
}

function draw () {
  // Clearing
  background(colors.black);

  // Drawing
  drawRaycasts(); // Do all of the raycasting magic.
  drawCurrentWall(); // Draw the wall the user is currently making.

  // Debug Drawing
  if (debug.drawMouse) drawMouse(); // Draw the mouse position.
  if (debug.drawWalls) drawWalls(); // Draw the walls.
}

function mouseClicked () {
  const mousePos = Vector2.fromMouse();


  const screen = new LineSegment( Vector2.Zero(), new Vector2(canvas.w, canvas.h) );
  if (mousePos.isWithin(screen)) {
    // Makes sure the mouse is actually within the canvas.

    if (mouseAction === `none`) {
      // The user wasn't doing anything, but now they're drawing walls.
  
      mouseAction = `draw`; // Change the mouse action.
      mouseMemory.firstWallPos = mousePos.copy(); // Copy mouse position into memory as the first wall position.
      mouseMemory.veryFirstWallPos = mousePos.copy(); // Copy mouse position into memory as the very first wall position.
    } else if (mouseAction === `draw`) {
      // The user was drawing a wall, let's let them finish it.

      if (keyIsDown(key.shift)) {
        // We should do continuous walls.

        walls.push(new LineSegment(
          mouseMemory.firstWallPos.copy(),
          mousePos.copy(),
        ));

        mouseMemory.continue = true;
        mouseMemory.firstWallPos = mousePos.copy();
      } else {
        // We should do normal walls.

        walls.push(new LineSegment(
          mouseMemory.firstWallPos.copy(),
          mousePos.copy()
        ));
        
        mouseAction = `none`; // Change the mouse action.
        mouseMemory.continue = false;
        mouseMemory.firstWallPos = null;
      }
    }
  }
}

function windowResized () {
  let size = getCanvasSize();
  
  let w = Math.floor(size[0]);
  let h = Math.floor(size[1]);
  
  canvas.w = w;
  canvas.h = h;
  
  resizeCanvas(w, h);

  walls = walls.filter(x => x.doDraw);
  walls.push(
    LineSegment.fromCoords(0, 0, canvas.w, 0).dontDraw(),
    LineSegment.fromCoords(canvas.w, 0, canvas.w, canvas.h).dontDraw(),
    LineSegment.fromCoords(canvas.w, canvas.h, 0, canvas.h).dontDraw(),
    LineSegment.fromCoords(0, canvas.h, 0, 0).dontDraw(),
  )
}

function keyPressed () {
  if (keyCode === key.space) finishShape();
}

// Functions
function getElementSize (elm) {
  // Returns the width and height of an element, without padding.

  let style = window.getComputedStyle(elm, null);

  let w = style.getPropertyValue(`width`);
  w = Number(w.substring(0, w.length - 2));

  let h = style.getPropertyValue(`height`);
  h = Number(h.substring(0, h.length - 2));

  return { w: w, h: h };
}

function getCanvasSize () {
  // Calculates the size that the canvas should be, based on the size of the canvas.
  // Default is a 16:9 aspect ratio, change this variable to change the ratio.

  // Old inline stuff
  //   const ratio = { x: 16, y: 9 };
  // 
  //   let container = { e: document.getElementById(`canvas`) };
  //   container.s = getElementSize(container.e);
  // 
  //   let width = container.s.w;
  //   let height = width / ratio.x * ratio.y;
  // 
  //   if (height > window.innerHeight) {
  //     height = window.innerHeight * 0.85;
  //     width = height / ratio.y * ratio.x;
  //   }
  // 
  //   return [Math.floor(width), Math.floor(height)];

  return [window.innerWidth, window.innerHeight];
}

function finishShape () {
  // Uses mouse memory to complete the currently drawn shape.

  if (mouseAction === `draw` && mouseMemory.continue) {
    walls.push(new LineSegment(
      mouseMemory.firstWallPos.copy(),
      mouseMemory.veryFirstWallPos.copy(),
    ));

    mouseMemory.veryFirstWallPos = null;
    mouseMemory.firstWallPos = null;
    mouseMemory.continue = false;
    mouseAction = `none`;
  }
}

function getAllVertices () {
  let vertices = [];

  for (let wall of walls) {
    vertices.push(wall.p1, wall.p2);
  }

  return vertices;
}

function drawRaycasts () {
  noStroke(); fill(colors.white);

  const mouse = Vector2.fromMouse();
  
  let allRays = mouse.getRaysToVertices();
  let hits = allRays.map(ray => ray.calculateClosestCollision()).filter(x => x !== null);

  beginShape();
  hits.forEach(hit => vertex(hit.x, hit.y));
  endShape();
}

function drawCurrentWall () {
  if (mouseAction === `draw`) {
    stroke(colors.gray); strokeWeight(1);
    line(...mouseMemory.firstWallPos.getCoords(), mouseX, mouseY);
  }
}

function drawMouse () {
  noStroke(); fill(colors.white);
  circle(mouseX, mouseY, 4);
}

function drawWalls () {
  stroke(colors.white); strokeWeight(1);
  for (let wall of walls) wall.draw();
}

function clearWalls () {
  // Erases all current walls, except for the room walls.

  walls = walls.filter(x => !x.doDraw);
}

// Debug Functions
function exportWalls () {
  // Debug function to export walls variable as JSON to console.

  console.log(JSON.stringify(walls));
}

function importWalls (str) {
  // Debug function to import string to walls variable.

  let j = JSON.parse(str);
  for (let wall of j) {
    let { p1, p2 } = wall;

    walls.push(new LineSegment(p1, p2));
  }
}