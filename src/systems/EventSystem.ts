import { TimeSystem, Season } from './TimeSystem'

export type EventType = 'festival' | 'seasonal' | 'special' | 'daily'

export interface GameEvent {
  id: string
  type: EventType
  name: string
  description: string
  season?: Season[]
  startDate: number // 게임 일자
  endDate: number // 게임 일자
  active: boolean
  rewards?: {
    coins?: number
    tokens?: number
    items?: Array<{ id: string; count: number }>
  }
  specialItems?: string[] // 이벤트 한정 아이템
  npcId?: string // NPC 관련 이벤트 (생일 파티 등)
}

export interface Mail {
  id: string
  from: string // NPC 이름 또는 시스템
  subject: string
  content: string
  attachments?: Array<{ id: string; count: number }> // 첨부 아이템
  receivedDate: number // 게임 일자
  read: boolean
}

export class EventSystem {
  private timeSystem: TimeSystem | null = null
  private currencySystem: any = null // CurrencySystem
  private inventoryManager: any = null // InventoryManager
  private npcSystem: any = null // NPCSystem (생일 파티용)
  private claimedRewards: Set<string> = new Set() // 이미 받은 보상 추적
  private events: Map<string, GameEvent> = new Map()
  private activeEvents: Set<string> = new Set()
  private mailBox: Mail[] = [] // 우편함
  private lastMailCheckDay: number = 0 // 마지막 우편 확인 일자
  private npcBirthdays: Map<string, number> = new Map() // NPC ID -> 생일 일자
  private weatherSystem: any = null // WeatherSystem 참조
  
  // 별똥별 이벤트 관련
  private shootingStarActive: boolean = false
  private shootingStarCooldown: number = 0 // 별똥별 발생 쿨다운
  private shootingStarDuration: number = 10 // 별똥별 지속 시간 (초)
  private shootingStarTimer: number = 0
  
  constructor() {
    this.initializeEvents()
    this.initializeNPCBirthdays()
  }
  
  public setTimeSystem(timeSystem: TimeSystem) {
    this.timeSystem = timeSystem
    this.updateEvents()
  }
  
  public setCurrencySystem(currencySystem: any) {
    this.currencySystem = currencySystem
  }
  
  public setInventoryManager(inventoryManager: any) {
    this.inventoryManager = inventoryManager
  }
  
  public setNPCSystem(npcSystem: any) {
    this.npcSystem = npcSystem
  }
  
  public setWeatherSystem(weatherSystem: any) {
    this.weatherSystem = weatherSystem
  }
  
  private initializeNPCBirthdays() {
    // NPC 생일 날짜 초기화 (게임 일자 기준)
    this.npcBirthdays.set('npc_tom', 15) // 톰 생일: 15일
    this.npcBirthdays.set('npc_emily', 42) // 에밀리 생일: 42일
    this.npcBirthdays.set('npc_bob', 78) // 밥 생일: 78일
  }
  
  private initializeEvents() {
    // 계절 이벤트
    const seasonalEvents: GameEvent[] = [
      {
        id: 'event_spring_festival',
        type: 'seasonal',
        name: '봄 축제',
        description: '봄을 맞이하는 축제입니다!',
        season: ['spring'],
        startDate: 1,
        endDate: 7,
        active: false,
        rewards: {
          coins: 500,
          tokens: 20
        },
        specialItems: ['item_spring_flower']
      },
      {
        id: 'event_summer_festival',
        type: 'seasonal',
        name: '여름 축제',
        description: '여름을 즐기는 축제입니다!',
        season: ['summer'],
        startDate: 91,
        endDate: 97,
        active: false,
        rewards: {
          coins: 500,
          tokens: 20
        },
        specialItems: ['item_summer_shell']
      },
      {
        id: 'event_autumn_festival',
        type: 'seasonal',
        name: '가을 축제',
        description: '가을을 감상하는 축제입니다!',
        season: ['autumn'],
        startDate: 182,
        endDate: 188,
        active: false,
        rewards: {
          coins: 500,
          tokens: 20
        },
        specialItems: ['item_autumn_leaf']
      },
      {
        id: 'event_winter_festival',
        type: 'seasonal',
        name: '겨울 축제',
        description: '겨울을 즐기는 축제입니다!',
        season: ['winter'],
        startDate: 273,
        endDate: 279,
        active: false,
        rewards: {
          coins: 500,
          tokens: 20
        },
        specialItems: ['item_winter_snowflake']
      }
    ]
    
    seasonalEvents.forEach(event => {
      this.events.set(event.id, event)
    })
    
    // 일일 이벤트
    const dailyEvents: GameEvent[] = [
      {
        id: 'event_daily_login',
        type: 'daily',
        name: '일일 출석',
        description: '매일 접속하면 보상을 받을 수 있습니다!',
        startDate: 1,
        endDate: 365,
        active: true,
        rewards: {
          coins: 50,
          tokens: 1
        }
      }
    ]
    
    dailyEvents.forEach(event => {
      this.events.set(event.id, event)
    })
  }
  
