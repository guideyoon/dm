import { Scene, Mesh, StandardMaterial, Color3, MeshBuilder, Vector3 } from '@babylonjs/core'

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
    private leftFootMesh: Mesh | null = null
    private rightFootMesh: Mesh | null = null
    private hairMeshes: Mesh[] = []
    
    // 의상 메시 저장 (착용 중인 의상)
    private equippedClothingMeshes: Map<string, Mesh[]> = new Map()
    
    // 신발 메시 저장 (동적으로 생성된 신발)
    private shoeMeshes: Mesh[] = []

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
        this.leftFootMesh = this.scene.getMeshByName('leftFoot') as Mesh
        this.rightFootMesh = this.scene.getMeshByName('rightFoot') as Mesh
        
        // 발 메시가 없으면 다리 메시 하단에 신발 메시를 동적으로 생성
        if (!this.leftFootMesh && this.leftLegMesh) {
            this.createShoeMesh('leftShoe', this.leftLegMesh)
        }
        if (!this.rightFootMesh && this.rightLegMesh) {
            this.createShoeMesh('rightShoe', this.rightLegMesh)
        }
        
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
    
    private createShoeMesh(name: string, legMesh: Mesh) {
        // 다리 메시의 하단 부분에 신발 메시 생성
        // 앞부분이 튀어나오도록 depth를 약간 늘림
        const shoe = MeshBuilder.CreateBox(name, { width: 0.22, height: 0.15, depth: 0.3 }, this.scene)
        // 신발을 다리 메시의 자식으로 설정하여 다리와 함께 움직이도록 함
        shoe.parent = legMesh
        
        // 다리 메시의 하단 부분에 위치 (다리 높이 0.6의 절반인 0.3 아래)
        // 다리 메시의 로컬 좌표계에서 하단에 배치
        // 신발이 바닥에 빠지지 않도록 y 위치를 더 올림
        // 신발 높이 0.15의 절반인 0.075를 더하고, 추가로 약간 더 올려서 바닥 위에 확실히 표시
        // 앞부분이 튀어나오도록 z축으로 약간 앞으로 이동
        shoe.position = new Vector3(0, -0.3 + 0.1, 0.025) // 다리 하단(-0.3)에서 신발 높이의 절반보다 조금 더 올림, 앞으로 약간 이동
        
        // 기본 신발 재질
        const defaultShoeMat = new StandardMaterial(`${name}Mat`, this.scene)
        defaultShoeMat.diffuseColor = new Color3(0.9, 0.9, 0.9) // 기본 흰색
        shoe.material = defaultShoeMat
        
        this.shoeMeshes.push(shoe)
        
        // 왼쪽/오른쪽 구분
        if (name === 'leftShoe') {
            this.leftFootMesh = shoe
        } else if (name === 'rightShoe') {
            this.rightFootMesh = shoe
        }
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
                this.applyShoesMaterial(clothing)
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
                    this.applyShoesMaterial(null) // 기본 재질로 복원
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
                    const clothing = this.wardrobe.get(this.equippedOutfit.shoes)
                    if (clothing) {
                        this.applyShoesMaterial(null)
                    }
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

    private applyShoesMaterial(clothing: ClothingItem | null) {
        // 신발 메시가 없으면 생성
        if (this.shoeMeshes.length === 0) {
            if (this.leftLegMesh && !this.leftFootMesh) {
                this.createShoeMesh('leftShoe', this.leftLegMesh)
            }
            if (this.rightLegMesh && !this.rightFootMesh) {
                this.createShoeMesh('rightShoe', this.rightLegMesh)
            }
        }
        
        const targetMeshes: Mesh[] = []
        
        if (this.leftFootMesh) {
            targetMeshes.push(this.leftFootMesh)
        }
        
        if (this.rightFootMesh) {
            targetMeshes.push(this.rightFootMesh)
        }

        if (targetMeshes.length === 0) return

        if (clothing && clothing.color) {
            targetMeshes.forEach((mesh, index) => {
                const material = new StandardMaterial(`shoesMat_${clothing.id}_${index}`, this.scene)
                material.diffuseColor = clothing.color!
                mesh.material = material
            })
        } else {
            // 기본 재질 복원 (기본 흰색 신발)
            const defaultMat = new StandardMaterial('shoesMat', this.scene)
            defaultMat.diffuseColor = new Color3(0.9, 0.9, 0.9) // 기본 흰색 신발
            targetMeshes.forEach((mesh, index) => {
                mesh.material = defaultMat.clone(`shoesMat_${index}`)
            })
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
