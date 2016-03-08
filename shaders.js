var SHADERS={
    GetVertexShader : function(){
        var vertexSource="\n\
            attribute vec3 position;\n\
            uniform mat4 Pmatrix;\n\
            uniform mat4 Vmatrix;\n\
            uniform mat4 Mmatrix;\n\
            uniform mat4 Smatrix;\n\
            attribute vec3 color; //the color of the point\n\
            varying vec3 vColor;\n\
            void main(void) { //pre-built function\n\
            gl_Position = Pmatrix*Vmatrix*Mmatrix*Smatrix*vec4(position, 1.);\n\
            vColor=color;\n\
            }";
       return vertexSource;
    },
    
    GetFragmentShader : function(){
        var fragmentSource="\n\
            precision mediump float;\n\
            varying vec3 vColor;\n\
            void main(void) {\n\
            gl_FragColor = vec4(vColor, 1.);\n\
            }";
        return fragmentSource;
    }
};