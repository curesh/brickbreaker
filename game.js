import {defs, tiny} from './examples/common.js';
import {Texture_Scroll_X} from './textures.js';
import {Brick} from "./brick.js";
import {Block_Type, Block} from "./block.js";
import {Text_Line} from "./examples/text-demo.js";
import {Shape_From_File} from "./examples/obj-file-demo.js";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;
const {Cube} = defs;


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
            'ball': new defs.Subdivision_Sphere(4),
            'text': new Text_Line(35),
            'heart': new Shape_From_File("assets/heart.obj")
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
            text_material: new Material(new defs.Textured_Phong(1), {
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture("assets/text.png")
            }),
            heart_texture: new Material(new defs.Phong_Shader(), {
                ambient: 1, diffusivity: 1, specularity: 1,
                color: hex_color("#FF0000")
            })
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

        this.init();
    }

    init() {
        this.reset()
        this.score = 0;
        this.lives = 3;
    }

    reset() {
        this.platformMoveLeft = false;
        this.platformMoveRight = false;

        // increase this to increase movement speed
        this.movementSpeed = 0.02;

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
        this.sphere_block_buffer = this.sphere_radius + BRICK_DIM/2;

        this.platformTransform = Mat4.identity();
        this.platformTransform = this.platformTransform.times(Mat4.translation(0, -20, 0));
        this.platformTransform = this.platformTransform.times(Mat4.scale(this.platform_radius, .1, 1));

        // borders

        this.sideBorderLength = 27;
        this.topBorderLength = 50;
        this.originOffset = 5;

        this.leftBorderTransform = Mat4.identity();
        this.leftBorderTransform = this.leftBorderTransform.times(Mat4.translation(-this.topBorderLength, this.originOffset, 0));
        this.leftBorderTransform = this.leftBorderTransform.times(Mat4.scale(0.1, this.sideBorderLength, 2));

        this.topBorderTransform = Mat4.identity();
        this.topBorderTransform = this.topBorderTransform.times(Mat4.translation(0, this.sideBorderLength + this.originOffset, 0));
        this.topBorderTransform = this.topBorderTransform.times(Mat4.scale(this.topBorderLength, 0.1, 2));

        this.rightBorderTransform = Mat4.identity();
        this.rightBorderTransform = this.rightBorderTransform.times(Mat4.translation(this.topBorderLength, this.originOffset, 0));
        this.rightBorderTransform = this.rightBorderTransform.times(Mat4.scale(0.1, this.sideBorderLength, 2));

        this.gameOver = false;

        this.block_array = [];
        for (let i = 0; i < BRICK_COUNT; i++) {
            this.block_array.push(new Block());
        }
    }

    // we'll use x to move left and c to move right
    make_control_panel() {
        this.control_panel.innerHTML += "Score: ";
        this.live_string(box => box.textContent = this.score);
        this.new_line();
        this.new_line();

        this.key_triggered_button("Move left", ["x"], () => {
            if (!this.gameOver) {
                this.platformMoveLeft = true
            }
        }, '#6E6460', () => this.platformMoveLeft = false);
        this.key_triggered_button("Move right", ["c"], () => {
            if (!this.gameOver) {
                this.platformMoveRight = true
            }
        }, '#6E6460', () => this.platformMoveRight = false);
        this.key_triggered_button("Reset", ["r"], () => this.init());
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
                if (sphere_y >= platform_y && (sphere_y - this.sphere_radius < platform_y)) {
                    return true;
                }
            }
            else if (side === "top") {
                if (sphere_y <= platform_y && (sphere_y + this.sphere_radius > platform_y)) {
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
                if (sphere_x >= border_transform_x && (sphere_x - this.sphere_radius < border_transform_x)) {
                    return true;
                }
            }
            else if (side === "right") {
                if (sphere_x <= border_transform_x && (sphere_x + this.sphere_radius > border_transform_x)) {
                    return true;
                }
            }
        }
        return false;
    }

    sphere_to_block_collision_detection(sphere_transform, block_coordinates) {
        const block_x = block_coordinates.x_coord,
            block_y = block_coordinates.y_coord;
        const sphere_x = sphere_transform[0][3];
        const sphere_y = sphere_transform[1][3];

        if ((Math.abs(block_x - sphere_x) < this.sphere_block_buffer) && (Math.abs(block_y - sphere_y) < this.sphere_block_buffer)) {
            return true;
        }

        return false;
    }

    sphere_to_block_collision_dir(sphere_transform, block_coordinates) {
        const block_x = block_coordinates.x_coord,
            block_y = block_coordinates.y_coord;
        const sphere_x = sphere_transform[0][3];
        const sphere_y = sphere_transform[1][3];

        console.log("Sphere x: " + sphere_x + ". Sphere y: " + sphere_y);
        console.log("Block x: " + block_x + ". Block y: " + block_y)

        let buffer = this.sphere_block_buffer - 0.5;

        // left side of brick
        if (sphere_x + buffer <= block_x) {
            this.ballMovementX *= -1;
            console.log("left side")
        }
        // right side of brick
        else if (sphere_x >= block_x + buffer) {
            this.ballMovementX *= -1;
            console.log("right side")
        }
        // bottom of brick
        else if (sphere_y + buffer <= block_y) {
            this.ballMovementY *= -1;
            console.log("bottom")
        }
        // top of brick
        else {
            this.ballMovementY *= -1;
            console.log("top")
        }
    }

    sphere_below_platform(sphere_transform) {
        const sphere_y = sphere_transform[1][3];

        return sphere_y < -20;
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
                if (block_type === Block_Type.None) {
                    // draw nothing
                }
                else if (block_type === Block_Type.Crate) {
                    this.shapes.crate.draw(context, program_state, brick_transform, this.materials.crate);
                }
                else if (block_type === Block_Type.Sand) {
                    this.shapes.sand.draw(context, program_state, brick_transform, this.materials.sand);
                }
                else if (block_type === Block_Type.Stone) {
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
        const turquoise = hex_color("#50C5B7");

        if (this.lives <= 0) {
            this.gameOver = true;
        }

        // alright so the game's coordinates are currently from -20 to 20 on the x direction and -10 to 0 in the y
        
        this.shapes.cube.draw(context, program_state, this.leftBorderTransform, this.materials.plastic.override({color: turquoise}));
        this.shapes.cube.draw(context, program_state, this.topBorderTransform, this.materials.plastic.override({color: turquoise}));
        this.shapes.cube.draw(context, program_state, this.rightBorderTransform, this.materials.plastic.override({color: turquoise}));

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
            this.platformTransform = this.platformTransform.times(Mat4.translation(-this.movementSpeed*10, 0, 0));
        }
        else if (this.platformMoveRight) {
            this.platformTransform = this.platformTransform.times(Mat4.translation(this.movementSpeed*10, 0, 0));
        }

        // for changing the ball angle after colliding: just use the center of the ball's location for x
        // once we've confirmed that there's a collision, we send the ball flying at an offset depending on distance from center

        // accounts for a delay in dt at the beginning where dt is a large value

        this.ballTransform = this.ballTransform.times(Mat4.translation(this.movementSpeed * this.ballMovementX, this.movementSpeed * this.ballMovementY, 0));
        this.shapes.ball.draw(context, program_state, this.ballTransform, this.materials.plastic.override({color:blue}));
        this.shapes.cube.draw(context, program_state, this.platformTransform, this.materials.plastic.override({color:green}));

        if (this.ballTransform[1][3] < this.platformTransform[1][3]) {
            this.gameOver = true;
        }
        else if (this.sphere_to_platform_collision_detection(this.ballTransform, this.platformTransform, "bottom", this.platform_radius)) {
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

        // collisions with the surrounding borders

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
            if (this.block_array[i].get_block_type() !== Block_Type.None) {
                if (this.sphere_to_block_collision_detection(this.ballTransform, this.block_array[i].get_coordinates())) {
                    console.log("Collided with block " + i)
                    this.block_array[i].block_hit();
                    this.sphere_to_block_collision_dir(this.ballTransform, this.block_array[i].get_coordinates());
                    this.score++;
                }
            }
        }

        // check for ball below platform
        if (this.sphere_below_platform(this.ballTransform)) {
            this.lives--;
            this.reset();
        }

        // draw the score
        let score_text = "Score: " + this.score;
        let score_transform = Mat4.identity().times(Mat4.translation(33, -20, 0));
        console.log(score_text)
        this.shapes.text.set_string(score_text, context.context);
        this.shapes.text.draw(context, program_state, score_transform, this.materials.text_material);

        // draw lives
        let lives_text = "Lives: " + this.lives;
        let lives_transform = Mat4.identity().times(Mat4.translation(-45, -20, 0));
        this.shapes.text.set_string(lives_text, context.context);
        this.shapes.text.draw(context, program_state, lives_transform, this.materials.text_material);

        // draw heart
        let heart_transform = Mat4.identity().times(Mat4.translation(-30, -19.5, 0));
        for (let i = 0; i < this.lives; i++) {
            heart_transform = heart_transform.times(Mat4.rotation(3*Math.PI/2,1,0,0))
            this.shapes.heart.draw(context, program_state, heart_transform, this.materials.heart_texture);
            heart_transform = heart_transform.times(Mat4.translation(3, 0, 0)
                .times(Mat4.rotation(-3*Math.PI/2,1,0,0)));
        }
    }
}
