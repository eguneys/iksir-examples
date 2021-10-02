## Handmade Pixi.js Tutorial

Pixi.js is an excellent library, but it is buried under lot's of corporate code. We will learn the essentials of how it uses WebGL to render sprites in batches.


## Create canvas element

First, let's say we put a canvas on the screen like:



```html
  <div id='app'></div>
  <script>
    Iksir(document.getElementById('app'));
  </script>
```

This is how we would do this:

```js
 
  function Iksir($wrap: HTMLElement) {
    let $canvas = document.createElement('canvas');
    $canvas.width = 320
    $canvas.height = 180
    $wrap.appendChild($canvas)
  }

```

The canvas's hardcoded dimensions are `320x180`. We will draw inside this area. And upscale this to cover the browser viewport area, with css. Also disable bluring to achieve a pixelated look.

Finally we acquire a webgl2 rendering context:

```js
   let gl = $canvas.getContext('webgl2');
```

## Clear the screen

For now, we will only draw to screen, not bothering with anything else, so:

```js
    gl.viewport(0, 0, 320, 180)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(this.gl.COLOR_BUFFER_BIT)
```

We can see the screen is cleared on the canvas.

## Draw a quad

Let's try to draw elements:

```js
   gl.drawElements(gl.TRIANGLES, 1, gl.UNSIGNED_BYTE, 0)
```

We get a `warning: index buffer not bound`, so let's do that:

```js

   let vao = gl.createVertexArray()

   gl.bindVertexArray(vao)


   let gl_abuffer = gl.createBuffer()

   gl.bindBuffer(gl.ARRAY_BUFFER, gl_abuffer)


   let gl_ibuffer = gl.createBuffer()

   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_ibuffer)

```

We need two buffers, for attributes and indices, we bind them both to a gl buffer. Also create a VAO for use later.

Now we get `warning: Index buffer too small`. so we put some random data to index buffer:

```js

   let indexBuffer = new Uint8Array([0])

   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer, gl.STATIC_DRAW)

```

We get `warning: The current program is not linked`. So let's make a program:

```js

  let glProgram = generateProgram(gl, '', '')
  gl.useProgram(glProgram)
```

`generateProgram` is adapted from pixi.js `packages/core/src/shader/utils/generateProgram.ts` it has this signature:


```js
export function generateProgram(gl: WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string): WebGLProgram
```

Now we get bunch of shader errors. Let's pass in some minimal valid shaders:

`default.vert`, vertex shader:
```
  void main(void) {
  }
```


`default.frag`: fragment shader:
```
  void main(void) {
  }
```

Now we get `warning: Program has no frag output at location 0, but ...`. So let's try to output color with shaders.

`defalt.frag`:
```
  precision lowp float;

  void main(void) {
    vec4 color = vec4(1.0);
    vec4 vColor = vec4(1.0);
    gl_FragColor = color * vColor; 
  } 
```

No more warnings, yet we see no white color on the screen.


### Pass Shader Attributes 

Let's define some shader attributes to draw a quad:

`default.vert`:
```
  precision lowp float;
  attribute vec2 aVertexPosition;
  
  void main(void) {
    gl_Position = vec4(vec3(aVertexPosition, 1.0).xy, 0.0, 1.0);
  }
```


```js

    // .... gl.useProgram(program)

    let attributeBuffer = new Uint8Array([
      0, 0,
      0, 1,
      1, 0
    ])

    gl.bindBuffer(gl.ARRAY_BUFFER, gl_abuffer)
    gl.bufferData(gl.ARRAY_BUFFER, attributeBuffer, gl.STATIC_DRAW)

    indexBuffer = new Uint8Array([0, 1, 2])
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_ibuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer, gl.STATIC_DRAW)

    gl.enableVertexAttribArray(0)

    gl.vertexAttribPointer(0, 2, gl.UNSIGNED_BYTE, false, 0, 0)

   
    // ... gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 0)

```

Now we can see half triangle drawn on screen. We can complete the other half by passing other vertices as attribute. 


### Projection matrix as a uniform

Let's multiply the vertices by a projection matrix, so we can pass vertex points in `320x180` dimension space.

`default.vert`
```
 // ...

 uniform mat3 projectionMatrix

 // ...
 
 gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0) 
```

Pixi.js has a matrix class, that allows 2d transformations of points. Translate, rotate, scale, and also return as an array to pass in as a uniform. We will adapt it to our use.

Let's use it to define the projection matrix:

```js
  
```


We have to keep track of attribute locations in our shader, so let's keep this data in a class, and update `generateProgram` to return an instance. 


```js

export interface IAttributeData {
  tpe: string;
  size: number;
  location: number;
  name: string;
}

export class Program {
  
     constructor(
       readonly attributeData: { [key: string]: IAttributeData },
     readonly program: WebGLProgram) {}
}


```


