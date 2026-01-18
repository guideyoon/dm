import { Scene, Mesh, Vector3, MeshBuilder, StandardMaterial, Color3, PickingInfo } from '@babylonjs/core'
import { InventoryManager } from '../InventoryManager'
import { TimeSystem, Season } from './TimeSystem'

export interface Bug {
  id: string
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic'
  price: number
  spawnConditions: {
    season?: Season[]
    timeOfDay?: ('dawn' | 'day' | 'dusk' | 'night')[]
    weather?: string[]
    location: 'grass' | 'tree' | 'flower' | 'water' | 'ground'
  }
  catchDifficulty: number // 1-10 (높을수록 어려움)
  behavior: 'static' | 'flee' | 'jump' | 'fly'
}

export interface BugCatchingResult {
  success: boolean
  bug?: Bug
  message: string
}

export class BugCatchingSystem {
  private scene: Scene
  private inventoryManager: InventoryManager
  private timeSystem: TimeSystem | null = null
  private bugSpawns: Mesh[] = []
  
  private bugDatabase: Bug[] = [
    {
      id: 'bug_ant',
      name: '개미',
      rarity: 'common',
      price: 5,
      spawnConditions: {
        location: 'ground',
        season: ['spring', 'summer', 'autumn', 'winter'],
        timeOfDay: ['day']
      },
      catchDifficulty: 1,
      behavior: 'static'
    },
    {
      id: 'bug_butterfly',
      name: '나비',
      rarity: 'common',
      price: 15,
      spawnConditions: {
        location: 'flower',
        season: ['spring', 'summer'],
        timeOfDay: ['day']
      },
      catchDifficulty: 3,
      behavior: 'fly'
    },
    {
      id: 'bug_beetle',
      name: '딱정벌레',
      rarity: 'uncommon',
      price: 30,
      spawnConditions: {
        location: 'tree',
        season: ['summer'],
        timeOfDay: ['day', 'dusk']
      },
      catchDifficulty: 4,
      behavior: 'static'
    },
    {
      id: 'bug_cicada',
      name: '매미',
      rarity: 'uncommon',
      price: 40,
      spawnConditions: {
        location: 'tree',
        season: ['summer'],
        timeOfDay: ['day']
      },
      catchDifficulty: 5,
      behavior: 'static'
    },
    {
      id: 'bug_firefly',
      name: '반딧불이',
      rarity: 'rare',
      price: 100,
      spawnConditions: {
        location: 'grass',
        season: ['summer'],
        timeOfDay: ['night']
      },
      catchDifficulty: 6,
      behavior: 'fly'
    },
    {
      id: 'bug_mantis',
      name: '사마귀',
      rarity: 'rare',
      price: 150,
      spawnConditions: {
        location: 'grass',
        season: ['autumn'],
        timeOfDay: ['day', 'dusk']
      },
      catchDifficulty: 7,
      behavior: 'flee'
    },
    {
      id: 'bug_grasshopper',
      name: '메뚜기',
      rarity: 'common',
      price: 20,
      spawnConditions: {
        location: 'grass',
        season: ['summer', 'autumn'],
        timeOfDay: ['day']
      },
      catchDifficulty: 4,
      behavior: 'jump'
    },
    {
      id: 'bug_spider',
      name: '거미',
      rarity: 'uncommon',
      price: 50,
      spawnConditions: {
        location: 'tree',
        season: ['spring', 'summer', 'autumn'],
        timeOfDay: ['dusk', 'night']
      },
      catchDifficulty: 5,
      behavior: 'static'
    }
  ]
  
  constructor(scene: Scene, inventoryManager: InventoryManager) {
    this.scene = scene
    this.inventoryManager = inventoryManager
    this.createBugSpawns()
  }
  
  public setTimeSystem(timeSystem: TimeSystem) {
    this.timeSystem = timeSystem
  }
  
