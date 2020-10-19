// An import statement allows your code to use jscad methods:
const { cuboid, cylinder, cylinderElliptic, sphere } = require('@jscad/modeling').primitives
const { intersect, subtract, union } = require('@jscad/modeling').booleans
const { center, rotateZ, rotateX, translateZ, translate } = require('@jscad/modeling').transforms
const { measureArea, measureBoundingBox, measureVolume } = require('@jscad/modeling').measurements


const d = (x) => { return [x, x] }
const flat = (o) => {return translateZ(-measureBoundingBox(o)[0][2], o)}

// A function declaration that returns geometry
const main = () => {
  let ring_ext = 39.8
  let ring_int = 37.7
  let ring_height = 2.7
  let body_height = 52.65
  let body_start_height = 3.75
  let narrow_hole_height = 18.25
  let screw_holder_height = 20
  let body_ext = 42.6
  let handle_size = 22
  let slot_width = 16
  let screw_hole2_width = 11.25
  let screw_hole2_ext = 16.35
  let screw_hole1_depth = 19.45
  let screw_hole1_width = 13.95
  let fudge_factor = 0; // try also with 20
  let cross_width = 1.6
  let segments = 64

  // one part of the cross
  let bar = flat(cuboid({size:[cross_width, ring_int, screw_holder_height]}))
  // outer cylinder of the central hole
  let narrow_hole_wall = flat(cylinder({radius:(screw_hole2_ext/2), height:screw_holder_height}))
  // other part of the cross
  let bar2 = rotateZ(Math.PI/2, bar)
  // cross plus central hole (without the inner hole yet)
  let cross = translateZ(body_start_height, union(bar, bar2, narrow_hole_wall))
  // This is the lowest, conic hole (internal side)
  let screw_hole_3 = translateZ(body_start_height, flat(cylinderElliptic({startRadius:d(12.4/2), endRadius:d(11/2), height:(narrow_hole_height - body_start_height)})))   //25.25-7
  // This is the ring thats fixating the part inside the exsiting pole
  let cyl1 = flat(subtract(cylinder({radius:ring_ext/2, height:body_height-body_ext/2}), cylinder({radius:ring_int/2, height:(body_height-body_ext/2)})))
  // full body internal walls (empty cavity)
  let body_clearance = flat(cylinder({radius:ring_int/2, height:body_height-body_ext/2}))
  // full body external walls
  let body_full =      flat(cylinder({radius:body_ext/2, height:body_height-body_ext/2, segments:segments}))
  // total body cylinder (hollow)
  let body = translateZ(ring_height, subtract(body_full, body_clearance))

  // The sphere that tops the part, the bottom part overlaps 'body'
  let cap_sphere = translateZ(body_height+ring_height-body_ext/2, sphere({radius:body_ext/2, segments:segments}))
  // body plus the sphere. we duplicate the sphere 2mm below because cutting the handle part will create a hole otherwise
  // so the sphere duplicate 2mm below closes this hole
  let shower1 = union(cyl1, body, cross, cap_sphere, translateZ(-2, cap_sphere))

  // This is the hole for the shower handle. it is wider on one side to fit the hendle
  let handle1 = translateZ(ring_height + body_height - body_ext/2, rotateX(Math.PI/2, cylinderElliptic({startRadius:d(handle_size/2), endRadius:d((handle_size+1)/2), height:body_ext})))
  // This is the vertical opening
  let slot1 = translate([fudge_factor, 0,  body_ext/4+ring_height+body_height - body_ext/2], cuboid({size:[slot_width, body_ext, body_ext/2]}))

  let screw_hole_1 = translateZ(screw_hole1_depth, flat(cylinder({radius:screw_hole1_width/2, height:body_height + ring_height})))
  let screw_hole_2 = cylinder({radius:screw_hole2_width/2, height:body_height + ring_height})

  // The ring thats gets pushed by the screw head
  let screw_support = translateZ(narrow_hole_height, flat(subtract(cylinder({radius:screw_hole1_width/2, height:screw_holder_height - narrow_hole_height}), cylinder({radius:6/2, height:screw_holder_height - narrow_hole_height}))))

  // subtract all the holes we designed from the part
  let cap_2 = union(screw_support, subtract(shower1, slot1, handle1, screw_hole_1, screw_hole_2, screw_hole_3))

  return cap_2
}

// A declaration of what elements in the module (this file) are externally available.
module.exports = { main }
