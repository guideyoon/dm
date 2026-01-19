import { InventoryManager } from '../InventoryManager'
import { TimeSystem } from './TimeSystem'
import { CurrencySystem } from './CurrencySystem'

export interface ShopItem {
  id: string
  name: string
  category: 'tool' | 'material' | 'furniture' | 'clothing' | 'seed' | 'consumable' | 'pet'
  buyPrice: number
  sellPrice: number
  stock: number // -1은 무제한
  unlockLevel?: number
  description: string
  petType?: string // 펫 아이템인 경우 펫 타입
}

export interface ShopTransaction {
  type: 'buy' | 'sell'
  itemId: string
  quantity: number
  totalPrice: number
  success: boolean
  message: string
}

export class ShopSystem {
  private inventoryManager: InventoryManager
  private timeSystem: TimeSystem | null = null
  private currencySystem: CurrencySystem | null = null
  private petSystem: any = null // PetSystem 참조
  private weatherSystem: any = null // WeatherSystem 참조
  private eventSystem: any = null // EventSystem 참조
  private lastStockUpdateDay: number = 0 // 마지막 재고 갱신 일자
  
  // 상점 아이템 데이터베이스
  private shopItems: ShopItem[] = [
    // 도구
    {
      id: 'tool_axe',
      name: '도끼',
      category: 'tool',
      buyPrice: 100,
      sellPrice: 50,
      stock: -1,
      description: '나무를 벨 수 있는 도구'
    },
    {
      id: 'tool_pickaxe',
      name: '곡괭이',
      category: 'tool',
      buyPrice: 150,
      sellPrice: 75,
      stock: -1,
      description: '돌을 캘 수 있는 도구'
    },
    {
      id: 'tool_shovel',
      name: '삽',
      category: 'tool',
      buyPrice: 80,
      sellPrice: 40,
      stock: -1,
      description: '땅을 팔 수 있는 도구'
    },
    {
      id: 'tool_fishing_rod',
      name: '낚싯대',
      category: 'tool',
      buyPrice: 200,
      sellPrice: 100,
      stock: -1,
      description: '물고기를 낚을 수 있는 도구'
    },
    {
      id: 'tool_net',
      name: '곤충망',
      category: 'tool',
      buyPrice: 120,
      sellPrice: 60,
      stock: -1,
      description: '벌레를 잡을 수 있는 도구'
    },
    {
      id: 'tool_watering_can',
      name: '물뿌리개',
      category: 'tool',
      buyPrice: 90,
      sellPrice: 45,
      stock: -1,
      description: '작물에 물을 줄 수 있는 도구'
    },
    
    // 재료
    {
      id: 'material_wood',
      name: '나무',
      category: 'material',
      buyPrice: 20,
      sellPrice: 10,
      stock: -1,
      description: '기본 건축 재료'
    },
    {
      id: 'material_stone',
      name: '돌',
      category: 'material',
      buyPrice: 15,
      sellPrice: 8,
      stock: -1,
      description: '기본 건축 재료'
    },
    {
      id: 'material_iron',
      name: '철',
      category: 'material',
      buyPrice: 50,
      sellPrice: 25,
      stock: -1,
      description: '고급 건축 재료'
    },
    
    // 씨앗
    {
      id: 'seed_turnip',
      name: '순무 씨앗',
      category: 'seed',
      buyPrice: 30,
      sellPrice: 0,
      stock: -1,
      description: '순무를 재배할 수 있는 씨앗'
    },
    {
      id: 'seed_carrot',
      name: '당근 씨앗',
      category: 'seed',
      buyPrice: 25,
      sellPrice: 0,
      stock: -1,
      description: '당근을 재배할 수 있는 씨앗'
    },
    {
      id: 'seed_potato',
      name: '감자 씨앗',
      category: 'seed',
      buyPrice: 20,
      sellPrice: 0,
      stock: -1,
      description: '감자를 재배할 수 있는 씨앗'
    },
    
    // 소비 아이템
    {
      id: 'item_bait',
      name: '미끼',
      category: 'consumable',
      buyPrice: 10,
      sellPrice: 5,
      stock: -1,
      description: '낚시 시 사용하는 미끼'
    },
    {
      id: 'item_fertilizer',
      name: '비료',
      category: 'consumable',
      buyPrice: 40,
      sellPrice: 20,
      stock: -1,
      description: '작물 성장 속도를 높이는 비료'
    },
    
    // 펫 사료
    {
      id: 'pet_food_basic',
      name: '기본 펫 사료',
      category: 'consumable',
      buyPrice: 50,
      sellPrice: 25,
      stock: -1,
      description: '펫에게 줄 수 있는 기본 사료'
    },
    {
      id: 'pet_food_premium',
      name: '프리미엄 펫 사료',
      category: 'consumable',
      buyPrice: 150,
      sellPrice: 75,
      stock: -1,
      description: '펫에게 줄 수 있는 프리미엄 사료 (효과 향상)'
    },
    {
      id: 'pet_food_fish',
      name: '생선 사료',
      category: 'consumable',
      buyPrice: 80,
      sellPrice: 40,
      stock: -1,
      description: '고양이 같은 펫이 좋아하는 생선 사료'
    },
    {
      id: 'pet_food_bone',
      name: '뼈 사료',
      category: 'consumable',
      buyPrice: 70,
      sellPrice: 35,
      stock: -1,
      description: '강아지 같은 펫이 좋아하는 뼈 사료'
    },
    
    // 펫
    {
      id: 'pet_egg_cat',
      name: '고양이 펫알',
      category: 'pet',
      buyPrice: 1000,
      sellPrice: 0,
      stock: -1,
      description: '고양이 펫을 얻을 수 있는 펫알',
      petType: 'cat'
    },
    {
      id: 'pet_egg_dog',
      name: '강아지 펫알',
      category: 'pet',
      buyPrice: 1500,
      sellPrice: 0,
      stock: -1,
      description: '강아지 펫을 얻을 수 있는 펫알',
      petType: 'dog'
    },
    {
      id: 'pet_egg_rabbit',
      name: '토끼 펫알',
      category: 'pet',
      buyPrice: 1200,
      sellPrice: 0,
      stock: -1,
      description: '토끼 펫을 얻을 수 있는 펫알',
      petType: 'rabbit'
    },
    {
      id: 'pet_egg_bird',
      name: '새 펫알',
      category: 'pet',
      buyPrice: 1000,
      sellPrice: 0,
      stock: -1,
      description: '새 펫을 얻을 수 있는 펫알',
      petType: 'bird'
    },
    {
      id: 'pet_egg_fox',
      name: '여우 펫알',
      category: 'pet',
      buyPrice: 2000,
      sellPrice: 0,
      stock: -1,
      description: '여우 펫을 얻을 수 있는 펫알',
      petType: 'fox'
    },
    {
      id: 'pet_egg_bear',
      name: '곰 펫알',
      category: 'pet',
      buyPrice: 3000,
      sellPrice: 0,
      stock: -1,
      description: '곰 펫을 얻을 수 있는 펫알',
      petType: 'bear'
    }
  ]
  
