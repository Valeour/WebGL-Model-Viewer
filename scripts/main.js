var main=function() {
  var CANVAS=document.getElementById("canvas");
  CANVAS.width=window.innerWidth;
  CANVAS.height=window.innerHeight;
  
  var canvas2d=document.getElementById("2dCanvas");
  canvas2d.width=window.innerWidth;
  canvas2d.height=window.innerHeight;

  var ctx = canvas2d.getContext("2d");
  // Canvas text
  // TODO:
  // Wireframe toogle
  var wireframeOn = false;
  var scrollPosition=0;
  var oldScrollPosition;
  var mouseDelta;
  var AMORTIZATION=0; //TODO: Fix weird bug with text showing massive numbers when set to anything but 0
  var drag=false;
  var old_x, old_y;
  var dX=0, dY=0;
 
  var mouseDown=function(e) {
    drag=true;
    old_x=e.pageX, old_y=e.pageY;
    e.preventDefault();
    return false;
  };

  var mouseUp=function(e){
    drag=false;
  };

  var mouseMove=function(e) {
    if (!drag) return false;
    dX=(e.pageX-old_x)*2*Math.PI/CANVAS.width,
      dY=(e.pageY-old_y)*2*Math.PI/CANVAS.height;
    THETA+=dX;
    PHI+=dY;
    old_x=e.pageX, old_y=e.pageY;
    e.preventDefault();
  };
  
  // Canvas listeners
  canvas2d.addEventListener("mousedown", mouseDown, false);
  canvas2d.addEventListener("mouseup", mouseUp, false);
  canvas2d.addEventListener("mouseout", mouseUp, false);
  canvas2d.addEventListener("mousemove", mouseMove, false);
  window.addEventListener("keyup", function(e){
	console.log(e.charCode);
      if(e.keyCode == 32 || e.charCode == 32){
           wireframeOn = !wireframeOn;
           e.preventDefault();
      }
  }, false);
  
  canvas2d.addEventListener("mousewheel", function(e){
    
      mouseDelta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
      console.log("mousedelta: "+mouseDelta);
      if(mouseDelta==1){
          scrollPosition++;
          if(scrollPosition>30){
              scrollPosition=30;
          }
      }else{
          scrollPosition--;
          if(scrollPosition < -18){
              scrollPosition = -18;
          }
      }
  }, false);
  
  /* Get WebGL context */
  var GL;
  try {
    GL = CANVAS.getContext("experimental-webgl", {antialias: true});
  } catch (e) {
    alert("You are not webgl compatible :(") ;
    return false;
  }

  /* Get shaders */ 
  var shader_vertex_source=SHADERS.GetVertexShader();
  var shader_fragment_source=SHADERS.GetFragmentShader();

  var get_shader=function(source, type, typeString) {
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
      alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
      return false;
    }
    return shader;
  };

  var shader_vertex=get_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
  var shader_fragment=get_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

  var SHADER_PROGRAM=GL.createProgram();
  GL.attachShader(SHADER_PROGRAM, shader_vertex);
  GL.attachShader(SHADER_PROGRAM, shader_fragment);

  GL.linkProgram(SHADER_PROGRAM);

  var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
  var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
  var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");
  var _Smatrix = GL.getUniformLocation(SHADER_PROGRAM, "Smatrix");

  var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
  var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");

  GL.enableVertexAttribArray(_color);
  GL.enableVertexAttribArray(_position);

  GL.useProgram(SHADER_PROGRAM);

  /*========================= THE CUBE ========================= */
  //POINTS :
  var cube_vertex=[
    -1,-1,-1,     1,1,0,
    1,-1,-1,     1,1,0,
    1, 1,-1,     1,1,0,
    -1, 1,-1,     1,1,0,

    -1,-1, 1,     0,0,1,
    1,-1, 1,     0,0,1,
    1, 1, 1,     0,0,1,
    -1, 1, 1,     0,0,1,

    -1,-1,-1,     0,1,1,
    -1, 1,-1,     0,1,1,
    -1, 1, 1,     0,1,1,
    -1,-1, 1,     0,1,1,

    1,-1,-1,     1,0,0,
    1, 1,-1,     1,0,0,
    1, 1, 1,     1,0,0,
    1,-1, 1,     1,0,0,

    -1,-1,-1,     1,0,1,
    -1,-1, 1,     1,0,1,
    1,-1, 1,     1,0,1,
    1,-1,-1,     1,0,1,

    -1, 1,-1,     0,1,0,
    -1, 1, 1,     0,1,0,
    1, 1, 1,     0,1,0,
    1, 1,-1,     0,1,0

  ];

  var CUBE_VERTEX= GL.createBuffer ();
  GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
  GL.bufferData(GL.ARRAY_BUFFER,
                new Float32Array(cube_vertex),
    GL.STATIC_DRAW);

  //FACES :
  var cube_faces = [
    0,1,2,
    0,2,3,

    4,5,6,
    4,6,7,

    8,9,10,
    8,10,11,

    12,13,14,
    12,14,15,

    16,17,18,
    16,18,19,

    20,21,22,
    20,22,23
  ];
  var CUBE_FACES= GL.createBuffer ();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(cube_faces),
    GL.STATIC_DRAW);

  /* Set matrices */

  var PROJMATRIX=LIBS.get_projection(40, CANVAS.width/CANVAS.height, 1, 100);
  var MOVEMATRIX=LIBS.get_I4();
  var VIEWMATRIX=LIBS.get_I4();
  var SCALEMATRIX=LIBS.get_I4();
  LIBS.translateZ(VIEWMATRIX, -10);
  var THETA=0,
      PHI=0;

  /*---------------Drawing starts here---------------*/
  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);
  GL.clearColor(0.0, 0.0, 0.0, 0.0);
  GL.clearDepth(1.0);

  var time_old=0;
  var animate=function(time) {
    var dt=time-time_old;
  
    if (!drag) {
      dX*=AMORTIZATION, dY*=AMORTIZATION;
      THETA+=dX, PHI+=dY;
    }
    LIBS.set_I4(MOVEMATRIX);
    LIBS.rotateY(MOVEMATRIX, THETA);
    LIBS.rotateX(MOVEMATRIX, PHI);
    // Probably a better way of doing this
    if(scrollPosition != oldScrollPosition){
           oldScrollPosition=scrollPosition;
           LIBS.scale(SCALEMATRIX, Math.abs(scrollPosition/100), mouseDelta);
       }
       
       
    
    time_old=time;

    GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
    GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);
    GL.uniformMatrix4fv(_Smatrix, false, SCALEMATRIX);

    GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false,4*(3+3),0) ;
    GL.vertexAttribPointer(_color, 3, GL.FLOAT, false,4*(3+3),3*4) ;

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    
    if(!wireframeOn){
        GL.drawElements(GL.TRIANGLES, 6*2*3, GL.UNSIGNED_SHORT, 0);
    }else{
        GL.drawElements(GL.LINES, 6*2*3, GL.UNSIGNED_SHORT, 0);
    }
    
    GL.flush();
    
    var FPS =fps.getFPS()
     //Write 2d TODO: Move all 2d drawing to its own handler class
    ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
    ctx.fillStyle = "white";
    ctx.font = "12pt Arial";
    ctx.fillText("dX: "+dX, 20, 20);
    ctx.fillText("dY: "+dY, 20, 40);
    ctx.fillText("ZoomValue: "+scrollPosition, 20, 60);
    ctx.fillText("ScrollDirection: "+mouseDelta, 20, 80);
    ctx.fillText("WireframeMode: "+wireframeOn, 20, 100);
    ctx.fillText("Projection: : "+LIBS.get_projection(), 20, 120);
    ctx.fillText("View: : "+VIEWMATRIX, 20, 140);
    //ctx.fillText("Move: : "+MOVEMATRIX, 20, 140);
    ctx.fillText("Scale: : "+SCALEMATRIX, 20, 160);

    ctx.fillText("FPS: "+FPS, 20, 180);

    ctx.fillText("NOT CHANCE'S WEBGL APP", 20, 180);

   
    window.requestAnimationFrame(animate);
  };
  animate(0);
};