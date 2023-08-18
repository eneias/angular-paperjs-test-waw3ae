import { Component, ViewChild, ElementRef } from '@angular/core';
import { Project, Path, Segment, Tool, Point,setup, view } from 'paper';
// import { paper } from 'paper';

import { PathFitter2, Point2 } from './mypaper'

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  @ViewChild('canvas') canvas;
  @ViewChild('canvas2') canvas2;
  ctx: CanvasRenderingContext2D

  project;
  path;
  path2;
  segmentCount: number = 0;
  difference: number = 0;
  percentage: number = 0;
  drawing: boolean = false;
  pts: number[][] = []
  lastX: number
  lastY: number
  mousePressed:boolean = false

  ngAfterViewInit() {
    this.pts = [
      [0,0],
      [50,0],
      [100,50],
      [100,100],
      [100,150],
      [50,200],
      [0,200]
    ]

    this.drawHtml()
    this.drawPaper()
  }

  drawHtml() {
    this.ctx = this.canvas2.nativeElement.getContext('2d')

    this.ctx.beginPath();
    // move to start
    this.ctx.moveTo(this.pts[0][0], this.pts[0][1]);

    for (let i = 1; i < this.pts.length; i+=3) {
      this.ctx.bezierCurveTo(
        this.pts[i][0], 
        this.pts[i][1],
        this.pts[i+1][0],
        this.pts[i+1][1],
        this.pts[i+2][0],
        this.pts[i+2][1]
      );
    }
   
    this.ctx.stroke();

    this.pts.forEach(pt => {
      this.draw_marker(pt[0], pt[1])
    })
  }

  drawPaper() {
    // setup(this.canvas.nativeElement);
    this.project=new Project(this.canvas.nativeElement)

    let segments = this.ptsToSegments(this.pts)

    this.path = new Path({
        segments: segments,
        strokeColor: 'black',
        fullySelected: true
    })
  }

  onMouseDown(e:any) {
    // console.log('mouse down ', e)
    this.drawing = true

    // If we produced a path before, deselect it:
    if (this.path) {
      this.path.selected = false;
    }

    // Create a new path and set its stroke color to black:
    this.path = new Path({
      segments: [new Point(e.offsetX,e.offsetY)],
      strokeColor: 'black',
      // Select the path, so we can see its segment points:
      // fullySelected: true
    });
  }

  onMouseDrag(e) {
    if (!this.drawing) return

    this.path.add(new Point(e.offsetX,e.offsetY));

    // Update the content of the text item to show how many
    // segments it has:
    this.segmentCount = this.path.segments.length;
  }

  onMouseUp(event) {
    this.drawing = false
    var segmentCount = this.path.segments.length;

    // console.log('PATH: ', this.path)

    // When the mouse is released, simplify it:
    this.path.simplify(10);

    // Select the path, so we can see its segments:
    // this.path.fullySelected = true;

    var newSegmentCount = this.path.segments.length;
    this.difference = segmentCount - newSegmentCount;
    this.percentage = 100 - Math.round(newSegmentCount / segmentCount * 100);
  }

  onMouseLeave(e) {
    this.drawing = false
  }

  ptsToSegments(pts) {
    let segments = []
    let num = pts.length

    for (let i = 0; i < num; i+=3) {
      let prev = Math.max(0, i - 1)
      let next = Math.min(num-1, i + 1)

      segments.push(new Segment({
        handleIn: [this.pts[prev][0] - this.pts[i][0], this.pts[prev][1] - this.pts[i][1]],
        point: [this.pts[i][0], this.pts[i][1]],
        handleOut: [this.pts[next][0] - this.pts[i][0], this.pts[next][1] - this.pts[i][1]]
      }))
    }

    return segments
  }

  drawSegmentsCanvas(segs, drawMarkers=false) {
    this.ctx.beginPath();

    let pts = []

    // move to first point
    this.ctx.moveTo(segs[0].point.x, segs[0].point.y)

    pts.push({x:segs[0].point.x, y:segs[0].point.y})

    // this.draw_marker(segs[0].point.x, segs[0].point.y)

    let curpt, prevpt
    for (let i = 1; i < segs.length; i+=1) {
      prevpt = segs[i-1].point
      curpt = segs[i].point

      this.ctx.bezierCurveTo(
        // handle out of previous point
        segs[i-1].handleOut.x + prevpt.x, segs[i-1].handleOut.y + prevpt.y,
        // handle in of current point
        segs[i].handleIn.x + curpt.x, segs[i].handleIn.y + curpt.y,
        // current point
        segs[i].point.x, segs[i].point.y
      );

      pts.push({x:segs[i-1].handleOut.x + prevpt.x, y:segs[i-1].handleOut.y + prevpt.y})
      pts.push({x:segs[i].handleIn.x + curpt.x, y:segs[i].handleIn.y + curpt.y})
      pts.push({x:segs[i].point.x, y:segs[i].point.y})
    }

    console.log(pts)

    this.ctx.stroke();

    if (drawMarkers) {
      segs.forEach(seg => {
        this.draw_handle(
          seg.handleIn.add(seg.point), 
          seg.point, 
          seg.handleOut.add(seg.point)
        )

        // this.draw_marker(seg.handleIn.x + seg.point.x, seg.handleIn.y + seg.point.y)
        // this.draw_marker(seg.point.x, seg.point.y)
        // this.draw_marker(seg.handleOut.x + seg.point.x, seg.handleOut.y + seg.point.y)
      })
    } 
  }

  redraw() { 
    console.log(this.path.segments)

    this.clear()

    var path = new Path({
      segments: this.path.segments,
      strokeColor: 'red',
      fullySelected: false
    })

    this.drawSegmentsCanvas(this.path.segments)
  }

  clear() {
    this.project.activeLayer.removeChildren()
    this.ctx.clearRect(0, 0, this.canvas2.nativeElement.width, this.canvas2.nativeElement.height);
  }

  canvasMouseDown(e) {
    this.mousePressed = true;
    let pos = this.getMousePos(e)

    this.lastX = pos.x; 
    this.lastY = pos.y;
    
    this.pts = [[pos.x,pos.y]]
  }

  canvasMouseMove(e) {
    if (this.mousePressed) {
      let pos = this.getMousePos(e)
      this.draw(pos.x, pos.y)
    }
  }

  canvasMouseUp(e) {
    this.mousePressed = false

    let segments = []

    this.pts.forEach(pt => {
      segments.push(new Point2(pt[0], pt[1]))
    })

    // console.log('Paper point: ', new Point(15,15))
    // console.log('My point: ', new Point2(15,15))

    // return list of segments with point, handleIn, handleOut
    let fitter = new PathFitter2(segments).fit(10)

    this.clear()
    this.drawSegmentsCanvas(fitter, true)

    var path = new Path({
      segments: segments,
      strokeColor: 'red',
      fullySelected: true
    })

    path.simplify(10)

    // console.log(path)
  }

  draw(x, y) {
    let dist = this.distance([x,y], [this.lastX, this.lastY])

    if (dist > 10) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 1;
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(x, y);
      this.ctx.closePath();
      this.ctx.stroke();
      this.pts.push([x,y])

      this.lastX = x
      this.lastY = y
    }
  }

  distance(p1, p2) {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return dx * dx + dy * dy;
  }

  getMousePos(e) {
    const rect = this.canvas2.nativeElement.getBoundingClientRect()

    // use touches for iphone
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top

    return {x: x, y: y}
  }

  onSimplify() {

  }

  draw_marker(x, y, radius=2) {
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI)
    this.ctx.closePath()
    this.ctx.fillStyle = "#07F"
    this.ctx.fill()
  }

  draw_line(x, y, x2, y2, lineWidth=1, lineColour='#07F') {
    this.ctx.beginPath()
    this.ctx.moveTo(x,y)
    this.ctx.lineTo(x2,y2)
    this.ctx.strokeStyle = lineColour;
    this.ctx.stroke()
  }

  draw_handle(pt1, pt2, pt3) {
    this.draw_marker(pt1.x, pt1.y)
    this.draw_marker(pt2.x, pt2.y)
    this.draw_marker(pt3.x, pt3.y)

    this.draw_line(pt1.x, pt1.y, pt3.x, pt3.y)
  }
}