  public update() {
    if (!this.timeSystem) return
    
    this.updateEvents()
    this.checkDailyMail()
    this.checkNPCBirthdays()
    this.updateShootingStarEvent()
  }
  
  private updateEvents() {
    if (!this.timeSystem) return
    
    const gameTime = this.timeSystem.getTime()
    const currentDay = gameTime.day
    
    this.events.forEach((event, eventId) => {
      // 이벤트 활성화 체크
      if (currentDay >= event.startDate && currentDay <= event.endDate) {
        // 계절 체크
        if (event.season && !event.season.includes(gameTime.season)) {
          event.active = false
          this.activeEvents.delete(eventId)
          return
        }
        
        if (!event.active) {
          event.active = true
          this.activeEvents.add(eventId)
        }
      } else {
        if (event.active) {
          event.active = false
          this.activeEvents.delete(eventId)
        }
      }
    })
  }
  
  public getActiveEvents(): GameEvent[] {
    return Array.from(this.activeEvents).map(id => this.events.get(id)!).filter(e => e !== undefined)
  }
  
  public getEvent(id: string): GameEvent | undefined {
    return this.events.get(id)
  }
  
  public getAllEvents(): GameEvent[] {
    return Array.from(this.events.values())
  }
  
  public getEventsByType(type: EventType): GameEvent[] {
    return this.getAllEvents().filter(event => event.type === type)
  }
  
  public isEventActive(eventId: string): boolean {
    return this.activeEvents.has(eventId)
  }
  
  public claimEventReward(eventId: string): { success: boolean; message: string; reward?: GameEvent['rewards'] } {
    const event = this.events.get(eventId)
    if (!event) {
      return { success: false, message: '이벤트를 찾을 수 없습니다.' }
    }
    
    if (!event.active) {
      return { success: false, message: '이벤트가 활성화되지 않았습니다.' }
    }
    
    if (!event.rewards) {
      return { success: false, message: '보상이 없습니다.' }
    }
    
    // 이미 받은 보상인지 확인 (일일 이벤트는 제외)
    if (event.type !== 'daily' && this.claimedRewards.has(eventId)) {
      return { success: false, message: '이미 보상을 받았습니다.' }
    }
    
    // 보상 지급 로직
    if (event.rewards.coins && this.currencySystem) {
      this.currencySystem.addCoins(event.rewards.coins)
    }
    
    if (event.rewards.tokens && this.currencySystem) {
      this.currencySystem.addTokens(event.rewards.tokens)
    }
    
    if (event.rewards.items && this.inventoryManager) {
      event.rewards.items.forEach(item => {
        this.inventoryManager.add(item.id, item.count)
      })
    }
    
    // 보상 받음 표시 (일일 이벤트는 제외)
    if (event.type !== 'daily') {
      this.claimedRewards.add(eventId)
    }
    
    return {
      success: true,
      message: `${event.name} 보상을 받았습니다!`,
      reward: event.rewards
    }
  }
  
