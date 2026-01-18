import { Scene, ParticleSystem, Texture, Vector3, Color4 } from '@babylonjs/core'
import { TimeSystem, Season } from './TimeSystem'

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy'

export interface WeatherState {
  type: WeatherType
  intensity: number // 0-1
  duration: number // 초 단위
  startTime: number // 시작 시간 (타임스탬프)
}

export class WeatherSystem {
  private scene: Scene
  private timeSystem: TimeSystem | null = null
  private currentWeather: WeatherState = {
    type: 'sunny',
    intensity: 0.5,
    duration: 3600, // 1시간
    startTime: Date.now()
  }
  
  // 파티클 시스템
  private rainParticles: ParticleSystem | null = null
  private snowParticles: ParticleSystem | null = null
  
  // 콜백
  private onWeatherChangeCallbacks: Array<(weather: WeatherState) => void> = []
  
  // 계절별 날씨 확률
  private weatherProbabilities: { [season in Season]: { [weather in WeatherType]: number } } = {
    spring: {
      sunny: 0.4,
      cloudy: 0.3,
      rainy: 0.25,
      snowy: 0.0,
      windy: 0.05
    },
    summer: {
      sunny: 0.5,
      cloudy: 0.2,
      rainy: 0.2,
      snowy: 0.0,
      windy: 0.1
    },
    autumn: {
      sunny: 0.3,
      cloudy: 0.3,
      rainy: 0.3,
      snowy: 0.0,
      windy: 0.1
    },
    winter: {
      sunny: 0.2,
      cloudy: 0.3,
      rainy: 0.1,
      snowy: 0.35,
      windy: 0.05
    }
  }
  
  constructor(scene: Scene) {
    this.scene = scene
    this.createParticleSystems()
    this.updateWeather()
  }
  
  public setTimeSystem(timeSystem: TimeSystem) {
    this.timeSystem = timeSystem
  }
  
  public update() {
    const now = Date.now()
    const elapsed = (now - this.currentWeather.startTime) / 1000 // 초 단위
    
    // 날씨 지속 시간이 지나면 새로운 날씨로 변경
    if (elapsed >= this.currentWeather.duration) {
      this.updateWeather()
    }
  }
  
  private updateWeather() {
    if (!this.timeSystem) {
      return
    }
    
    const season = this.timeSystem.getSeason()
    const probabilities = this.weatherProbabilities[season]
    
    // 확률에 따라 날씨 선택
    const random = Math.random()
    let cumulative = 0
    let newWeatherType: WeatherType = 'sunny'
    
    for (const [weather, prob] of Object.entries(probabilities) as [WeatherType, number][]) {
      cumulative += prob
      if (random <= cumulative) {
        newWeatherType = weather
        break
      }
    }
    
    // 날씨 강도 (0.3 ~ 0.8)
    const intensity = 0.3 + Math.random() * 0.5
    
    // 날씨 지속 시간 (30분 ~ 2시간)
    const duration = 1800 + Math.random() * 7200
    
    this.currentWeather = {
      type: newWeatherType,
      intensity: intensity,
      duration: duration,
      startTime: Date.now()
    }
    
    // 파티클 시스템 업데이트
    this.updateParticles()
    
    // 콜백 호출
    this.notifyWeatherChange()
  }
  