  private createBugSpawns() {
    // 나무에 벌레 스폰 포인트 (작은 원형 마커)
    const treePositions = [
      { x: 5, z: 5 },
      { x: -8, z: 12 },
      { x: 15, z: -10 },
      { x: -12, z: -5 }
    ]
    
    treePositions.forEach((pos, index) => {
      const marker = MeshBuilder.CreateSphere(`bugSpawn_tree_${index}`, { diameter: 0.3 }, this.scene)
      marker.position = new Vector3(pos.x, 2, pos.z)
      
      const markerMat = new StandardMaterial(`bugMarkerMat_${index}`, this.scene)
      markerMat.diffuseColor = new Color3(0.8, 0.2, 0.2)
      markerMat.emissiveColor = new Color3(0.4, 0.1, 0.1)
      markerMat.alpha = 0.5
      marker.material = markerMat
      
      marker.isPickable = true
      marker.metadata = { type: 'bugSpawn', location: 'tree' }
      marker.visibility = 0.3 // 반투명
      
      this.bugSpawns.push(marker)
    })
    
    // 꽃에 벌레 스폰 포인트
    const flowerPositions = [
      { x: 2, z: 8 },
      { x: -6, z: 4 },
      { x: 12, z: -3 }
    ]
    
    flowerPositions.forEach((pos, index) => {
      const marker = MeshBuilder.CreateSphere(`bugSpawn_flower_${index}`, { diameter: 0.2 }, this.scene)
      marker.position = new Vector3(pos.x, 0.2, pos.z)
      
      const markerMat = new StandardMaterial(`bugMarkerMat_flower_${index}`, this.scene)
      markerMat.diffuseColor = new Color3(0.8, 0.2, 0.2)
      markerMat.emissiveColor = new Color3(0.4, 0.1, 0.1)
      markerMat.alpha = 0.5
      marker.material = markerMat
      
      marker.isPickable = true
      marker.metadata = { type: 'bugSpawn', location: 'flower' }
      marker.visibility = 0.3
      
      this.bugSpawns.push(marker)
    })
    
    // 잔디에 벌레 스폰 포인트
    const grassPositions = [
      { x: 1, z: 2 },
      { x: -4, z: 6 },
      { x: 11, z: -1 }
    ]
    
    grassPositions.forEach((pos, index) => {
      const marker = MeshBuilder.CreateSphere(`bugSpawn_grass_${index}`, { diameter: 0.15 }, this.scene)
      marker.position = new Vector3(pos.x, 0.1, pos.z)
      
      const markerMat = new StandardMaterial(`bugMarkerMat_grass_${index}`, this.scene)
      markerMat.diffuseColor = new Color3(0.8, 0.2, 0.2)
      markerMat.emissiveColor = new Color3(0.4, 0.1, 0.1)
      markerMat.alpha = 0.5
      marker.material = markerMat
      
      marker.isPickable = true
      marker.metadata = { type: 'bugSpawn', location: 'grass' }
      marker.visibility = 0.3
      
      this.bugSpawns.push(marker)
    })
  }
  
  public isBugSpawn(mesh: Mesh | null): boolean {
    if (!mesh) return false
    return mesh.metadata?.type === 'bugSpawn'
  }
  
  public getBugSpawnLocation(mesh: Mesh): 'grass' | 'tree' | 'flower' | 'water' | 'ground' {
    return mesh.metadata?.location || 'grass'
  }
  
  public getAvailableBugs(location: 'grass' | 'tree' | 'flower' | 'water' | 'ground'): Bug[] {
    if (!this.timeSystem) {
      return this.bugDatabase.filter(bug => bug.spawnConditions.location === location)
    }
    
    const gameTime = this.timeSystem.getTime()
    
    return this.bugDatabase.filter(bug => {
      // 위치 체크
      if (bug.spawnConditions.location !== location) return false
      
      // 계절 체크
      if (bug.spawnConditions.season && !bug.spawnConditions.season.includes(gameTime.season)) {
        return false
      }
      
      // 시간대 체크
      if (bug.spawnConditions.timeOfDay && !bug.spawnConditions.timeOfDay.includes(gameTime.timeOfDay)) {
        return false
      }
      
      return true
    })
  }
  
  public startBugCatching(location: 'grass' | 'tree' | 'flower' | 'water' | 'ground'): Promise<BugCatchingResult> {
    return new Promise((resolve) => {
      const availableBugs = this.getAvailableBugs(location)
      
      if (availableBugs.length === 0) {
        resolve({
          success: false,
          message: '이 시간대에는 잡을 수 있는 벌레가 없습니다.'
        })
        return
      }
      
      // 벌레 선택 (희귀도에 따라 가중치 적용)
      const selectedBug = this.selectBug(availableBugs)
      
      // 벌레 채집 미니게임 시작
      this.showBugCatchingMiniGame(selectedBug, (success: boolean) => {
        if (success) {
          // 벌레 획득
          this.inventoryManager.add(selectedBug.id, 1)
          resolve({
            success: true,
            bug: selectedBug,
            message: `${selectedBug.name}을(를) 잡았습니다!`
          })
        } else {
          resolve({
            success: false,
            message: '벌레가 도망갔습니다.'
          })
        }
      })
    })
  }
  
  private selectBug(availableBugs: Bug[]): Bug {
    // 희귀도별 가중치
    const weights: { [key: string]: number } = {
      'common': 50,
      'uncommon': 30,
      'rare': 15,
      'epic': 5
    }
    
    // 가중치 기반 선택
    const totalWeight = availableBugs.reduce((sum, bug) => sum + weights[bug.rarity], 0)
    let random = Math.random() * totalWeight
    
    for (const bug of availableBugs) {
      random -= weights[bug.rarity]
      if (random <= 0) {
        return bug
      }
    }
    
    // 폴백: 첫 번째 벌레
    return availableBugs[0]
  }
  
