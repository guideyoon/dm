import { Scene, HemisphericLight, DirectionalLight, Color3, Vector3 } from '@babylonjs/core'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

export interface GameTime {
  hour: number // 0-23
  minute: number // 0-59
  day: number // 1-365
  season: Season
  timeOfDay: TimeOfDay
}

export class TimeSystem {
  private scene: Scene
  private light: HemisphericLight | null = null
  private directionalLight: DirectionalLight | null = null
  
  // 게임 시간 (현실 시간 가속)
  private gameTime: GameTime = {
    hour: 8, // 오전 8시 시작
    minute: 0,
    day: 1,
    season: 'spring',
    timeOfDay: 'day'
  }
  
  // 시간 가속 배율 (더 느리게 조정: 1초 = 게임 10초)
  private timeScale: number = 10 // 1초 = 게임 10초 (하루 = 약 144분 = 2시간 24분)
  private lastUpdateTime: number = Date.now()
  
  // 조명 관련
  private baseLightIntensity: number = 0.7
  private currentLightIntensity: number = 0.7
  private targetLightIntensity: number = 0.7
  
  // 콜백
  private onTimeChangeCallbacks: Array<(time: GameTime) => void> = []
  private onSeasonChangeCallbacks: Array<(season: Season) => void> = []
  
  constructor(scene: Scene, light: HemisphericLight) {
    this.scene = scene
    this.light = light
    
    // 방향성 조명 추가 (태양/달)
    this.directionalLight = new DirectionalLight('sunLight', new Vector3(-1, -1, -1), scene)
    this.directionalLight.intensity = 0.5
    this.directionalLight.diffuse = new Color3(1, 0.95, 0.8)
    
    this.updateSeason()
    this.updateLighting()
  }
  
  public update() {
    const now = Date.now()
    const deltaTime = (now - this.lastUpdateTime) / 1000 // 초 단위
    this.lastUpdateTime = now
    
    // 게임 시간 업데이트
    const gameMinutesToAdd = deltaTime * this.timeScale
    this.addMinutes(gameMinutesToAdd)
    
    // 조명 부드럽게 전환
    if (Math.abs(this.currentLightIntensity - this.targetLightIntensity) > 0.01) {
      this.currentLightIntensity += (this.targetLightIntensity - this.currentLightIntensity) * 0.05
      if (this.light) {
        this.light.intensity = this.currentLightIntensity
      }
      if (this.directionalLight) {
        this.directionalLight.intensity = this.currentLightIntensity * 0.7
      }
    }
  }
  
  private addMinutes(minutes: number) {
    this.gameTime.minute += minutes
    
    while (this.gameTime.minute >= 60) {
      this.gameTime.minute -= 60
      this.gameTime.hour += 1
      
      if (this.gameTime.hour >= 24) {
        this.gameTime.hour = 0
        this.gameTime.day += 1
        
        // 계절 업데이트 (90일마다)
        const oldSeason = this.gameTime.season
        this.updateSeason()
        if (oldSeason !== this.gameTime.season) {
          this.notifySeasonChange(this.gameTime.season)
        }
      }
    }
    
    // 시간대 업데이트
    const oldTimeOfDay = this.gameTime.timeOfDay
    this.updateTimeOfDay()
    
    // 조명 업데이트
    this.updateLighting()
    
    // 콜백 호출
    if (oldTimeOfDay !== this.gameTime.timeOfDay || minutes >= 1) {
      this.notifyTimeChange()
    }
  }
  
  private updateTimeOfDay() {
    const hour = this.gameTime.hour
    
    if (hour >= 5 && hour < 7) {
      this.gameTime.timeOfDay = 'dawn'
    } else if (hour >= 7 && hour < 18) {
      this.gameTime.timeOfDay = 'day'
    } else if (hour >= 18 && hour < 20) {
      this.gameTime.timeOfDay = 'dusk'
    } else {
      this.gameTime.timeOfDay = 'night'
    }
  }
  
  private updateSeason() {
    const dayOfYear = ((this.gameTime.day - 1) % 365) + 1
    
    if (dayOfYear >= 1 && dayOfYear < 91) {
      this.gameTime.season = 'spring'
    } else if (dayOfYear >= 91 && dayOfYear < 182) {
      this.gameTime.season = 'summer'
    } else if (dayOfYear >= 182 && dayOfYear < 273) {
      this.gameTime.season = 'autumn'
    } else {
      this.gameTime.season = 'winter'
    }
  }
  