  // 우편 확인
  private checkDailyMail() {
    if (!this.timeSystem) return
    
    const currentDay = this.timeSystem.getTime().day
    if (currentDay === this.lastMailCheckDay) return
    
    this.lastMailCheckDay = currentDay
    
    // 매일 랜덤 우편 생성 (30% 확률)
    if (Math.random() < 0.3 && this.npcSystem) {
      this.generateRandomMail(currentDay)
    }
  }
  
  // 랜덤 우편 생성
  private generateRandomMail(day: number) {
    if (!this.npcSystem) return
    
    const npcs = this.npcSystem.getAllNPCs()
    if (npcs.length === 0) return
    
    const randomNPC = npcs[Math.floor(Math.random() * npcs.length)]
    const mailTemplates = [
      {
        subject: '안부 인사',
        content: `안녕하세요! ${randomNPC.name}입니다. 요즘 어떻게 지내세요? 저는 잘 지내고 있어요. 가끔 놀러 오세요!`
      },
      {
        subject: '작은 선물',
        content: `안녕하세요! 오늘 좋은 일이 있어서 작은 선물을 보냈어요. 받아주세요!`
      },
      {
        subject: '초대장',
        content: `안녕하세요! 제가 준비한 작은 모임에 초대하고 싶어요. 시간 되실 때 들러주세요!`
      }
    ]
    
    const template = mailTemplates[Math.floor(Math.random() * mailTemplates.length)]
    
    const mail: Mail = {
      id: `mail_${Date.now()}`,
      from: randomNPC.name,
      subject: template.subject,
      content: template.content,
      attachments: template.subject === '작은 선물' ? [{ id: '나무', count: 5 }] : undefined,
      receivedDate: day,
      read: false
    }
    
    this.mailBox.push(mail)
    console.log(`우편 도착: ${mail.subject} (${mail.from})`)
  }
  
  // NPC 생일 파티 체크
  private checkNPCBirthdays() {
    if (!this.timeSystem || !this.npcSystem) return
    
    const currentDay = this.timeSystem.getTime().day
    
    this.npcBirthdays.forEach((birthday, npcId) => {
      // 생일인 날 체크
      if (currentDay === birthday) {
        const npc = this.npcSystem.getNPCById(npcId)
        if (npc) {
          // 생일 파티 이벤트 생성
          const eventId = `event_birthday_${npcId}_${currentDay}`
          if (!this.events.has(eventId)) {
            const birthdayEvent: GameEvent = {
              id: eventId,
              type: 'daily',
              name: `${npc.name} 생일 파티`,
              description: `오늘은 ${npc.name}의 생일입니다! 파티에 참석하고 축하 선물을 주세요!`,
              startDate: currentDay,
              endDate: currentDay,
              active: true,
              rewards: {
                coins: 200,
                friendship: 10 // NPC 친밀도 증가
              },
              npcId: npcId
            }
            
            this.events.set(eventId, birthdayEvent)
            this.activeEvents.add(eventId)
            
            // 생일 축하 우편 발송
            const birthdayMail: Mail = {
              id: `mail_birthday_${npcId}_${currentDay}`,
              from: npc.name,
              subject: '생일 초대장',
              content: `안녕하세요! 오늘 제 생일이에요! 작은 파티를 준비했는데, 참석해주시면 정말 기쁠 것 같아요. 축하 선물도 환영해요!`,
              receivedDate: currentDay,
              read: false
            }
            
            this.mailBox.push(birthdayMail)
            console.log(`생일 파티 이벤트 생성: ${npc.name}`)
          }
        }
      }
    })
  }
  
  // 우편함 가져오기
  public getMailBox(): Mail[] {
    return this.mailBox
  }
  
  // 읽지 않은 우편 개수
  public getUnreadMailCount(): number {
    return this.mailBox.filter(mail => !mail.read).length
  }
  
  // 우편 읽기
  public readMail(mailId: string): Mail | null {
    const mail = this.mailBox.find(m => m.id === mailId)
    if (!mail) return null
    
    mail.read = true
    
    // 첨부 아이템 받기
    if (mail.attachments && this.inventoryManager) {
      mail.attachments.forEach(item => {
        this.inventoryManager.add(item.id, item.count)
      })
      mail.attachments = [] // 받으면 제거
    }
    
    return mail
  }
  