  private showBugCatchingMiniGame(bug: Bug, callback: (success: boolean) => void) {
    // 벌레 채집 미니게임 UI 생성
    const gameContainer = document.createElement('div')
    gameContainer.id = 'bug-catching-minigame'
    gameContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      height: 250px;
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
    title.textContent = `${bug.name} 잡기!`
    title.style.cssText = 'font-size: 24px; font-weight: bold; color: #fff;'
    
    const instruction = document.createElement('div')
    instruction.textContent = bug.behavior === 'fly' ? '날아다니는 벌레입니다! 클릭으로 잡으세요!' : 
                             bug.behavior === 'flee' ? '도망가는 벌레입니다! 빠르게 클릭하세요!' :
                             bug.behavior === 'jump' ? '뛰어다니는 벌레입니다! 타이밍을 맞추세요!' :
                             '정지한 벌레입니다! 클릭하세요!'
    instruction.style.cssText = 'color: #fff; font-size: 14px; text-align: center;'
    
    const bugDisplay = document.createElement('div')
    bugDisplay.style.cssText = `
      width: 100px;
      height: 100px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      position: relative;
      cursor: pointer;
    `
    bugDisplay.textContent = '🐛'
    
    const timerBar = document.createElement('div')
    timerBar.style.cssText = `
      width: 100%;
      height: 10px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 5px;
      overflow: hidden;
    `
    
    const timerFill = document.createElement('div')
    timerFill.style.cssText = `
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      transition: width 0.1s linear;
    `
    timerBar.appendChild(timerFill)
    
    gameContainer.appendChild(title)
    gameContainer.appendChild(instruction)
    gameContainer.appendChild(bugDisplay)
    gameContainer.appendChild(timerBar)
    document.body.appendChild(gameContainer)
    
    // 벌레 채집 미니게임 로직
    let gameActive = true
    let bugCaught = false
    let timeLeft = 5.0 // 5초 제한
    const difficulty = bug.catchDifficulty
    const speed = 0.3 + (difficulty * 0.05) // 난이도에 따라 속도 증가
    
    // 벌레 움직임 (행동 패턴에 따라)
    let bugX = 0
    let bugY = 0
    let bugVX = 0
    let bugVY = 0
    
    if (bug.behavior === 'fly') {
      bugVX = (Math.random() - 0.5) * speed * 2
      bugVY = (Math.random() - 0.5) * speed * 2
    } else if (bug.behavior === 'flee') {
      bugVX = (Math.random() - 0.5) * speed * 3
      bugVY = (Math.random() - 0.5) * speed * 3
    } else if (bug.behavior === 'jump') {
      bugVX = (Math.random() - 0.5) * speed * 1.5
      bugVY = (Math.random() - 0.5) * speed * 1.5
    }
    
    const updateBugPosition = () => {
      if (!gameActive) return
      
      bugX += bugVX
      bugY += bugVY
      
      // 경계 체크
      if (Math.abs(bugX) > 40) bugVX *= -1
      if (Math.abs(bugY) > 40) bugVY *= -1
      
      // 행동 패턴에 따른 움직임 업데이트
      if (bug.behavior === 'fly' || bug.behavior === 'flee') {
        bugVX += (Math.random() - 0.5) * 0.1
        bugVY += (Math.random() - 0.5) * 0.1
      } else if (bug.behavior === 'jump' && Math.random() < 0.1) {
        bugVX = (Math.random() - 0.5) * speed * 2
        bugVY = (Math.random() - 0.5) * speed * 2
      }
      
      bugDisplay.style.transform = `translate(${bugX}px, ${bugY}px)`
      
      requestAnimationFrame(updateBugPosition)
    }
    
    const updateTimer = () => {
      if (!gameActive) return
      
      timeLeft -= 0.016 // 약 60fps 기준
      timerFill.style.width = `${(timeLeft / 5.0) * 100}%`
      
      if (timeLeft <= 0) {
        gameActive = false
        setTimeout(() => {
          document.body.removeChild(gameContainer)
          callback(false)
        }, 500)
        return
      }
      
      requestAnimationFrame(updateTimer)
    }
    
    bugDisplay.onclick = () => {
      if (!gameActive || bugCaught) return
      
      bugCaught = true
      gameActive = false
      
      // 성공 애니메이션
      bugDisplay.style.transform = 'scale(1.5)'
      bugDisplay.style.transition = 'transform 0.3s'
      
      setTimeout(() => {
        document.body.removeChild(gameContainer)
        callback(true)
      }, 500)
    }
    
    // 게임 시작
    updateBugPosition()
    updateTimer()
  }
  
  public getBugById(id: string): Bug | undefined {
    return this.bugDatabase.find(bug => bug.id === id)
  }
  
  public getAllBugs(): Bug[] {
    return [...this.bugDatabase]
  }
}
