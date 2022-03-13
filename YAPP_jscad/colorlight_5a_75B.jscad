/*
****************************************************************************
*
* Permission is hereby granted, free of charge, to any person obtaining a
* copy of this software and associated documentation files (the
* "Software"), to deal in the Software without restriction, including
* without limitation the rights to use, copy, modify, merge, publish,
* distribute, sublicense, and/or sell copies of the Software, and to permit
* persons to whom the Software is furnished to do so, subject to the
* following conditions:
*
* The above copyright notice and this permission notice shall be included
* in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
* OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
* IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
* CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT
* OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
* THE USE OR OTHER DEALINGS IN THE SOFTWARE.
* 
****************************************************************************
*/

// *****************************************************************************************************
// *                                                                                                   *
// * This design is an OpenJSCAD rewrite of the following code (https://github.com/mrWheel/YAPP_Box)   *
// *                                                                                                   *
// *      /*                                                                                           *
// *      ***************************************************************************                  *
// *      **  Yet Another Parameterised Projectbox generator                                           *
// *      **                                                                                           *
// *      */                                                                                           *
// *      let Version="v1.3 (26-02-2022)";                                                             *
// *      /*                                                                                           *
// *      **                                                                                           *
// *      **  Copyright (c) 2021, 2022 Willem Aandewiel                                                *
// *      **                                                                                           *
// *      **  TERMS OF USE: MIT License. See base offile.                                              *
// *      ***************************************************************************                  *
// *      */                                                                                           *
// *****************************************************************************************************

//
// OpenJSCAD port and original code Copyright (c) 2022 Udi Finkelstein
//

const jscad = require('@jscad/modeling')
const { arc, circle, ellipse, line, polygon, rectangle, roundedRectangle, square, star } = jscad.primitives
const { cube, cuboid, cylinder, sphere, roundedCuboid } = jscad.primitives
const { translate, rotateX, rotateY, rotateZ, mirror, mirrorZ, mirrorY, mirrorX, scale } = jscad.transforms
const { hull, hullChain } = jscad.hulls
const { extrudeRectangular, extrudeLinear, extrudeRotate } = jscad.extrusions
const { union, subtract, intersect } = jscad.booleans
const { colorize, colorNameToRgb , hslToRgb, hsvToRgb } = jscad.colors
const { geom3 } = jscad.geometries
const { toOutlines } = jscad.geometries.geom2
const { degToRad } = jscad.utils
const {vectorText } = jscad.text

//
// The array was moved out of getParamDefinitions() in a hope that it would be somehow
// possible to modify it on the fly.
//
var parameters = [
    {
        name: 'boxMode', type: 'radio', caption: 'View:',
        values: ['base', 'lid', 'lid on base', 'side by side'],
        captions: ['Base', 'Lid', 'Lid on Base', 'Side by Side'], initial: 'side by side'
    },
    { name: 'showPCB', type: 'checkbox', checked: false, initial: false, caption: 'Show PCB:' },
    { name: 'showMarkers', type: 'checkbox', checked: false, initial: true, caption: 'Show Markers:' },
    { name: 'showOrientation', type: 'checkbox', checked: false, initial: true, caption: 'Show Orientation:' },
]
  
const getParameterDefinitions = () => parameters

const main = (params) => {

    var obj = new Box()
    YAPP_colorlight_5A_75B(obj)
    obj.update_Box()

    if (params.boxMode === 'base') {
        obj.printBaseShell = true;
        obj.printLidShell = false;
    } else if (params.boxMode === 'lid') {
        obj.printBaseShell = false;
        obj.printLidShell = true;
        obj.showSideBySide = true;
    } else if (params.boxMode === 'side by side') {
        obj.printBaseShell = true;
        obj.printLidShell = true;
        obj.showSideBySide = true;
    } else if (params.boxMode === 'lid on base') {
        obj.printBaseShell = true;
        obj.printLidShell = true;
        obj.showSideBySide = false;
    }
    obj.showPCB = params.showPCB
    obj.showMarkers = params.showMarkers
    obj.show_orientation = params.showOrientation
    //obj.baseShell()
    obj.YAPPgenerate()
    return obj.color_Box()
}

//---------------------------------------------------------
// This design is parameterized based on the size of a PCB.
//---------------------------------------------------------
// Note: length/lengte refers to X axis, 
//       width/breedte to Y, 
//       height/hoogte to Z

/*
      padding-back|<------pcb length --->|<padding-front
                            RIGHT
        0    X-as ---> 
        +----------------------------------------+   ---
        |                                        |    ^
        |                                        |   padding-right 
        |                                        |    v
        |    -5,y +----------------------+       |   ---              
 B    Y |         | 0,y              x,y |       |     ^              F
 A    - |         |                      |       |     |              R
 C    a |         |                      |       |     | pcb width    O
 K    s |         |                      |       |     |              N
        |         | 0,0              x,0 |       |     v              T
      ^ |    -5,0 +----------------------+       |   ---
      | |                                        |    padding-left
      0 +----------------------------------------+   ---
        0    X-as --->
                          LEFT
*/
const YAPP_colorlight_5A_75B = (obj) => {
    //-- which half do you want to print?
    obj.printBaseShell    = true;
    obj.printLidShell     = true;

    //-- Edit these parameters for your own board dimensions
    obj.wallThickness       = 1.2;
    obj.basePlaneThickness  = 1.0;
    obj.lidPlaneThickness   = 1.7;

    //-- Total height of box = basePlaneThickness + lidPlaneThickness 
    //--                     + baseWallHeight + lidWallHeight
    //-- space between pcb and lidPlane :=
    //--      (baseWallHeight+lidWall_heigth) - (standoff_heigth+pcbThickness)
    //--      (6.2 + 4.5) - (3.5 + 1.5) ==> 5.7
    obj.baseWallHeight    = 6.2;
    obj.lidWallHeight     = 4.5;

    // https://www.ledcontrollercard.com/media/wysiwyg/ColorLight/5A-75B%20Receiving%20Card.pdf
    //-- pcb dimensions
    obj.pcbLength         = 143.64; // i(5.6496);
    obj.pcbWidth          = 91.69; // i(3.6);
    obj.pcbThickness      = 2.0;
                            
    //-- padding between pcb and inside wall
    obj.paddingFront      = 2;
    obj.paddingBack       = 2;
    obj.paddingRight      = 2;
    obj.paddingLeft       = 2;

    //-- ridge where base and lid off box can overlap
    //-- Make sure this isn't less than lidWallHeight
    obj.ridgeHeight       = 3.5;
    obj.ridgeSlack        = 0.1;
    obj.roundRadius       = 2.0;

    //-- How much the PCB needs to be raised from the base
    //-- to leave room for solderings and whatnot
    obj.standoffHeight    = 3.5;
    obj.pinDiameter       = 2.8;
    obj.pinHoleSlack      = 0.1;
    obj.standoffDiameter  = 4;


    //-- D E B U G ----------------------------
    obj.showSideBySide    = true;     //-> true
    obj.onLidGap          = 5;
    obj.shiftLid          = 1;
    obj.hideLidWalls      = false;    //-> false
    obj.colorLid          = "yellow";   
    obj.hideBaseWalls     = false;    //-> false
    obj.colorBase         = "white";
    obj.showPCB           = false;    //-> false
    obj.showMarkers       = true;    //-> false
    obj.inspectX          = 0;  //-> 0=none (>0 from front, <0 from back)
    obj.inspectY          = 0;  //-> 0=none (>0 from front, <0 from back)
    //-- D E B U G ----------------------------


    //-- pcb_standoffs  -- origin is pcb[0,0,0]
    // (0) = posx
    // (1) = posy
    // (2) = { yappBoth | yappLidOnly | yappBaseOnly }
    // (3) = { yappHole, YappPin }
    obj.holeDistance = 60.33; // i(2.375)
    obj.holeX  = (obj.pcbLength - 135.26) / 2;
    obj.holeY1 = (obj.pcbWidth - 81.28) / 2;
    obj.holeY2 = (obj.pcbWidth - 60.33) / 2;
    obj.pcbStands = [
                    [                obj.holeX, obj.pcbWidth - obj.holeY2, obj.yappBoth, obj.yappPin]         // back-left
                  , [                obj.holeX,                obj.holeY2, obj.yappBoth, obj.yappPin] // back-right
                  , [obj.pcbLength - obj.holeX, obj.pcbWidth - obj.holeY1, obj.yappBoth, obj.yappPin]         // back-left
                  , [obj.pcbLength - obj.holeX,                obj.holeY1, obj.yappBoth, obj.yappPin] // back-right
                ];

    //-- Lid plane    -- origin is pcb[0,0,0]
    // (0) = posx
    // (1) = posy
    // (2) = width
    // (3) = length
    // (4) = { yappRectangle | yappCircle }
    // (5) = { yappCenter }
    obj.cutoutsLid =  [
                  [i(0.375+0*1.075), i(0.26), i(2*0.1), i(0.8), obj.yappRectangle, obj.yappOffset, i(0.05), i(0.05), 25]
                , [i(0.375+1*1.075), i(0.26), i(2*0.1), i(0.8), obj.yappRectangle, obj.yappOffset, i(0.05), i(0.05), 25]
                , [i(0.375+2*1.075), i(0.26), i(2*0.1), i(0.8), obj.yappRectangle, obj.yappOffset, i(0.05), i(0.05), 25]
                , [i(0.375+3*1.075), i(0.26), i(2*0.1), i(0.8), obj.yappRectangle, obj.yappOffset, i(0.05), i(0.05), 25]
                , [i(0.375+0*1.075), obj.pcbWidth-i(0.26+0.1), i(0.2), i(0.8), obj.yappRectangle, obj.yappOffset, i(0.05), i(0.05), -25]
                , [i(0.375+1*1.075), obj.pcbWidth-i(0.26+0.1), i(0.2), i(0.8), obj.yappRectangle, obj.yappOffset, i(0.05), i(0.05), -25]
                , [i(0.375+2*1.075), obj.pcbWidth-i(0.26+0.1), i(0.2), i(0.8), obj.yappRectangle, obj.yappOffset, i(0.05), i(0.05), -25]
                , [i(0.375+3*1.075), obj.pcbWidth-i(0.26+0.1), i(0.2), i(0.8), obj.yappRectangle, obj.yappOffset, i(0.05), i(0.05), -25]
                //, [0, 31.5-1, 12.2+2, 11, yappRectangle]       // USB (right)
                //, [0, 3.5-1, 12, 13.5, yappRectangle]          // Power Jack
                //, [29-1, 12.5-1, 8.5+2, 35+2,  yappRectangle]  // ATmega328
                //, [17.2-1, 49.5-1, 5, 47.4+2,  yappRectangle]  // right headers
                //, [26.5-1, 1-1, 5, 38+2,  yappRectangle]       // left headers
                //, [65.5, 28.5, 8.0, 5.5,  yappRectangle, yappCenter]    // ICSP1
                //, [18.0, 45.5, 6.5, 8.0,  yappRectangle, yappCenter]    // ICSP2
                //, [6, 49, 8, 0, yappCircle]                  // reset button
    //-- if space between pcb and LidPlane > 5.5 we do'n need holes for the elco's --
    //             , [18.0, 8.6, 7.2, 0, yappCircle]            // elco1
    //             , [26.0, 8.6, 7.2, 0, yappCircle]            // elco2
    //             , [21.5, 8.6, 7.2, 7, yappRectangle, yappCenter]        // connect elco's
                , [28.2, 35.2, 5, 3.5, obj.yappRectangle, obj.yappCenter]       // TX/RX leds
                , [28.2, 42.5, 3, 3.5, obj.yappRectangle, obj.yappCenter]       // led13
                , [58.5, 37, 3, 3.5,   obj.yappRectangle, obj.yappCenter]         // ON led
                ];

    //-- base plane    -- origin is pcb[0,0,0]
    // (0) = posx
    // (1) = posy
    // (2) = width
    // (3) = length
    // (4) = { yappRectangle | yappCircle }
    // (5) = { yappCenter }
    obj.cutoutsBase =   [
                      [30, obj.pcbWidth/2, 25, 2, obj.yappRectangle, obj.yappCenter]
                    , [35, obj.pcbWidth/2, 25, 2, obj.yappRectangle, obj.yappCenter]
                    , [40, obj.pcbWidth/2, 25, 2, obj.yappRectangle, obj.yappCenter]
                    , [45, obj.pcbWidth/2, 25, 2, obj.yappRectangle, obj.yappCenter]
                    , [50, obj.pcbWidth/2, 25, 2, obj.yappRectangle, obj.yappCenter]
                    , [55, obj.pcbWidth/2, 25, 2, obj.yappRectangle, obj.yappCenter]
                    ];

    //-- back plane  -- origin is pcb[0,0,0]
    // (0) = posy
    // (1) = posz
    // (2) = width
    // (3) = height
    // (4) = { yappRectangle | yappCircle }
    // (5) = { yappCenter }
    obj.cutoutsBack = [
                  [31.5-1, -1, 12.2+2, 12, obj.yappRectangle]  // USB
                , [3.5-1,  -1, 12,     11, obj.yappRectangle]  // Power Jack
                ];

    //-- snap Joins -- origen = box[x0,y0]
    // (0) = posx | posy
    // (1) = width
    // (2..5) = yappLeft / yappRight / yappFront / yappBack (one or more)
    // (n) = { yappSymmetric }
    obj.snapJoins   =     [
                        [10, 5, obj.yappLeft, obj.yappRight, obj.yappSymmetric]
                    ];

    //-- origin of labels is box [0,0,0]
    // (0) = posx
    // (1) = posy/z
    // (2) = orientation
    // (3) = plane {lid | base | left | right | front | back }
    // (4) = font
    // (5) = size
    // (6) = "label text"
    obj.labelsPlane = [
                  [5,  28,   0, "lid", "Arial:style=bold", 5, "Arduino UNO" ]
                , [57, 33,  90, "lid", "Liberation Mono:style=bold", 5, "YAPP" ]
                , [35, 36,   0, "lid", "Liberation Mono:style=bold", 3, "RX" ]
                , [35, 40.5, 0, "lid", "Liberation Mono:style=bold", 3, "TX" ]
                , [35, 45.6, 0, "lid", "Liberation Mono:style=bold", 3, "13" ]
                ];

}

