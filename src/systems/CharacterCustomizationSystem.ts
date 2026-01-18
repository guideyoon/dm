import { Scene, Mesh, StandardMaterial, Color3, MeshBuilder } from '@babylonjs/core'

export type ClothingCategory = 'top' | 'bottom' | 'dress' | 'shoes' | 'hat' | 'hair'

export type ClothingRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface ClothingItem {
    id: string
    name: string
    category: ClothingCategory
    rarity: ClothingRarity
    price: number
    color?: Color3
    colors?: Color3[] // 색상 변형
    pattern?: 'solid' | 'striped' | 'checked' | 'dotted' | 'floral'
    unlockCondition?: {
        type: 'shop' | 'craft' | 'quest' | 'event'
        requirement: string
    }
}

export interface EquippedOutfit {
    top?: string
    bottom?: string
    dress?: string
    shoes?: string
    hat?: string
    hair?: string
}

export class CharacterCustomizationSystem {
    private scene: Scene
    private playerMesh: Mesh
    private wardrobe: Map<string, ClothingItem> = new Map()
    private equippedOutfit: EquippedOutfit = {}
    
    // 캐릭터 부위 메시 참조
    private bodyMesh: Mesh | null = null
    private leftLegMesh: Mesh | null = null
    private rightLegMesh: Mesh | null = null
    private leftArmMesh: Mesh | null = null
    private rightArmMesh: Mesh | null = null
    private hairMeshes: Mesh[] = []
    
    // 의상 메시 저장 (착용 중인 의상)
    private equippedClothingMeshes: Map<string, Mesh[]> = new Map()

    constructor(scene: Scene, playerMesh: Mesh) {
        this.scene = scene
        this.playerMesh = playerMesh
        this.initializeCharacterParts()
        this.initializeDefaultClothing()
    }

    private initializeCharacterParts() {
        // 캐릭터 부위 찾기
        this.bodyMesh = this.scene.getMeshByName('body') as Mesh
        this.leftLegMesh = this.scene.getMeshByName('leftLeg') as Mesh
        this.rightLegMesh = this.scene.getMeshByName('rightLeg') as Mesh
        this.leftArmMesh = this.scene.getMeshByName('leftArm') as Mesh
        this.rightArmMesh = this.scene.getMeshByName('rightArm') as Mesh
        
        // 헤어 메시 찾기
        const hairTop = this.scene.getMeshByName('hairTop')
        const hairBack = this.scene.getMeshByName('hairBack')
        const hairLeft = this.scene.getMeshByName('hairLeft')
        const hairRight = this.scene.getMeshByName('hairRight')
        
        if (hairTop) this.hairMeshes.push(hairTop as Mesh)
        if (hairBack) this.hairMeshes.push(hairBack as Mesh)
        if (hairLeft) this.hairMeshes.push(hairLeft as Mesh)
        if (hairRight) this.hairMeshes.push(hairRight as Mesh)
    }

