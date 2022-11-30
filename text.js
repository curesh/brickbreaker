import {defs, tiny} from './examples/common.js';
// Pull these names into this module's scope for convenience:
const {Vector, vec3, vec4, color, Mat4, Light, Shape, Material, Shader, Texture, Scene} = tiny;

export class Text_Line extends Shape {                           // **Text_Line** embeds text in the 3D world, using a crude texture
                                                                 // method.  This Shape is made of a horizontal arrangement of quads.
                                                                 // Each is textured over with images of ASCII characters, spelling
                                                                 // out a string.  Usage:  Instantiate the Shape with the desired
                                                                 // character line width.  Then assign it a single-line string by calling
                                                                 // set_string("your string") on it. Draw the shape on a material
                                                                 // with full ambient weight, and text.png assigned as its texture
                                                                 // file.  For multi-line strings, repeat this process and draw with
                                                                 // a different matrix.
    constructor(max_size) {
        super("position", "normal", "texture_coord");
        this.max_size = max_size;
        var object_transform = Mat4.identity();
        for (var i = 0; i < max_size; i++) {                                       // Each quad is a separate Square instance:
            defs.Square.insert_transformed_copy_into(this, [], object_transform);
            object_transform.post_multiply(Mat4.translation(1.5, 0, 0));
        }
    }

    set_string(line, context) {           // set_string():  Call this to overwrite the texture coordinates buffer with new
        // values per quad, which enclose each of the string's characters.
        this.arrays.texture_coord = [];
        for (var i = 0; i < this.max_size; i++) {
            var row = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) / 16),
                col = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) % 16);

            var skip = 3, size = 32, sizefloor = size - skip;
            var dim = size * 16,
                left = (col * size + skip) / dim, top = (row * size + skip) / dim,
                right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

            this.arrays.texture_coord.push(...Vector.cast([left, 1 - bottom], [right, 1 - bottom],
                [left, 1 - top], [right, 1 - top]));
        }
        if (!this.existing) {
            this.copy_onto_graphics_card(context);
            this.existing = true;
        } else
            this.copy_onto_graphics_card(context, ["texture_coord"], false);
    }
}