module.exports = { main, getParameterDefinitions }

function i(m) {
    return m*25.4
}

class Box {
    constructor() {
        //-- constants, do not change
        this.yappRectangle   =  0;
        this.yappCircle      =  1;
        this.yappBoth        =  2;
        this.yappLidOnly     =  3;
        this.yappBaseOnly    =  4;
        this.yappHole        =  5;
        this.yappPin         =  6;
        this.yappLeft        =  7;
        this.yappRight       =  8;
        this.yappFront       =  9;
        this.yappBack        = 10;
        this.yappCenter      = 11;
        this.yappSymmetric   = 12;
        this.yappAllCorners  = 13;
        this.yappOffset      = 14;

        //-- pcb_standoffs  -- origin is pcb[0,0,0]
        // (0) = posx
        // (1) = posy
        // (2) = { yappBoth | yappLidOnly | yappBaseOnly }
        // (3) = { yappHole, YappPin }
        this.pcbStands =    [
            //   , [20,  20, yappBoth, yappPin] 
            //   , [3,  3, yappBoth, yappPin] 
            //   , [pcbLength-10,  pcbWidth-3, yappBoth, yappPin]
        ];

        //-- Lid plane    -- origin is pcb[0,0,0]
        // (0) = posx
        // (1) = posy
        // (2) = width
        // (3) = length
        // (4) = { yappRectangle | yappCircle }
        // (5) = { yappCenter }
        this.cutoutsLid  =   [
        //     [20, 0, 10, 24, yappRectangle]
        //   , [pcbWidth-6, 40, 12, 4, yappCircle]
        //   , [30, 25, 10, 14, yappRectangle, yappCenter]
            ];

        //-- base plane    -- origin is pcb[0,0,0]
        // (0) = posx
        // (1) = posy
        // (2) = width
        // (3) = length
        // (4) = { yappRectangle | yappCircle }
        // (5) = { yappCenter }
        this.cutoutsBase =   [
        //       [30, 0, 10, 24, yappRectangle]
        //     , [pcbLength/2, pcbWidth/2, 12, 4, yappCircle]
        //     , [pcbLength-8, 25, 10, 14, yappRectangle, yappCenter]
            ];

        //-- front plane  -- origin is pcb[0,0,0]
        // (0) = posy
        // (1) = posz
        // (2) = width
        // (3) = height
        // (4) = { yappRectangle | yappCircle }
        // (5) = { yappCenter }
        this.cutoutsFront =  [
        //      [10, 5, 12, 15, yappRectangle]
        //    , [30, 7.5, 15, 9, yappRectangle, yappCenter]
        //    , [0, 2, 10, 7, yappCircle]
            ];

        //-- back plane  -- origin is pcb[0,0,0]
        // (0) = posy
        // (1) = posz
        // (2) = width
        // (3) = height
        // (4) = { yappRectangle | yappCircle }
        // (5) = { yappCenter }
        this.cutoutsBack =   [
        //      [10, 0, 10, 18, yappRectangle]
        //    , [30, 0, 10, 8, yappRectangle, yappCenter]
        //    , [pcbWidth, 0, 8, 5, yappCircle]
            ];

        //-- left plane   -- origin is pcb[0,0,0]
        // (0) = posx
        // (1) = posz
        // (2) = width
        // (3) = height
        // (4) = { yappRectangle | yappCircle }
        // (5) = { yappCenter }
        this.cutoutsLeft =   [
        //    , [0, 0, 15, 20, yappRectangle]
        //    , [30, 5, 25, 10, yappRectangle, yappCenter]
        //    , [pcbLength-10, 2, 10,7, yappCircle]
            ];

        //-- right plane   -- origin is pcb[0,0,0]
        // (0) = posx
        // (1) = posz
        // (2) = width
        // (3) = height
        // (4) = { yappRectangle | yappCircle }
        // (5) = { yappCenter }
        this.cutoutsRight =  [
        //      [0, 0, 15, 7, yappRectangle]
        //    , [30, 10, 25, 15, yappRectangle, yappCenter]
        //    , [pcbLength-10, 2, 10,7, yappCircle]
            ];

        //-- connectors -- origen = box[0,0,0]
        // (0) = posx
        // (1) = posy
        // (2) = screwDiameter
        // (3) = insertDiameter
        // (4) = outsideDiameter
        // (5) = { yappAllCorners }
        this.connectors   =  [
        //      [10, 10, 2, 3, 2]
        //    , [30, 20, 4, 6, 9]
        //    , [4, 3, 34, 3, yappFront]
        //    , [25, 3, 3, 3, yappBack]
            ];

        //-- base mounts -- origen = box[x0,y0]
        // (0) = posx | posy
        // (1) = screwDiameter
        // (2) = width
        // (3) = height
        // (4..7) = yappLeft / yappRight / yappFront / yappBack (one or more)
        // (5) = { yappCenter }
        this.baseMounts   =  [
            //  [-5, 3.3, 10, 3, this.yappLeft, this.yappRight, this.yappCenter]
            //, [40, 3,    8, 3, this.yappBack, this.yappFront]
            //, [ 4, 3,   34, 3, this.yappFront]
            //, [25, 3,    3, 3, this.yappBack]
            ];

        //-- snap Joins -- origen = box[x0,y0]
        // (0) = posx | posy
        // (1) = width
        // (2..5) = yappLeft / yappRight / yappFront / yappBack (one or more)
        // (n) = { yappSymmetric }
        this.snapJoins   =     [
        //    [2,               5, yappLeft, yappRight, yappSymmetric]
        //    [5,              10, yappLeft]
        //  , [shellLength-2,  10, yappLeft]
        //  , [20,             10, yappFront, yappBack]
        //  , [2.5,             5, yappBack,  yappFront, yappSymmetric]
            ];
 
        //-- origin of labels is box [0,0,0]
        // (0) = posx
        // (1) = posy/z
        // (2) = orientation
        // (3) = plane {lid | base | left | right | front | back }
        // (4) = font
        // (5) = size
        // (6) = "label text"
        this.labelsPlane =   [
                [5, 5, 0, "lid", "Liberation Mono:style=bold", 5, "YAPP" ]
            ];

        //-- which half do you want to print?
        this.printBaseShell      = true;
        this.printLidShell       = true;

        //-- Edit these parameters for your own board dimensions
        this.wallThickness       = 1.2;
        this.basePlaneThickness  = 1.0;
        this.lidPlaneThickness   = 1.0;

        //-- Total height of box = basePlaneThickness + lidPlaneThickness 
        //--                     + baseWallHeight + lidWallHeight
        //-- space between pcb and lidPlane :=
        //--      (bottonWallHeight+lidWallHeight) - (standoffHeight+pcbThickness)
        this.baseWallHeight      = 8;
        this.lidWallHeight       = 5;

        //-- ridge where base and lid off box can overlap
        //-- Make sure this isn't less than lidWallHeight
        this.ridgeHeight         = 3.0;
        this.ridgeSlack          = 0.2;
        this.roundRadius         = 5.0;

        //-- pcb dimensions
        this.pcbLength           = 30;
        this.pcbWidth            = 15;
        this.pcbThickness        = 1.5;

        //-- How much the PCB needs to be raised from the base
        //-- to leave room for solderings and whatnot
        this.standoffHeight      = 3.0;
        this.pinDiameter         = 2.0;
        this.pinHoleSlack        = 0.2;
        this.standoffDiameter    = 4;
                            
        //-- padding between pcb and inside wall
        this.paddingFront        = 1;
        this.paddingBack         = 1;
        this.paddingRight        = 1;
        this.paddingLeft         = 1;


        //-- D E B U G -----------------//-> Default ---------
        this.showSideBySide      = true;     //-> true
        this.onLidGap            = 3;
        this.shiftLid            = 1;
        this.hideLidWalls        = false;    //-> false
        this.colorLid            = "yellow";   
        this.hideBaseWalls       = false;    //-> false
        this.colorBase           = "white";
        this.showPCB             = false;    //-> false
        this.showMarkers         = false;    //-> false
        this.inspectX            = 0;        //-> 0=none (>0 from front, <0 from back)
        this.inspectY            = 0;        //-> 0=none (>0 from left, <0 from right)
        // new udif stuff
        this.show_orientation    = true;
        //-- D E B U G ---------------------------------------

        /*
        ********* don't change anything below this line ***************
        */
        this.red    = emptyObject()
        this.green  = emptyObject()
        this.blue   = emptyObject()
        this.black  = emptyObject()
        this.orange = emptyObject()
        this.purple = emptyObject()
        this.obj = [this.red, this.green, this.blue, this.black, this.orange, this.purple]
    }

