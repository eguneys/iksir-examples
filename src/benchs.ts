import { Play, Quad } from 'iksir'
import { ticks } from './shared'

export abstract class IBench {

  get play(): Play { return this.ctx.play }

  get image(): HTMLImageElement { return this.ctx.image }

  quad: Quad

  constructor(readonly ctx: BenchCtx) {

    this.quad = Quad.make(this.image,
      0, 0, 128, 128)
 
  }

  abstract update(dt: number): void
  abstract draw(): void
}

export interface BenchCtx {
  play: Play;
  image: HTMLImageElement;
}

export class First extends IBench {

  static make = (ctx: BenchCtx) => new First(ctx)


  constructor(readonly ctx: BenchCtx) {
    super(ctx)
  }


  update(dt: number) {}

  draw() {
    for (let i = 0; i < 100; i++) {
      this.play.draw(this.quad, Math.random() * 320, 
        Math.random() * 180)
    }
  }
}

export class Second extends IBench {

  static make = (ctx: BenchCtx) => new Second(ctx)

  x: number = 0
  y: number = 0
  theta: number = 0

  constructor(readonly ctx: BenchCtx) {
     super(ctx)
  }


  update(dt: number) {
    this.x += (320 / (ticks.second * 6)) * dt
    this.y += (180 / (ticks.second * 6)) * dt

    this.theta += (Math.PI * 2 / (ticks.second * 16)) * dt

    this.x %= 320
    this.y %= 180
  }

  draw() {
    this.play.draw(this.quad, this.x, this.y, 0, 0.5, 0.5) 
    this.play.draw(this.quad, this.x + Math.sin(this.theta) * 10, 
      this.y + Math.cos(this.theta)*10, this.theta) 

    this.play.draw(this.quad, 160, 90, 0, 0.5, 0.5)
    this.play.draw(this.quad, 160, 90, this.theta, 0.7, 0.7)
  }
}

export default [
  First.make,
  Second.make
]
