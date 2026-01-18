import { Scene, Mesh, Vector3, MeshBuilder, StandardMaterial, Color3, PickingInfo } from '@babylonjs/core'
import { InventoryManager } from '../InventoryManager'
import { TimeSystem, Season } from './TimeSystem'

export interface Fish {
  id: string
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic'
  size: 'small' | 'medium' | 'large'
  price: number
  spawnConditions: {
    season?: Season[]
    timeOfDay?: ('dawn' | 'day' | 'dusk' | 'night')[]
    weather?: string[]
    location: 'river' | 'ocean' | 'pond'
  }
  catchDifficulty: number // 1-10 (높을수록 어려움)
}

export interface FishingResult {
  success: boolean
  fish?: Fish
  message: string
}

export class FishingSystem {
  private scene: Scene
  private inventoryManager: InventoryManager
  private timeSystem: TimeSystem | null = null
  private fishingSpots: Mesh[] = []
  
  private fishDatabase: Fish[] = [
    {
      id: 'fish_crucian',
      name: '붕어',
      rarity: 'common',
      size: 'small',
      price: 10,
      spawnConditions: {
        location: 'river',
        season: ['spring', 'summer', 'autumn', 'winter'],
        timeOfDay: ['day', 'dusk']
      },
      catchDifficulty: 2
    },
    {
      id: 'fish_carp',
      name: '잉어',
      rarity: 'common',
      size: 'medium',
      price: 30,
      spawnConditions: {
        location: 'river',
        season: ['spring', 'summer', 'autumn', 'winter'],
        timeOfDay: ['day', 'dawn', 'dusk']
      },
      catchDifficulty: 3
    },
    {
      id: 'fish_catfish',
      name: '메기',
      rarity: 'uncommon',
      size: 'large',
      price: 80,
      spawnConditions: {
        location: 'river',
        season: ['spring', 'summer'],
        timeOfDay: ['dusk', 'night']
      },
      catchDifficulty: 5
    },
    {
      id: 'fish_salmon',
      name: '연어',
      rarity: 'rare',
      size: 'large',
      price: 150,
      spawnConditions: {
        location: 'river',
        season: ['autumn'],
        timeOfDay: ['day', 'dusk']
      },
      catchDifficulty: 7
    },
    {
      id: 'fish_tuna',
      name: '참치',
      rarity: 'epic',
      size: 'large',
      price: 500,
      spawnConditions: {
        location: 'ocean',
        season: ['summer'],
        timeOfDay: ['day']
      },
      catchDifficulty: 9
    },
    {
      id: 'fish_sardine',
      name: '정어리',
      rarity: 'common',
      size: 'small',
      price: 15,
      spawnConditions: {
        location: 'ocean',
        season: ['spring', 'summer', 'autumn', 'winter'],
        timeOfDay: ['day', 'dusk']
      },
      catchDifficulty: 1
    },
    {
      id: 'fish_goldfish',
      name: '금붕어',
      rarity: 'rare',
      size: 'small',
      price: 200,
      spawnConditions: {
        location: 'pond',
        season: ['spring', 'summer', 'autumn', 'winter'],
        timeOfDay: ['day']
      },
      catchDifficulty: 6
    }
  ]
  
  constructor(scene: Scene, inventoryManager: InventoryManager) {
    this.scene = scene
    this.inventoryManager = inventoryManager
    this.createFishingSpots()
  }
  
  public setTimeSystem(timeSystem: TimeSystem) {
    this.timeSystem = timeSystem
  }
  
  private createFishingSpots() {
    // 강 낚시 포인트
    this.createFishingSpot(-10, 0, 0, 'river')
    this.createFishingSpot(10, 0, 0, 'river')
    this.createFishingSpot(0, 0, -10, 'river')
    
    // 바다 낚시 포인트
    this.createFishingSpot(-20, 0, -20, 'ocean')
    this.createFishingSpot(20, 0, -20, 'ocean')
    
    // 연못 낚시 포인트
    this.createFishingSpot(0, 0, 10, 'pond')
  }
  