    update_Box() {
        this.shellInsideWidth  = this.pcbWidth + this.paddingLeft + this.paddingRight;
        this.shellWidth        = this.shellInsideWidth + (this.wallThickness*2)+0;
        this.shellInsideLength = this.pcbLength + this.paddingFront + this.paddingBack;
        this.shellLength       = this.pcbLength + (this.wallThickness*2) + this.paddingFront + this.paddingBack;
        this.shellInsideHeight = this.baseWallHeight + this.lidWallHeight;
        this.shellHeight       = this.basePlaneThickness + this.shellInsideHeight + this.lidPlaneThickness;
        this.pcbX              = this.wallThickness + this.paddingBack;
        this.pcbY              = this.wallThickness + this.paddingLeft;
        this.pcbYlid           = this.wallThickness + this.pcbWidth + this.paddingRight;
        this.pcbZ              = this.basePlaneThickness + this.standoffHeight + this.pcbThickness;
      //this.pcbZlid           = (this.baseWallHeight + this.lidWallHeight + this.basePlaneThickness) - (this.standoffHeight);
        this.pcbZlid           = (this.baseWallHeight + this.lidWallHeight + this.lidPlaneThickness)
                                -(this.standoffHeight + this.pcbThickness);        
    }

    color_Box() {
        return [
            colorize(colorNameToRgb('red'), this.red),
            colorize(colorNameToRgb('green'), this.green),
            colorize(colorNameToRgb('blue'), this.blue),
            colorize(colorNameToRgb('black'), this.black),
            colorize(colorNameToRgb('orange'), this.orange),
            colorize(colorNameToRgb('purple'), this.purple)
        ]
    }
    //--------------------------------------------------------
    //-- position is: [(shellLength/2), 
    //--               shellWidth/2, 
    //--               (baseWallHeight+basePlaneThickness)]
    //--------------------------------------------------------
    //-- back to [0,0,0]
    printBaseMounts() {
        var o = emptyObject()
        if (this.showMarkers) {
            o = colorize(colorNameToRgb('red'),
                translate([0,0,((this.shellHeight + this.onLidGap)/2)],
                    cylinder({radius: 1, height: (this.shellHeight + this.onLidGap + 20)})))
        }
        for (let i in this.baseMounts) {
            let bm = this.baseMounts[i]
            console.log(bm)
            var c = isTrue(this.yappCenter, bm, 5);
        
            // (0) = posx | posy
            // (1) = screwDiameter
            // (2) = width
            // (3) = Height
            // (4..7) = yappLeft / yappRight / yappFront / yappBack (one or more)
            if (isTrue(this.yappLeft, bm, 4)) {
                let newWidth  = maxWidth(bm[2], bm[1], this.shellLength);
                let tmpPos    = calcScrwPos(bm[0], newWidth, this.shellLength, c);
                let tmpMinPos = minPos(tmpPos, bm[1]);
                let scrwX1pos = maxPos(tmpMinPos, newWidth, bm[1], this.shellLength);
                let scrwX2pos = scrwX1pos + newWidth;
                o = union(o, oneMount(bm, scrwX1pos, scrwX2pos))
            } //  if yappLeft
        
            // (0) = posx | posy
            // (1) = screwDiameter
            // (2) = width
            // (3) = Height
            // (4..7) = yappLeft / yappRight / yappFront / yappBack (one or more)
            if (isTrue(this.yappRight, bm, 4)) {
                let newWidth  = maxWidth(bm[2], bm[1], this.shellLength);
                let tmpPos    = calcScrwPos(bm[0], newWidth, this.shellLength, c);
                let tmpMinPos = minPos(tmpPos, bm[1]);
                let scrwX1pos = maxPos(tmpMinPos, newWidth, bm[1], this.shellLength);
                let scrwX2pos = scrwX1pos + newWidth;
                o = union(o, 
                    rotateZ(Math.PI,
                        mirror({normal: [1,0,0]},
                            translate([0, -this.shellWidth, 0],
                                oneMount(bm, scrwX1pos, scrwX2pos)
                            )
                        ) // mirror()
                    ) // rotate
                )
            } //  if yappRight
        
            // (0) = posx | posy
            // (1) = screwDiameter
            // (2) = width
            // (3) = Height
            // (4..7) = yappLeft / yappRight / yappFront / yappBack (one or more)
            if (isTrue(this.yappFront, bm, 4)) {
                let newWidth  = maxWidth(bm[2], bm[1], this.shellWidth);
                let tmpPos    = calcScrwPos(bm[0], newWidth, this.shellWidth, c);
                let tmpMinPos = minPos(tmpPos, bm[1]);
                let scrwX1pos = maxPos(tmpMinPos, newWidth, bm[1], this.shellWidth);
                let scrwX2pos = scrwX1pos + newWidth;
                o = union(o, 
                    rotateY(Math.PI, 
                        rotateZ(-Math.PI/2,
                            mirror({normal: [1,0,0]},
                                translate([0,this.shellLength*-1, (bm[3]*-1)],
                                    oneMount(bm, scrwX1pos, scrwX2pos)
                                )
                            )
                        ) //  rotate Z-ax
                    ) // rotate Y-ax
                )
            } //  if yappFront
        
            // (0) = posx | posy
            // (1) = screwDiameter
            // (2) = width
            // (3) = Height
            // (4..7) = yappLeft / yappRight / yappFront / yappBack (one or more)
            if (isTrue(this.yappBack, bm, 4)) {
            //echo("printBaseMount: BACK!!");
                let newWidth  = maxWidth(bm[2], bm[1], this.shellWidth);
                let tmpPos    = calcScrwPos(bm[0], newWidth, this.shellWidth, c);
                let tmpMinPos = minPos(tmpPos, bm[1]);
                let scrwX1pos = maxPos(tmpMinPos, newWidth, bm[1], this.shellWidth);
                let scrwX2pos = scrwX1pos + newWidth;
                o = union(o, 
                    rotateY(Math.PI,
                        rotateZ(-Math.PI / 2,
                            translate([0, 0, -bm[3]],
                                oneMount(bm, scrwX1pos, scrwX2pos)
                            ) // translate
                        ) //  rotate Z-ax
                    ) // rotate Y-ax
                )
            } //  if yappFront
        } // for ..
        return translate([
            -(this.shellLength / 2),
            -(this.shellWidth  / 2),
            -(this.baseWallHeight + this.basePlaneThickness)], o)
    } //  printBaseMounts()