    private initializeDefaultClothing() {
        // 기본 상의
        this.addClothingToWardrobe({
            id: 'top_basic_tshirt_white',
            name: '기본 흰색 티셔츠',
            category: 'top',
            rarity: 'common',
            price: 0, // 기본 의상은 무료
            color: new Color3(1, 1, 1)
        })

        this.addClothingToWardrobe({
            id: 'top_basic_tshirt_blue',
            name: '기본 파란색 티셔츠',
            category: 'top',
            rarity: 'common',
            price: 300,
            color: new Color3(0.2, 0.5, 0.9)
        })

        this.addClothingToWardrobe({
            id: 'top_basic_tshirt_red',
            name: '기본 빨간색 티셔츠',
            category: 'top',
            rarity: 'common',
            price: 300,
            color: new Color3(0.9, 0.2, 0.2)
        })

        this.addClothingToWardrobe({
            id: 'top_basic_tshirt_green',
            name: '기본 초록색 티셔츠',
            category: 'top',
            rarity: 'common',
            price: 300,
            color: new Color3(0.2, 0.9, 0.2)
        })

        this.addClothingToWardrobe({
            id: 'top_basic_tshirt_yellow',
            name: '기본 노란색 티셔츠',
            category: 'top',
            rarity: 'common',
            price: 300,
            color: new Color3(1, 1, 0.2)
        })

        // 기본 하의
        this.addClothingToWardrobe({
            id: 'bottom_basic_pants_blue',
            name: '기본 파란색 바지',
            category: 'bottom',
            rarity: 'common',
            price: 0, // 기본 의상은 무료
            color: new Color3(0.2, 0.2, 0.3)
        })

        this.addClothingToWardrobe({
            id: 'bottom_basic_pants_black',
            name: '기본 검은색 바지',
            category: 'bottom',
            rarity: 'common',
            price: 400,
            color: new Color3(0.1, 0.1, 0.1)
        })

        this.addClothingToWardrobe({
            id: 'bottom_basic_pants_brown',
            name: '기본 갈색 바지',
            category: 'bottom',
            rarity: 'common',
            price: 400,
            color: new Color3(0.4, 0.2, 0.1)
        })

        // 기본 신발
        this.addClothingToWardrobe({
            id: 'shoes_basic_sneakers_white',
            name: '기본 흰색 운동화',
            category: 'shoes',
            rarity: 'common',
            price: 0, // 기본 의상은 무료
            color: new Color3(0.9, 0.9, 0.9)
        })

        this.addClothingToWardrobe({
            id: 'shoes_basic_sneakers_black',
            name: '기본 검은색 운동화',
            category: 'shoes',
            rarity: 'common',
            price: 500,
            color: new Color3(0.2, 0.2, 0.2)
        })

        this.addClothingToWardrobe({
            id: 'shoes_basic_boots_brown',
            name: '기본 갈색 부츠',
            category: 'shoes',
            rarity: 'common',
            price: 600,
            color: new Color3(0.5, 0.3, 0.1)
        })

        // 기본 헤어스타일
        this.addClothingToWardrobe({
            id: 'hair_short_black',
            name: '짧은 검은 머리',
            category: 'hair',
            rarity: 'common',
            price: 0, // 기본 헤어는 무료
            color: new Color3(0.2, 0.1, 0.05)
        })

        this.addClothingToWardrobe({
            id: 'hair_short_brown',
            name: '짧은 갈색 머리',
            category: 'hair',
            rarity: 'common',
            price: 800,
            color: new Color3(0.4, 0.2, 0.1)
        })

        this.addClothingToWardrobe({
            id: 'hair_short_blonde',
            name: '짧은 금발',
            category: 'hair',
            rarity: 'common',
            price: 800,
            color: new Color3(0.9, 0.7, 0.3)
        })

        // 기본 상의는 자동 착용
        this.equipClothing('top_basic_tshirt_white')
        this.equipClothing('bottom_basic_pants_blue')
        this.equipClothing('shoes_basic_sneakers_white')
        this.equipClothing('hair_short_black')
    }

    addClothingToWardrobe(clothing: ClothingItem) {
        this.wardrobe.set(clothing.id, clothing)
    }

    getClothing(id: string): ClothingItem | undefined {
        return this.wardrobe.get(id)
    }

    getAllClothing(): ClothingItem[] {
        return Array.from(this.wardrobe.values())
    }

    getClothingByCategory(category: ClothingCategory): ClothingItem[] {
        return this.getAllClothing().filter(item => item.category === category)
    }

    hasClothing(id: string): boolean {
        return this.wardrobe.has(id)
    }

    equipClothing(id: string): boolean {
        const clothing = this.wardrobe.get(id)
        if (!clothing) {
            console.warn('의상을 찾을 수 없습니다:', id)
            return false
        }

        // 기존 착용 중인 같은 카테고리 의상 해제
        this.unequipCategory(clothing.category)

        // 의상 착용 처리
        switch (clothing.category) {
            case 'top':
                this.equippedOutfit.top = id
                this.applyTopMaterial(clothing)
                break
            case 'bottom':
                this.equippedOutfit.bottom = id
                this.applyBottomMaterial(clothing)
                break
            case 'shoes':
                this.equippedOutfit.shoes = id
                // 신발은 현재 다리 메시의 색상으로 표현 (나중에 별도 메시로 확장 가능)
                break
            case 'hair':
                this.equippedOutfit.hair = id
                this.applyHairMaterial(clothing)
                break
        }

        console.log('의상 착용:', clothing.name)
        return true
    }

    unequipClothing(id: string): boolean {
        const clothing = this.wardrobe.get(id)
        if (!clothing) return false

        // 착용 해제
        switch (clothing.category) {
            case 'top':
                if (this.equippedOutfit.top === id) {
                    delete this.equippedOutfit.top
                    this.applyTopMaterial(null) // 기본 재질로 복원
                }
                break
            case 'bottom':
                if (this.equippedOutfit.bottom === id) {
                    delete this.equippedOutfit.bottom
                    this.applyBottomMaterial(null) // 기본 재질로 복원
                }
                break
            case 'shoes':
                if (this.equippedOutfit.shoes === id) {
                    delete this.equippedOutfit.shoes
                }
                break
            case 'hair':
                if (this.equippedOutfit.hair === id) {
                    delete this.equippedOutfit.hair
                    this.applyHairMaterial(null) // 기본 재질로 복원
                }
                break
        }

        return true
    }

