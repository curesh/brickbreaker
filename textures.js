import {defs} from './examples/common.js';

export class Texture_Scroll_X extends defs.Textured_Phong {
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