    //===========================================================
    //-- snapJoins -- origen = box[x0,y0]
    // (0) = posx | posy
    // (1) = width
    // (2..5) = yappLeft / yappRight / yappFront / yappBack (one or more)
    // (n) = { yappSymmetric }
    printBaseSnapJoins() {
        let snapHeight = 2;
        let snapDiam   = 1.2;
    
        var o = emptyObject()
        for (let i in this.snapJoins) {
            let snj = this.snapJoins[i]
            let snapWidth  = snj[1];
            let snapZposLR = (this.basePlaneThickness + this.baseWallHeight) - ((snapHeight / 2) - 0.2);
            let snapZposBF = (this.basePlaneThickness + this.baseWallHeight) - ((snapHeight / 2) - 0.2);
            let tmpYmin    = (this.roundRadius * 2) + (snapWidth / 2);
            let tmpYmax    = this.shellWidth - tmpYmin;
            let tmpY       = lowestVal(snj[0] + (snapWidth / 2), tmpYmin);
            let snapYpos   = highestVal(tmpY, tmpYmax);

            let tmpXmin    = (this.roundRadius * 2) + (snapWidth / 2);
            let tmpXmax    = this.shellLength - tmpXmin;
            let tmpX       = lowestVal(snj[0] + (snapWidth / 2), tmpXmin);
            let snapXpos   = highestVal(tmpX, tmpXmax);

            if (isTrue(this.yappLeft, snj, 2)) {
                o = union(o, 
                    translate([snapXpos-(snapWidth / 2), this.wallThickness / 2, snapZposLR],
                        rotateY(Math.PI / 2,
                                //color("blue") cylinder(d=wallThickness, h=snapWidth);
                            cylinder({radius: snapDiam / 2, height: snapWidth})))) // 13-02-2022
                if (isTrue(this.yappSymmetric, snj, 3)) {
                    o = union(o, 
                        translate([this.shellLength - (snapXpos + (snapWidth / 2)), this.wallThickness / 2, snapZposLR],
                            rotateY(Math.PI / 2,
                                cylinder({radius: snapDiam / 2, height: snapWidth}))))
                }  // yappCenter
            } // yappLeft
    
            if (isTrue(this.yappRight, snj, 2)) {
                o = union(o, 
                    translate([snapXpos - (snapWidth / 2), this.shellWidth - (this.wallThickness / 2), snapZposLR],
                        rotateY(Math.PI / 2,
                            //color("blue") cylinder(d=wallThickness, h=snapWidth);
                            cylinder({radius: snapDiam / 2, height: snapWidth}))))
                if (isTrue(this.yappSymmetric, snj, 3)) {
                    o = union(o, 
                        translate([this.shellLength - (snapXpos + (snapWidth / 2)), this.shellWidth - (this.wallThickness / 2), snapZposLR],
                            rotateY(Math.PI / 2,
                                //color("blue") cylinder(d=wallThickness, h=snapWidth);
                                cylinder({radius: snapDiam / 2, height: snapWidth}))))
                } // yappCenter
            } // yappRight
    
            if (isTrue(this.yappBack, snj, 2)) {
                o = union(o, 
                    translate([(this.wallThickness / 2), snapYpos - (snapWidth / 2), snapZposBF],
                        rotateX(-Math.PI / 2,
                            //color("blue") cylinder(d=wallThickness, h=snapWidth);
                            cylinder({radius: snapDiam / 2, height: snapWidth})))) // 13-02-2022
                if (isTrue(this.yappSymmetric, snj, 3)) {
                    o = union(o, 
                        translate([(this.wallThickness / 2), this.shellWidth - (snapYpos + (snapWidth / 2)), snapZposBF],
                            rotateX(-Math.PI / 2,
                                //color("blue") cylinder(d=wallThickness, h=snapWidth);
                                cylinder({radius: snapDiam / 2, height: snapWidth})))) // 13-02-2022
                } // yappCenter
            } // yappBack
    
            if (isTrue(this.yappFront, snj, 2)) {
                o = union(o, 
                    translate([this.shellLength - (this.wallThickness / 2), snapYpos - (snapWidth / 2), snapZposBF],
                        rotateX(-Math.PI / 2,
                            //color("blue") cylinder(d=wallThickness, h=snapWidth);
                            cylinder({radius: snapDiam / 2, height: snapWidth})))) // 13-02-2022
                if (isTrue(this.yappSymmetric, snj, 3)) {
                    o = union(o, 
                        translate([this.shellLength - (this.wallThickness / 2), this.shellWidth - (snapYpos + (snapWidth / 2)), snapZposBF],
                            rotateX(-Math.PI / 2,
                                //color("blue") cylinder(d=wallThickness, h=snapWidth);
                                cylinder({radius: snapDiam / 2, height: snapWidth})))) // 13-02-2022
                } // yappCenter
            } // yappFront
        } // for snj .. 
        return o
    } //  printBaseSnapJoins()

//===========================================================
//-- snapJoins -- origen = box[x0,y0]
// (0) = posx | posy
// (1) = width
// (2..5) = yappLeft / yappRight / yappFront / yappBack (one or more)
// (n) = { yappSymmetric }
    printLidSnapJoins() {
        var o = emptyObject()
        for (let i in this.snapJoins) {
            let snj = this.snapJoins[i]
            let snapWidth  = snj[1] + 1;
            let snapHeight = 2;
            let snapDiam   = 1.4;  // fixed
    
            let tmpYmin    = (this.roundRadius * 2) + (snapWidth / 2);
            let tmpYmax    = this.shellWidth - tmpYmin;
            let tmpY       = lowestVal(snj[0] + (snapWidth / 2), tmpYmin);
            let snapYpos   = highestVal(tmpY, tmpYmax);

            let tmpXmin    = (this.roundRadius * 2) + (snapWidth / 2);
            let tmpXmax    = this.shellLength - tmpXmin;
            let tmpX       = lowestVal(snj[0] + (snapWidth / 2), tmpXmin);
            let snapXpos   = highestVal(tmpX, tmpXmax);

            let snapZposLR = -(this.lidPlaneThickness + this.lidWallHeight)-(snapHeight/2)-0.5;
            let snapZposBF = -(this.lidPlaneThickness + this.lidWallHeight)-(snapHeight/2)-0.5;

            if (isTrue(this.yappLeft, snj, 2)) {
                o = union(o, 
                    translate([snapXpos - (snapWidth / 2) - 0.5, -0.5, snapZposLR],
                    //color("red") cube([snapWidth, 5, wallThickness]);
                        colorize(colorNameToRgb('red'),
                            scadCube({size: [snapWidth, this.wallThickness + 1, snapDiam]}))))  // 13-02-2022
                if (isTrue(this.yappSymmetric, snj, 3)) {
                    o = union(o, 
                        translate([this.shellLength - (snapXpos + (snapWidth / 2)) + 0.5, -0.5, snapZposLR],
                            //color("red") cube([snapWidth, 5, wallThickness]);
                            colorize(colorNameToRgb('red'),
                                scadCube({size: [snapWidth, this.wallThickness + 1, snapDiam]}))))  // 13-02-2022
                } // yappSymmetric
            } // yappLeft
    
            if (isTrue(this.yappRight, snj, 2)) {
                o = union(o, 
                    translate([snapXpos - (snapWidth / 2) - 0.5, this.shellWidth - (this.wallThickness - 0.5), snapZposLR],
                        //color("red") cube([snapWidth, 5, wallThickness]);
                        colorize(colorNameToRgb('red'),
                            scadCube({size: [snapWidth, this.wallThickness + 1, snapDiam]}))))  // 13-02-2022
                if (isTrue(this.yappSymmetric, snj, 3)) {
                    o = union(o, 
                        translate([this.shellLength - (snapXpos + (snapWidth / 2) - 0.5), this.shellWidth - (this.wallThickness - 0.5), snapZposLR],
                            //color("red") cube([snapWidth, 5, wallThickness]);
                            colorize(colorNameToRgb('green'),
                                scadCube({size: [snapWidth, this.wallThickness + 1, snapDiam]}))))  // 13-02-2022
                } // yappSymmetric
            } // yappRight
    
            if (isTrue(this.yappBack, snj, 2)) {
                //translate([(wallThickness/2)+2,
                o = union(o, 
                    translate([-0.5, snapYpos-(snapWidth/2)-0.5, snapZposBF],
                        //color("red") cube([5, snapWidth, wallThickness]);
                        colorize(colorNameToRgb('red'),
                            scadCube({size: [this.wallThickness + 1, snapWidth, snapDiam]}))))  // 13-02-2022
                if (isTrue(this.yappSymmetric, snj, 3)) {
                    o = union(o, 
                        translate([-0.5, this.shellWidth - (snapYpos + (snapWidth / 2)) + 0.5, snapZposBF],
                            colorize(colorNameToRgb('red'),
                                scadCube({size: [this.wallThickness + 1, snapWidth, snapDiam]}))))  // 13-02-2022
                } // yappSymmetric
            } // yappBack
    
            if (isTrue(this.yappFront, snj, 2)) {
                //translate([shellLength-(wallThickness/2)-1,
                o = union(o, 
                    translate([this.shellLength - this.wallThickness + 0.5, snapYpos - (snapWidth / 2) - 0.5, snapZposBF],
                        colorize(colorNameToRgb('red'),
                            scadCube({size: [this.wallThickness + 1, snapWidth, snapDiam]}))))  // 13-02-2022
                if (isTrue(this.yappSymmetric, snj, 3))
                {
                    o = union(o, 
                        translate([shellLength-(this.wallThickness-0.5), shellWidth-(snapYpos+(snapWidth/2))+0.5, snapZposBF],
                            colorize(colorNameToRgb('red'),
                                scadCube({size: [this.wallThickness + 1, snapWidth, snapDiam]}))))  // 13-02-2022
                } // yappSymmetric
            } // yappFront
        } // for snj ..
        return o
    } //  printLidSnapJoins()

    //===========================================================
    minkowskiBox(shell, L, W, H, rad, plane, wall) {
        let iRad = getMinRad(rad, this.wallThickness);

        //--------------------------------------------------------
        function minkowskiOuterBox(L, W, H, rad, plane, wall) {
            return roundedCuboid({size:[L + wall * 2,  W + wall * 2, (H * 2) + (plane * 2)], roundRadius: rad})
        }
        //--------------------------------------------------------
        function minkowskiInnerBox(L, W, H, iRad, plane, wall) {
            return roundedCuboid({size:[L, W, H * 2], roundRadius: iRad})
        }
        //--------------------------------------------------------
    
        //echo("Box:", L=L, W=W, H=H, rad=rad, iRad=iRad, wall=wall, plane=plane);
        //echo("Box:", L2=L-(rad*2), W2=W-(rad*2), H2=H-(rad*2), rad=rad, wall=wall);
    
        var o = subtract(minkowskiOuterBox(L, W, H, rad, plane, wall), minkowskiInnerBox(L, W, H, iRad, plane, wall))
        
        if (shell=="base") {
            if (this.baseMounts.length > 0) {
                o = union(o, subtract(printBaseMounts(), minkowskiInnerBox(L, W, H, iRad, plane, wall)))
            }
        }          
        return o
    } //  minkowskiBox()

    //===========================================================
    printPCB(posX, posY, posZ) {
        var o_red = scadCube({size: [this.pcbLength, this.pcbWidth, this.pcbThickness]})
        var o_black = emptyObject()
        if (this.showMarkers) {
            let markerHeight = this.basePlaneThickness + this.baseWallHeight + this.pcbThickness
            let c = cylinder({radius: .5, height: markerHeight, segments: 20}) // black
            let c2 = cylinder({radius: .5, height: this.shellLength + (this.wallThickness * 2), segments: 20}) // red
            o_black =
                union(o_black,
                    translate([0, 0, 0], c),
                    translate([0, this.pcbWidth, 0], c),
                    translate([this.pcbLength, this.pcbWidth, 0], c),
                    translate([this.pcbLength, 0, 0], c))
            o_red =
                union(o_red, 
                    translate([((this.shellLength - (this.wallThickness * 2)) / 2), 0, this.pcbThickness], 
                        rotateY(Math.PI / 2, c2)),
                    translate([((this.shellLength - (this.wallThickness * 2)) / 2), this.pcbWidth, this.pcbThickness],
                        rotateY(Math.PI / 2, c2)))
        } // show_markers

        this.black = union(this.black, translate([posX, posY, posZ], o_black))
        this.red   = union(this.red,   translate([posX, posY, posZ], o_red))

        //--- show inspection X-as
        if (this.inspectX > 0) {
            this.obj = this.obj.map((o) =>
                subtract(o,
                    translate([this.shellLength - this.inspectX, -2, -2],
                        scadCube({size: [this.shellLength, this.shellWidth + 3, this.shellHeight + 3]}))))
        } else if (this.inspectX < 0) {
            this.obj = this.obj.map((o) =>
                subtract(o,
                    translate([-this.shellLength + Math.abs(this.inspectX), -2, -2],
                        scadCube({size: [this.shellLength, this.shellWidth + 3, this.shellHeight + 3]}))))
        }

        //--- show inspection Y-as
        if (this.inspectY > 0) {
            this.obj = this.obj.map((o) =>
                subtract(o,
                    translate([-1, this.inspectY - this.shellWidth, -2],
                        scadCube({size: [this.shellLength + 2, this.shellWidth, this.baseWallHeight + this.basePlaneThickness + 4]}))))
        } else if (this.inspectY < 0) {
            this.obj = this.obj.map((o) =>
                subtract(o,
                    translate([-1, this.shellWidth - Math.abs(this.inspectY), -2],
                        scadCube({size: [this.shellLength + 2, this.shellWidth, this.baseWallHeight + this.basePlaneThickness + 4]}))))
        }
    } // printPCB()

