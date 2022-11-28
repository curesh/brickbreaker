import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;
const {Cube, Textured_Phong, Axis_Arrows} = defs;

export class Brick extends Shape {                                   // **Shape_From_File** is a versatile standalone Shape that imports
                                                                               // all its arrays' data from an .obj 3D model file.
    constructor(path) {
        super("position", "normal", "texture_coord");
        // Begin downloading the mesh. Once that completes, return
        // control to our parse_into_mesh function.
        this.load_file(path);
    }

    load_file(filename) {                             // Request the external file and wait for it to load.
        // Failure mode:  Loads an empty shape.
        return fetch(filename)
            .then(response => {
                if (response.ok) return Promise.resolve(response.text())
                else return Promise.reject(response.status)
            })
            .then(obj_file_contents => this.parse_into_mesh(obj_file_contents))
            .catch(error => {
                this.copy_onto_graphics_card(this.gl);
            })
    }

    parse_into_mesh(data) {                           // Adapted from the "webgl-obj-loader.js" library found online:
        var verts = [], vertNormals = [], textures = [], unpacked = {};

        unpacked.verts = [];
        unpacked.norms = [];
        unpacked.textures = [];
        unpacked.hashindices = {};
        unpacked.indices = [];
        unpacked.index = 0;

        var lines = data.split('\n');

        var VERTEX_RE = /^v\s/;
        var NORMAL_RE = /^vn\s/;
        var TEXTURE_RE = /^vt\s/;
        var FACE_RE = /^f\s/;
        var WHITESPACE_RE = /\s+/;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var elements = line.split(WHITESPACE_RE);
            elements.shift();

            if (VERTEX_RE.test(line)) verts.push.apply(verts, elements);
            else if (NORMAL_RE.test(line)) vertNormals.push.apply(vertNormals, elements);
            else if (TEXTURE_RE.test(line)) textures.push.apply(textures, elements);
            else if (FACE_RE.test(line)) {
                var quad = false;
                for (var j = 0, eleLen = elements.length; j < eleLen; j++) {
                    if (j === 3 && !quad) {
                        j = 2;
                        quad = true;
                    }
                    if (elements[j] in unpacked.hashindices)
                        unpacked.indices.push(unpacked.hashindices[elements[j]]);
                    else {
                        var vertex = elements[j].split('/');

                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);

                        if (textures.length) {
                            unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 0]);
                            unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 1]);
                        }

                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 0]);
                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 1]);
                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 2]);

                        unpacked.hashindices[elements[j]] = unpacked.index;
                        unpacked.indices.push(unpacked.index);
                        unpacked.index += 1;
                    }
                    if (j === 3 && quad) unpacked.indices.push(unpacked.hashindices[elements[0]]);
                }
            }
        }
        {
            const {verts, norms, textures} = unpacked;
            for (var j = 0; j < verts.length / 3; j++) {
                this.arrays.position.push(vec3(verts[3 * j], verts[3 * j + 1], verts[3 * j + 2]));
                this.arrays.normal.push(vec3(norms[3 * j], norms[3 * j + 1], norms[3 * j + 2]));
                this.arrays.texture_coord.push(vec(textures[2 * j], textures[2 * j + 1]));
            }
            this.indices = unpacked.indices;
        }
        this.normalize_positions(false);
        this.ready = true;
    }

    draw(context, program_state, model_transform, material) {               // draw(): Same as always for shapes, but cancel all
        // attempts to draw the shape before it loads:
        if (this.ready)
            super.draw(context, program_state, model_transform, material);
    }
}

class Cube_Outline extends Shape {
    constructor() {
        super("position", "color");

    }
}

class Cube_Single_Strip extends Shape {
    constructor() {
        super("position", "normal");
        // TODO (Requirement 6)
    }
}


export class Base_Scene extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.hover = this.swarm = false;
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            'crate': new Brick("assets/crate.obj"),
            'sand': new Brick("assets/sand.obj"),
            'stone': new Brick("assets/stone.obj"),
            'cube': new Cube(),
            'outline': new Cube_Outline(),
            'tmp_cube': new defs.Cube(),
            'ball': new defs.Subdivision_Sphere(4),
        };

        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            background: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity:.6, specularity: 0}),
            crate : new Material(new defs.Fake_Bump_Map(1), {
                color: hex_color("#5A3828"),
                ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("assets/crate.png")
            }),
            sand : new Material(new defs.Fake_Bump_Map(1), {
                color: hex_color("#C2B280"),
                ambient: .5, diffusivity: .5, specularity: 0, texture: new Texture("assets/sand.jpg")
            }),
            stone : new Material(new defs.Fake_Bump_Map(1), {
                color: color(.5, .5, .5, 1),
                ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("assets/stone.jpg")
            }),
            bg: new Material(new Texture_Scroll_X(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/black-city.jpeg", "LINEAR_MIPMAP_LINEAR")
            }),
        };
        // The white material and basic shader are used for drawing the outline.
        this.white = new Material(new defs.Basic_Shader());
    }

    display(context, program_state) {
        // display():  Called once per frame of animation. Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, -5, -70));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 15, 15, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    }
}