  // 아이템 판매 가격 (인벤토리 아이템 판매용)
  private sellPrices: { [itemId: string]: number } = {
    // 기본 재료 (밸런스 조정: 가격 상향)
    '나무': 15, // 10 → 15
    '돌': 12, // 8 → 12
    '열매': 8, // 5 → 8
    '나뭇가지': 8,
    '나무 통나무': 20,
    '단단한 나무': 30,
    '일반 버섯': 12,
    '버섯': 12,
    '희귀 버섯': 50,
    '일반 꽃': 15,
    '희귀 꽃': 40,
    '꽃': 15,
    '녹색 허브': 10,
    '파란 허브': 25,
    '일반 조개': 12,
    '희귀 조개': 40,
    '철광석': 30,
    '화석': 50,
    '사과': 20,
    '황금 열매': 100,
    '무작위 씨앗': 5,
    // 물고기
    'fish_crucian': 10,
    'fish_carp': 30,
    'fish_catfish': 80,
    'fish_salmon': 150,
    'fish_tuna': 500,
    'fish_sardine': 15,
    'fish_goldfish': 200,
    // 농장 작물 판매 가격 (밸런스 조정: 가격 상향)
    '순무': 35, // 25 → 35
    '당근': 30, // 20 → 30
    '감자': 25, // 15 → 25
    '토마토': 45, // 30 → 45
    '옥수수': 60, // 40 → 60
    // 제작된 요리 판매 가격 (밸런스 조정: 재료비의 1.2-1.5배)
    'consumable_berry_juice': 25, // 열매 3개 (24코인) → 25코인
    'consumable_herb_tea': 35, // 녹색 허브 2개 + 파란 허브 1개 (45코인) → 35코인
    'consumable_mushroom_soup': 50, // 버섯 2개 + 돌 1개 (36코인) → 50코인
    'consumable_turnip_salad': 90, // 순무 2개 + 일반 꽃 1개 (85코인) → 90코인
    'consumable_carrot_cake': 120, // 당근 3개 + 열매 2개 (106코인) → 120코인
    'consumable_fried_potato': 70, // 감자 2개 + 돌 1개 (62코인), 2개 제작 → 개당 70코인
    'consumable_tomato_juice': 150, // 토마토 3개 (135코인), 2개 제작 → 개당 150코인
    'consumable_corn_soup': 150, // 옥수수 2개 + 버섯 1개 (132코인) → 150코인
    'consumable_stir_fry': 100, // 순무 1개 + 당근 1개 + 감자 1개 (90코인) → 100코인
    'consumable_tomato_pasta': 120 // 토마토 2개 + 나무 2개 (110코인) → 120코인
  }
  
  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager
  }
  
  public setTimeSystem(timeSystem: TimeSystem) {
    this.timeSystem = timeSystem
    // 초기 재고 갱신 일자 설정
    if (timeSystem) {
      const gameTime = timeSystem.getTime()
      this.lastStockUpdateDay = gameTime.day
    }
  }
  
  public setCurrencySystem(currencySystem: CurrencySystem) {
    this.currencySystem = currencySystem
  }

  public setPetSystem(petSystem: any) {
    this.petSystem = petSystem
  }
  
  public setWeatherSystem(weatherSystem: any) {
    this.weatherSystem = weatherSystem
  }
  
  public setEventSystem(eventSystem: any) {
    this.eventSystem = eventSystem
  }
  
  public getCoins(): number {
    return this.currencySystem ? this.currencySystem.getCoins() : 0
  }
  
  public getShopItems(category?: string): ShopItem[] {
    if (category) {
      return this.shopItems.filter(item => item.category === category)
    }
    return [...this.shopItems]
  }
  
  public getShopItem(itemId: string): ShopItem | undefined {
    return this.shopItems.find(item => item.id === itemId)
  }
  
  public buyItem(itemId: string, quantity: number = 1): ShopTransaction {
    const shopItem = this.getShopItem(itemId)
    
    if (!shopItem) {
      return {
        type: 'buy',
        itemId,
        quantity,
        totalPrice: 0,
        success: false,
        message: '상점에 없는 아이템입니다.'
      }
    }
    
    // 재고 확인
    if (shopItem.stock !== -1 && shopItem.stock < quantity) {
      return {
        type: 'buy',
        itemId,
        quantity,
        totalPrice: 0,
        success: false,
        message: `재고가 부족합니다. (재고: ${shopItem.stock})`
      }
    }
    
    // 가격 계산 (시세 변동 적용)
    const basePrice = shopItem.buyPrice
    const priceMultiplier = this.getPriceMultiplier()
    const totalPrice = Math.floor(basePrice * quantity * priceMultiplier)
    
    // 코인 확인
    if (!this.currencySystem || !this.currencySystem.hasCoins(totalPrice)) {
      const currentCoins = this.currencySystem ? this.currencySystem.getCoins() : 0
      return {
        type: 'buy',
        itemId,
        quantity,
        totalPrice,
        success: false,
        message: `코인이 부족합니다. (필요: ${totalPrice}, 보유: ${currentCoins})`
      }
    }
    
    // 펫 아이템인 경우 특별 처리
    if (shopItem.category === 'pet' && shopItem.petType) {
      // 펫집 공간 확인
      if (!this.petSystem || !this.petSystem.hasSpaceInPetHouse || !this.petSystem.hasSpaceInPetHouse()) {
        return {
          type: 'buy',
          itemId,
          quantity,
          totalPrice,
          success: false,
          message: '펫집에 공간이 없습니다. 펫집을 업그레이드하세요.'
        }
      }
      
      // 코인 지불
      if (this.currencySystem) {
        this.currencySystem.spendCoins(totalPrice)
      }
      
      // 펫 획득 (각 펫알마다 펫 획득)
      const petTypeNames: { [key: string]: string } = {
        'cat': '고양이',
        'dog': '강아지',
        'rabbit': '토끼',
        'bird': '새',
        'fox': '여우',
        'bear': '곰'
      }
      
      let successCount = 0
      for (let i = 0; i < quantity; i++) {
        const petName = `${petTypeNames[shopItem.petType]} ${Date.now() + i}`
        const pet = this.petSystem.obtainPet(shopItem.petType, petName)
        if (pet) {
          successCount++
        }
      }
      
      if (successCount === 0) {
        // 실패 시 코인 환불
        if (this.currencySystem) {
          this.currencySystem.addCoins(totalPrice)
        }
        return {
          type: 'buy',
          itemId,
          quantity,
          totalPrice,
          success: false,
          message: '펫 획득에 실패했습니다. 펫집 공간을 확인해주세요.'
        }
      }
      
      return {
        type: 'buy',
        itemId,
        quantity,
        totalPrice,
        success: true,
        message: `${shopItem.name} x${successCount}개로 펫 ${successCount}마리를 획득했습니다! (${totalPrice} 코인)`
      }
    }
    
    // 일반 아이템 구매
    // 인벤토리 공간 확인
    if (!this.inventoryManager.hasSpace(quantity)) {
      return {
        type: 'buy',
        itemId,
        quantity,
        totalPrice,
        success: false,
        message: '인벤토리 공간이 부족합니다.'
      }
    }
    
    // 구매 처리
    if (this.currencySystem) {
      this.currencySystem.spendCoins(totalPrice)
    }
    this.inventoryManager.add(shopItem.id, quantity)
    
    // 재고 감소
    if (shopItem.stock !== -1) {
      shopItem.stock -= quantity
    }
    
    return {
      type: 'buy',
      itemId,
      quantity,
      totalPrice,
      success: true,
      message: `${shopItem.name} x${quantity}을(를) 구매했습니다. (${totalPrice} 코인)`
    }
  }
  
  public sellItem(itemId: string, quantity: number = 1): ShopTransaction {
    // 인벤토리에 아이템이 있는지 확인
    const inventoryItem = this.inventoryManager.list().find(item => item.name === itemId)
    
    if (!inventoryItem || inventoryItem.count < quantity) {
      return {
        type: 'sell',
        itemId,
        quantity,
        totalPrice: 0,
        success: false,
        message: `판매할 아이템이 없습니다. (보유: ${inventoryItem?.count || 0})`
      }
    }
    
    // 판매 가격 확인
    let sellPrice = this.sellPrices[itemId]
    
    // 상점 아이템인 경우 상점 판매 가격 사용
    if (!sellPrice) {
      const shopItem = this.getShopItem(itemId)
      if (shopItem) {
        sellPrice = shopItem.sellPrice
      } else {
        // 기본 판매 가격 (구매 가격의 50%)
        sellPrice = 5
      }
    }
    
    // 시세 변동 적용
    const priceMultiplier = this.getPriceMultiplier()
    const totalPrice = Math.floor(sellPrice * quantity * priceMultiplier)
    
    // 판매 처리
    this.inventoryManager.remove(itemId, quantity)
    if (this.currencySystem) {
      this.currencySystem.addCoins(totalPrice)
    }
    
    const itemName = this.getItemDisplayName(itemId)
    
    return {
      type: 'sell',
      itemId,
      quantity,
      totalPrice,
      success: true,
      message: `${itemName} x${quantity}을(를) 판매했습니다. (${totalPrice} 코인)`
    }
  }
  
  public getPriceMultiplier(): number {
    // 시세 변동 (0.8 ~ 1.2)
    let multiplier = 1.0
    
    // 1. 시간 기반 시세 변동
    if (this.timeSystem) {
      const gameTime = this.timeSystem.getTime()
      const hour = gameTime.hour
      
      // 오전 (6-11시): +0.05
      if (hour >= 6 && hour < 12) {
        multiplier += 0.05
      }
      // 오후 (12-17시): +0.1
      else if (hour >= 12 && hour < 18) {
        multiplier += 0.1
      }
      // 저녁 (18-21시): +0.05
      else if (hour >= 18 && hour < 22) {
        multiplier += 0.05
      }
      // 밤 (22-5시): -0.05
      else {
        multiplier -= 0.05
      }
    }
    
    // 2. 날씨 기반 시세 변동
    if (this.weatherSystem) {
      const weatherType = this.weatherSystem.getWeatherType()
      
      // 비오는 날: +0.05 (실내 활동 증가)
      if (weatherType === 'rainy') {
        multiplier += 0.05
      }
      // 눈 오는 날: +0.03
      else if (weatherType === 'snowy') {
        multiplier += 0.03
      }
      // 맑은 날: -0.03 (외출 증가, 실내 수요 감소)
      else if (weatherType === 'sunny') {
        multiplier -= 0.03
      }
      // 흐린 날: +0.02
      else if (weatherType === 'cloudy') {
        multiplier += 0.02
      }
    }
    
    // 3. 이벤트 기반 시세 변동
    if (this.eventSystem) {
      const activeEvents = this.eventSystem.getActiveEvents()
      // 축제 이벤트가 있으면 +0.1 (수요 증가)
      const hasFestival = activeEvents.some((event: any) => 
        event.type === 'festival' || event.type === 'seasonal'
      )
      if (hasFestival) {
        multiplier += 0.1
      }
    }
    
    // 범위 제한 (0.8 ~ 1.2)
    multiplier = Math.max(0.8, Math.min(1.2, multiplier))
    
    return multiplier
  }
  
  private getItemDisplayName(itemId: string): string {
    const shopItem = this.getShopItem(itemId)
    if (shopItem) {
      return shopItem.name
    }
    
    const displayNames: { [key: string]: string } = {
      // 기본 재료
      'Wood': '나무',
      'Stone': '돌',
      'Berry': '열매',
      'Mushroom': '버섯',
      'Flower': '꽃',
      
      // 도구
      'tool_axe': '도끼',
      'tool_pickaxe': '곡괭이',
      'tool_shovel': '삽',
      'tool_fishing_rod': '낚싯대',
      'tool_net': '곤충망',
      'tool_watering_can': '물뿌리개',
      'tool_axe_iron': '강화 도끼',
      'tool_pickaxe_iron': '강화 곡괭이',
      'tool_fishing_rod_pro': '고급 낚싯대',
      
      // 재료
      'material_wood': '나무',
      'material_stone': '돌',
      'material_iron': '철',
      'material_plank': '나무 판자',
      'material_brick': '돌 벽돌',
      
      // 소비품
      'consumable_berry_juice': '베리 주스',
      'consumable_herb_tea': '허브 차',
      'consumable_mushroom_soup': '버섯 수프',
      'consumable_turnip_salad': '순무 샐러드',
      'consumable_carrot_cake': '당근 케이크',
      'consumable_fried_potato': '감자 튀김',
      'consumable_tomato_juice': '토마토 주스',
      'consumable_corn_soup': '옥수수 수프',
      'consumable_stir_fry': '야채 볶음',
      'consumable_tomato_pasta': '토마토 파스타',
      'item_bait': '미끼',
      'item_fertilizer': '비료',
      'pet_food_basic': '기본 펫 사료',
      'pet_food_premium': '프리미엄 펫 사료',
      'pet_food_fish': '생선 사료',
      'pet_food_bone': '뼈 사료',
      
      // 가구
      'furniture_chair': '의자',
      'furniture_table': '테이블',
      'furniture_lamp': '램프',
      'furniture_plant': '화분',
      'furniture_rug': '카펫',
      
      // 장식
      'decoration_flower_crown': '꽃 화관',
      'decoration_flower_bouquet': '꽃다발',
      'decoration_shell_ornament': '조개 장식',
      'decoration_fossil_display': '화석 표시품',
      
      // 펫
      'pet_egg_cat': '고양이 펫알',
      'pet_egg_dog': '강아지 펫알',
      'pet_egg_rabbit': '토끼 펫알',
      'pet_egg_bird': '새 펫알',
      'pet_egg_fox': '여우 펫알',
      'pet_egg_bear': '곰 펫알',
      
      // 씨앗
      'seed_turnip': '순무 씨앗',
      'seed_carrot': '당근 씨앗',
      'seed_potato': '감자 씨앗',
      
      // 물고기
      'fish_crucian': '붕어',
      'fish_carp': '잉어',
      'fish_catfish': '메기',
      'fish_salmon': '연어',
      'fish_tuna': '참치',
      'fish_sardine': '정어리',
      'fish_goldfish': '금붕어'
    }
    
    return displayNames[itemId] || itemId
  }
  
  public getSellPrice(itemId: string): number {
    let sellPrice = this.sellPrices[itemId]
    
    if (!sellPrice) {
      const shopItem = this.getShopItem(itemId)
      if (shopItem) {
        sellPrice = shopItem.sellPrice
      } else {
        sellPrice = 5
      }
    }
    
    return Math.floor(sellPrice * this.getPriceMultiplier())
  }
  
  public updateStock() {
    // 상점 재고 업데이트 (매일 갱신 등)
    if (!this.timeSystem) return
    
    const gameTime = this.timeSystem.getTime()
    const currentDay = gameTime.day
    
    // 날짜가 바뀌었을 때만 재고 갱신
    if (currentDay !== this.lastStockUpdateDay) {
      this.lastStockUpdateDay = currentDay
      
      // 재고가 있는 아이템들의 재고 갱신
      this.shopItems.forEach(item => {
        if (item.stock !== -1 && item.stock < 10) {
          // 재고가 10개 미만이면 랜덤하게 5-15개로 갱신
          const randomStock = Math.floor(Math.random() * 11) + 5 // 5-15
          item.stock = randomStock
        } else if (item.stock !== -1) {
          // 재고가 있으면 랜덤하게 0-5개 추가
          const randomAddition = Math.floor(Math.random() * 6) // 0-5
          item.stock += randomAddition
        }
      })
      
      console.log(`상점 재고가 갱신되었습니다. (게임 일자: ${currentDay})`)
    }
  }
}