    //===========================================================
    // Place the standoffs and through-PCB pins in the base Box
    pcbHolders() {        
        //-- place pcb Standoff's
        var o = emptyObject()
        for (let i in this.pcbStands) {
            let stand = this.pcbStands[i]
            //echo("pcbHolders:", pcbX=pcbX, pcbY=pcbY, pcbZ=pcbZ);
            //-- [0]posx, [1]posy, [2]{yappBoth|yappLidOnly|yappBaseOnly}
            //--          , [3]{yappHole, YappPin}
            let posx = this.pcbX + stand[0];
            let posy = this.pcbY + stand[1];
            //echo("pcbHolders:", posx=posx, posy=posy);
            if (stand[2] != this.yappLidOnly) {
                o = union(o,
                        translate([posx, posy, this.basePlaneThickness],
                            this.pcbStandoff("green", this.standoffHeight, stand[3])))
            }
        }
        return o
    } // pcbHolders()
    
    //===========================================================
    pcbPushdowns() {
        //-- place pcb Standoff-pushdown
        var o = emptyObject()
        for (let i in this.pcbStands) {
            let pushdown = this.pcbStands[i]
            //echo("pcb_pushdowns:", pcbX=pcbX, pcbY=pcbY, pcbZ=pcbZ);
            //-- [0]posx, [1]posy, [2]{yappBoth|yappLidOnly|yappBaseOnly}
            //--          , [3]{yappHole|YappPin}
            //
            //-- stands in lid are alway's holes!
            let posx = this.pcbX + pushdown[0];
            let posy = (this.pcbY + pushdown[1]);
            let height = (this.baseWallHeight + this.lidWallHeight) - (this.standoffHeight + this.pcbThickness);
            //echo("pcb_pushdowns:", posx=posx, posy=posy);
            if (pushdown[2] != this.yappBaseOnly) {
        //        translate([posx, posy, lidPlaneThickness])
                o = union(o,
                        translate([posx, posy, -this.pcbZlid],
                            this.pcbStandoff("yellow", height, this.yappHole)))
            }
        }
        return o
    } // pcbPushdowns()

    //===========================================================
    cutoutsInXY(type) {
        var self = this
        function actZpos(T) {
            return (T=="base") ? -(self.roundRadius - 1) :
                                 -(self.roundRadius + 2)
        }
        function planeThickness(T) {
            return (T=="base") ? (self.basePlaneThickness + self.roundRadius + 2) :
                                 (self.lidPlaneThickness + self.roundRadius + 2)
        }
        function setCutoutArray(T) {
            return (T=="base") ? self.cutoutsBase : self.cutoutsLid
        }
      
        let zPos = actZpos(type);
        let thickness = planeThickness(type);
  
        //-- [0]pcb_x, [1]pcb_y, [2]width, [3]length, 
        //-- [4]{yappRectangle | yappCircle}
        //-- [5] yappCenter
        let cutoutarray = setCutoutArray(type)
        var o = emptyObject()
        for (let i in cutoutarray) {
            let cutOut = cutoutarray[i]
            if (cutOut[4] == this.yappRectangle && cutOut[5] == this.yappOffset) { // org pcb_x/y
                let posx = this.pcbX + cutOut[0]
                let posy = this.pcbY + cutOut[1]
                o = union(o,
                        translate([this.posx + cutOut[6], this.posy + cutOut[7], this.zPos],
                            rotateZ(degToRad(cutOut[8]),
                                translate([-cutOut[6], -cutOut[7], 0],
                                    scadCube({size: [cutOut[3], cutOut[2], thickness]})))))
            } else if (cutOut[4] == this.yappRectangle && cutOut[5] != this.yappCenter) { // org pcb_x/y
                let posx = this.pcbX + cutOut[0]
                let posy = this.pcbY + cutOut[1]
                o = union(o,
                        translate([posx, posy, zPos],
                            scadCube({size: [cutOut[3], cutOut[2], thickness]})))
            } else if (cutOut[4] == this.yappRectangle && cutOut[5] == this.yappCenter) { // center around x/y
                let posx = this.pcbX + cutOut[0] - cutOut[3] / 2
                let posy = this.pcbY + cutOut[1] - cutOut[2] / 2
                //if (type=="base")
                //      echo("XY-base:", posx=posx, posy=posy, zPos=zPos);
                //else  echo("XY-lid:", posx=posx, posy=posy, zPos=zPos);
                o = union(o,
                        translate([posx, posy, zPos],
                            scadCube({size: [cutOut[3], cutOut[2], thickness]})))
            } else if (cutOut[4] == this.yappCircle) { // circle centered around x/y
                let posx = this.pcbX + cutOut[0]
                let posy = this.pcbY + cutOut[1]
                o = union(o,
                        translate([posx, posy, zPos + thickness / 2],
                            cylinder({radius: cutOut[2] / 2, height: thickness, segments: 20})))
            }
        } // for ..
      
        //--- make screw holes for connectors
        if (type=="base") {
            for (let i in this.connectors) {
                let conn = this.connectors[i]
                //-- screwHead Diameter = screwDiameter * 2.2
                o = union(o,
                        translate([conn[0], conn[1], -this.basePlaneThickness + ((this.basePlaneThickness*2)+1) / 2],
                            cylinder({radius: conn[2]*2.2 / 2, height: (this.basePlaneThickness*2)+1, segments: 20})))

                if (conn[5] == this.yappAllCorners) {
                    //echo("Alle corners hole!");
                    o = union(o,
                            translate([this.shellLength-conn[0], conn[1], -(this.basePlaneThickness - 1) + (this.basePlaneThickness + 3) / 2],
                                cylinder({radius: conn[2]*2.2 / 2, height: this.basePlaneThickness + 3, segments: 20})),
                            translate([this.shellLength-conn[0], this.shellWidth-conn[1], -(this.basePlaneThickness - 1) + (this.basePlaneThickness + 3) / 2],
                                cylinder({radius: conn[2]*2.2 / 2, height: this.basePlaneThickness + 3, segments: 20})),
                            translate([conn[0], this.shellWidth-conn[1], -(this.basePlaneThickness - 1) + (this.basePlaneThickness + 3) / 2],
                                cylinder({radius: conn[2]*2.2 / 2, height: this.basePlaneThickness + 3, segments: 20})))
                }
            } //  for ..
        } // if lid  
        return o
    } //  cutoutsInXY(type)

    //===========================================================
    cutoutsInXZ(type) {      
        function actZpos(T) {
            return (T=="base") ? this.pcbZ : -this.pcbZlid
        }
        //-- place cutOuts in left plane
        //-- [0]pcb_x, [1]pcb_z, [2]width, [3]height, 
        //-- [4]{yappRectangle | yappCircle}, 
        //-- [5]yappCenter           
        //         
        //      [0]pos_x->|
        //                |
        //  F  |          +-----------+  ^ 
        //  R  |          |           |  |
        //  O  |          |<[2]length>|  [3]height
        //  N  |          +-----------+  v   
        //  T  |            ^
        //     |            | [1]z_pos
        //     |            v
        //     +----------------------------- pcb(0,0)
        //
        var o = emptyObject()
        for (let i in this.cutoutsLeft) {
            let cutOut = this.cutoutsLeft[i]
            //echo("XZ (Left):", cutOut);

            if (cutOut[4] == this.yappRectangle && cutOut[5] != this.yappCenter) {
                let posx = this.pcbX + cutOut[0]
                let posz = actZpos(type) + cutOut[1]
                let z = this.standoffHeight + this.pcbThickness + cutOut[1];
                let t = this.baseWallHeight - this.ridgeHeight
                let newH = this.newHeight(type, cutOut[3], z, t);
                o = union(o,
                        translate([posx, -1, posz],
                            scadCube({size: [cutOut[2], this.wallThickness + this.roundRadius + 2, newH]})))
            } else if (cutOut[4] == this.yappRectangle && cutOut[5] == this.yappCenter) {
                let posx = this.pcbX + cutOut[0] - cutOut[2] / 2
                let posz = actZpos(type) + cutOut[1] - cutOut[3] / 2
                let z = this.standoffHeight + this.pcbThickness + cutOut[1] - cutOut[3] / 2
                let t = this.baseWallHeight - this.ridgeHeight - cutOut[3] / 2
                let newH = this.newHeight(type, cutOut[3] / 2, z, t) + cutOut[3] / 2;
                o = union(o,
                        translate([posx, -1, posz],
                            scadCube({size: [cutOut[2], this.wallThickness + this.roundRadius + 2, newH]})))
            } else if (cutOut[4] == this.yappCircle) {
                let posx = this.pcbX + cutOut[0];
                let posz = actZpos(type) + cutOut[1];
                //echo("circle Left:", posx=posx, posz=posz);
                o = union(o,
                        translate([posx, (this.roundRadius + this.wallThickness+2), posz],
                            rotateX(Math.Pi / 2, 
                                cylinder({radius: cutOut[2] / 2, height: this.wallThickness + this.roundRadius + 3, segments: 20}))))
            }
        } //   for cutOut's ..

        //-- [0]pcb_x, [1]pcb_z, [2]width, [3]height, 
        //--                {yappRectangle | yappCircle}, yappCenter           
        for (let i in this.cutoutsRight) {
            let cutOut = this.cutoutsRight[i]
            //echo("XZ (Right):", cutOut);

            if (cutOut[4] == this.yappRectangle && cutOut[5] != yappCenter) {
                let posx = this.pcbX + cutOut[0]
                let posz = actZpos(type) + cutOut[1]
                let z = this.standoffHeight + this.pcbThickness + cutOut[1];
                let t = this.baseWallHeight - this.ridgeHeight
                newH = this.newHeight(type, cutOut[3], z, t);
                o = union(o,
                    translate([posx, this.shellWidth - (this.wallThickness + this.roundRadius + 1), posz],
                        colorize(colorNameToRgb('orange'),
                            scadCube({size:[cutOut[2], this.wallThickness + this.roundRadius + 2, newH]}))))
            }  else if (cutOut[4] == this.yappRectangle && cutOut[5]==yappCenter) {
                let posx = this.pcbX + cutOut[0] - cutOut[2] / 2
                let posz = actZpos(type) + cutOut[1] - cutOut[3] / 2
                let z = this.standoffHeight + this.pcbThickness + cutOut[1] - cutOut[3] / 2
                let t = this.baseWallHeight - this.ridgeHeight - cutOut[3] / 2
                newH = this.newHeight(type, cutOut[3] / 2, z, t) + cutOut[3] / 2;
                o = union(o,
                        translate([posx, this.shellWidth - (this.wallThickness + this.roundRadius + 1), posz],
                            colorize(colorNameToRgb('orange'),
                                scadCube({size: [cutOut[2], this.wallThickness + this.roundRadius + 2, newH]}))))
            } else if (cutOut[4] == this.yappCircle) {
                let posx = this.pcbX + cutOut[0]
                let posz = actZpos(type) + cutOut[1]
                //echo("circle Right:", posx=posx, posz=posz);
                o = union(o,
                    translate([posx, shellWidth+2, posz],
                        rotateX(Math.Pi / 2, 
                            colorize(colorNameToRgb('orange'),
                                cylinder({radius: cutOut[2] / 2, height: this.wallThickness + this.roundRadius + 3, segments: 20})))))
            }        
      } //  for ...
      return o
    } // cutoutsInXZ()

