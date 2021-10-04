import Iksir, { Play }  from 'iksir'
import * as PIXI from 'pixi.js'
import uvpng from '../assets/uv.png'
import * as Stats from 'stats.js'
import Benchs, { BenchCtx } from './benchs'

function assets(): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    let res = new Image()
    res.onload = () => resolve(res)
    res.src = uvpng
  })
}

function iksir(element: HTMLElement) {

  assets().then(image => {

    let play = Iksir(element)

    let stats = new Stats()

    stats.showPanel(1)
    element.appendChild(stats.dom)


    let ctx = {
      play,
      image
    }

    let bench = Benchs[1](ctx)
    let last: number | undefined
    function step(ts: number) {

      let dt = (ts - (last || ts)) / 1000
      last = ts

      stats.begin()
      bench.update(dt)
      bench.draw()
      play.flush()
      stats.end()

      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
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
  //piksi(element)
  iksir(element)
}