  private createFishingSpot(x: number, z: number, location: 'river' | 'ocean' | 'pond') {
    // 물 표시 (반투명 파란색 평면)
    const water = MeshBuilder.CreateGround(`fishingSpot_${x}_${z}`, { width: 3, height: 3 }, this.scene)
    water.position = new Vector3(x, 0.01, z)
    
    const waterMat = new StandardMaterial(`waterMat_${x}_${z}`, this.scene)
    waterMat.diffuseColor = new Color3(0.2, 0.4, 0.8)
    waterMat.alpha = 0.6
    waterMat.emissiveColor = new Color3(0.1, 0.2, 0.4)
    water.material = waterMat
    
    // 낚시 포인트 마커 (작은 원)
    const marker = MeshBuilder.CreateCylinder(`fishingMarker_${x}_${z}`, { height: 0.1, diameter: 0.5 }, this.scene)
    marker.position = new Vector3(x, 0.05, z)
    marker.rotation.x = Math.PI / 2
    
    const markerMat = new StandardMaterial(`markerMat_${x}_${z}`, this.scene)
    markerMat.diffuseColor = new Color3(0.3, 0.6, 1)
    markerMat.emissiveColor = new Color3(0.1, 0.2, 0.4)
    marker.material = markerMat
    
    marker.isPickable = true
    marker.metadata = { type: 'fishingSpot', location: location }
    
    this.fishingSpots.push(marker)
  }
  
  public isFishingSpot(mesh: Mesh | null): boolean {
    if (!mesh) return false
    return mesh.metadata?.type === 'fishingSpot'
  }
  
  public getFishingSpotLocation(mesh: Mesh): 'river' | 'ocean' | 'pond' {
    return mesh.metadata?.location || 'river'
  }
  
  public getAvailableFish(location: 'river' | 'ocean' | 'pond'): Fish[] {
    if (!this.timeSystem) {
      return this.fishDatabase.filter(fish => fish.spawnConditions.location === location)
    }
    
    const gameTime = this.timeSystem.getTime()
    
    return this.fishDatabase.filter(fish => {
      // 위치 체크
      if (fish.spawnConditions.location !== location) return false
      
      // 계절 체크
      if (fish.spawnConditions.season && !fish.spawnConditions.season.includes(gameTime.season)) {
        return false
      }
      
      // 시간대 체크
      if (fish.spawnConditions.timeOfDay && !fish.spawnConditions.timeOfDay.includes(gameTime.timeOfDay)) {
        return false
      }
      
      return true
    })
  }
  
  public startFishing(location: 'river' | 'ocean' | 'pond'): Promise<FishingResult> {
    return new Promise((resolve) => {
      const availableFish = this.getAvailableFish(location)
      
      if (availableFish.length === 0) {
        resolve({
          success: false,
          message: '이 시간대에는 낚을 수 있는 물고기가 없습니다.'
        })
        return
      }
      
      // 물고기 선택 (희귀도에 따라 가중치 적용)
      const selectedFish = this.selectFish(availableFish)
      
      // 낚시 미니게임 시작
      this.showFishingMiniGame(selectedFish, (success: boolean) => {
        if (success) {
          // 물고기 획득
          this.inventoryManager.add(selectedFish.id, 1)
          resolve({
            success: true,
            fish: selectedFish,
            message: `${selectedFish.name}을(를) 낚았습니다!`
          })
        } else {
          resolve({
            success: false,
            message: '물고기가 도망갔습니다.'
          })
        }
      })
    })
  }
  
  private selectFish(availableFish: Fish[]): Fish {
    // 희귀도별 가중치
    const weights: { [key: string]: number } = {
      'common': 50,
      'uncommon': 30,
      'rare': 15,
      'epic': 5
    }
    
    // 가중치 기반 선택
    const totalWeight = availableFish.reduce((sum, fish) => sum + weights[fish.rarity], 0)
    let random = Math.random() * totalWeight
    
    for (const fish of availableFish) {
      random -= weights[fish.rarity]
      if (random <= 0) {
        return fish
      }
    }
    
    // 폴백: 첫 번째 물고기
    return availableFish[0]
  }
  