    //===========================================================
    cutoutsInYZ(type) { 
        var self = this     
        function actZpos(T) {
            return (T=="base") ? self.pcbZ : -self.pcbZlid
        }

        var o = emptyObject()
        for (let i in this.cutoutsFront) {
            let cutOut = this.cutoutsFront[i]
            // (0) = posy
            // (1) = posz
            // (2) = width
            // (3) = height
            // (4) = { yappRectangle | yappCircle }
            // (5) = { yappCenter }

            //echo("YZ (Front):", plane=type, cutOut);

            if (cutOut[4] == this.yappRectangle && cutOut[5] != this.yappCenter) {
                let posy = this.pcbY + cutOut[0]
                let posz = actZpos(type) + cutOut[1]
                let z = this.standoffHeight + this.pcbThickness + cutOut[1];
                let t = this.baseWallHeight - this.ridgeHeight
                let newH = this.newHeight(type, cutOut[3], z, t);
                o = union(o,
                    translate([this.shellLength - this.wallThickness - this.roundRadius - 1, posy, posz],
                        colorize(colorNameToRgb('purple'),
                            scadCube({size: [this.wallThickness + this.roundRadius + 2, cutOut[2], newH]}))))
            } else if (cutOut[4] == this.yappRectangle && cutOut[5] == this.yappCenter) {
                let posy = this.pcbY + cutOut[0] - cutOut[2] / 2
                let posz = actZpos(type) + cutOut[1] - cutOut[3] / 2
                let z = this.standoffHeight + this.pcbThickness + cutOut[1] - cutOut[3] / 2
                let t = this.baseWallHeight - this.ridgeHeight - cutOut[3] / 2
                let newH = this.newHeight(type, cutOut[3] / 2, z, t) + cutOut[3] / 2;
                o = union(o,
                    translate([this.shellLength - this.wallThickness - this.roundRadius - 1, posy, posz],
                        colorize(colorNameToRgb('purple'),
                            scadCube({size: [this.wallThickness + this.roundRadius + 2, cutOut[2], newH]}))))
            } else if (cutOut[4] == this.yappCircle) {
                let posy = this.pcbY + cutOut[0]
                let posz = actZpos(type) + cutOut[1]
                o = union(o,
                        translate([this.shellLength - this.wallThickness - this.roundRadius - 1, posy, posz],
                            rotateY(Math.Pi / 2, 
                                colorize(colorNameToRgb('purple'),
                                    cylinder({radius: cutOut[2] / 2, height: this.wallThickness + this.roundRadius + 2, segments: 20})))))
            }
        } //   for cutOut's ..

        //-- [0]pcb_x, [1]pcb_z, [2]width, [3]height, 
        //--                {yappRectangle | yappCircle}, yappCenter           
        for (let i in this.cutoutsBack) {
            let cutOut = this.cutoutsBack[i]
            //echo("YZ (Back):", cutOut);

            if (cutOut[4] == this.yappRectangle && cutOut[5] != this.yappCenter) {
                let posy = this.pcbY + cutOut[0]
                let posz = actZpos(type) + cutOut[1]
                let z = this.standoffHeight + this.pcbThickness + cutOut[1];
                let t = this.baseWallHeight - this.ridgeHeight
                let newH = this.newHeight(type, cutOut[3], z, t);
                o = union(o,
                        translate([-1 , posy, posz],
                            colorize(colorNameToRgb('blue'),
                                scadCube({size: [this.wallThickness + this.roundRadius + 2, cutOut[2], newH]}))))
            } else if (cutOut[4] == this.yappRectangle && cutOut[5] == this.yappCenter) {
                let posy = this.pcbY + cutOut[0] - cutOut[2] / 2
                let posz = actZpos(type) + cutOut[1] - cutOut[3] / 2
                let z = this.standoffHeight + this.pcbThickness + cutOut[1] - cutOut[3] / 2
                let t = this.baseWallHeight - this.ridgeHeight - cutOut[3] / 2
                let newH = this.newHeight(type, cutOut[3] / 2, z, t) + cutOut[3] / 2;
                o = union(o,
                    translate([-1, posy, posz],
                        colorize(colorNameToRgb('orange'),
                            scadCube({size: [this.wallThickness + this.roundRadius + 2, cutOut[2], newH]}))))
            } else if (cutOut[4] == this.yappCircle) {
                let posy = this.pcbY + cutOut[0]
                let posz = actZpos(type) + cutOut[1]
                //echo("circle Back:", posy=posy, posz=posz);
                o = union(o,
                    translate([-1, posy, posz],
                        rotateY(Math.Pi / 2,
                            colorize(colorNameToRgb('orange'),
                                cylinder({radius: cutOut[2] / 2, height: this.wallThickness + 3, segments: 20})))))
            }
        } // for ..
        return o
    } // cutoutsInYZ()

    //===========================================================
    subtractLabels(plane, side) {
        var o = emptyObject()
        for (let i in this.labelsPlane) {
            let label = this.labelsPlane[i]
            // [0]x_pos, [1]y_pos, [2]orientation, [3]plane, [4]font, [5]size, [6]"text" 

            if (plane=="base" && side=="base" && label[3]=="base") {
                o = union(o,
                    translate([this.shellLength - label[0], label[1], -this.basePlaneThickness/2],
                        rotateZ(degToRad(label[2]),
                            mirrorX(
                                scadText(label[6], this.lidPlaneThickness, label[5])))))
                                    //font=label[4], size=label[5], direction="ltr", valign="bottom");
            } //  if base/base
            if (plane=="base" && side=="front" && label[3]=="front") {
                o = union(o,
                    translate([this.shellLength - this.wallThickness / 2, label[0], label[1]],
                        rotate([Math.PI / 2, 0, degToRad(90 + label[2])],
                            scadText(label[6], this.lidPlaneThickness, label[5]))))
                                //font=label[4], size=label[5], direction="ltr", valign="bottom");    
            } //  if base/front
            if (plane=="base" && side=="back" && label[3]=="back") {
                o = union(o,
                    translate([-this.wallThickness / 2, this.shellWidth - label[0], label[1]],
                        rotate([Math.PI / 2, 0, degToRad(90 + label[2])],
                            mirrorX(
                                scadText(label[6], this.lidPlaneThickness, label[5])))))
            } //  if base/back
            if (plane=="base" && side=="left" && label[3]=="left") {
                o = union(o,
                    translate([label[0], this.wallThickness / 2, label[1]], 
                        rotate([Math.PI / 2, degToRad(label[2], 0)],
                            scadText(label[6], this.lidPlaneThickness, label[5]))))
            } //  if..base/left
            if (plane=="base" && side=="right" && label[3]=="right") {
                o = union(o,
                    translate([this.shellLength - label[0], this.shellWidth + this.wallThickness / 2, label[1]],
                        rotate([Math.PI / 2, degToRad(label[2], 0)],
                            mirrorX(
                                scadText(label[6], this.lidPlaneThickness, label[5])))))
            } //  if..base/right
            if (plane=="lid" && side=="lid" && label[3]=="lid") {
                o = union(o,
                    translate([label[0], label[1], -this.lidPlaneThickness/2],
                        rotateZ(degToRad(label[2]),
                            scadText(label[6], this.lidPlaneThickness, label[5]))))
            } //  if lid/lid
            if (plane=="lid" && side=="front" && label[3]=="front") {
                //translate([shellLength+label[0], (shellHeight*-1)-label[1], 10+(lidPlaneThickness*-0.5)]) 
                o = union(o,
                    translate([this.shellLength - this.wallThickness / 2, label[0], -this.shellHeight + label[1]],
                        rotate([Math.PI / 2, 0, degToRad(90 + label[2])],
                            scadText(label[6], this.lidPlaneThickness, label[5]))))
            } //  if lid/front
            if (plane=="lid" && side=="back" && label[3]=="back") {
                o = union(o,
                    translate([-this.wallThickness / 2, this.shellWidth - label[0], -this.shellHeight + label[1]],
                        rotate([Math.PI / 2, 0, degToRad(90 + label[2])],
                            mirrorX(
                                scadText(label[6], this.lidPlaneThickness, label[5])))))
            } //  if lid/back
            if (plane=="lid" && side=="left" && label[3]=="left") {
                o = union(o,
                    translate([label[0], this.lidPlaneThickness/2, -this.shellHeight + label[1]],
                        rotate([Math.PI / 2, degToRad(label[2]), 0],
                            scadText(label[6], this.lidPlaneThickness, label[5]))))
            } //  if..lid/left
            if (plane=="lid" && side=="right" && label[3]=="right") {
                o = union(o,
                translate([this.shellLength - label[0], this.shellWidth + wallThickness / 2, -this.shellHeight + label[1]], 
                    rotate([Math.PI / 2, degToRad(label[2]), 0],
                        mirrorX(
                            scadText(label[6], this.lidPlaneThickness, label[5])))))
            } //  if..lid/right
        } // for labels...
        return o
    } //  subtractLabels()

