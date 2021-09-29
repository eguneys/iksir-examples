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
 
  function($wrap: HTMLElement) {
    let $canvas = document.createElement('canvas');
    $canvas.width = 320
    $canvas.height = 180
    $wrap.appendChild($canvas)
  }

```

The canvas's hardcoded dimensions are `320x180`. We will draw inside this area. And upscale this to cover the browser viewport area, with css. Also disable bluring to achieve a pixelated look.

Finally we acquire a webgl rendering context, and keep these referenced under a class:

```js
   let gl = $canvas.getContext('webgl2');

   // these variables will be used under an instance of a Canvas class we have defined.
```

## Make a game loop

There are some ways to complicate this render loop, but it's simply this:

```js
  function step(t) {
    update(1/60);
    draw();
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
```

We pass hardcoded `1/60` ms as elapsed time `dt` but you can actually calculate that value based on timestamp got from argument `t`.

## Clear the screen

For now, we will only draw to screen, not bothering with anything else, so:

```js
  function draw() {

    gl.viewport(0, 0, 320, 180)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(this.gl.COLOR_BUFFER_BIT)
  }
```

## Render a texture


