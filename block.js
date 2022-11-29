import {tiny} from './examples/common.js';
const {
    Mat4,
} = tiny;

export const Brick_Type = {
    None: 0,
    Crate: 1,
    Sand: 2,
    Stone: 3
}

const ORIGIN = [-45, 10];
const BRICK_DIM = 1.5;


export class Block {

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