const Brick_Type = {
    None: 0,
    Crate: 1,
    Sand: 2,
    Stone: 3
}

class Block {

    constructor() {
        this.block_type = Math.floor(Math.random() * 4)
    }

    get_block_type() {
        return this.block_type;
    }

    get_block_transformation(i, j) {
        let delta_y = 2;
        let delta_x = 2;
        let brick_transform = Mat4.identity().times(Mat4.translation(ORIGIN[0] + j * (BRICK_DIM + delta_x), ORIGIN[1] + i * (BRICK_DIM + delta_y), 0)).times(Mat4.scale(BRICK_DIM/2,BRICK_DIM/2, BRICK_DIM/2));
        if (this.block_type == Brick_Type.Crate) {
            return brick_transform.times(Mat4.scale(2.5,2.5,2.5));
        }
        
        return brick_transform.times(Mat4.scale(5, 10, 2));
    }
}


const ORIGIN = [-45, 10];
const BRICK_ROWS = 6;
const BRICK_COLUMNS = 27;
const BRICK_COUNT = BRICK_ROWS * BRICK_COLUMNS;
const BRICK_DIM = 1.5;
export class Game extends Base_Scene {
    /**
     * This Scene object can be added to any display canvas.
     * We isolate that code so it can be experimented with on its own.
     * This gives you a very small code sandbox for editing a simple scene, and for
     * experimenting with matrix transformations.
     */

    constructor() {
        super();

        this.platformMoveLeft = false;
        this.platformMoveRight = false;

        // positioning of the ball
        this.ballX = 0;
        this.ballY = 0;

        this.ballTransform = Mat4.identity();
        this.ballMovementCoefficientSum = 50;

        // ball movement, abs(x + y) should add up to ballMovementCoefficientSum
        this.ballMovementX = 0;
        this.ballMovementY = -50;

        this.sphere_radius = 1;
        this.platform_radius = 7;

        this.platformTransform = Mat4.identity();
        this.platformTransform = this.platformTransform.times(Mat4.translation(0, -20, 0));
        this.platformTransform = this.platformTransform.times(Mat4.scale(this.platform_radius, .1, 1));

        // borders

        this.sideBorderLength = 27;
        this.topBorderLength = 50;
        this.originOffset = 5;

        this.leftBorderTransform = Mat4.identity();
        this.leftBorderTransform = this.leftBorderTransform.times(Mat4.translation(-this.topBorderLength, this.originOffset, 0));
        this.leftBorderTransform = this.leftBorderTransform.times(Mat4.scale(0.1, this.sideBorderLength, 1));

        this.topBorderTransform = Mat4.identity();
        this.topBorderTransform = this.topBorderTransform.times(Mat4.translation(0, this.sideBorderLength + this.originOffset, 0));
        this.topBorderTransform = this.topBorderTransform.times(Mat4.scale(this.topBorderLength, 0.1, 1));

        this.rightBorderTransform = Mat4.identity();
        this.rightBorderTransform = this.rightBorderTransform.times(Mat4.translation(this.topBorderLength, this.originOffset, 0));
        this.rightBorderTransform = this.rightBorderTransform.times(Mat4.scale(0.1, this.sideBorderLength, 1));


        this.colors = this.createColors();

        this.block_array = [];
        for (let i = 0; i < BRICK_COUNT; i++) {
            this.block_array.push(new Block());
        }
    }

    // we'll use x to move left and c to move right
    make_control_panel() {
        this.key_triggered_button("Move left", ["x"], () => this.platformMoveLeft = true, '#6E6460', () => this.platformMoveLeft = false);
        this.key_triggered_button("Move right", ["c"], () => this.platformMoveRight = true, '#6E6460', () => this.platformMoveRight = false);
    }

    draw_box(context, program_state, model_transform) {
        // TODO:  Helper function for requirement 3 (see hint).
        //        This should make changes to the model_transform matrix, draw the next box, and return the newest model_transform.
        // Hint:  You can add more parameters for this function, like the desired color, index of the box, etc.

        return model_transform;
    }

