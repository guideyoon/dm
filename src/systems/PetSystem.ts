import { Scene, Mesh, Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core'

export type PetType = 'cat' | 'dog' | 'rabbit' | 'hamster' | 'bird' | 'fox' | 'squirrel' | 'duck' | 'turtle' | 'bear' | 'wolf' | 'deer' | 'horse' | 'sheep' | 'penguin' | 'panda' | 'gorilla' | 'tiger' | 'lion'

export type PetCategory = 'small' | 'medium' | 'large' | 'special'

export type PetPersonality = 'active' | 'calm' | 'friendly' | 'independent'

export interface PetAbility {
    id: string
    name: string
    description: string
    level: number // 필요한 펫 레벨
    cooldown: number // 쿨타임 (초)
    effect: {
        type: 'collect' | 'defend' | 'explore' | 'assist' | 'carry'
        value: number
    }
}

export interface Pet {
    id: string
    name: string
    type: PetType
    category: PetCategory
    personality: PetPersonality
    
    // 상태
    level: number
    experience: number
    health: number // 0-100
    happiness: number // 0-100
    intimacy: number // 0-100
    hunger: number // 0-100
    energy: number // 0-100
    
    // 능력
    abilities: string[] // PetAbility id 배열
    stats: {
        collectionRadius: number
        collectionSpeed: number
        inventorySlots: number
        specialSkill?: string
    }
    
    // 외형
    appearance: {
        color: Color3
        size: number
        accessories: string[]
    }
    
    // 메타 정보
    obtainedDate: number // 획득 날짜
    lastInteractionDate: number // 마지막 상호작용 날짜
    favoriteFood: string // 좋아하는 음식
    favoriteToy: string // 좋아하는 장난감
    
    // 게임 내 오브젝트
    mesh?: Mesh
    position?: Vector3
    isFollowing: boolean // 플레이어를 따라다니는지
    isAtHome: boolean // 집에 있는지
}

export interface PetHouse {
    id: string
    capacity: number // 수용 가능한 펫 수
    level: number // 펫집 레벨 (1: 기본, 2: 확장, 3: 대형)
    position: Vector3
    decorations: string[] // 장식 아이템 id 배열
    mesh?: Mesh
}

export class PetSystem {
    private scene: Scene
    private pets: Map<string, Pet> = new Map()
    private petHouses: Map<string, PetHouse> = new Map()
    private masterAbilities: Map<string, PetAbility> = new Map()
    private playerMesh: Mesh | null = null
    
    // 펫 능력 사용을 위한 시스템 참조
    private inventoryManager: any = null
    private gatheringSystem: any = null
    private farmingSystem: any = null
    private currencySystem: any = null
    
    // 펫 능력 쿨타임 추적
    private abilityCooldowns: Map<string, Map<string, number>> = new Map() // petId -> abilityId -> remainingCooldown
    
    // 펫 타입별 기본 설정
    private petTypeConfigs: Map<PetType, {
        category: PetCategory
        defaultColor: Color3
        defaultSize: number
        defaultAbilities: string[]
        defaultStats: Pet['stats']
        favoriteFood: string
        favoriteToy: string
    }> = new Map()

    constructor(scene: Scene, playerMesh?: Mesh) {
        this.scene = scene
        this.playerMesh = playerMesh || null
        this.initializeMasterAbilities()
        this.initializePetTypeConfigs()
        this.initializeDefaultPetHouse()
    }

    public setInventoryManager(inventoryManager: any) {
        this.inventoryManager = inventoryManager
    }

    public setCurrencySystem(currencySystem: any) {
        this.currencySystem = currencySystem
    }

    public setGatheringSystem(gatheringSystem: any) {
        this.gatheringSystem = gatheringSystem
    }

    public setFarmingSystem(farmingSystem: any) {
        this.farmingSystem = farmingSystem
    }

    private initializeMasterAbilities() {
        // 수집 능력
        this.masterAbilities.set('auto_collect', {
            id: 'auto_collect',
            name: '자동 수집',
            description: '주변 아이템을 자동으로 수집합니다',
            level: 1,
            cooldown: 5,
            effect: { type: 'collect', value: 5.0 }
        })

        this.masterAbilities.set('rare_collect', {
            id: 'rare_collect',
            name: '희귀 아이템 발견',
            description: '희귀한 아이템을 찾아냅니다',
            level: 15,
            cooldown: 300,
            effect: { type: 'explore', value: 10.0 }
        })

        // 운반 능력
        this.masterAbilities.set('inventory_expand', {
            id: 'inventory_expand',
            name: '인벤토리 확장',
            description: '추가 인벤토리 공간을 제공합니다',
            level: 5,
            cooldown: 0,
            effect: { type: 'carry', value: 5 }
        })

        // 방어 능력
        this.masterAbilities.set('pest_control', {
            id: 'pest_control',
            name: '해충 방제',
            description: '농장의 해충을 잡아먹습니다',
            level: 10,
            cooldown: 60,
            effect: { type: 'defend', value: 1 }
        })

        // 탐험 능력
        this.masterAbilities.set('path_finder', {
            id: 'path_finder',
            name: '길 안내',
            description: '목적지까지 길을 안내합니다',
            level: 20,
            cooldown: 120,
            effect: { type: 'explore', value: 5.0 }
        })

        // 작업 도움
        this.masterAbilities.set('farming_help', {
            id: 'farming_help',
            name: '농장 도움',
            description: '농장 작업을 도와줍니다',
            level: 8,
            cooldown: 60,
            effect: { type: 'assist', value: 1 }
        })
    }

    private initializePetTypeConfigs() {
        // 고양이
        this.petTypeConfigs.set('cat', {
            category: 'small',
            defaultColor: new Color3(0.8, 0.6, 0.4),
            defaultSize: 0.4,
            defaultAbilities: ['auto_collect', 'pest_control'],
            defaultStats: {
                collectionRadius: 3.0,
                collectionSpeed: 1.5,
                inventorySlots: 3
            },
            favoriteFood: 'fish',
            favoriteToy: 'yarn'
        })

        // 강아지
        this.petTypeConfigs.set('dog', {
            category: 'small',
            defaultColor: new Color3(0.6, 0.4, 0.2),
            defaultSize: 0.5,
            defaultAbilities: ['auto_collect', 'path_finder'],
            defaultStats: {
                collectionRadius: 4.0,
                collectionSpeed: 2.0,
                inventorySlots: 5
            },
            favoriteFood: 'bone',
            favoriteToy: 'ball'
        })

        // 토끼
        this.petTypeConfigs.set('rabbit', {
            category: 'small',
            defaultColor: new Color3(0.9, 0.9, 0.9),
            defaultSize: 0.3,
            defaultAbilities: ['auto_collect', 'farming_help'],
            defaultStats: {
                collectionRadius: 2.5,
                collectionSpeed: 1.8,
                inventorySlots: 3
            },
            favoriteFood: 'carrot',
            favoriteToy: 'carrot_toy'
        })

        // 새
        this.petTypeConfigs.set('bird', {
            category: 'small',
            defaultColor: new Color3(0.3, 0.5, 0.8),
            defaultSize: 0.2,
            defaultAbilities: ['rare_collect', 'explore'],
            defaultStats: {
                collectionRadius: 5.0,
                collectionSpeed: 3.0,
                inventorySlots: 2
            },
            favoriteFood: 'seed',
            favoriteToy: 'bell'
        })

        // 여우
        this.petTypeConfigs.set('fox', {
            category: 'medium',
            defaultColor: new Color3(1.0, 0.5, 0.1),
            defaultSize: 0.6,
            defaultAbilities: ['auto_collect', 'rare_collect'],
            defaultStats: {
                collectionRadius: 4.5,
                collectionSpeed: 2.5,
                inventorySlots: 4
            },
            favoriteFood: 'berry',
            favoriteToy: 'toy'
        })

        // 곰
        this.petTypeConfigs.set('bear', {
            category: 'large',
            defaultColor: new Color3(0.4, 0.3, 0.2),
            defaultSize: 1.2,
            defaultAbilities: ['inventory_expand', 'defend'],
            defaultStats: {
                collectionRadius: 3.0,
                collectionSpeed: 1.0,
                inventorySlots: 10
            },
            favoriteFood: 'honey',
            favoriteToy: 'big_toy'
        })
    }

    private initializeDefaultPetHouse() {
        // 기본 펫집 생성 (플레이어 집 근처)
        const defaultHouse: PetHouse = {
            id: 'pet_house_default',
            capacity: 1,
            level: 1,
            position: new Vector3(0, 0, -5),
            decorations: []
        }
        this.petHouses.set(defaultHouse.id, defaultHouse)
        this.createPetHouseMesh(defaultHouse)
    }

    private createPetHouseMesh(petHouse: PetHouse) {
        // 간단한 펫집 메시 생성
        const house = MeshBuilder.CreateBox(`petHouse_${petHouse.id}`, {
            width: 2,
            height: 1.5,
            depth: 2
        }, this.scene)

        const roof = MeshBuilder.CreateBox(`petHouseRoof_${petHouse.id}`, {
            width: 2.2,
            height: 0.5,
            depth: 2.2
        }, this.scene)

        const mat = new StandardMaterial(`petHouseMat_${petHouse.id}`, this.scene)
        mat.diffuseColor = new Color3(0.6, 0.4, 0.3)
        house.material = mat

        const roofMat = new StandardMaterial(`petHouseRoofMat_${petHouse.id}`, this.scene)
        roofMat.diffuseColor = new Color3(0.5, 0.2, 0.1)
        roof.material = roofMat

        house.position = petHouse.position.clone()
        roof.position = petHouse.position.clone()
        roof.position.y = 1.0

        petHouse.mesh = house
    }

    // 펫 획득
    obtainPet(type: PetType, name: string, position?: Vector3): Pet | null {
        const config = this.petTypeConfigs.get(type)
        if (!config) {
            console.warn('알 수 없는 펫 타입:', type)
            return null
        }

        // 펫집 수용 공간 확인
        if (!this.hasSpaceInPetHouse()) {
            console.warn('펫집에 공간이 없습니다')
            return null
        }

        const petId = `pet_${type}_${Date.now()}`
        const pet: Pet = {
            id: petId,
            name: name,
            type: type,
            category: config.category,
            personality: this.getRandomPersonality(),
            level: 1,
            experience: 0,
            health: 100,
            happiness: 70,
            intimacy: 20,
            hunger: 80,
            energy: 100,
            abilities: [...config.defaultAbilities],
            stats: { ...config.defaultStats },
            appearance: {
                color: config.defaultColor.clone(),
                size: config.defaultSize,
                accessories: []
            },
            obtainedDate: Date.now(),
            lastInteractionDate: Date.now(),
            favoriteFood: config.favoriteFood,
            favoriteToy: config.favoriteToy,
            isFollowing: false,
            isAtHome: true,
            position: position || new Vector3(0, 0, -5)
        }

        this.pets.set(petId, pet)
        this.createPetMesh(pet)

        // 펫집에 할당
        this.assignPetToHouse(petId)

        console.log('펫 획득:', pet.name, pet.type)
        return pet
    }

    private getRandomPersonality(): PetPersonality {
        const personalities: PetPersonality[] = ['active', 'calm', 'friendly', 'independent']
        return personalities[Math.floor(Math.random() * personalities.length)]
    }

    public hasSpaceInPetHouse(): boolean {
        let totalCapacity = 0
        let currentPets = 0

        this.petHouses.forEach(house => {
            totalCapacity += house.capacity
        })

        currentPets = this.pets.size
        return currentPets < totalCapacity
    }

    private assignPetToHouse(petId: string) {
        // 가장 여유 공간이 많은 펫집에 할당
        for (const house of this.petHouses.values()) {
            const petsInHouse = Array.from(this.pets.values()).filter(p => 
                p.position && house.position && 
                Vector3.Distance(p.position, house.position) < 3
            ).length

            if (petsInHouse < house.capacity) {
                const pet = this.pets.get(petId)
                if (pet) {
                    pet.position = house.position.clone()
                    pet.position.x += (Math.random() - 0.5) * 2
                    pet.position.z += (Math.random() - 0.5) * 2
                    if (pet.mesh) {
                        pet.mesh.position = pet.position.clone()
                    }
                    break
                }
            }
        }
    }

    private createPetMesh(pet: Pet) {
        // 펫 타입에 따른 간단한 메시 생성
        const config = this.petTypeConfigs.get(pet.type)
        if (!config) return

        let mesh: Mesh
        const size = pet.appearance.size

        switch (pet.category) {
            case 'small':
                mesh = MeshBuilder.CreateSphere(`pet_${pet.id}`, { diameter: size }, this.scene)
                break
            case 'medium':
                mesh = MeshBuilder.CreateBox(`pet_${pet.id}`, {
                    width: size,
                    height: size * 1.2,
                    depth: size
                }, this.scene)
                break
            case 'large':
                mesh = MeshBuilder.CreateBox(`pet_${pet.id}`, {
                    width: size,
                    height: size * 1.5,
                    depth: size
                }, this.scene)
                break
            default:
                mesh = MeshBuilder.CreateSphere(`pet_${pet.id}`, { diameter: size }, this.scene)
        }

        const mat = new StandardMaterial(`petMat_${pet.id}`, this.scene)
        mat.diffuseColor = pet.appearance.color
        mesh.material = mat

        mesh.position = pet.position ? pet.position.clone() : new Vector3(0, size / 2, -5)
        mesh.checkCollisions = true

        pet.mesh = mesh
    }

    // 펫 관리
    feedPet(petId: string, foodType?: string): boolean {
        const pet = this.pets.get(petId)
        if (!pet) return false

        const isFavorite = foodType === pet.favoriteFood
        
        // 배고픔 회복
        pet.hunger = Math.min(100, pet.hunger + (isFavorite ? 30 : 20))
        
        // 행복도 증가
        pet.happiness = Math.min(100, pet.happiness + (isFavorite ? 10 : 5))
        
        // 친밀도 증가
        pet.intimacy = Math.min(100, pet.intimacy + (isFavorite ? 3 : 2))
        
        pet.lastInteractionDate = Date.now()

        console.log(`${pet.name}에게 음식을 주었습니다. (좋아하는 음식: ${isFavorite ? '예' : '아니오'})`)
        return true
    }

    playWithPet(petId: string, toyType?: string): boolean {
        const pet = this.pets.get(petId)
        if (!pet) return false

        const isFavorite = toyType === pet.favoriteToy

        // 행복도 증가
        pet.happiness = Math.min(100, pet.happiness + (isFavorite ? 15 : 10))
        
        // 친밀도 증가
        pet.intimacy = Math.min(100, pet.intimacy + (isFavorite ? 5 : 3))
        
        // 에너지 소모
        pet.energy = Math.max(0, pet.energy - 10)
        
        pet.lastInteractionDate = Date.now()

        // 경험치 획득
        this.addExperience(petId, isFavorite ? 5 : 3)

        console.log(`${pet.name}와 놀았습니다. (좋아하는 장난감: ${isFavorite ? '예' : '아니오'})`)
        return true
    }

    petPet(petId: string): boolean {
        const pet = this.pets.get(petId)
        if (!pet) return false

        // 행복도 증가
        pet.happiness = Math.min(100, pet.happiness + 5)
        
        // 친밀도 증가
        pet.intimacy = Math.min(100, pet.intimacy + 2)
        
        pet.lastInteractionDate = Date.now()

        console.log(`${pet.name}를 쓰다듬었습니다.`)
        return true
    }

    // 펫 상태 업데이트
    updatePetStatus(petId: string, deltaTime: number) {
        const pet = this.pets.get(petId)
        if (!pet) return

        // 시간 경과에 따른 상태 변화
        const hoursSinceInteraction = (Date.now() - pet.lastInteractionDate) / (1000 * 60 * 60)

        // 배고픔 감소 (시간당 2)
        pet.hunger = Math.max(0, pet.hunger - hoursSinceInteraction * 2)

        // 행복도 감소 (배고픔이 낮으면 더 빠르게)
        if (pet.hunger < 30) {
            pet.happiness = Math.max(0, pet.happiness - hoursSinceInteraction * 3)
        } else if (pet.hunger < 50) {
            pet.happiness = Math.max(0, pet.happiness - hoursSinceInteraction * 1)
        }

        // 친밀도 감소 (장기간 상호작용 없으면)
        if (hoursSinceInteraction > 24) {
            pet.intimacy = Math.max(0, pet.intimacy - hoursSinceInteraction * 0.5)
        }

        // 건강 상태 (배고픔과 행복도에 영향)
        if (pet.hunger < 20 || pet.happiness < 20) {
            pet.health = Math.max(0, pet.health - hoursSinceInteraction * 2)
        } else {
            pet.health = Math.min(100, pet.health + hoursSinceInteraction * 0.5)
        }

        // 에너지 회복 (휴식 중일 때)
        if (!pet.isFollowing && pet.energy < 100) {
            pet.energy = Math.min(100, pet.energy + hoursSinceInteraction * 10)
        }
    }

    // 펫 성장 시스템
    addExperience(petId: string, amount: number) {
        const pet = this.pets.get(petId)
        if (!pet) return

        pet.experience += amount

        // 레벨업 체크
        const expNeeded = this.getExperienceNeeded(pet.level)
        if (pet.experience >= expNeeded) {
            this.levelUpPet(petId)
        }
    }

    private getExperienceNeeded(level: number): number {
        // 레벨당 필요 경험치 계산
        return level * 50 + (level - 1) * 25
    }

    private levelUpPet(petId: string) {
        const pet = this.pets.get(petId)
        if (!pet) return

        pet.level += 1
        pet.experience = 0

        // 능력 획득 체크
        this.checkAbilityUnlock(petId)

        // 스탯 증가
        pet.stats.collectionRadius += 0.5
        pet.stats.collectionSpeed += 0.1
        if (pet.level % 5 === 0) {
            pet.stats.inventorySlots += 1
        }

        console.log(`${pet.name}가 레벨 ${pet.level}로 올랐습니다!`)
    }

    private checkAbilityUnlock(petId: string) {
        const pet = this.pets.get(petId)
        if (!pet) return

        // 마스터 능력 중 레벨 조건 만족하는 능력 찾기
        for (const ability of this.masterAbilities.values()) {
            if (ability.level <= pet.level && !pet.abilities.includes(ability.id)) {
                pet.abilities.push(ability.id)
                console.log(`${pet.name}가 능력 "${ability.name}"을 습득했습니다!`)
            }
        }
    }

    // 펫 집 관리
    upgradePetHouse(houseId: string): boolean {
        const house = this.petHouses.get(houseId)
        if (!house) return false

        if (house.level >= 3) {
            console.warn('이미 최대 레벨입니다')
            return false
        }

        // 업그레이드 비용 확인
        let upgradeCost = 0
        if (house.level === 1) {
            upgradeCost = 1000 // 레벨 1 -> 2: 1000 코인
        } else if (house.level === 2) {
            upgradeCost = 5000 // 레벨 2 -> 3: 5000 코인
        }

        if (this.currencySystem && this.currencySystem.getCoins() < upgradeCost) {
            console.warn('업그레이드 비용이 부족합니다')
            return false
        }

        // 코인 차감
        if (this.currencySystem) {
            this.currencySystem.spendCoins(upgradeCost)
        }

        house.level += 1
        house.capacity = house.level === 2 ? 3 : 5

        // 메시 업데이트
        if (house.mesh) {
            house.mesh.dispose()
        }
        this.createPetHouseMesh(house)

        console.log(`펫집이 레벨 ${house.level}로 업그레이드되었습니다. (수용량: ${house.capacity})`)
        return true
    }

    // 펫집 업그레이드 비용 조회
    getUpgradeCost(houseId: string): number {
        const house = this.petHouses.get(houseId)
        if (!house) return 0

        if (house.level >= 3) return 0 // 이미 최대 레벨
        if (house.level === 1) return 1000
        if (house.level === 2) return 5000
        return 0
    }

    // 펫 AI (기본)
    setPetFollowing(petId: string, following: boolean) {
        const pet = this.pets.get(petId)
        if (!pet) return

        pet.isFollowing = following
        pet.isAtHome = !following

        if (pet.mesh) {
            // 플레이어를 따라다니는 로직은 업데이트 루프에서 처리
        }
    }

    updatePetAI(petId: string, playerPosition: Vector3, deltaTime: number) {
        const pet = this.pets.get(petId)
        if (!pet || !pet.mesh) return

        if (pet.isFollowing) {
            // 플레이어를 따라다니기
            const currentPos = pet.mesh.position
            const direction = playerPosition.subtract(currentPos)
            const distance = direction.length()

            if (distance > 3) {
                // 너무 멀면 따라가기
                const moveSpeed = 2.0 * deltaTime
                const normalized = direction.normalize()
                pet.mesh.position.addInPlace(new Vector3(
                    normalized.x * moveSpeed,
                    0,
                    normalized.z * moveSpeed
                ))
                pet.position = pet.mesh.position.clone()
            } else if (distance < 1.5 && distance > 0.1) {
                // 너무 가까우면 조금 뒤로
                const moveSpeed = 1.0 * deltaTime
                const normalized = direction.normalize()
                pet.mesh.position.subtractInPlace(new Vector3(
                    normalized.x * moveSpeed,
                    0,
                    normalized.z * moveSpeed
                ))
                pet.position = pet.mesh.position.clone()
            }
        } else if (!pet.isAtHome && pet.position) {
            // 집으로 돌아가기
            const homeHouse = Array.from(this.petHouses.values())[0]
            if (homeHouse && homeHouse.position) {
                const currentPos = pet.mesh.position
                const direction = homeHouse.position.subtract(currentPos)
                const distance = direction.length()

                if (distance > 1) {
                    const moveSpeed = 1.5 * deltaTime
                    const normalized = direction.normalize()
                    pet.mesh.position.addInPlace(new Vector3(
                        normalized.x * moveSpeed,
                        0,
                        normalized.z * moveSpeed
                    ))
                    pet.position = pet.mesh.position.clone()
                } else {
                    pet.isAtHome = true
                }
            }
        }
    }

    // 펫 조회
    getPet(petId: string): Pet | undefined {
        return this.pets.get(petId)
    }

    getAllPets(): Pet[] {
        return Array.from(this.pets.values())
    }

    getPetHouse(houseId: string): PetHouse | undefined {
        return this.petHouses.get(houseId)
    }

    getAllPetHouses(): PetHouse[] {
        return Array.from(this.petHouses.values())
    }

    getPetAbility(abilityId: string): PetAbility | undefined {
        return this.masterAbilities.get(abilityId)
    }

    getAllAbilities(): PetAbility[] {
        return Array.from(this.masterAbilities.values())
    }

    // 펫 이름 변경
    renamePet(petId: string, newName: string): boolean {
        const pet = this.pets.get(petId)
        if (!pet) return false

        pet.name = newName
        return true
    }

    // 펫 커스터마이징 (액세서리 추가/제거)
    equipAccessory(petId: string, accessoryId: string): boolean {
        const pet = this.pets.get(petId)
        if (!pet) return false

        if (!pet.appearance.accessories.includes(accessoryId)) {
            pet.appearance.accessories.push(accessoryId)
            console.log(`${pet.name}에게 액세서리 "${accessoryId}"를 장착했습니다.`)
            return true
        }
        return false
    }

    unequipAccessory(petId: string, accessoryId: string): boolean {
        const pet = this.pets.get(petId)
        if (!pet) return false

        const index = pet.appearance.accessories.indexOf(accessoryId)
        if (index > -1) {
            pet.appearance.accessories.splice(index, 1)
            console.log(`${pet.name}에게서 액세서리 "${accessoryId}"를 제거했습니다.`)
            return true
        }
        return false
    }

    // 펫 외형 변경 (색상, 크기)
    changePetColor(petId: string, color: Color3): boolean {
        const pet = this.pets.get(petId)
        if (!pet) return false

        pet.appearance.color = color
        if (pet.mesh) {
            const material = pet.mesh.material as StandardMaterial
            if (material) {
                material.diffuseColor = color
            }
        }
        console.log(`${pet.name}의 색상을 변경했습니다.`)
        return true
    }

    changePetSize(petId: string, size: number): boolean {
        const pet = this.pets.get(petId)
        if (!pet) return false

        pet.appearance.size = size
        if (pet.mesh) {
            pet.mesh.scaling = new Vector3(size, size, size)
        }
        console.log(`${pet.name}의 크기를 변경했습니다.`)
        return true
    }

    // 펫 번식 시스템
    canBreed(petType: PetType): boolean {
        // 같은 종류의 펫이 2마리 이상 있으면 번식 가능
        const sameTypePets = Array.from(this.pets.values()).filter(p => p.type === petType)
        return sameTypePets.length >= 2
    }

    breedPets(petType: PetType): Pet | null {
        if (!this.canBreed(petType)) {
            console.warn('번식에 필요한 펫이 부족합니다. 같은 종류의 펫이 2마리 이상 필요합니다.')
            return null
        }

        // 펫집 공간 확인
        if (!this.hasSpaceInPetHouse()) {
            console.warn('펫집에 공간이 없습니다.')
            return null
        }

        // 같은 종류의 펫 2마리 선택
        const sameTypePets = Array.from(this.pets.values()).filter(p => p.type === petType)
        if (sameTypePets.length < 2) return null

        const parent1 = sameTypePets[0]
        const parent2 = sameTypePets[1]

        // 새끼 펫 생성
        const babyName = `${parent1.name}와 ${parent2.name}의 새끼`
        const babyPosition = parent1.position || new Vector3(0, 0, 0)

        // 부모의 특징을 물려받음 (색상, 크기 등)
        const babyColor = new Color3(
            (parent1.appearance.color.r + parent2.appearance.color.r) / 2,
            (parent1.appearance.color.g + parent2.appearance.color.g) / 2,
            (parent1.appearance.color.b + parent2.appearance.color.b) / 2
        )
        const babySize = (parent1.appearance.size + parent2.appearance.size) / 2

        const babyPet = this.obtainPet(petType, babyName, babyPosition)
        if (babyPet) {
            // 새끼 펫의 외형 설정
            babyPet.appearance.color = babyColor
            babyPet.appearance.size = babySize

            // 메시 색상 적용
            if (babyPet.mesh) {
                const material = babyPet.mesh.material as StandardMaterial
                if (material) {
                    material.diffuseColor = babyColor
                }
                babyPet.mesh.scaling = new Vector3(babySize, babySize, babySize)
            }

            // 부모의 능력 일부 물려받음
            if (parent1.abilities.length > 0 || parent2.abilities.length > 0) {
                const inheritedAbility = parent1.abilities.length > 0 
                    ? parent1.abilities[0] 
                    : parent2.abilities[0]
                if (inheritedAbility && !babyPet.abilities.includes(inheritedAbility)) {
                    babyPet.abilities.push(inheritedAbility)
                }
            }

            console.log(`${babyName}가 태어났습니다!`)
            return babyPet
        }

        return null
    }

    // 펫 삭제 (집으로 돌려보내기)
    releasePet(petId: string): boolean {
        const pet = this.pets.get(petId)
        if (!pet) return false

        if (pet.mesh) {
            pet.mesh.dispose()
        }

        this.pets.delete(petId)
        console.log(`${pet.name}를 집으로 돌려보냈습니다.`)
        return true
    }

    // 펫 능력 사용 (자동 수집 등)
    private usePetAbilities(petId: string, deltaTime: number) {
        const pet = this.pets.get(petId)
        if (!pet || !pet.mesh || !pet.isFollowing) return

        // 쿨타임 업데이트
        if (!this.abilityCooldowns.has(petId)) {
            this.abilityCooldowns.set(petId, new Map())
        }
        const cooldowns = this.abilityCooldowns.get(petId)!

        // 쿨타임 감소
        cooldowns.forEach((remaining, abilityId) => {
            if (remaining > 0) {
                cooldowns.set(abilityId, Math.max(0, remaining - deltaTime))
            }
        })

        // 각 능력 확인 및 실행
        for (const abilityId of pet.abilities) {
            const ability = this.masterAbilities.get(abilityId)
            if (!ability) continue

            // 쿨타임 확인
            const currentCooldown = cooldowns.get(abilityId) || 0
            if (currentCooldown > 0) continue

            // 능력 타입에 따라 실행
            switch (ability.effect.type) {
                case 'collect':
                    this.useAutoCollectAbility(petId, ability)
                    if (ability.cooldown > 0) {
                        cooldowns.set(abilityId, ability.cooldown)
                    }
                    break
                case 'explore':
                    this.useRareCollectAbility(petId, ability)
                    if (ability.cooldown > 0) {
                        cooldowns.set(abilityId, ability.cooldown)
                    }
                    break
                case 'defend':
                    this.usePestControlAbility(petId, ability)
                    if (ability.cooldown > 0) {
                        cooldowns.set(abilityId, ability.cooldown)
                    }
                    break
                case 'assist':
                    this.useFarmingHelpAbility(petId, ability)
                    if (ability.cooldown > 0) {
                        cooldowns.set(abilityId, ability.cooldown)
                    }
                    break
            }
        }
    }

    // 자동 수집 능력
    private useAutoCollectAbility(petId: string, ability: PetAbility) {
        const pet = this.pets.get(petId)
        if (!pet || !pet.mesh || !this.gatheringSystem || !this.inventoryManager) return

        const petPosition = pet.mesh.position
        const collectionRadius = pet.stats.collectionRadius

        // 씬의 모든 메시에서 채집 가능한 오브젝트 찾기
        const gatherableMeshNames = ['trunk', 'leaves', 'rock', 'berryBush', 'herb', 'fruitTree', 'mushroomCap', 'petal', 'flowerCenter', 'shell', 'stump', 'rockPile']

        // 가장 가까운 채집 가능한 오브젝트 찾기
        let closestMesh: Mesh | null = null
        let closestDistance = collectionRadius
        let closestMeshName = ''

        for (const mesh of this.scene.meshes) {
            // 이름으로 채집 가능 여부 판단
            let isGatherable = false
            let meshName = ''
            for (const name of gatherableMeshNames) {
                if (mesh.name.includes(name)) {
                    isGatherable = true
                    meshName = name
                    break
                }
            }

            if (!isGatherable || !mesh.position) continue

            // 채집 가능 여부 확인 (메시가 아직 존재하는지)
            if (mesh.isDisposed()) continue

            // 거리 확인
            const distance = Vector3.Distance(petPosition, mesh.position)
            if (distance <= collectionRadius && distance < closestDistance) {
                closestDistance = distance
                closestMesh = mesh
                closestMeshName = meshName
            }
        }

        // 가장 가까운 오브젝트가 있으면 채집
        if (closestMesh && closestMeshName) {
            this.gatheringSystem.gather(closestMeshName, 'hand', true).then((result: any) => {
                if (result && result.items && result.items.length > 0) {
                    // 수집한 아이템을 인벤토리에 추가
                    result.items.forEach((item: any) => {
                        this.inventoryManager.add(item.itemId, item.count || 1)
                    })
                    console.log(`${pet.name}가 자동으로 아이템을 수집했습니다!`, result.items)
                }
            }).catch((error: any) => {
                // 채집 실패 시 무시
            })
        }
    }

    // 희귀 아이템 발견 능력
    private useRareCollectAbility(petId: string, ability: PetAbility) {
        // 희귀 아이템 발견은 랜덤 확률로 주변에 희귀 아이템 생성
        const pet = this.pets.get(petId)
        if (!pet || !pet.mesh || !this.inventoryManager) return

        const rareItems = ['희귀 꽃', 'shell_rare', 'mushroom_rare', 'wood_hard']
        const randomItem = rareItems[Math.floor(Math.random() * rareItems.length)]
        
        // 확률적으로 희귀 아이템 발견 (10% 확률)
        if (Math.random() < 0.1) {
            this.inventoryManager.add(randomItem, 1)
            console.log(`${pet.name}가 희귀 아이템을 발견했습니다!`, randomItem)
        }
    }

    // 해충 방제 능력
    private usePestControlAbility(petId: string, ability: PetAbility) {
        if (!this.farmingSystem) return
        
        const pet = this.pets.get(petId)
        if (!pet) return
        
        // 농장의 모든 작물 확인
        const farmPlots = this.farmingSystem.getFarmPlots()
        let treatedCount = 0
        
        farmPlots.forEach(plot => {
            if (plot.crop && plot.crop.stage === 'withered') {
                // 시든 작물을 제거하여 새로 심을 수 있게 함 (또는 복구)
                // 간단하게 작물을 제거하여 새로 심을 수 있게 함
                if (plot.crop.mesh) {
                    plot.crop.mesh.dispose()
                }
                plot.crop = null
                treatedCount++
            }
        })
        
        if (treatedCount > 0) {
            console.log(`${pet.name}가 해충 방제를 완료했습니다! (${treatedCount}개 작물 정리)`)
        }
    }

    // 농장 도움 능력
    private useFarmingHelpAbility(petId: string, ability: PetAbility) {
        if (!this.farmingSystem) return
        
        const pet = this.pets.get(petId)
        if (!pet) return
        
        // 농장의 모든 작물 확인
        const farmPlots = this.farmingSystem.getFarmPlots()
        let helpedCount = 0
        
        farmPlots.forEach(plot => {
            if (plot.crop) {
                // 성숙한 작물이 있으면 수확 도움 (인벤토리에 자동 추가)
                if (plot.crop.stage === 'mature') {
                    const result = this.farmingSystem.harvestCrop(plot.id)
                    if (result.success) {
                        helpedCount++
                    }
                }
                // 물주지 않은 작물이 있으면 물주기
                else if (!plot.crop.watered && plot.crop.stage !== 'withered' && plot.crop.stage !== 'seed') {
                    const success = this.farmingSystem.waterCrop(plot.id)
                    if (success) {
                        helpedCount++
                    }
                }
            }
        })
        
        if (helpedCount > 0) {
            console.log(`${pet.name}가 농장 작업을 도와주었습니다! (${helpedCount}개 작물 처리)`)
        }
    }

    // 업데이트 (매 프레임)
    update(deltaTime: number, playerPosition: Vector3) {
        // 모든 펫 상태 업데이트
        this.pets.forEach((pet, petId) => {
            this.updatePetStatus(petId, deltaTime)
            this.updatePetAI(petId, playerPosition, deltaTime)
            // 펫 능력 사용
            this.usePetAbilities(petId, deltaTime)
        })
    }
}
