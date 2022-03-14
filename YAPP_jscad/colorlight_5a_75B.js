
//
// OpenJSCAD port and original code Copyright (c) 2022 Udi Finkelstein
//

const yapp_jscad = require('./lib/yapp-jscad.js')

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

    var obj = new yapp_jscad.Box()
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

function i(m) {
    return m*25.4
}

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
    obj.pcbWidth          = i(3.6);
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
                , [obj.pcbLength - i(2), obj.pcbWidth-i(1.175), i(0.1), i(0.2), obj.yappRectangle, obj.yappOffset, i(0.05), i(0.05), -0]
                , [obj.pcbLength - i(2.54), obj.pcbWidth-i(1.63), i(0.1), i(0.4), obj.yappRectangle, obj.yappOffset, i(0.05), i(0.05), -90]
                , [obj.pcbLength-i(0.6), obj.pcbWidth-i(1.1)-i(2.15), i(2.15), i(0.6), obj.yappRectangle]
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

    //-- front plane  -- origin is pcb[0,0,0]
    // (0) = posy
    // (1) = posz
    // (2) = width
    // (3) = height
    // (4) = { yappRectangle | yappCircle }
    // (5) = { yappCenter }
    obj.cutoutsFront =  [
        [obj.pcbWidth - i(1.1) - i(2.15), -5, i(2.15), 15+obj.lidWallHeight, obj.yappRectangle]
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
    obj.cutoutsBack = [
                //  [31.5-1, -1, 12.2+2, 12, obj.yappRectangle]  // USB
                //, [3.5-1,  -1, 12,     11, obj.yappRectangle]  // Power Jack
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
                  [10,  65,  0, "lid", "Arial:style=bold", 7, "Colorlight 5A-75B" ]
                , [57, 33,  90, "lid", "Liberation Mono:style=bold", 5, "YAPP" ]
                , [80, 43,  90, "lid", "Liberation Mono:style=bold", 5, "JTAG" ]
                , [90, 48 + i(0.3), 180, "lid", "Liberation Mono:style=bold", 2, "TCK" ]
                , [90, 48 + i(0.2), 180, "lid", "Liberation Mono:style=bold", 2, "TMS" ]
                , [90, 48 + i(0.1), 180, "lid", "Liberation Mono:style=bold", 2, "TDI" ]
                , [90, 48 + i(0.0), 180, "lid", "Liberation Mono:style=bold", 2, "TDO" ]
                , [98 + i(0.1), 68, 90, "lid", "Liberation Mono:style=bold", 2, "GND" ]
                , [98 + i(0.0), 68, 90, "lid", "Liberation Mono:style=bold", 2, "3V3" ]
];

}

module.exports = { main, getParameterDefinitions }