    // TODO (david): make this collision detection algorithm more refined (treats the balls as cubes essentially)
    sphere_to_platform_collision_detection(sphere_transform, platform_transform, side, platform_radius) {

        // no collision detected if the ball is on the way up
        if ((this.ballMovementY > 0 && side === "bottom") ||
             this.ballMovementY < 0 && side === "top") {
            return false;
        }

        // detects a collision if the x value of the sphere is within the platform range AND the y value of the sphere is within platform range

        const sphere_x = sphere_transform[0][3];
        const sphere_y = sphere_transform[1][3];
        const platform_x = platform_transform[0][3];
        const platform_y = platform_transform[1][3];
        if (sphere_x - this.sphere_radius < platform_x + platform_radius &&
            sphere_x + this.sphere_radius > platform_x - platform_radius) {
            if (side === "bottom") {
                if (sphere_y > platform_y && (sphere_y - this.sphere_radius < platform_y)) {
                    return true;
                }
            }
            else if (side === "top") {
                if (sphere_y < platform_y && (sphere_y + this.sphere_radius > platform_y)) {
                    return true;
                }
            }
        }
        return false;
    }

    sphere_to_border_collision_detection(sphere_transform, border_transform, side) {
        if ((this.ballMovementX > 0 && side === "left") ||
             this.ballMovementX < 0 && side === "right") {
            return false;
        }
        const sphere_x = sphere_transform[0][3];
        const sphere_y = sphere_transform[1][3];
        const border_transform_x = border_transform[0][3];
        const border_transform_y = border_transform[1][3];

        if (sphere_y - this.sphere_radius < border_transform_y + this.sideBorderLength &&
            sphere_y + this.sphere_radius > border_transform_y - this.sideBorderLength) {
            if (side === "left") {
                if (sphere_x > border_transform_x && (sphere_x - this.sphere_radius < border_transform_x)) {
                    return true;
                }
            }
            else if (side === "right") {
                if (sphere_x < border_transform_x && (sphere_x + this.sphere_radius > border_transform_x)) {
                    return true;
                }
            }
        }
        return false;
    }

    sphere_to_block_collision_detection(sphere_transform, block_transform) {
        const sphere_x = sphere_transform[0][3];
        const sphere_y = sphere_transform[1][3];

        return true;
    }

    createColors() {
        let colors = [];
        let colore = color(Math.random(), Math.random(), Math.random(), 1.0);
        for(let i = 0; i  < 29; i++) {
            while(colors.includes(colore)) {
                colore = color(Math.random(), Math.random(), Math.random(), 1.0);
            }
            colors.push(colore);
        }
        return colors
    }

    generate_bricks(context, program_state) {
        let start_x = ORIGIN[0];
        let start_y = ORIGIN[1];
        let counter = 0;
        let brick_transform = Mat4.identity().times(Mat4.translation(start_x, start_y, 0)).times(Mat4.scale(1/BRICK_DIM,1/BRICK_DIM, 1/BRICK_DIM)).times(Mat4.scale(2,2,2));

        for (let i = 0; i < BRICK_ROWS; i += 1) {

            for (let j = 0; j < BRICK_COLUMNS; j += 1) {

                let block = this.block_array[counter];
                brick_transform = block.get_block_transformation(i, j);

                // use block_type cases to determine what material to draw
                let block_type = block.get_block_type();
                if (block_type === Brick_Type.None) {
                    // draw nothing
                }
                else if (block_type === Brick_Type.Crate) {
                    // TODO: (tina) figure out how to draw glass material
                    this.shapes.crate.draw(context, program_state, brick_transform, this.materials.crate);
                }
                else if (block_type === Brick_Type.Sand) {
                    // TODO: brick material
                    this.shapes.sand.draw(context, program_state, brick_transform, this.materials.sand);
                }
                else if (block_type === Brick_Type.Stone) {
                    // TODO: steel material
                    this.shapes.stone.draw(context, program_state, brick_transform, this.materials.stone);
                }
                else {
                    // error lol
                }

                counter += 1;
            }
        }
    }