  private createParticleSystems() {
    // 비 파티클 시스템
    this.rainParticles = new ParticleSystem('rain', 5000, this.scene)
    this.rainParticles.particleTexture = new Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', this.scene)
    this.rainParticles.emitter = new Vector3(0, 20, 0)
    this.rainParticles.minEmitBox = new Vector3(-50, 0, -50)
    this.rainParticles.maxEmitBox = new Vector3(50, 0, 50)
    this.rainParticles.color1 = new Color4(0.8, 0.8, 1.0, 1.0)
    this.rainParticles.color2 = new Color4(0.8, 0.8, 1.0, 1.0)
    this.rainParticles.colorDead = new Color4(0.8, 0.8, 1.0, 0.0)
    this.rainParticles.minSize = 0.1
    this.rainParticles.maxSize = 0.2
    this.rainParticles.minLifeTime = 0.5
    this.rainParticles.maxLifeTime = 1.0
    this.rainParticles.emitRate = 0
    this.rainParticles.gravity = new Vector3(0, -9.81, 0)
    this.rainParticles.direction1 = new Vector3(-1, -10, -1)
    this.rainParticles.direction2 = new Vector3(1, -10, 1)
    this.rainParticles.minAngularSpeed = 0
    this.rainParticles.maxAngularSpeed = 0
    this.rainParticles.targetStopDuration = 0
    this.rainParticles.start()
    this.rainParticles.stop()
    
    // 눈 파티클 시스템
    this.snowParticles = new ParticleSystem('snow', 3000, this.scene)
    this.snowParticles.particleTexture = new Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', this.scene)
    this.snowParticles.emitter = new Vector3(0, 20, 0)
    this.snowParticles.minEmitBox = new Vector3(-50, 0, -50)
    this.snowParticles.maxEmitBox = new Vector3(50, 0, 50)
    this.snowParticles.color1 = new Color4(1.0, 1.0, 1.0, 1.0)
    this.snowParticles.color2 = new Color4(1.0, 1.0, 1.0, 1.0)
    this.snowParticles.colorDead = new Color4(1.0, 1.0, 1.0, 0.0)
    this.snowParticles.minSize = 0.2
    this.snowParticles.maxSize = 0.5
    this.snowParticles.minLifeTime = 2.0
    this.snowParticles.maxLifeTime = 4.0
    this.snowParticles.emitRate = 0
    this.snowParticles.gravity = new Vector3(0, -2, 0)
    this.snowParticles.direction1 = new Vector3(-0.5, -2, -0.5)
    this.snowParticles.direction2 = new Vector3(0.5, -2, 0.5)
    this.snowParticles.minAngularSpeed = -0.5
    this.snowParticles.maxAngularSpeed = 0.5
    this.snowParticles.targetStopDuration = 0
    this.snowParticles.start()
    this.snowParticles.stop()
  }
  
  private updateParticles() {
    if (!this.rainParticles || !this.snowParticles) return
    
    // 모든 파티클 정지
    this.rainParticles.stop()
    this.snowParticles.stop()
    
    // 현재 날씨에 따라 파티클 시작
    if (this.currentWeather.type === 'rainy') {
      const emitRate = Math.floor(1000 * this.currentWeather.intensity)
      this.rainParticles.emitRate = emitRate
      this.rainParticles.start()
    } else if (this.currentWeather.type === 'snowy') {
      const emitRate = Math.floor(500 * this.currentWeather.intensity)
      this.snowParticles.emitRate = emitRate
      this.snowParticles.start()
    }
  }
  
  public getCurrentWeather(): WeatherState {
    return { ...this.currentWeather }
  }
  
  public getWeatherType(): WeatherType {
    return this.currentWeather.type
  }
  
  public getWeatherIcon(): string {
    const icons: { [key in WeatherType]: string } = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      snowy: '❄️',
      windy: '💨'
    }
    return icons[this.currentWeather.type]
  }
  
  public getWeatherName(): string {
    const names: { [key in WeatherType]: string } = {
      sunny: '맑음',
      cloudy: '흐림',
      rainy: '비',
      snowy: '눈',
      windy: '바람'
    }
    return names[this.currentWeather.type]
  }
  
  public onWeatherChange(callback: (weather: WeatherState) => void) {
    this.onWeatherChangeCallbacks.push(callback)
  }
  
  private notifyWeatherChange() {
    this.onWeatherChangeCallbacks.forEach(callback => {
      callback(this.getCurrentWeather())
    })
  }
  
  public setWeather(type: WeatherType, intensity: number = 0.5, duration: number = 3600) {
    this.currentWeather = {
      type,
      intensity,
      duration,
      startTime: Date.now()
    }
    this.updateParticles()
    this.notifyWeatherChange()
  }
  
  public dispose() {
    if (this.rainParticles) {
      this.rainParticles.dispose()
    }
    if (this.snowParticles) {
      this.snowParticles.dispose()
    }
    this.onWeatherChangeCallbacks = []
  }
}