    unequipCategory(category: ClothingCategory) {
        switch (category) {
            case 'top':
                if (this.equippedOutfit.top) {
                    const clothing = this.wardrobe.get(this.equippedOutfit.top)
                    if (clothing) {
                        this.applyTopMaterial(null)
                    }
                    delete this.equippedOutfit.top
                }
                break
            case 'bottom':
                if (this.equippedOutfit.bottom) {
                    const clothing = this.wardrobe.get(this.equippedOutfit.bottom)
                    if (clothing) {
                        this.applyBottomMaterial(null)
                    }
                    delete this.equippedOutfit.bottom
                }
                break
            case 'shoes':
                if (this.equippedOutfit.shoes) {
                    delete this.equippedOutfit.shoes
                }
                break
            case 'hair':
                if (this.equippedOutfit.hair) {
                    const clothing = this.wardrobe.get(this.equippedOutfit.hair)
                    if (clothing) {
                        this.applyHairMaterial(null)
                    }
                    delete this.equippedOutfit.hair
                }
                break
        }
    }

    private applyTopMaterial(clothing: ClothingItem | null) {
        if (!this.bodyMesh) return

        if (clothing && clothing.color) {
            const material = new StandardMaterial(`topMat_${clothing.id}`, this.scene)
            material.diffuseColor = clothing.color
            this.bodyMesh.material = material
        } else {
            // 기본 재질 복원
            const defaultMat = new StandardMaterial('clothesMat', this.scene)
            defaultMat.diffuseColor = new Color3(0.2, 0.5, 0.9)
            this.bodyMesh.material = defaultMat
        }
    }

    private applyBottomMaterial(clothing: ClothingItem | null) {
        if (!this.leftLegMesh || !this.rightLegMesh) return

        if (clothing && clothing.color) {
            const material = new StandardMaterial(`bottomMat_${clothing.id}`, this.scene)
            material.diffuseColor = clothing.color

            // 왼쪽 다리 메시가 있으면 복제 사용
            const leftLegMaterial = material.clone(`bottomMat_${clothing.id}_left`)
            const rightLegMaterial = material.clone(`bottomMat_${clothing.id}_right`)
            
            this.leftLegMesh.material = leftLegMaterial
            this.rightLegMesh.material = rightLegMaterial
        } else {
            // 기본 재질 복원
            const defaultMat = new StandardMaterial('pantsMat', this.scene)
            defaultMat.diffuseColor = new Color3(0.2, 0.2, 0.3)

            const leftLegMat = defaultMat.clone('pantsMat_left')
            const rightLegMat = defaultMat.clone('pantsMat_right')
            
            this.leftLegMesh.material = leftLegMat
            this.rightLegMesh.material = rightLegMat
        }
    }

    private applyHairMaterial(clothing: ClothingItem | null) {
        if (!clothing) {
            // 기본 재질 복원
            const defaultMat = new StandardMaterial('hairMat', this.scene)
            defaultMat.diffuseColor = new Color3(0.3, 0.2, 0.1)
            this.hairMeshes.forEach(hair => {
                hair.material = defaultMat.clone(`hairMat_${hair.name}`)
            })
            return
        }

        if (clothing.color) {
            this.hairMeshes.forEach((hair, index) => {
                const material = new StandardMaterial(`hairMat_${clothing.id}_${index}`, this.scene)
                material.diffuseColor = clothing.color!
                hair.material = material
            })
        }
    }

    getEquippedOutfit(): EquippedOutfit {
        return { ...this.equippedOutfit }
    }

    isEquipped(id: string): boolean {
        return Object.values(this.equippedOutfit).includes(id)
    }

    getEquippedClothing(category: ClothingCategory): string | undefined {
        switch (category) {
            case 'top': return this.equippedOutfit.top
            case 'bottom': return this.equippedOutfit.bottom
            case 'dress': return this.equippedOutfit.dress
            case 'shoes': return this.equippedOutfit.shoes
            case 'hat': return this.equippedOutfit.hat
            case 'hair': return this.equippedOutfit.hair
            default: return undefined
        }
    }
}
