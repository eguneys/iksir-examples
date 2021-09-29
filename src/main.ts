import Iksir from 'iksir';
import * as PIXI from 'pixi.js';
import uvpng from '../assets/uv.png';

function assets() {

}

function iksir(element: HTMLElement) {

}

function piksi(element: HTMLElement) {

 PIXI.Loader.shared.add(uvpng)
  .load(function() {

    let app = new PIXI.Application({ width: 320, height: 180 })
    let { texture } = PIXI.Loader.shared.resources[uvpng];

    let sprite = new PIXI.Sprite(texture)

    app.stage.addChild(sprite)


    element.appendChild(app.view)
  })



}


export default function app(element: HTMLElement) {
  piksi(element)
  //iksir(element)
}