  // 우편 삭제
  public deleteMail(mailId: string): boolean {
    const index = this.mailBox.findIndex(m => m.id === mailId)
    if (index === -1) return false
    
    this.mailBox.splice(index, 1)
    return true
  }
  
  // 별똥별 이벤트 업데이트
  private updateShootingStarEvent() {
    if (!this.timeSystem || !this.weatherSystem) return
    
    const gameTime = this.timeSystem.getTime()
    const hour = gameTime.hour
    const isNight = hour >= 22 || hour < 4 // 밤 시간대: 22시 ~ 4시
    const isClearWeather = this.weatherSystem.getWeatherType() === 'sunny'
    
    // 쿨다운 감소
    if (this.shootingStarCooldown > 0) {
      this.shootingStarCooldown -= 1/60 // 1초마다 감소
    }
    
    // 별똥별 이벤트 진행 중
    if (this.shootingStarActive) {
      this.shootingStarTimer -= 1/60 // 1초마다 감소
      
      if (this.shootingStarTimer <= 0) {
        // 별똥별 이벤트 종료
        this.shootingStarActive = false
        this.shootingStarCooldown = 300 // 5분 쿨다운
      }
      return
    }
    
    // 별똥별 발생 조건 체크
    if (isNight && isClearWeather && this.shootingStarCooldown <= 0) {
      // 10% 확률로 별똥별 발생
      if (Math.random() < 0.1) {
        this.activateShootingStar()
      }
    }
  }
  
  // 별똥별 이벤트 활성화
  private activateShootingStar() {
    this.shootingStarActive = true
    this.shootingStarTimer = this.shootingStarDuration
    
    // 별똥별 이벤트 생성
    const eventId = `event_shooting_star_${Date.now()}`
    const shootingStarEvent: GameEvent = {
      id: eventId,
      type: 'special',
      name: '별똥별 소원 빌기',
      description: '밤하늘에 별똥별이 보입니다! 소원을 빌어보세요!',
      startDate: this.timeSystem ? this.timeSystem.getTime().day : 1,
      endDate: this.timeSystem ? this.timeSystem.getTime().day : 1,
      active: true,
      rewards: {
        coins: 100,
        tokens: 5,
        items: [{ id: '별 조각', count: 1 }]
      },
      specialItems: ['별 조각']
    }
    
    this.events.set(eventId, shootingStarEvent)
    this.activeEvents.add(eventId)
    
    console.log('✨ 별똥별 이벤트 발생!')
  }
  
  // 별똥별 소원 빌기
  public makeWishOnShootingStar(): { success: boolean; message: string; reward?: any } {
    if (!this.shootingStarActive) {
      return { success: false, message: '지금은 별똥별이 보이지 않습니다.' }
    }
    
    // 활성화된 별똥별 이벤트 찾기
    const shootingStarEvents = Array.from(this.activeEvents)
      .map(id => this.events.get(id))
      .filter(e => e && e.name === '별똥별 소원 빌기' && e.active)
    
    if (shootingStarEvents.length === 0) {
      return { success: false, message: '별똥별 이벤트를 찾을 수 없습니다.' }
    }
    
    const event = shootingStarEvents[0]
    
    // 보상 지급
    const result = this.claimEventReward(event!.id)
    
    if (result.success) {
      // 별똥별 이벤트 즉시 종료
      this.shootingStarActive = false
      this.shootingStarTimer = 0
      
      return {
        success: true,
        message: '✨ 소원을 빌었습니다! 별 조각을 받았어요!',
        reward: result.reward
      }
    }
    
    return result
  }
  
  // 별똥별 이벤트 활성화 여부 확인
  public isShootingStarActive(): boolean {
    return this.shootingStarActive
  }
  
  // 별똥별 이벤트 남은 시간
  public getShootingStarTimeRemaining(): number {
    return Math.max(0, Math.ceil(this.shootingStarTimer))
  }
}
