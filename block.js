import {tiny} from './examples/common.js';
const {
    Mat4,
} = tiny;

export const Block_Type = {
    None: 0,
    Crate: 1,
    Sand: 2,
    Stone: 3
}

const ORIGIN = [-45, 10];
const BRICK_DIM = 1.5;


export class Block {

    constructor() {
        this.block_type = Math.floor(Math.random() * 4);
        this.x_coord = 0;
        this.y_coord = 0;
    }

    get_coordinates() {
        let x_coord = this.x_coord,
            y_coord = this.y_coord;
        return {x_coord, y_coord};
    }

    get_block_type() {
        return this.block_type;
    }

    get_block_transformation(i, j) {
        let delta_y = 2;
        let delta_x = 2;
        this.x_coord = ORIGIN[0] + j * (BRICK_DIM + delta_x)
        this.y_coord = ORIGIN[1] + i * (BRICK_DIM + delta_y)
        let block_transform = Mat4.identity().times(Mat4.translation(ORIGIN[0] + j * (BRICK_DIM + delta_x), ORIGIN[1] + i * (BRICK_DIM + delta_y), 0)).times(Mat4.scale(BRICK_DIM/2,BRICK_DIM/2, BRICK_DIM/2));
        if (this.block_type == Block_Type.Crate) {
            return block_transform.times(Mat4.scale(2.5,2.5,2.5));
        }

        return block_transform.times(Mat4.scale(5, 10, 2));
    }

    block_hit() {
        if (this.block_type !== Block_Type.None) {
            this.block_type--;
        }
    }
}