    display(context, program_state) {
        super.display(context, program_state);


        const blue = hex_color("#1a9ffa");
        const green = hex_color("#90EE90");
        const yellow = hex_color("#FFFF00");

        // alright so the game's coordinates are currently from -20 to 20 on the x direction and -10 to 0 in the y
        
        this.shapes.cube.draw(context, program_state, this.leftBorderTransform, this.materials.plastic.override({color: yellow}));
        this.shapes.cube.draw(context, program_state, this.topBorderTransform, this.materials.plastic.override({color: yellow}));
        this.shapes.cube.draw(context, program_state, this.rightBorderTransform, this.materials.plastic.override({color: yellow}));

        let background_transform = Mat4.identity();
        background_transform = background_transform.times(Mat4.translation(0,5.5,-2));
        background_transform = background_transform.times(Mat4.scale(50,28,0.1));

        this.shapes.cube.draw(context, program_state, background_transform, this.materials.bg);

        this.generate_bricks(context, program_state);
        // time since starting given in seconds
        const t = this.t = program_state.animation_time / 1000;
        const dt = program_state.animation_delta_time / 1000;

        // make this value more negative for faster falling

        // can't move any more to the left or the right if the platform is exceeding the bounds of the game
        if (this.platformTransform[0][3] + this.platform_radius >= this.topBorderLength) {
            this.platformMoveRight = false;
        }
        
        if (this.platformTransform[0][3] - this.platform_radius <= -this.topBorderLength) {
            this.platformMoveLeft = false;
        }
        
        if (this.platformMoveLeft) {
            this.platformTransform = this.platformTransform.times(Mat4.translation(-dt*10, 0, 0));
        }
        else if (this.platformMoveRight) {
            this.platformTransform = this.platformTransform.times(Mat4.translation(dt*10, 0, 0));
        }

        // for changing the ball angle after colliding: just use the center of the ball's location for x
        // once we've confirmed that there's a collision, we send the ball flying at an offset depending on distance from center

        // accounts for a delay in dt at the beginning where dt is a large value
        if (t > 2) {
            this.ballTransform = this.ballTransform.times(Mat4.translation(dt * this.ballMovementX, dt*this.ballMovementY, 0));
        }

        this.shapes.ball.draw(context, program_state, this.ballTransform, this.materials.plastic.override({color:blue}));
        this.shapes.cube.draw(context, program_state, this.platformTransform, this.materials.plastic.override({color:green}));

        if (this.sphere_to_platform_collision_detection(this.ballTransform, this.platformTransform, "bottom", this.platform_radius)) {
            this.ballX = this.ballTransform[0][3];
            this.ballY = this.ballTransform[1][3];

            const platform_center = this.platformTransform[0][3];

            // constrain the values between 1.8 and -1.8 to avoid having movement that only goes in the x-direction
            const sphere_dist_from_platform_center = Math.max(-this.platform_radius + .2, Math.min(this.platform_radius - .2, this.ballX - platform_center));

            // console.log("Sphere dist from center: ", sphere_dist_from_platform_center);

            if (Math.abs(sphere_dist_from_platform_center) <= this.platform_radius) {
                this.ballMovementX = (sphere_dist_from_platform_center / this.platform_radius) * this.ballMovementCoefficientSum;
                this.ballMovementY = Math.abs(this.ballMovementCoefficientSum) - Math.abs(this.ballMovementX);
                
                // console.log("x: ", this.ballMovementX);
                // console.log("y: ", this.ballMovementY);
            }
        }

        if (this.sphere_to_border_collision_detection(this.ballTransform, this.leftBorderTransform, "left")) {
            this.ballX = this.ballTransform[0][3];
            this.ballY = this.ballTransform[1][3];

            this.ballMovementX *= -1;
        }
        else if (this.sphere_to_platform_collision_detection(this.ballTransform, this.topBorderTransform, "top", 50)) {
            this.ballX = this.ballTransform[0][3];
            this.ballY = this.ballTransform[1][3];

            this.ballMovementY *= -1;
        }
        else if (this.sphere_to_border_collision_detection(this.ballTransform, this.rightBorderTransform, "right")) {
            this.ballX = this.ballTransform[0][3];
            this.ballY = this.ballTransform[1][3];

            this.ballMovementX *= -1;
        }

        // check for collision with every single block
        for (let i = 0; i < this.block_array.length; i++) {
            if (this.sphere_to_block_collision_detection(this.ballTransform, this.block_array[i].get_block_transformation())) {
                // TODO
            }
        }
    }
}

class Texture_Scroll_X extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                float t = mod(animation_time, 10.) * 0.1; 
                mat4 slide_matrix = mat4(vec4(-1., 0., 0., 0.), 
                                   vec4( 0., 1., 0., 0.), 
                                   vec4( 0., 0., 1., 0.), 
                                   vec4(t, 0., 0., 1.)); 
                vec4 scaled_tex_coord = vec4(f_tex_coord, 0, 0) + vec4(1., 1., 0., 1.); 
                scaled_tex_coord = slide_matrix * scaled_tex_coord; 
                vec4 tex_color = texture2D(texture, scaled_tex_coord.xy);

                float u = mod(scaled_tex_coord.x, 1.0);
                float v = mod(scaled_tex_coord.y, 1.0);

                if( tex_color.w < .01 ) discard;                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}