import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, Mesh, ParticleSystem, Texture } from '@babylonjs/core'

export class ParticleEffects {
  private scene: Scene

  constructor(scene: Scene) {
    this.scene = scene
  }

  /**
   * 아이템 획득 파티클 효과
   */
  createItemGetEffect(position: Vector3, color: Color3 = new Color3(1, 1, 0)): void {
    const particleSystem = new ParticleSystem('itemGetParticles', 50, this.scene)
    
    // 파티클 생성 위치
    const emitter = MeshBuilder.CreateBox('emitter', { size: 0.1 }, this.scene)
    emitter.position = position.clone()
    emitter.isVisible = false
    
    particleSystem.emitter = emitter
    particleSystem.particleTexture = this.createParticleTexture(color)
    
    // 파티클 속성
    particleSystem.minEmitBox = new Vector3(-0.1, 0, -0.1)
    particleSystem.maxEmitBox = new Vector3(0.1, 0.5, 0.1)
    
    particleSystem.color1 = color.toColor4()
    particleSystem.color2 = new Color3(color.r * 0.8, color.g * 0.8, color.b * 0.8).toColor4()
    particleSystem.colorDead = new Color3(0, 0, 0).toColor4()
    
    particleSystem.minSize = 0.1
    particleSystem.maxSize = 0.3
    
    particleSystem.minLifeTime = 0.5
    particleSystem.maxLifeTime = 1.0
    
    particleSystem.emitRate = 100
    
    particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE
    
    particleSystem.gravity = new Vector3(0, -5, 0)
    
    particleSystem.direction1 = new Vector3(-1, 2, -1)
    particleSystem.direction2 = new Vector3(1, 3, 1)
    
    particleSystem.minAngularSpeed = 0
    particleSystem.maxAngularSpeed = Math.PI
    
    particleSystem.minEmitPower = 1
    particleSystem.maxEmitPower = 3
    
    particleSystem.updateSpeed = 0.02
    
    // 파티클 시작
    particleSystem.start()
    
    // 1초 후 정리
    setTimeout(() => {
      particleSystem.dispose()
      emitter.dispose()
    }, 1000)
  }

  /**
   * 코인 획득 파티클 효과
   */
  createCoinGetEffect(position: Vector3): void {
    this.createItemGetEffect(position, new Color3(1, 0.84, 0)) // 금색
  }

  /**
   * 성취 달성 파티클 효과
   */
  createAchievementEffect(position: Vector3): void {
    const particleSystem = new ParticleSystem('achievementParticles', 200, this.scene)
    
    const emitter = MeshBuilder.CreateSphere('emitter', { diameter: 0.1 }, this.scene)
    emitter.position = position.clone()
    emitter.isVisible = false
    
    particleSystem.emitter = emitter
    particleSystem.particleTexture = this.createParticleTexture(new Color3(1, 0.5, 0))
    
    particleSystem.minEmitBox = new Vector3(-0.5, -0.5, -0.5)
    particleSystem.maxEmitBox = new Vector3(0.5, 0.5, 0.5)
    
    particleSystem.color1 = new Color3(1, 1, 0).toColor4()
    particleSystem.color2 = new Color3(1, 0.5, 0).toColor4()
    particleSystem.colorDead = new Color3(0, 0, 0).toColor4()
    
    particleSystem.minSize = 0.2
    particleSystem.maxSize = 0.5
    
    particleSystem.minLifeTime = 1.0
    particleSystem.maxLifeTime = 2.0
    
    particleSystem.emitRate = 200
    
    particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE
    
    particleSystem.gravity = new Vector3(0, -2, 0)
    
    particleSystem.direction1 = new Vector3(-2, 2, -2)
    particleSystem.direction2 = new Vector3(2, 4, 2)
    
    particleSystem.minAngularSpeed = 0
    particleSystem.maxAngularSpeed = Math.PI * 2
    
    particleSystem.minEmitPower = 2
    particleSystem.maxEmitPower = 5
    
    particleSystem.updateSpeed = 0.02
    
    particleSystem.start()
    
    setTimeout(() => {
      particleSystem.dispose()
      emitter.dispose()
    }, 2000)
  }

  /**
   * 하트 효과 (친밀도 증가 등)
   */
  createHeartEffect(position: Vector3): void {
    const particleSystem = new ParticleSystem('heartParticles', 30, this.scene)
    
    const emitter = MeshBuilder.CreateBox('emitter', { size: 0.1 }, this.scene)
    emitter.position = position.clone()
    emitter.isVisible = false
    
    particleSystem.emitter = emitter
    particleSystem.particleTexture = this.createParticleTexture(new Color3(1, 0.2, 0.5))
    
    particleSystem.minEmitBox = new Vector3(-0.1, 0, -0.1)
    particleSystem.maxEmitBox = new Vector3(0.1, 0.3, 0.1)
    
    particleSystem.color1 = new Color3(1, 0.2, 0.5).toColor4()
    particleSystem.color2 = new Color3(1, 0.5, 0.7).toColor4()
    particleSystem.colorDead = new Color3(0, 0, 0).toColor4()
    
    particleSystem.minSize = 0.15
    particleSystem.maxSize = 0.3
    
    particleSystem.minLifeTime = 1.0
    particleSystem.maxLifeTime = 1.5
    
    particleSystem.emitRate = 30
    
    particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE
    
    particleSystem.gravity = new Vector3(0, 2, 0) // 위로 올라감
    
    particleSystem.direction1 = new Vector3(-0.5, 2, -0.5)
    particleSystem.direction2 = new Vector3(0.5, 3, 0.5)
    
    particleSystem.minAngularSpeed = 0
    particleSystem.maxAngularSpeed = Math.PI
    
    particleSystem.minEmitPower = 1
    particleSystem.maxEmitPower = 2
    
    particleSystem.updateSpeed = 0.02
    
    particleSystem.start()
    
    setTimeout(() => {
      particleSystem.dispose()
      emitter.dispose()
    }, 1500)
  }

  /**
   * 별 효과 (레벨업, 특별 이벤트)
   */
  createStarEffect(position: Vector3): void {
    const particleSystem = new ParticleSystem('starParticles', 100, this.scene)
    
    const emitter = MeshBuilder.CreateSphere('emitter', { diameter: 0.1 }, this.scene)
    emitter.position = position.clone()
    emitter.isVisible = false
    
    particleSystem.emitter = emitter
    particleSystem.particleTexture = this.createParticleTexture(new Color3(1, 1, 0))
    
    particleSystem.minEmitBox = new Vector3(-0.3, -0.3, -0.3)
    particleSystem.maxEmitBox = new Vector3(0.3, 0.3, 0.3)
    
    particleSystem.color1 = new Color3(1, 1, 0).toColor4()
    particleSystem.color2 = new Color3(1, 0.8, 0).toColor4()
    particleSystem.colorDead = new Color3(0, 0, 0).toColor4()
    
    particleSystem.minSize = 0.1
    particleSystem.maxSize = 0.4
    
    particleSystem.minLifeTime = 0.8
    particleSystem.maxLifeTime = 1.5
    
    particleSystem.emitRate = 100
    
    particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE
    
    particleSystem.gravity = new Vector3(0, -1, 0)
    
    particleSystem.direction1 = new Vector3(-2, 1, -2)
    particleSystem.direction2 = new Vector3(2, 3, 2)
    
    particleSystem.minAngularSpeed = 0
    particleSystem.maxAngularSpeed = Math.PI * 2
    
    particleSystem.minEmitPower = 1
    particleSystem.maxEmitPower = 4
    
    particleSystem.updateSpeed = 0.02
    
    particleSystem.start()
    
    setTimeout(() => {
      particleSystem.dispose()
      emitter.dispose()
    }, 1500)
  }

  /**
   * 간단한 파티클 텍스처 생성 (색상 기반)
   */
  private createParticleTexture(color: Color3): Texture | null {
    // 기본 파티클 텍스처는 Babylon.js 내장 사용
    // 실제로는 별도 텍스처 이미지를 사용하는 것이 좋지만, 
    // 여기서는 기본 파티클 시스템 사용
    return null // null이면 기본 파티클 텍스처 사용
  }
}