  private updateLighting() {
    const hour = this.gameTime.hour
    const timeOfDay = this.gameTime.timeOfDay
    
    // 시간대별 조명 강도
    let intensity = 0.7
    let sunIntensity = 0.5
    let sunColor = new Color3(1, 0.95, 0.8)
    let skyColor = new Color3(0.5, 0.7, 1)
    
    if (timeOfDay === 'dawn') {
      // 새벽 (5-7시)
      const progress = (hour - 5) / 2 // 0-1
      intensity = 0.3 + progress * 0.4
      sunIntensity = 0.2 + progress * 0.3
      sunColor = new Color3(1, 0.6, 0.4)
      skyColor = new Color3(0.8, 0.6, 0.4)
    } else if (timeOfDay === 'day') {
      // 낮 (7-18시)
      if (hour >= 7 && hour < 12) {
        // 오전
        const progress = (hour - 7) / 5
        intensity = 0.7 + progress * 0.2
        sunIntensity = 0.5 + progress * 0.2
      } else if (hour >= 12 && hour < 18) {
        // 오후
        const progress = (18 - hour) / 6
        intensity = 0.9 - progress * 0.2
        sunIntensity = 0.7 - progress * 0.2
      }
    } else if (timeOfDay === 'dusk') {
      // 저녁 (18-20시)
      const progress = (hour - 18) / 2
      intensity = 0.7 - progress * 0.4
      sunIntensity = 0.5 - progress * 0.3
      sunColor = new Color3(1, 0.5, 0.3)
      skyColor = new Color3(0.6, 0.4, 0.3)
    } else {
      // 밤 (20-5시)
      intensity = 0.1
      sunIntensity = 0.05
      sunColor = new Color3(0.3, 0.3, 0.5)
      skyColor = new Color3(0.1, 0.1, 0.2)
    }
    
    // 계절별 조정
    if (this.gameTime.season === 'winter') {
      intensity *= 0.9
      sunIntensity *= 0.9
    } else if (this.gameTime.season === 'summer') {
      intensity *= 1.1
      sunIntensity *= 1.1
    }
    
    this.targetLightIntensity = Math.max(0.05, Math.min(1.0, intensity))
    
    if (this.light) {
      this.light.diffuse = skyColor
    }
    
    if (this.directionalLight) {
      this.directionalLight.diffuse = sunColor
    }
    
    // 태양 위치 업데이트
    this.updateSunPosition()
  }
  
  private updateSunPosition() {
    if (!this.directionalLight) return
    
    const hour = this.gameTime.hour
    const minute = this.gameTime.minute
    const timeOfDay = hour + minute / 60
    
    // 태양 각도 계산 (0시 = -90도, 12시 = 90도)
    const sunAngle = ((timeOfDay - 6) / 12) * Math.PI - Math.PI / 2
    
    // 태양 방향 벡터
    const sunX = Math.cos(sunAngle)
    const sunY = Math.sin(sunAngle)
    const sunZ = 0.3
    
    this.directionalLight.direction = new Vector3(-sunX, -sunY, -sunZ).normalize()
  }
  
  public getTime(): GameTime {
    return { ...this.gameTime }
  }
  
  public getTimeString(): string {
    const hour = Math.floor(this.gameTime.hour)
    const minute = Math.floor(this.gameTime.minute)
    const hourStr = hour.toString().padStart(2, '0')
    const minuteStr = minute.toString().padStart(2, '0')
    return `${hourStr}:${minuteStr}`
  }
  
  public getDateString(): string {
    const seasonNames = {
      spring: '봄',
      summer: '여름',
      autumn: '가을',
      winter: '겨울'
    }
    return `${seasonNames[this.gameTime.season]} ${this.gameTime.day}일`
  }
  
  public getSeason(): Season {
    return this.gameTime.season
  }
  
  public getTimeOfDay(): TimeOfDay {
    return this.gameTime.timeOfDay
  }
  
  public setTimeScale(scale: number) {
    this.timeScale = scale
  }
  
  public setTime(hour: number, minute: number = 0, day: number = 1) {
    this.gameTime.hour = hour
    this.gameTime.minute = minute
    this.gameTime.day = day
    this.updateSeason()
    this.updateTimeOfDay()
    this.updateLighting()
    this.notifyTimeChange()
  }
  
  public onTimeChange(callback: (time: GameTime) => void) {
    this.onTimeChangeCallbacks.push(callback)
  }
  
  public onSeasonChange(callback: (season: Season) => void) {
    this.onSeasonChangeCallbacks.push(callback)
  }
  
  private notifyTimeChange() {
    this.onTimeChangeCallbacks.forEach(callback => {
      callback(this.getTime())
    })
  }
  
  private notifySeasonChange(season: Season) {
    this.onSeasonChangeCallbacks.forEach(callback => {
      callback(season)
    })
  }
  
  public dispose() {
    if (this.directionalLight) {
      this.directionalLight.dispose()
    }
    this.onTimeChangeCallbacks = []
    this.onSeasonChangeCallbacks = []
  }
}
