import {defs, tiny} from './examples/common.js';

import {Transforms_Sandbox} from "./examples/transforms-sandbox.js"
import {Scene_To_Texture_Demo} from "./examples/scene-to-texture-demo.js"
import {Surfaces_Demo} from "./examples/surfaces-demo.js"
import {Many_Lights_Demo} from "./examples/many-lights-demo.js"
import {Obj_File_Demo} from "./examples/obj-file-demo.js"

import {Game} from "./game.js"
// Pull these names into this module's scope for convenience:
const {
    Vector, Vector3, vec, vec3, vec4, color, Matrix, Mat4, Light, Shape, Material, Shader, Texture, Scene,
    Canvas_Widget, Code_Widget, Text_Widget
} = tiny;

// Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and common.js.
// This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

// ******************** Extra step only for when executing on a local machine:
//                      Load any more files in your directory and copy them into "defs."
//                      (On the web, a server should instead just pack all these as well
//                      as common.js into one file for you, such as "dependencies.js")

const Minimal_Webgl_Demo = defs.Minimal_Webgl_Demo;

Object.assign(defs,
            {Transforms_Sandbox}, {Game}, {Scene_To_Texture_Demo}, {Surfaces_Demo}, {Many_Lights_Demo}, {Obj_File_Demo});

// ******************** End extra step

// (Can define Main_Scene's class here)

const Main_Scene = Obj_File_Demo;
const Additional_Scenes = [];

export {Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs}