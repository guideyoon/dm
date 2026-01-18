import { NodeCategory } from './GatheringNode'

export interface SkillLevel {
    category: NodeCategory
    level: number
    xp: number
    xpToNext: number
}

export class SkillSystem {
    private skills: Map<NodeCategory, SkillLevel> = new Map()
    private maxLevel: number = 20

    constructor() {
        // 모든 카테고리 초기화
        const categories: NodeCategory[] = ['plant', 'wood', 'mineral', 'beach', 'special']
        categories.forEach(category => {
            this.skills.set(category, {
                category,
                level: 1,
                xp: 0,
                xpToNext: this.calculateXPToNext(1)
            })
        })
    }

    public addXP(category: NodeCategory, xp: number): { leveledUp: boolean; newLevel?: number } {
        const skill = this.skills.get(category)
        if (!skill) {
            // 카테고리 없으면 생성
            this.skills.set(category, {
                category,
                level: 1,
                xp: 0,
                xpToNext: this.calculateXPToNext(1)
            })
            return { leveledUp: false }
        }

        let leveledUp = false
        let newLevel = skill.level

        skill.xp += xp

        // 레벨업 체크
        while (skill.xp >= skill.xpToNext && skill.level < this.maxLevel) {
            skill.xp -= skill.xpToNext
            skill.level++
            skill.xpToNext = this.calculateXPToNext(skill.level)
            leveledUp = true
            newLevel = skill.level
        }

        return { leveledUp, newLevel: leveledUp ? newLevel : undefined }
    }

    private calculateXPToNext(level: number): number {
        // 레벨에 따라 필요한 XP 증가 (예: 100 * level)
        return 100 * level
    }

    public getSkill(category: NodeCategory): SkillLevel | undefined {
        return this.skills.get(category)
    }

    public getLevel(category: NodeCategory): number {
        return this.skills.get(category)?.level || 1
    }

    // 숙련도 효과 계산
    public getGatherTimeReduction(category: NodeCategory): number {
        const level = this.getLevel(category)
        // 최대 20% 시간 단축 (레벨당 1%)
        return Math.min(level * 0.01, 0.2)
    }

    public getBonusDropChance(category: NodeCategory): number {
        const level = this.getLevel(category)
        // 최대 10% 보너스 드랍 확률 증가 (레벨당 0.5%)
        return Math.min(level * 0.005, 0.1)
    }

    public getDurabilityReduction(category: NodeCategory): number {
        const level = this.getLevel(category)
        // 최대 15% 내구도 소모 감소 (레벨당 0.75%)
        return Math.min(level * 0.0075, 0.15)
    }

    public getAllSkills(): SkillLevel[] {
        return Array.from(this.skills.values())
    }
}
