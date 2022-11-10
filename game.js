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
        //  TODO (Requirement 5).
        // When a set of lines is used in graphics, you should think of the list entries as
        // broken down into pairs; each pair of vertices will be drawn as a line segment.
        // Note: since the outline is rendered with Basic_shader, you need to redefine the position and color of each vertex
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
            program_state.set_camera(Mat4.translation(0, 10, -30));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    }
}

export class Game extends Base_Scene {
    /**
     * This Scene object can be added to any display canvas.
     * We isolate that code so it can be experimented with on its own.
     * This gives you a very small code sandbox for editing a simple scene, and for
     * experimenting with matrix transformations.
     */

    constructor() {
        super();

        this.moveLeft = false;
        this.moveRight = false;

        this.platformX = 0;
    }

    // we'll use x to move left and c to move right
    make_control_panel() {
        this.key_triggered_button("Move left", ["x"], () => this.moveLeft = true);
        this.key_triggered_button("Move right", ["c"], () => this.moveRight = true);
    }

    draw_box(context, program_state, model_transform) {
        // TODO:  Helper function for requirement 3 (see hint).
        //        This should make changes to the model_transform matrix, draw the next box, and return the newest model_transform.
        // Hint:  You can add more parameters for this function, like the desired color, index of the box, etc.

        return model_transform;
    }

    // TODO (david): make this collision detection algorithm more refined (treats the balls as cubes essentially)
    sphere_to_platform_collision_detection(sphere_transform, platform_transform) {

        // detects a collision if the x value of the sphere is within the platform range AND the y value of the sphere is within platform range

        const sphere_x = sphere_transform[0][3];
        const sphere_y = sphere_transform[1][3];
        const platform_x = platform_transform[0][3];
        const platform_y = platform_transform[1][3];

        // currently testing with platform length of 2 and sphere radius of 1
        const sphere_radius = 0.5;
        const platform_radius = 1;

        if (sphere_x - sphere_radius < platform_x + platform_radius ||
            sphere_x + sphere_radius > platform_x - platform_radius) {
            if (sphere_y > platform_y && (sphere_y - sphere_radius < platform_y)) {
                return true;
            }
        }
        return false;

    }

    display(context, program_state) {
        super.display(context, program_state);
        const blue = hex_color("#1a9ffa");
        const green = hex_color("#90EE90");
        let ball_transform = Mat4.identity();

        // time since starting given in seconds
        const t = this.t = program_state.animation_time / 1000;

        // make this value more negative for faster falling


        // this.shapes.ball.draw(context, program_state, ball_transform, this.materials.plastic.override({color:blue}));

        let platform_transform = Mat4.identity();

        // TODO (david): make the movement more smooth by making it based on time, and changing the platform location by adding the product of the time and (-1, 0, 1)

        if (this.moveLeft) {
            this.platformX -= 1;
            this.moveLeft = false;
        }
        else if (this.moveRight) {
            this.platformX += 1
            this.moveRight = false;
        }

        platform_transform = platform_transform.times(Mat4.translation(this.platformX, -20, 0));
        platform_transform = platform_transform.times(Mat4.scale(2, .1, 1));

        // draw the ball
        const ball_delta = -5;


        ball_transform = ball_transform.times(Mat4.translation(0, t * ball_delta, 0, 1));

        this.shapes.ball.draw(context, program_state, ball_transform, this.materials.plastic.override({color:blue}));
        this.shapes.cube.draw(context, program_state, platform_transform, this.materials.plastic.override({color:green}));
        
    }
}