  private showFishingMiniGame(fish: Fish, callback: (success: boolean) => void) {
    // 낚시 미니게임 UI 생성
    const gameContainer = document.createElement('div')
    gameContainer.id = 'fishing-minigame'
    gameContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      height: 200px;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #4CAF50;
      border-radius: 10px;
      padding: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    `
    
    const title = document.createElement('div')
    title.textContent = `${fish.name} 낚기!`
    title.style.cssText = 'font-size: 24px; font-weight: bold; color: #fff;'
    
    const progressBar = document.createElement('div')
    progressBar.style.cssText = `
      width: 100%;
      height: 30px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 15px;
      overflow: hidden;
      position: relative;
    `
    
    const progressFill = document.createElement('div')
    progressFill.style.cssText = `
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      transition: width 0.1s linear;
    `
    progressBar.appendChild(progressFill)
    
    const instruction = document.createElement('div')
    instruction.textContent = '스페이스바를 눌러 잡으세요!'
    instruction.style.cssText = 'color: #fff; font-size: 14px;'
    
    const targetZone = document.createElement('div')
    targetZone.style.cssText = `
      width: 60px;
      height: 30px;
      background: rgba(255, 255, 0, 0.5);
      border: 2px solid #FFD700;
      position: absolute;
      left: 50%;
      top: 0;
      transform: translateX(-50%);
      transition: left 0.05s linear;
    `
    progressBar.appendChild(targetZone)
    
    gameContainer.appendChild(title)
    gameContainer.appendChild(progressBar)
    gameContainer.appendChild(instruction)
    document.body.appendChild(gameContainer)
    
    // 낚시 미니게임 로직
    let progress = 0
    let targetPosition = 50 // 0-100
    let isHolding = false
    let gameActive = true
    
    const difficulty = fish.catchDifficulty
    const speed = 0.5 + (difficulty * 0.1) // 난이도에 따라 속도 증가
    const targetSize = Math.max(10, 20 - difficulty) // 난이도에 따라 타겟 영역 크기 감소
    
    const updateTarget = () => {
      if (!gameActive) return
      
      // 타겟 이동 (좌우로 움직임)
      targetPosition += (Math.random() - 0.5) * speed * 2
      targetPosition = Math.max(targetSize / 2, Math.min(100 - targetSize / 2, targetPosition))
      
      targetZone.style.left = `${targetPosition}%`
      targetZone.style.width = `${targetSize}%`
      targetZone.style.transform = `translateX(-50%)`
      
      requestAnimationFrame(updateTarget)
    }
    
    const updateProgress = () => {
      if (!gameActive) return
      
      if (isHolding) {
        // 타겟 영역 안에 있으면 진행
        const progressCenter = progress
        const targetLeft = targetPosition - targetSize / 2
        const targetRight = targetPosition + targetSize / 2
        
        if (progressCenter >= targetLeft && progressCenter <= targetRight) {
          progress += 2
        } else {
          progress = Math.max(0, progress - 1) // 실패 시 감소
        }
      } else {
        progress = Math.max(0, progress - 0.5) // 자동 감소
      }
      
      progressFill.style.width = `${Math.min(100, progress)}%`
      
      if (progress >= 100) {
        // 성공
        gameActive = false
        setTimeout(() => {
          document.body.removeChild(gameContainer)
          callback(true)
        }, 500)
        return
      }
      
      if (progress <= 0 && isHolding) {
        // 실패
        gameActive = false
        setTimeout(() => {
          document.body.removeChild(gameContainer)
          callback(false)
        }, 500)
        return
      }
      
      requestAnimationFrame(updateProgress)
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameActive) {
        e.preventDefault()
        isHolding = true
        instruction.textContent = '계속 누르고 있으세요!'
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isHolding = false
        instruction.textContent = '스페이스바를 눌러 잡으세요!'
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    // 게임 시작
    updateTarget()
    updateProgress()
    
    // 10초 제한 시간
    setTimeout(() => {
      if (gameActive) {
        gameActive = false
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
        document.body.removeChild(gameContainer)
        callback(false)
      }
    }, 10000)
  }
  
  public getFishById(id: string): Fish | undefined {
    return this.fishDatabase.find(fish => fish.id === id)
  }
  
  public getAllFish(): Fish[] {
    return [...this.fishDatabase]
  }
}
