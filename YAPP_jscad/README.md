OpenJSCADS Box generator
========================
This project is based on https://github.com/mrWheel/YAPP_Box , which was written in OpenSCAD.
I have rewritten the code for OpenJSCAD, but this is still work in progress.

Here is a link to the current snapshot:
[ColorLight 5A-75B Box](https://openjscad.xyz/?uri=https://raw.githubusercontent.com/udif/openjscad-objects-V2/master/YAPP_jscad/colorlight_5a_75B.jscad)

Issues
------
1. OpenSCAD and OpenJSCAD have different semantics for coloring the 3D model. OpenSCAD model is undocumented (on purpose) as it may change in the future.
(Basically, color is saved per face and in case of boolean operations comes from the object from which this face originated).  
OpenJSCAD color model has only one color per object, but you can return an array of objects each with a different color. I have done my best to preserve the original colors from YAPP, but there are limits to what can be done.  
2. OpenSCAD supports arbitrary fonts, while OpenJSCAD supports only the built in vector fonts, or you have to convert other fonts yourself.
3. The original project relies on a common library that renders the box, but specific box projects can load the library and override the parameters. This can be easily done with OpenJSCAD, by splitting the core library, but not in the single-file web based mode.

TODO:
-----
1. Finish fixing existing issues where the port is still broken compared to YAPP
2. Add support for M3 screws and hex M3 nuts
4. Allow Modifying parameters dynamically
5. streamline the code (too many duplications)
5. Modernize data entry