    //===========================================================
    baseShell() {
        //-------------------------------------------------------------------
        var self = this
        function subtrbaseRidge(L, W, H, posZ, rad) {
            let wall = self.wallThickness / 2 + self.ridgeSlack / 2  // 26-02-2022
            let oRad = rad
            let iRad = getMinRad(oRad, wall)

            return subtract(
                translate([0,0,posZ],
                    //color("blue")
                    //-- outside of ridge
                    extrudeLinear({height: H + 1},
                        roundedRectangle({size: [L + self.wallThickness + 1, W + self.wallThickness + 1], roundRadius: rad}))),
                //-- hollow inside
                translate([0, 0, posZ],
                    extrudeLinear({height: H + 1},
                        roundedRectangle({size: [L, W - self.ridgeSlack], roundRadius: iRad}))))          
        } //  subtrbaseRidge()

        //-------------------------------------------------------------------
   
        let posZ00 = this.baseWallHeight + this.basePlaneThickness
        // udif temp
        //echo("base:", posZ00=posZ00);
        var o =
            union(
                translate([this.shellLength / 2, this.shellWidth / 2, posZ00],
                    subtract(
                        this.minkowskiBox("base", this.shellInsideLength, this.shellInsideWidth, this.baseWallHeight, this.roundRadius, this.basePlaneThickness, this.wallThickness),
                        this.hideBaseWalls ? 
                            translate([-1, -1, this.shellHeight/2],
                                cuboid({size: [this.shellLength + 3, this.shellWidth + 3, this.shellHeight + this.baseWallHeight * 2 - this.basePlaneThickness + this.roundRadius]})) :
                            union(
                                translate([-1, -1, this.shellHeight/2],
                                    cuboid({size: [this.shellLength + 3, this.shellWidth + 3, this.shellHeight]})),
                                //-- build ridge
                                subtrbaseRidge(this.shellInsideLength + this.wallThickness, this.shellInsideWidth + this.wallThickness, 
                                               this.ridgeHeight, -this.ridgeHeight, this.roundRadius)
                            )
                    ),
                ),
                this.pcbHolders(),
                (this.ridgeHeight < 3) ? console.log("ridgeHeight < 3mm: no SnapJoins possible") : this.printBaseSnapJoins(),
                this.shellConnectors("base")
            )
        return o
    } //  baseShell()

//===========================================================
    lidShell() {
        var self = this
        function newRidge(p1) {
            return (p1 > 0.5) ? p1 - 0.5 : p1
        }

        //-------------------------------------------------------------------
        function addlidRidge(L, W, H, rad) {
            let wall = self.wallThickness / 2
            let oRad = rad;
            let iRad = getMinRad(oRad, wall);
        
            //echo("Ridge:", L=L, W=W, H=H, rad=rad, wallThickness=wallThickness);
            //echo("Ridge:", L2=L-(rad*2), W2=W-(rad*2), H2=H, oRad=oRad, iRad=iRad);

            return translate([0,0,-(H-0.005)],
                subtract(
                    extrudeLinear({height: H + 1},
                        roundedRectangle({size: [L + self.wallThickness, W + self.wallThickness], roundRadius: rad})),
                    //-- hollow inside
                    translate([0, 0, -0.5],
                        extrudeLinear({height: H + 2},
                            roundedRectangle({size: [L, W + self.ridgeSlack / 2], roundRadius: iRad})))
                )
            )
        } //  addlidRidge()
        //-------------------------------------------------------------------

        let posZ00 = this.lidWallHeight + this.lidPlaneThickness;
        //echo("lid:", posZ00=posZ00);

        var o =
            union(
                translate([this.shellLength / 2, this.shellWidth / 2, -posZ00],
                    union(
                        subtract(
                            this.minkowskiBox("lid", this.shellInsideLength, this.shellInsideWidth, this.lidWallHeight,  this.roundRadius, this.lidPlaneThickness, this.wallThickness),
                            this.hideLidWalls ?
                            //--- cutoff wall
                            translate([-((this.shellLength / 2) + 2), -(this.shellWidth / 2), -this.shellHeight],
                                colorize(colorNameToRgb('black'),
                                    scadCube({size: [(this.shellLength + 4), (this.shellWidth + 4), this.shellHeight + this.lidWallHeight + this.lidPlaneThickness - this.roundRadius]}))) :
                            //--- cutoff lower halve
                            translate([-((this.shellLength / 2) + 2), -((this.shellWidth / 2) + 2), -this.shellHeight],
                                colorize(colorNameToRgb('black'),
                                    scadCube({size: [this.shellLength + 3, this.shellWidth + 3, this.shellHeight]})))
                        ),
                        !this.hideLidWalls ? 
                            addlidRidge(this.shellInsideLength + this.wallThickness, this.shellInsideWidth + this.wallThickness, newRidge(this.ridgeHeight), this.roundRadius) :
                            emptyObject()
                    )
                ),
                this.pcbPushdowns(),
                this.shellConnectors("lid"))
        return o
    } //  lidShell()

    //===========================================================
    pcbStandoff(color, height, type) {
        var self = this
        function standoff(color) {
            return colorize(colorNameToRgb(color),
                cylinder({radius: self.standoffDiameter / 2, height: height, center: [0, 0, height / 2], segments: 20}))
        } // standoff()
        
        function standPin(color) {
            let h = self.pcbThickness + self.standoffHeight + self.pinDiameter
            return colorize(colorNameToRgb(color),
                cylinder({radius: self.pinDiameter / 2, height: h, center: [0, 0, h / 2], segments: 20}))
        } // standPin()
        
        function standHole(color) {
            let h = (self.pcbThickness*2)+height+0.02
            return colorize(colorNameToRgb(color),
                cylinder({radius: (self.pinDiameter + .2 + self.pinHoleSlack) / 2, height: h, center: [0, 0, h/2], segments: 20}))
        } // standhole()
        
        return (type == this.yappPin) ?
            // pin
            union(
                standoff(color),
                standPin(color)) :
            // hole
            subtract(
                standoff(color),
                standHole(color))        
    } // pcbStandoff()

    //===========================================================
    //-- d1 = screw Diameter
    //-- d2 = insert Diameter
    //-- d3 = outside diameter
    connector(plane, x, y, d1, d2, d3) {
        if (plane=="base") {
            let hb = this.baseWallHeight + this.basePlaneThickness;
            return translate([x, y, 0],
                subtract(
                    cylinder({radius: d3 / 2, height: hb, center:[0, 0, hb / 2], segments: 20}),
                    //-- screw head Hole --
                    cylinder({radius: d1 * 2.2 / 2, height: hb - d1, center:[0, 0, (hb - d1) / 2], segments: 20}),
                    //-- screwHole --
                    cylinder({radius: d1 * 1.2 / 2, height: hb + d1, center:[0, 0, (hb + d1) / 2], segments: 20})))
        } //  if base
  
        if (plane=="lid") {
            let ht= this.lidWallHeight
            return translate([x, y, this.lidWallHeight - this.lidPlaneThickness],
                subtract(
                    //-- outside Diameter --
                    cylinder({radius: d3 / 2, height: ht, center:[0, 0, ht / 2], segments: 20}),
                    //-- insert --
                    cylinder({radius: d2 / 2, height: ht, center:[0, 0, ht / 2], segments: 20})))
        } //  if lid
    } // connector()

    //===========================================================
    shellConnectors(plane) {
        var o = emptyObject()
        if (!(plane=="base" || plane=="lid")) {
            return o
        }
        for (let i in this.connectors) {
            let conn = this.connectors[i]
            //-- [0] x-pos
            //-- [1] y-pos
            //-- [2] screwDiameter
            //-- [3] insertDiameter, 
            //-- [4] outsideDiameter
    
            let outD = minOutside(conn[4], conn[3])
            //echo("minOut:", rcvrD=conn[4], outD=outD);
    
            //echo("baseConnector:", conn, outD=outD);
            //--connector(plane, x,       y,       scrwD,   rcvrD,   outD) --  
            //echo("lidConnector:", conn);
            //--connector(lid    x,       y,       scrwD,   rcvrD,   outD)  
            o = union(o, connector(plane, conn[0], conn[1], conn[2], conn[3], outD))
            if (conn[5] == this.yappAllCorners) {
                //echo("allCorners:");
                o = union(o,
                    connector(plane, this.shellLength - conn[0],                   conn[1], conn[2], conn[3], outD),
                    connector(plane, this.shellLength - conn[0], this.shellWidth - conn[1], conn[2], conn[3], outD),
                    connector(plane,                    conn[0], this.shellWidth - conn[1], conn[2], conn[3], outD))
            }
        } // for ..
        return o
    } // shellConnectors()

    //===========================================================
    cutoutSquare(color, w, h) {
        return
            colorize(colorNameToRgb(color),
                scadCube({size:[this.wallThickness + 2, w, h]}))
    } // cutoutSquare()

    //===========================================================
    showOrientation() {
        if (this.show_orientation) {
            this.blue =
                union(this.blue, 
                    translate([-10, 10, 0],
                        rotateZ(Math.PI / 2,
                            scadText("BACK", 1, 5))),
                    translate([this.shellLength + 15, 10, 0],
                        rotateZ(Math.PI / 2,
                            scadText("FRONT", 1, 5))),
                    translate([15, -(15 + this.shiftLid), 0],
                        scadText("LEFT", 1, 5)))
        }
    } // showOrientation()

