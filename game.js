import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Cube extends Shape {
    constructor() {
        super("position", "normal",);
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
            [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]);
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
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


class Base_Scene extends Scene {
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
            'cube': new Cube(),
            'outline': new Cube_Outline(),
            'tmp_cube': new defs.Cube(),
            'ball': new defs.Subdivision_Sphere(4),
        };

        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
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
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    }
}

const Brick_Type = {
    None: 0,
    Glass: 1,
    Brick: 2,
    Steel: 3
}

class Block {

    constructor() {
        this.block_type = Math.floor(Math.random() * 4)
        this.block_transformation = null;
    }

    get_block_type() {
        return this.block_type;
    }

    update_block_transformation(block_transformation) {
        this.block_transformation = block_transformation;
    }

    get_block_transformation() {
        return this.block_transformation;
    }
}

// Dimensions of the game (only in x and y space)
// Y : -20 < y < 20
// X : -10 < x < 10
// Bricks : 10 < y < 20
// Bricks : -10 < x < 10
// Brick dimensions : 1.5 x 1.5
// Brick count : 50
// Platform y = -20, -10 < x < 10
// Platform dimension = 2 x 0.1

const GAME_WIDTH = 20;
const GAME_LENGTH = 40;
const ORIGIN = [-10, -20];
const BRICK_COUNT = 50;
const BRICK_START_Y = 10;
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

        // positioning of the platform
        this.platformX = 0;

        // positioning of the ball
        this.ballX = 0;
        this.ballY = 0;

        this.ballMovementCoefficientSum = 5;

        // ball movement, abs(x + y) should add up to ballMovementCoefficientSum
        this.ballMovementX = 0;
        this.ballMovementY = -5;

        // once a collision happens, we use this variable to reset the time to zero
        this.time_offset = 0;

        this.sphere_radius = 1;
        this.platform_radius = 2;

        this.colors = this.createColors();

        this.block_array = [];
        for (let i = 0; i < BRICK_COUNT; i++) {
            this.block_array.push(new Block());
        }
    }

    // we'll use x to move left and c to move right
    make_control_panel() {
        this.key_triggered_button("Move left", ["x"], () => this.platformMoveLeft = true);
        this.key_triggered_button("Move right", ["c"], () => this.platformMoveRight = true);
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

        if (sphere_y - this.sphere_radius < border_transform_y + 10 &&
            sphere_y + this.sphere_radius > border_transform_y - 10) {
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
        let brick_transform = Mat4.identity().times(Mat4.translation(ORIGIN[0], BRICK_START_Y, 0)).times(Mat4.scale(1/BRICK_DIM,1/BRICK_DIM, 1/BRICK_DIM));
        let start_x = ORIGIN[0];
        let start_y = BRICK_START_Y;
        let delta_y = 2;
        let delta_x = 2;
        let counter = 0;
        for (let i = ORIGIN[0]; i < ORIGIN[0] + GAME_WIDTH; i += delta_x) {

            for (let j = BRICK_START_Y; j < ORIGIN[1] + GAME_LENGTH; j += delta_y) {
                counter += 1;
                brick_transform = Mat4.identity().times(Mat4.translation(i, j, 0)).times(Mat4.scale(BRICK_DIM/2,BRICK_DIM/2, BRICK_DIM/2));

                let block = this.block_array[counter];
                block.update_block_transformation(brick_transform);

                // use block_type cases to determine what material to draw
                let block_type = block.get_block_type();
                if (block_type === Brick_Type.None) {
                    // draw nothing
                }
                else if (block_type === Brick_Type.Glass) {
                    // TODO: (tina) figure out how to draw glass material
                    this.shapes.cube.draw(context, program_state, brick_transform, this.materials.plastic.override({color: hex_color('#FFFFFF')}));
                }
                else if (block_type === Brick_Type.Brick) {
                    // TODO: brick material
                    this.shapes.cube.draw(context, program_state, brick_transform, this.materials.plastic.override({color: hex_color('#964B00')}));
                }
                else if (block_type === Brick_Type.Steel) {
                    // TODO: steel material
                    this.shapes.cube.draw(context, program_state, brick_transform, this.materials.plastic.override({color: hex_color('#808080')}));
                }
                else {
                    // error lol
                }
            }
        }
    }

    display(context, program_state) {
        super.display(context, program_state);
        const blue = hex_color("#1a9ffa");
        const green = hex_color("#90EE90");
        const yellow = hex_color("#FFFF00");

        // alright so the game's coordinates are currently from -20 to 20 on the x direction and -10 to 0 in the y

        // draw the borders for the game
        let left_border_transform = Mat4.identity();
        left_border_transform = left_border_transform.times(Mat4.translation(- 20, -10, 0));
        left_border_transform = left_border_transform.times(Mat4.scale(0.1, 10, 1));

        let top_border_transform = Mat4.identity();
        top_border_transform = top_border_transform.times(Mat4.translation(0, 0, 0));
        top_border_transform = top_border_transform.times(Mat4.scale(20, 0.1, 1));

        let right_border_transform = Mat4.identity();
        right_border_transform = right_border_transform.times(Mat4.translation(20, -10, 0));
        right_border_transform = right_border_transform.times(Mat4.scale(0.1, 10, 1));


        this.shapes.cube.draw(context, program_state, left_border_transform, this.materials.plastic.override({color: yellow}));
        this.shapes.cube.draw(context, program_state, top_border_transform, this.materials.plastic.override({color: yellow}));
        this.shapes.cube.draw(context, program_state, right_border_transform, this.materials.plastic.override({color: yellow}));

        let ball_transform = Mat4.identity();
        this.generate_bricks(context, program_state);
        // time since starting given in seconds
        const t = this.t = program_state.animation_time / 1000;

        // make this value more negative for faster falling


        // this.shapes.ball.draw(context, program_state, ball_transform, this.materials.plastic.override({color:blue}));

        let platform_transform = Mat4.identity();

        // TODO (david): make the movement more smooth by making it based on time, and changing the platform location by adding the product of the time and (-1, 0, 1)

        if (this.platformMoveLeft) {
            this.platformX -= 1;
            this.platformMoveLeft = false;
        }
        else if (this.platformMoveRight) {
            this.platformX += 1
            this.platformMoveRight = false;
        }

        platform_transform = platform_transform.times(Mat4.translation(this.platformX, -20, 0));
        platform_transform = platform_transform.times(Mat4.scale(2, .1, 1));

        // draw the ball
        // const ball_delta = -5;
        const time_delta = t - this.time_offset;

        // for changing the ball angle after colliding: just use the center of the ball's location for x
        // once we've confirmed that there's a collision, we send the ball flying at an offset depending on distance from center


        ball_transform = ball_transform.times(Mat4.translation(this.ballX + (time_delta * this.ballMovementX), this.ballY + (time_delta * this.ballMovementY), 0, 1));

        this.shapes.ball.draw(context, program_state, ball_transform, this.materials.plastic.override({color:blue}));
        this.shapes.cube.draw(context, program_state, platform_transform, this.materials.plastic.override({color:green}));


        if (this.sphere_to_platform_collision_detection(ball_transform, platform_transform, "bottom", this.platform_radius)) {
            this.time_offset = t;
            this.ballX = ball_transform[0][3];
            this.ballY = ball_transform[1][3];

            const platform_center = platform_transform[0][3];

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

        if (this.sphere_to_border_collision_detection(ball_transform, left_border_transform, "left")) {
            this.time_offset = t;
            this.ballX = ball_transform[0][3];
            this.ballY = ball_transform[1][3];

            this.ballMovementX *= -1;
        }
        else if (this.sphere_to_platform_collision_detection(ball_transform, top_border_transform, "top", 20)) {
            this.time_offset = t;
            this.ballX = ball_transform[0][3];
            this.ballY = ball_transform[1][3];

            this.ballMovementY *= -1;
        }
        else if (this.sphere_to_border_collision_detection(ball_transform, right_border_transform, "right")) {
            this.time_offset = t;
            this.ballX = ball_transform[0][3];
            this.ballY = ball_transform[1][3];

            this.ballMovementX *= -1;
        }

        // check for collision with every single block
        for (let i = 0; i < this.block_array.length; i++) {
            if (this.sphere_to_block_collision_detection(ball_transform, this.block_array[i].get_block_transformation())) {
                // TODO
            }
        }
    }
}