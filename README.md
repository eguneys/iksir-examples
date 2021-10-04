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
   let gl = $canvas.getContext('webgl2', { antialias: false });
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

  // Pixi.js matrix has this structure  
  // a c tx
  // b d ty
  // 0 0 1
  export default class Matrix {

    // projection matrix is defined like this
    static projection = (width: number, height: number) => {
      let b = 0,
        c = 0
  
      let a = 1 / width * 2,
      d = -1 / height * 2,
      tx = -1,
      ty = 1
  
      return new Matrix(a, b, c, d, tx, ty)
    } 
  
  }
```

Let's say we pass the uniform like this:

```js
  let projectionMatrix = Matrix.projection(320, 180)

  // ...


  let program = generateProgram(gl, vSource, fSource)

  gl.useProgram(program.program)
  gl.uniformMatrix3fv(program.uniformData['projectionMatrix'].location, false, this.projectionMatrix.array_t)

```

We need uniform and attribute locations in the shader, so let's keep this data in a class, and update `generateProgram` to return all of this data. 

```js

export interface IAttributeData {
  tpe: string;
  size: number;
  location: number;
  name: string;
}

export interface IUniformData {
  name: string;
  index: number;
  location: WebGLUniformLocation;
}

export class Program {
  
     constructor(
       readonly uniformData: { [key: string]: IUniformData },
       readonly attributeData: { [key: string]: IAttributeData },
     readonly program: WebGLProgram) {}
}


```

Now we can pass coordinates in 320x180 dimensions, let's also make sure we use `Float32Array` buffers so we don't overflow.

One important thing is not to mismatch the types of data in the buffers. For example

```js

    gl.vertexAttribPointer(0, 2, gl.UNSIGNED_BYTE, false, 0, 0)
   
    // ... gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 0)

```

the third argument to `vertexAttribPointer` is the data type of the attributes buffer.
And `gl.drawElements` is the data type for the index buffer.

## Draw more quads with transform

Let's draw more quads at random positions like:

```js
  // draw(x, y)
  draw(10, 10)
  draw(30, 30)
  draw(80, 100)
  flush()
``` 

We can do it like this:

```js
  
  let elements = []
  function draw(x, y) {

    elements.push(
      Rectangle.unit.transform(
        Matrix.unit
        .scale(w, h)
        .translate(x, y)))

  }

```

`draw` only pushes a rectangle to an array. Don't worry about how we build the rectangle, it's intuitive though. Later Rectangle will give us the `vertexData` to push into the attributes buffer.

```js

  function flush() {


    let attributesBuffer = new Float32Array(4 * 4 * 2),
        indexBuffer = new Uint16Array(4 * 6)


    
    this.elements.forEach((element, i) => {

      let {
        vertexData,
        indices } = element

      for (let k = 0; k < vertexData.length; k++) {
        attributeBuffer[i * vertexData.length + k] = vertexData[k]
      }

      for (let k = 0; k < indices.length; k++) {
        indexBuffer[i * indices.length + k] = i * 4 + indices[k]
      }
    })

    // usual draw operations

  }

```

We copy `vertexData` and `indices` of the rectangles to draw, into respective buffers. Later to pass to webgl.

### Transforming Rectangle with Matrix 

`Rectangle.unit` returns the `1x1` rectangle at `0,0` position. `rectangle.transform` transforms the rectangle with a matrix operation. Basically multiplying every vertex with the matrix and returning a new rectangle. `Matrix.unit` is the identity matrix. Matrix class has api like `translate`, `rotate`, `scale`, that applies the transformation to the current matrix returning a new matrix. 


Now we can draw multiple rectangles with various transformations.


## Benchmark, Animation

Let's say we draw lots of quads every frame, and test our framerate:

```js

function benchmark1(play: Play) {

  for (let i = 0; i < 100; i++) {
    play.draw(Math.random() * 320, Math.random() * 180)
  }

}

```

Don't forget to adjust the buffer sizes to actually contain that many elements.

For now I don't really see any performance problems, I guess that's a good thing.

## Texture the Quad

Let's say we give the quad a texture:


`default.frag`:
```
  varying vec2 vTextureCoord;

  uniform sampler2D uSampler;

  void main(void) {
    gl_fragColor *= texture2D(uSampler, vTextureCoord)
  }  
```

`default.vert`:
```
  // ...

  attribute vec2 aTextureCoord;

  varying vec2 vTextureCoord;

  void main(void) {
    // ...
    vTextureCoord = aTextureCoord;
  }  
```

Now we see white quads, now let's upload a texture into webgl.

```js


    let glTexture = gl.createTexture()


    gl.bindTexture(gl.TEXTURE_2D, glTexture)

    gl.texImage2D(gl.TEXTURE_2D, 0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 255, 255]))


    // gl.drawElements(gl.TRIANGLES, indexBuffer.length, gl.UNSIGNED_SHORT, 0)

```

We uploaded a blue texture but we can't see it, let's put the uv data into `attributeBuffer` like this: 

```js
 
    let aIndex = 0

    this.elements.forEach((element, i) => {
      let {
        vertexData,
        indices } = element

      let { fsUv } = this.quads[i]

      for (let k = 0; k < vertexData.length; k+=2) {
        attributeBuffer[aIndex++] = vertexData[k]
        attributeBuffer[aIndex++] = vertexData[k+1]
        attributeBuffer[aIndex++] = fsUv[k]
        attributeBuffer[aIndex++] = fsUv[k+1]
      }

      for (let k = 0; k < indices.length; k++) {
        indexBuffer[i * indices.length + k] = i * 4 + indices[k]
      }
    })

```

fsUv holds texture uv's for an element. Let's make a Quad class that holds that information:

```js
  
export default class Quad {

  static make = (texture: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number) => new Quad(texture,
      Rectangle.make(x, y, w, h))

  readonly fsUv: Float32Array
  // ... 
```

We can use it like this: 

```js
  
  
  draw = (quad: Quad, x: number, y: number, //...

    this.quads.push(quad)
    // ...
```

Everytime we draw we also push a quad to `this.quads`.

Now the quads turned blue, let's upload a texture from one of the quads.

```js
    let texture = this.quads[0].texture

    gl.texImage2D(gl.TEXTURE_2D, 0,
      gl.RGBA, texture.width, texture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      texture)

    gl.generateMipmap(gl.TEXTURE_2D)

```

We should scale the element to the texture width:

```js
   draw = (quad: Quad // ...

    this.elements.push(
      Rectangle.unit.transform(
        Matrix.unit
        .scale(quad.tw, quad.th)
        .scale(sx, sy)
        .translate(-sx * quad.tw * 0.5, -sy * quad.th * 0.5)
        .rotate(r)
        .translate(sx * quad.tw * 0.5, sy * quad.th * 0.5)
        .translate(x, y))
    // ...
```