    //===========================================================
    YAPPgenerate() {
        console.log("OpenJACSD YAPP==========================================")
        console.log("OpenJACSD YAPP: wallThickness=", this.wallThickness)
        console.log("OpenJACSD YAPP: roundRadius=", this.roundRadius)
        console.log("OpenJACSD YAPP: shellLength=", this.shellLength)
        console.log("OpenJACSD YAPP: shellInsideLength=", this.shellInsideLength)
        console.log("OpenJACSD YAPP: shellWidth=", this.shellWidth)
        console.log("OpenJACSD YAPP: shellInsideWidth=", this.shellInsideWidth)
        console.log("OpenJACSD YAPP: shellHeight=", this.shellHeight)
        console.log("OpenJACSD YAPP: shellInsideHeight=", this.shellInsideHeight)
        console.log("OpenJACSD YAPP==========================================")
        console.log("OpenJACSD YAPP: pcbX=", this.pcbX)
        console.log("OpenJACSD YAPP: pcbY=", this.pcbY)
        console.log("OpenJACSD YAPP: pcbZ=", this.pcbZ)
        console.log("OpenJACSD YAPP: pcbZlid=", this.pcbZlid)
        console.log("OpenJACSD YAPP==========================================")
        console.log("OpenJACSD YAPP: roundRadius=", this.roundRadius)
        console.log("OpenJACSD YAPP: shiftLid=", this.shiftLid)
        console.log("OpenJACSD YAPP: onLidGap=", this.onLidGap)
        console.log("OpenJACSD YAPP==========================================")
        console.log("OpenJACSD YAPP:")
        console.log("OpenJACSD YAPP:   portions copyright by Willem Aandewiel")
        console.log("OpenJACSD YAPP==========================================")
        // $fn=25;
        var o = emptyObject()
            
        if (this.showMarkers) {
            //-- box[0,0] marker --
            this.blue =
                union(this.blue,
                    translate([0, 0, 8],
                        cylinder({radius: .5, height: 20, segments: 20})))
        } //  showMarkers
      
        if (this.printBaseShell) {
            if (this.showPCB) {
                this.printPCB(this.pcbX, this.pcbY, this.basePlaneThickness + this.standoffHeight)
            }
            this.blue = union(this.blue,
                //baseHookOutside(),
                subtract(  // (a)
                    this.baseShell(),
          
                    this.cutoutsInXY("base"),
                    this.cutoutsInXZ("base"),
                    this.cutoutsInYZ("base"),

                    colorize(colorNameToRgb('blue'), this.subtractLabels("base", "base")),
                    colorize(colorNameToRgb('blue'), this.subtractLabels("base", "front")),
                    colorize(colorNameToRgb('blue'), this.subtractLabels("base", "back")),
                    colorize(colorNameToRgb('blue'), this.subtractLabels("base", "left")),
                    colorize(colorNameToRgb('blue'), this.subtractLabels("base", "right")),

                    //--- show inspection X-as
                    //(this.inspectX > 0) ?
                    //    translate([this.shellLength - this.inspectX, -2, -2], 
                    //        scadCube({size: [this.shellLength, this.shellWidth + 10, this.shellHeight + 3]})) :
                    //(this.inspectX < 0) ?
                    //    translate([-this.shellLength + abs(this.inspectX), -2-10, -2], 
                    //        scadCube({size: [this.shellLength, this.shellWidth + 20, this.shellHeight + 3]})) : emptyObject(),

                    //--- show inspection Y-as
                    //(this.inspectY > 0) ?
                    //    translate([-1, this.inspectY - this.shellWidth, -2], 
                    //        scadCube([this.shellLength + 2, this.shellWidth, this.baseWallHeight + this.basePlaneThickness + 4])) :
                    //(this.inspectY < 0) ?
                    //    translate([-1, this.shellWidth - abs(this.inspectY), -2], 
                    //        scadCube([this.shellLength + 2, this.shellWidth, this.baseWallHeight + this.basePlaneThickness + 4])) : emptyObject()),
                )
                //baseHookInside(),
            )
            this.showOrientation()
        } // if printBaseShell ..
    
        if (this.printLidShell) {
            if (this.showSideBySide) {
            //-- lid side-by-side
                o = union(o,
                    mirrorZ(
                        mirrorY(
                            translate([0, (5 + this.shellWidth + (this.shiftLid / 2))*-2, 0],
                            union(emptyObject(),
                                    //lidHookInside(),
                                    subtract(
                                        this.lidShell(),
                        
                                        this.cutoutsInXY("lid"),
                                        this.cutoutsInXZ("lid"),
                                        this.cutoutsInYZ("lid"),
                                        (this.ridgeHeight < 3) ? console.log("ridgeHeight < 3mm: no SnapJoins possible") : this.printLidSnapJoins(),
                                        colorize(colorNameToRgb('red'), this.subtractLabels("lid", "lid")),
                                        colorize(colorNameToRgb('red'), this.subtractLabels("lid", "front")),
                                        colorize(colorNameToRgb('red'), this.subtractLabels("lid", "back")),
                                        colorize(colorNameToRgb('red'), this.subtractLabels("lid", "left")),
                                        colorize(colorNameToRgb('red'), this.subtractLabels("lid", "right")),

                                        //--- show inspection X-as
                                        //(this.inspectX > 0) ?
                                        //    translate([this.shellLength - this.inspectX, -2, -(this.lidWallHeight + this.lidPlaneThickness + this.ridgeHeight + 2)],
                                        //        scadCube({size:[this.shellLength, this.shellWidth + 3,  this.shellHeight + this.ridgeHeight + this.lidPlaneThickness + 4]})) :
                                        //(this.inspectX < 0) ?
                                        //    translate([-this.shellLength + abs(this.inspectX), -2, -(this.lidWallHeight + this.lidPlaneThickness+ this.ridgeHeight + 2)],
                                        //        scadCube({size:[this.shellLength, this.shellWidth + 3,  this.shellHeight + this.ridgeHeight + this.lidPlaneThickness + 4]})) : emptyObject(),

                                        //--- show inspection Y-as
                                        //(this.inspectY > 0) ?
                                        //    translate([-1, this.inspectY - this.shellWidth, -(this.lidWallHeight + this.lidPlaneThickness + this.ridgeHeight + 2)],
                                        //        scadCube({size:[this.shellLength + 2, this.shellWidth,  this.lidWallHeight + this.ridgeHeight + this.lidPlaneThickness + 4]})) :
                                        //(this.inspectY < 0) ? 
                                        //    translate([-1, this.shellWidth - abs(this.inspectY), -2],
                                        //        scadCube({size:[this.shellLength + 2, this.shellWidth,  this.baseWallHeight + this.basePlaneThickness + 4]})) : emptyObject()),
                                    ),
                                    //lidHookOutside(),
                        
                                    (this.show_orientation) ?
                                        translate([this.shellLength - 15, -15, 0],
                                                mirrorX(
                                                    scadText("LEFT", 1, 5))) :
                                        emptyObject()
                                )))))
            } else { // lid on base
                o = union(o,
                        translate([0, 0, this.baseWallHeight + this.basePlaneThickness + this.lidWallHeight + this.lidPlaneThickness + this.onLidGap],
                        //lidHookOutside(),
                            subtract(  // (t2)
                                this.lidShell(),

                                this.cutoutsInXY("lid"),
                                this.cutoutsInXZ("lid"),
                                this.cutoutsInYZ("lid"),
                                (this.ridgeHeight < 3) ? console.log("ridgeHeight < 3mm: no SnapJoins possible") : this.printLidSnapJoins(),
                                colorize(colorNameToRgb('red'), this.subtractLabels("lid", "lid")),
                                colorize(colorNameToRgb('red'), this.subtractLabels("lid", "front")),
                                colorize(colorNameToRgb('red'), this.subtractLabels("lid", "back")),
                                colorize(colorNameToRgb('red'), this.subtractLabels("lid", "left")),
                                colorize(colorNameToRgb('red'), this.subtractLabels("lid", "right")),

                                //--- show inspection X-as
                                (this.inspectX > 0) ?
                                    translate([shellLength-inspectX, -2, (shellHeight+lidPlaneThickness+ridgeHeight+4)*-1],
                                        scadCube({size:[this.shellLength, this.shellWidth + 3,  (this.ShellHeight + this.ridgeHeight + this.lidPlaneThickness) * 2 + this.onLidGap]})) :
                                (this.inspectX < 0) ? 
                                    translate([-this.shellLength* + abs(this.inspectX), -2, -this.shellHeight],
                                        scadCube({size:[this.shellLength, this.shellWidth + 3,  this.ShellHeight + this.onLidGap]})) : emptyObject(),

                                //--- show inspection Y-as
                                (this.inspectY > 0) ?
                                    translate([-1, this.inspectY - this.shellWidth, -(this.lidWallHeight + this.ridgeHeight + this.lidPlaneThickness + 2)],
                                        scadCube({size:[this.shellLength + 2, this.shellWidth, this.lidWallHeight + this.lidPlaneThickness + this.ridgeHeight + 4]})) :
                                (this.inspectY < 0) ? 
                                    translate([-1, this.shellWidth - abs(this.inspectY), -2],
                                        scadCube({size:[this.shellLength + 2, this.shellWidth, this.baseWallHeight + this.basePlaneThicknesst + 4]})) : emptyObject()
                            )
                        )
                        //lidHookInside();
                    )
            } // lid on top off Base
            this.blue = union(this.blue, o)
        } // printLidShell()
    } //  YAPPgenerate()

    newHeight(T, h, z, t) {
        return (((h + z) > t) && (T=="base")) ? t + this.standoffHeight : h;
    }
    
} // class Box

//===========================================================
function getMinRad(p1, wall) {
    return (p1 <= wall) ? 1 : p1 - wall;
}

function isTrue(w, aw, from) {
    return  ( w==aw[from] 
        || w==aw[from+1]  
        || w==aw[from+2]  
        || w==aw[from+3]  
        || w==aw[from+4]  
        || w==aw[from+5]  
        || w==aw[from+6] ) ;
}

function minOutside(o, d) {
    return ((((d*2)+1)>=o) ? (d*2)+1 : o);
}

function lowestVal(v1, minV) {
    return ((v1<minV) ? minV : v1);
}

function highestVal(v1, maxV) {
    return ((v1>maxV) ? maxV : v1);
}
//function betweenVal(minV, maxV, v1) = (v1 >= minV && v1 <= maxV) ? true : false);
//function maxVal(maxV, v1, btwn) = (!btwn && v1 < minV) ? minV : v1);
//===========================================================
//-------------------------------------------------------------------

function roundedRect({x1, x2, y1, y2, h, r} = {}) {
    // place 4 circles in the corners, with the given radius
    return extrudeLinear({height: h}, hull([
        translate([(x1 + r), (y1 + r), 0], circle( {radius: r})),
        translate([(x1 + r), (y2 + r), 0], circle( {radius: r})),
        translate([(x2 + r), (y2 + r), 0], circle( {radius: r})),
        translate([(x2 + r), (y1 + r), 0], circle( {radius: r}))
    ]));
} // roundRect()

function oneMount(bm, scrwX1pos, scrwX2pos)
{
    // [0]=pos, [1]=scrwDiameter, [2]=len
    outRadius = bm[1];  // rad := diameter (r=6 := d=6)
    bmX1pos   = scrwX1pos-bm[1];
    bmX2pos   = scrwX2pos-outRadius;
    bmYpos    = -(bm[1] * 2);
    bmLen     =  (bm[1] * 4) + bmYpos;

    return subtract(colorize(colorNameToRgb('red'), roundedRect(
            {x1 : bmX1pos, x2 : bmX2pos,
             y1 : bmYpos, y2 : (bmYpos + bmLen),
              h : bm[3], r : outRadius})),
        translate([0, -bm[1], -1],
            extrudeLinear({height : (bm[3]+2)}, 
                hull([
                    translate([scrwX1pos,0, 4],
                        colorize(colorNameToRgb('blue'),
                            circle({radius : bm[1]/2}))),
                    translate([scrwX2pos,0, -4],
                        colorize(colorNameToRgb('blue'),
                            circle({radius : bm[1]/2})))
                ]) // hull
            ) //  extrude
        ) //  translate
    ) // difference..
} //  oneMount()

function emptyObject() {
    //return intersect(cube(), translate([0, 0, 100], cube()))
    return geom3.create()
}

//--------------------------------------------------------------------
function calcScrwPos(p, l, ax, c) {
    return (c==1) ? (ax / 2) - (l / 2) : p;
}
function maxWidth(w, r, l) {
    return (w > (l - (r * 4))) ? l - (r * 4) : w;
}
function minPos(p, r) {
    return (p < (r * 2)) ? r*2 : p;
}
function maxPos(p, w, r, mL) {
    return ((p + w) > (mL - (r * 2))) ? mL - (w + (r * 2)) : p;
}
//--------------------------------------------------------------------

// Build text by creating the font strokes (2D), then extruding up (3D).
// This function was taken from:
// https://github.com/jscad/OpenJSCAD.org/blob/d57e0a4a6d5dc75ebbdbc5597a3df2f5ad12c7ef/packages/examples/core/text/text.js

const buildFlatText = (message, extrusionHeight, characterLineWidth) => {
    if (message === undefined || message.length === 0) return []
  
    const lineRadius = characterLineWidth / 2
    const lineCorner = circle({ radius: lineRadius })
  
    const lineSegmentPointArrays = vectorText({ x: 0, y: 0, input: message }) // line segments for each character
    const lineSegments = []
    lineSegmentPointArrays.forEach((segmentPoints) => { // process the line segment
      const corners = segmentPoints.map((point) => translate(point, lineCorner))
      lineSegments.push(hullChain(corners))
    })
    const message2D = union(lineSegments)
    const message3D = extrudeLinear({ height: extrusionHeight }, message2D)
    return translate([0, 0, 0], message3D)
  }
  
const scadText = (message, height = 1, size = 1) => {
    //return rotateY(0*Math.PI/2, buildFlatText(message, 1, 1))
    let t = size * 0.04
    return scale([t, t, 1], buildFlatText(message, height, 3))
}

const scadCube = (p) => {
    p.center = [p.size[0]/2, p.size[1]/2, p.size[2]/2]
    return cuboid(p)
}