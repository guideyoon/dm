import { Scene, Mesh, Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core'
import { InventoryManager } from '../InventoryManager'
import { TimeSystem } from './TimeSystem'
import { CurrencySystem } from './CurrencySystem'
import { WeatherSystem, WeatherType } from './WeatherSystem'

export interface NPC {
  id: string
  name: string
  personality: 'friendly' | 'grumpy' | 'lazy' | 'energetic' | 'shy'
  friendshipLevel: number // 0-100
  favoriteItems: string[]
  dislikedItems: string[]
  dailyQuests: string[]
  mesh?: Mesh
  position: { x: number; y: number; z: number }
}

export interface Dialogue {
  id: string
  npcId: string
  text: string
  options?: Array<{ text: string; action: string }>
  condition?: () => boolean
}

export interface Quest {
  id: string
  npcId: string
  title: string
  description: string
  objective: string
  reward: {
    coins?: number
    tokens?: number
    items?: Array<{ id: string; count: number }>
    friendship?: number
  }
  progress: number
  target: number
  completed: boolean
}

export class NPCSystem {
  private scene: Scene
  private inventoryManager: InventoryManager
  private timeSystem: TimeSystem | null = null
  private weatherSystem: WeatherSystem | null = null
  private currencySystem: CurrencySystem | null = null
  private npcs: Map<string, NPC> = new Map()
  private dialogues: Map<string, Dialogue[]> = new Map()
  private quests: Map<string, Quest> = new Map()
  private dailyDialogueSeeds: Map<string, number> = new Map() // 일일 대화 시드 (날짜 기반)
  
  constructor(scene: Scene, inventoryManager: InventoryManager) {
    this.scene = scene
    this.inventoryManager = inventoryManager
    this.initializeNPCs()
    this.initializeDialogues()
    this.initializeQuests()
  }
  
  public setTimeSystem(timeSystem: TimeSystem) {
    this.timeSystem = timeSystem
  }
  
  public setWeatherSystem(weatherSystem: WeatherSystem) {
    this.weatherSystem = weatherSystem
  }
  
  public setCurrencySystem(currencySystem: CurrencySystem) {
    this.currencySystem = currencySystem
  }
  
  private initializeNPCs() {
    // NPC 생성
    const npcData = [
      {
        id: 'npc_tom',
        name: '톰',
        personality: 'friendly',
        position: { x: 8, y: 0, z: 8 },
        favoriteItems: ['Wood', 'Flower'],
        dislikedItems: ['Stone']
      },
      {
        id: 'npc_emily',
        name: '에밀리',
        personality: 'energetic',
        position: { x: -8, y: 0, z: 8 },
        favoriteItems: ['Berry', 'Flower'],
        dislikedItems: []
      },
      {
        id: 'npc_bob',
        name: '밥',
        personality: 'lazy',
        position: { x: 0, y: 0, z: -8 },
        favoriteItems: ['Mushroom'],
        dislikedItems: []
      }
    ]
    
    npcData.forEach(data => {
      const npc: NPC = {
        id: data.id,
        name: data.name,
        personality: data.personality,
        friendshipLevel: 0,
        favoriteItems: data.favoriteItems,
        dislikedItems: data.dislikedItems,
        dailyQuests: [],
        position: data.position
      }
      
      // NPC 메시 생성
      this.createNPCMesh(npc)
      
      this.npcs.set(npc.id, npc)
    })
  }
  
  private createNPCMesh(npc: NPC) {
    // 간단한 NPC 메시 (원통 몸통 + 구체 머리)
    const body = MeshBuilder.CreateCylinder(`npc_body_${npc.id}`, { height: 1, diameter: 0.6 }, this.scene)
    body.position = new Vector3(npc.position.x, 0.5, npc.position.z)
    
    const bodyMat = new StandardMaterial(`npcBodyMat_${npc.id}`, this.scene)
    bodyMat.diffuseColor = new Color3(0.2, 0.5, 0.9) // 파란색 옷
    body.material = bodyMat
    
    const head = MeshBuilder.CreateSphere(`npc_head_${npc.id}`, { diameter: 0.4 }, this.scene)
    head.position = new Vector3(npc.position.x, 1.2, npc.position.z)
    
    const headMat = new StandardMaterial(`npcHeadMat_${npc.id}`, this.scene)
    headMat.diffuseColor = new Color3(1, 0.8, 0.6) // 피부색
    head.material = headMat
    
    // NPC 마커 (상호작용 가능)
    const marker = MeshBuilder.CreateSphere(`npc_marker_${npc.id}`, { diameter: 0.3 }, this.scene)
    marker.position = new Vector3(npc.position.x, 1.5, npc.position.z)
    
    const markerMat = new StandardMaterial(`npcMarkerMat_${npc.id}`, this.scene)
    markerMat.diffuseColor = new Color3(1, 1, 0) // 노란색
    markerMat.emissiveColor = new Color3(0.5, 0.5, 0)
    markerMat.alpha = 0.7
    marker.material = markerMat
    
    marker.isPickable = true
    marker.metadata = { type: 'npc', npcId: npc.id }
    
    npc.mesh = marker
  }
  
  private initializeDialogues() {
    // 기본 대화 초기화
    this.npcs.forEach(npc => {
      const dialogues: Dialogue[] = [
        {
          id: `dialogue_${npc.id}_greeting`,
          npcId: npc.id,
          text: `안녕하세요! 저는 ${npc.name}입니다.`
        },
        {
          id: `dialogue_${npc.id}_weather`,
          npcId: npc.id,
          text: '오늘 날씨가 좋네요!'
        },
        {
          id: `dialogue_${npc.id}_quest`,
          npcId: npc.id,
          text: '도와주실 수 있나요?',
          options: [
            { text: '네, 도와드리겠습니다!', action: 'accept_quest' },
            { text: '나중에요', action: 'decline' }
          ]
        }
      ]
      
      this.dialogues.set(npc.id, dialogues)
    })
  }
  
  private initializeQuests() {
    // 기본 퀘스트 초기화
    const questData = [
      {
        id: 'quest_tom_wood',
        npcId: 'npc_tom',
        title: '나무 가져오기',
        description: '톰에게 나무 5개를 가져다주세요.',
        objective: '나무 5개 수집',
        reward: { coins: 100, friendship: 10 },
        target: 5
      },
      {
        id: 'quest_emily_flower',
        npcId: 'npc_emily',
        title: '꽃 수집',
        description: '에밀리에게 꽃 3개를 가져다주세요.',
        objective: '꽃 3개 수집',
        reward: { coins: 80, friendship: 8 },
        target: 3
      }
    ]
    
    questData.forEach(data => {
      const quest: Quest = {
        id: data.id,
        npcId: data.npcId,
        title: data.title,
        description: data.description,
        objective: data.objective,
        reward: data.reward,
        progress: 0,
        target: data.target,
        completed: false
      }
      
      this.quests.set(quest.id, quest)
    })
  }
  
  public isNPC(mesh: Mesh | null): boolean {
    if (!mesh) return false
    return mesh.metadata?.type === 'npc'
  }
  
  public getNPC(mesh: Mesh): NPC | undefined {
    const npcId = mesh.metadata?.npcId
    if (!npcId) return undefined
    return this.npcs.get(npcId)
  }
  
  public getNPCById(id: string): NPC | undefined {
    return this.npcs.get(id)
  }
  
  public getAllNPCs(): NPC[] {
    return Array.from(this.npcs.values())
  }
  
  public getDialogues(npcId: string): Dialogue[] {
    return this.dialogues.get(npcId) || []
  }
  
  public getQuests(npcId?: string): Quest[] {
    const quests = Array.from(this.quests.values())
    if (npcId) {
      return quests.filter(quest => quest.npcId === npcId)
    }
    return quests
  }
  
  public getActiveQuests(npcId?: string): Quest[] {
    return this.getQuests(npcId).filter(quest => !quest.completed)
  }
  
  public giveItemToNPC(npcId: string, itemId: string, count: number = 1): { success: boolean; message: string; friendshipGain: number } {
    const npc = this.npcs.get(npcId)
    if (!npc) {
      return { success: false, message: 'NPC를 찾을 수 없습니다.', friendshipGain: 0 }
    }
    
    // 인벤토리에 아이템이 있는지 확인
    const inventoryItem = this.inventoryManager.list().find(item => item.name === itemId)
    if (!inventoryItem || inventoryItem.count < count) {
      return { success: false, message: '아이템이 부족합니다.', friendshipGain: 0 }
    }
    
    // 아이템 제거
    this.inventoryManager.remove(itemId, count)
    
    // 호감도 계산
    let friendshipGain = 0
    if (npc.favoriteItems.includes(itemId)) {
      friendshipGain = 5 * count
    } else if (npc.dislikedItems.includes(itemId)) {
      friendshipGain = -2 * count
    } else {
      friendshipGain = 1 * count
    }
    
    npc.friendshipLevel = Math.max(0, Math.min(100, npc.friendshipLevel + friendshipGain))
    
    let message = ''
    if (friendshipGain > 0) {
      message = `${npc.name}이(가) 좋아합니다! (+${friendshipGain} 호감도)`
    } else if (friendshipGain < 0) {
      message = `${npc.name}이(가) 싫어합니다... (${friendshipGain} 호감도)`
    } else {
      message = `${npc.name}에게 아이템을 주었습니다.`
    }
    
    return { success: true, message, friendshipGain }
  }
  
  public updateQuestProgress(questId: string, progress: number) {
    const quest = this.quests.get(questId)
    if (!quest || quest.completed) return false
    
    quest.progress = Math.min(progress, quest.target)
    
    if (quest.progress >= quest.target && !quest.completed) {
      quest.completed = true
      return true
    }
    
    return false
  }
  
  public completeQuest(questId: string): { success: boolean; message: string; reward?: Quest['reward'] } {
    const quest = this.quests.get(questId)
    if (!quest) {
      return { success: false, message: '퀘스트를 찾을 수 없습니다.' }
    }
    
    if (!quest.completed) {
      return { success: false, message: '퀘스트가 아직 완료되지 않았습니다.' }
    }
    
    // 보상 지급
    if (quest.reward.coins && this.currencySystem) {
      this.currencySystem.addCoins(quest.reward.coins)
    }
    
    if (quest.reward.tokens && this.currencySystem) {
      this.currencySystem.addTokens(quest.reward.tokens)
    }
    
    if (quest.reward.items) {
      quest.reward.items.forEach(item => {
        this.inventoryManager.add(item.id, item.count)
      })
    }
    
    // 호감도 증가
    if (quest.reward.friendship) {
      const npc = this.npcs.get(quest.npcId)
      if (npc) {
        npc.friendshipLevel = Math.min(100, npc.friendshipLevel + quest.reward.friendship)
      }
    }
    
    // 퀘스트 제거 (완료된 퀘스트는 제거)
    this.quests.delete(questId)
    
    return {
      success: true,
      message: `퀘스트 완료! 보상을 받았습니다.`,
      reward: quest.reward
    }
  }
  
  public getFriendshipLevel(npcId: string): number {
    const npc = this.npcs.get(npcId)
    return npc?.friendshipLevel || 0
  }
  
  // 친밀도 구간 반환 (0: 초면, 1: 알음, 2: 친구, 3: 절친)
  private getFriendshipTier(friendshipLevel: number): 0 | 1 | 2 | 3 {
    if (friendshipLevel <= 20) return 0
    if (friendshipLevel <= 50) return 1
    if (friendshipLevel <= 80) return 2
    return 3
  }
  
  // 일일 대화 시드 업데이트 (날짜 변경 시)
  private updateDailyDialogueSeed(npcId: string, day: number) {
    const seed = day * 1000 + npcId.charCodeAt(0) // 날짜 + NPC ID로 고유 시드 생성
    this.dailyDialogueSeeds.set(npcId, seed)
    return seed
  }
  
  // 친밀도별 대화 풀 생성
  private getIntimacyDialogues(npc: NPC, tier: 0 | 1 | 2 | 3): string[] {
    const personality = npc.personality
    const name = npc.name
    
    const dialogues: { [key: string]: { [tier: number]: string[] } } = {
      friendly: {
        0: [
          `안녕하세요! ${name}입니다. 처음 뵙는군요!`,
          `반갑습니다! 오늘 처음 보는데요?`,
          `안녕하세요. 저는 ${name}입니다. 잘 부탁드려요!`
        ],
        1: [
          `안녕하세요! 다시 만나서 반가워요.`,
          `오, 또 오셨네요! 뭔가 도와드릴 일이 있나요?`,
          `좋은 하루네요! 무슨 일로 오셨나요?`
        ],
        2: [
          `친구야! 오늘도 만나니 기분이 좋네!`,
          `반가워! 요즘 어떻게 지내?`,
          `어서와! 나랑 이야기 할 시간 있어?`
        ],
        3: [
          `최고의 친구! 정말 보고 싶었어!`,
          `우리 절친이 왔네! 무엇이든 도와줄게!`,
          `너를 보니 하루가 다 밝아지는 기분이야!`
        ]
      },
      energetic: {
        0: [
          `안녕! ${name}야! 오늘도 에너지 넘쳐!`,
          `헤이! 새로운 사람이네! 반가워!`,
          `어서와! 나는 ${name}! 활기찬 하루 되자고!`
        ],
        1: [
          `어이! 또 왔네! 오늘 뭐 할 거야?`,
          `반가워! 같이 뭔가 재미있는 일 하자!`,
          `왔구나! 오늘도 활동적인 하루가 될 거야!`
        ],
        2: [
          `친구! 같이 뛰어다닐 시간이야!`,
          `반가워! 오늘 뭔가 모험할까?`,
          `와! 오늘도 우리 함께 신나게 놀자!`
        ],
        3: [
          `절친! 너 없인 내 하루가 무의미해!`,
          `최고의 파트너야! 뭐든 같이 하자!`,
          `너와 함께하면 모든 게 재미있어!`
        ]
      },
      lazy: {
        0: [
          `어... 안녕... 나는 ${name}...`,
          `음... 새로 온 사람이네... 힘들어...`,
          `안녕... 나는 ${name}인데... 오늘도 졸려...`
        ],
        1: [
          `오... 또 왔구나... 기운 좀 있어?`,
          `안녕... 너도 오늘 힘들지?`,
          `어... 또 왔네... 뭔가 할 일 있어?`
        ],
        2: [
          `친구... 오늘도 편하게 쉬자...`,
          `안녕... 같이 편하게 앉아있자...`,
          `와... 너도 편하게 있는 거 좋아하구나...`
        ],
        3: [
          `절친... 너는 나를 너무 잘 알아...`,
          `최고의 친구야... 같이 아무것도 안 하자...`,
          `너와 있으면 정말 편해...`
        ]
      },
      grumpy: {
        0: [
          `흠... ${name}이다.`,
          `새로운 사람이네... 뭐 원하는 게 있나?`,
          `안녕. 나는 ${name}.`
        ],
        1: [
          `또 왔구나... 뭔가 필요하면 말해.`,
          `음... 또 오네.`,
          `안녕... 도와줄 건 없어?`
        ],
        2: [
          `친구... 그래, 넌 괜찮아.`,
          `오늘도 왔구나. 잘 지냈어?`,
          `너는 내가 신뢰하는 사람이야.`
        ],
        3: [
          `절친... 너를 만나면 기분이 좋아져.`,
          `최고의 친구... 고마워.`,
          `너는 정말 특별한 사람이야.`
        ]
      },
      shy: {
        0: [
          `어... 안녕하세요... 저는 ${name}입니다...`,
          `음... 새로 오신 분이시군요...`,
          `안녕... ${name}이라고 해요...`
        ],
        1: [
          `어... 또 오셨네요... 반가워요...`,
          `안녕하세요... 오늘도 만나서 기뻐요...`,
          `어... 오셨네요...`
        ],
        2: [
          `친구... 당신과 있으면 편해요...`,
          `안녕... 오늘도 기다렸어요...`,
          `너와 있으면 용기가 생겨요...`
        ],
        3: [
          `절친... 당신은 나의 소중한 친구예요...`,
          `최고의 친구... 고마워요...`,
          `당신과 함께하면 행복해요...`
        ]
      }
    }
    
    return dialogues[personality]?.[tier] || [`안녕하세요!`]
  }
  
  // 시간대별 대화 생성
  private getTimeBasedDialogue(npc: NPC, hour: number): string[] {
    const name = npc.name
    
    if (hour >= 5 && hour < 12) {
      // 아침 (5-11시)
      return [
        `좋은 아침이에요! 오늘도 힘내요!`,
        `상쾌한 아침이네요!`,
        `아침 햇살이 참 좋아요!`
      ]
    } else if (hour >= 12 && hour < 18) {
      // 오후 (12-17시)
      return [
        `점심은 드셨나요?`,
        `오후 날씨가 좋네요!`,
        `오늘 하루 어떻게 보내세요?`
      ]
    } else if (hour >= 18 && hour < 22) {
      // 저녁 (18-21시)
      return [
        `저녁 시간이에요!`,
        `오늘 하루 수고하셨어요!`,
        `저녁에 뭘 하실 건가요?`
      ]
    } else {
      // 밤 (22-4시)
      return [
        `늦은 시간인데 아직 안 주무세요?`,
        `밤이 깊었네요...`,
        `피곤하지 않으세요?`
      ]
    }
  }
  
  // 날씨별 대화 생성
  private getWeatherBasedDialogue(npc: NPC, weather: WeatherType): string[] {
    const name = npc.name
    const personality = npc.personality
    
    const weatherDialogues: { [weather in WeatherType]: { [personality: string]: string[] } } = {
      sunny: {
        friendly: [`오늘 날씨가 정말 좋아요!`],
        energetic: [`햇살이 좋아서 기분이 최고야!`],
        lazy: [`날씨 좋은데 밖에 나가기 싫어...`],
        grumpy: [`햇빛이 너무 밝아.`],
        shy: [`맑은 날씨네요...`]
      },
      rainy: {
        friendly: [`비 오는 날이네요. 우산 챙기셨어요?`],
        energetic: [`비 오는 날에도 활동적인 게 좋아!`],
        lazy: [`비 오는 날엔 집에 있는 게 최고야...`],
        grumpy: [`비가 오면 기분이 안 좋아.`],
        shy: [`비 소리가 듣기 좋아요...`]
      },
      snowy: {
        friendly: [`눈이 오네요! 눈사람 만들까요?`],
        energetic: [`눈밭에서 놀고 싶어!`],
        lazy: [`눈 오는 날엔 따뜻한 곳에 있어야 해...`],
        grumpy: [`눈 오면 길이 미끄러워서 싫어.`],
        shy: [`눈이 하얗게 내려요...`]
      },
      cloudy: {
        friendly: [`흐린 날이네요.`],
        energetic: [`구름이 있어도 기운 넘쳐!`],
        lazy: [`흐린 날엔 더 졸려...`],
        grumpy: [`날씨가 썩 좋지 않네.`],
        shy: [`구름이 많네요...`]
      },
      windy: {
        friendly: [`바람이 많이 부네요!`],
        energetic: [`바람이 상쾌해!`],
        lazy: [`바람이 불어서 나가기 싫어...`],
        grumpy: [`바람이 너무 세다.`],
        shy: [`바람 소리가 들려요...`]
      }
    }
    
    return weatherDialogues[weather]?.[personality] || [`날씨가...`]
  }
  
  // 상황별 대화 반환 (친밀도, 시간대, 날씨 고려)
  public getDialogue(npcId: string): string {
    const npc = this.npcs.get(npcId)
    if (!npc) return '안녕하세요!'
    
    const friendshipLevel = npc.friendshipLevel
    const tier = this.getFriendshipTier(friendshipLevel)
    
    // 일일 대화 시드 업데이트
    const currentDay = this.timeSystem ? this.timeSystem.getTime().day : 1
    const seed = this.updateDailyDialogueSeed(npcId, currentDay)
    
    // 랜덤 시드 생성기 (일일 시드 기반)
    const random = (min: number, max: number) => {
      const x = Math.sin(seed * 10000) * 10000
      return Math.floor((x - Math.floor(x)) * (max - min + 1) + min)
    }
    
    // 대화 풀 선택 우선순위: 친밀도별 > 시간대별 > 날씨별 > 기본
    let dialoguePool: string[] = []
    
    // 친밀도별 대화 (50% 확률)
    if (random(0, 100) < 50) {
      const intimacyDialogues = this.getIntimacyDialogues(npc, tier)
      dialoguePool = intimacyDialogues
    } else {
      // 시간대별 대화 (30% 확률)
      const hour = this.timeSystem ? Math.floor(this.timeSystem.getTime().hour) : 12
      if (random(0, 100) < 30 && hour >= 0) {
        dialoguePool = this.getTimeBasedDialogue(npc, hour)
      } else {
        // 날씨별 대화 (20% 확률)
        if (this.weatherSystem) {
          const weather = this.weatherSystem.getWeatherType()
          dialoguePool = this.getWeatherBasedDialogue(npc, weather)
        }
      }
    }
    
    // 풀이 비어있으면 친밀도별 대화 사용
    if (dialoguePool.length === 0) {
      dialoguePool = this.getIntimacyDialogues(npc, tier)
    }
    
    // 랜덤하게 하나 선택
    const index = random(0, dialoguePool.length - 1)
    return dialoguePool[index] || '안녕하세요!'
  }
  
  // NPC 간 대화
  public getNPCToNPCDialogue(npc1Id: string, npc2Id: string): string {
    const npc1 = this.npcs.get(npc1Id)
    const npc2 = this.npcs.get(npc2Id)
    if (!npc1 || !npc2) return ''
    
    // NPC 간 대화 시나리오
    const dialogues: string[] = [
      `${npc1.name}: ${npc2.name}야! 오늘 기분이 어때?`,
      `${npc2.name}: 괜찮아! ${npc1.name}는?`,
      `${npc1.name}: 오늘 날씨가 좋네!`,
      `${npc2.name}: 맞아, 정말 좋은 하루야!`,
      `${npc1.name}: 뭔가 재미있는 일 없을까?`,
      `${npc2.name}: 나랑 같이 놀러 가자!`,
      `${npc1.name}: 좋아! 어디로 갈까?`,
      `${npc2.name}: 마을 한 바퀴 돌아보자!`
    ]
    
    // NPC 성격에 따라 대화 변경
    if (npc1.personality === 'friendly' && npc2.personality === 'energetic') {
      dialogues.push(`${npc1.name}: 오늘 뭔가 할 일 있어?`, `${npc2.name}: 같이 모험을 떠나자!`)
    }
    
    const index = Math.floor(Math.random() * dialogues.length)
    return dialogues[index] || `${npc1.name}: 안녕, ${npc2.name}!`
  }
  
  // NPC 업데이트 (이동, 취미 활동, 대화)
  public update(deltaTime: number) {
    this.npcs.forEach(npc => {
      // NPC 자유 이동 (30초마다 목적지 변경)
      if (!npc.mesh) return
      
      const currentTime = Date.now()
      const lastUpdateTime = (npc as any).lastMovementUpdate || 0
      
      if (currentTime - lastUpdateTime > 30000) { // 30초마다
        this.updateNPCMovement(npc)
        ;(npc as any).lastMovementUpdate = currentTime
      }
      
      // NPC 간 거리 체크 (만나면 대화)
      this.checkNPCEncounters(npc)
    })
  }
  
  // NPC 이동 업데이트
  private updateNPCMovement(npc: NPC) {
    if (!npc.mesh) return
    
    // 랜덤 목적지 생성 (맵 크기 100x100 기준, -50 ~ 50)
    const targetX = (Math.random() - 0.5) * 80 // -40 ~ 40
    const targetZ = (Math.random() - 0.5) * 80 // -40 ~ 40
    
    // NPC 성격에 따라 이동 패턴 변경
    if (npc.personality === 'lazy') {
      // 게으른 NPC는 거의 안 움직임
      if (Math.random() < 0.3) return // 70% 확률로 이동 안 함
    } else if (npc.personality === 'energetic') {
      // 활동적인 NPC는 자주 움직임
      // 이미 자주 움직임 (30초마다)
    }
    
    ;(npc as any).targetPosition = { x: targetX, y: 0, z: targetZ }
    ;(npc as any).isMoving = true
    ;(npc as any).moveSpeed = 0.02 // 이동 속도
  }
  
  // NPC 이동 애니메이션 (렌더 루프에서 호출)
  public updateNPCMovements(deltaTime: number) {
    this.npcs.forEach(npc => {
      if (!npc.mesh || !(npc as any).isMoving) return
      
      const targetPos = (npc as any).targetPosition
      if (!targetPos) return
      
      const currentPos = npc.position
      const dx = targetPos.x - currentPos.x
      const dz = targetPos.z - currentPos.z
      const distance = Math.sqrt(dx * dx + dz * dz)
      
      if (distance < 0.1) {
        // 목적지 도착
        ;(npc as any).isMoving = false
        ;(npc as any).targetPosition = null
      } else {
        // 목적지로 이동
        const moveSpeed = (npc as any).moveSpeed || 0.02
        const moveDistance = moveSpeed * deltaTime * 60 // 프레임 비율 조정
        
        const moveX = (dx / distance) * moveDistance
        const moveZ = (dz / distance) * moveDistance
        
        npc.position.x += moveX
        npc.position.z += moveZ
        
        // 메시 위치 업데이트
        const body = this.scene.getMeshByName(`npc_body_${npc.id}`)
        const head = this.scene.getMeshByName(`npc_head_${npc.id}`)
        
        if (body) {
          body.position.x = npc.position.x
          body.position.z = npc.position.z
        }
        if (head) {
          head.position.x = npc.position.x
          head.position.z = npc.position.z
        }
        if (npc.mesh) {
          npc.mesh.position.x = npc.position.x
          npc.mesh.position.z = npc.position.z
        }
      }
    })
  }
  
  // NPC 간 만남 체크
  private checkNPCEncounters(npc: NPC) {
    const encounterDistance = 3.0 // 만남 거리
    
    this.npcs.forEach(otherNPC => {
      if (npc.id === otherNPC.id) return
      
      const dx = npc.position.x - otherNPC.position.x
      const dz = npc.position.z - otherNPC.position.z
      const distance = Math.sqrt(dx * dx + dz * dz)
      
      if (distance < encounterDistance) {
        // NPC 간 만남 처리
        const lastEncounterTime = (npc as any).lastEncounterTime || {}
        const lastTime = lastEncounterTime[otherNPC.id] || 0
        const currentTime = Date.now()
        
        // 10분마다 한 번씩 대화
        if (currentTime - lastTime > 600000) {
          const dialogue = this.getNPCToNPCDialogue(npc.id, otherNPC.id)
          if (dialogue) {
            console.log(`[NPC 대화] ${dialogue}`)
            ;(npc as any).lastEncounterTime = { ...lastEncounterTime, [otherNPC.id]: currentTime }
          }
        }
      }
    })
  }
  
  // NPC 취미 활동 (낚시, 독서, 운동)
  public startNPCHobby(npcId: string, hobby: 'fishing' | 'reading' | 'exercise'): void {
    const npc = this.npcs.get(npcId)
    if (!npc || !npc.mesh) return
    
    ;(npc as any).currentHobby = hobby
    ;(npc as any).hobbyStartTime = Date.now()
    
    // 취미 활동에 따른 위치 이동
    switch (hobby) {
      case 'fishing':
        // 낚시 포인트로 이동 (예: x: 10, z: 10)
        ;(npc as any).targetPosition = { x: 10, y: 0, z: 10 }
        ;(npc as any).isMoving = true
        break
      case 'reading':
        // 독서 장소로 이동 (예: x: -10, z: 10)
        ;(npc as any).targetPosition = { x: -10, y: 0, z: 10 }
        ;(npc as any).isMoving = true
        break
      case 'exercise':
        // 운동 장소로 이동 (예: x: 0, z: 10)
        ;(npc as any).targetPosition = { x: 0, y: 0, z: 10 }
        ;(npc as any).isMoving = true
        break
    }
    
    console.log(`${npc.name}이(가) ${hobby === 'fishing' ? '낚시' : hobby === 'reading' ? '독서' : '운동'}를 시작했습니다.`)
  }
  
  // NPC 취미 활동 중지
  public stopNPCHobby(npcId: string): void {
    const npc = this.npcs.get(npcId)
    if (!npc) return
    
    ;(npc as any).currentHobby = null
    ;(npc as any).hobbyStartTime = null
  }
  
  // NPC 취미 활동 가져오기
  public getNPCHobby(npcId: string): 'fishing' | 'reading' | 'exercise' | null {
    const npc = this.npcs.get(npcId)
    if (!npc) return null
    return (npc as any).currentHobby || null
  }
  
  // 이벤트 시스템 참조 설정
  private eventSystem: any = null
  public setEventSystem(eventSystem: any) {
    this.eventSystem = eventSystem
  }
}
