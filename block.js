import {tiny} from './examples/common.js';
import {ORIGIN, BRICK_DIM} from './game.js';
const {
    Mat4,
} = tiny;

export const Block_Type = {
    None: 0,
    Crate: 1,
    Sand: 2,
    Stone: 3
}

export class Block {

    constructor() {
        this.block_type = Math.floor(Math.random() * 4);
        this.x_coord = null;
        this.y_coord = null;
        // this.block_transform = 2;
    }

    get_coordinates() {
        let x_coord = this.x_coord,
            y_coord = this.y_coord;
        return {x_coord, y_coord};
    }

    get_block_type() {
        return this.block_type;
    }

    set_block_type(btype) {
        this.block_type = btype;
    }

    get_block_transformation() {
        return this.block_transform;
    }

    set_block_transformation(i, j) {
        let delta_y = 2;
        let delta_x = 2;
        this.x_coord = ORIGIN[0] + j * (BRICK_DIM + delta_x)
        this.y_coord = ORIGIN[1] - i * (BRICK_DIM + delta_y)
        let block_transform = Mat4.identity().times(Mat4.translation(ORIGIN[0] + j * (BRICK_DIM + delta_x), ORIGIN[1] - i * (BRICK_DIM + delta_y), 0)).times(Mat4.scale(BRICK_DIM/2,BRICK_DIM/2, BRICK_DIM/2));
        if (this.block_type == Block_Type.Crate || this.block_type == Block_Type.None) {
            return block_transform.times(Mat4.scale(2.5,2.5,2.5));
        }

        return block_transform.times(Mat4.scale(5, 10, 1));
    }

    block_hit() {
        if (this.block_type !== Block_Type.None) {
            this.block_type--;
        }
    }
}