import { Scene, Sound } from '@babylonjs/core'

export interface SoundConfig {
    name: string
    url?: string
    volume?: number
    loop?: boolean
    autoplay?: boolean
}

export class SoundSystem {
    private scene: Scene
    private sounds: Map<string, Sound> = new Map()
    private backgroundMusic: Sound | null = null
    private soundEnabled: boolean = true
    private musicEnabled: boolean = true
    private masterVolume: number = 1.0
    private musicVolume: number = 0.7
    private sfxVolume: number = 1.0

    constructor(scene: Scene) {
        this.scene = scene
        this.loadDefaultSounds()
    }

    private loadDefaultSounds() {
        // 기본 효과음 로드 (Web Audio API로 간단한 톤 생성)
        
        // 채집 효과음
        this.loadSound('chop_wood', undefined, 0.6) // 나무 베기
        this.loadSound('mine_stone', undefined, 0.6) // 돌 깨기
        this.loadSound('pick_flower', undefined, 0.5) // 꽃 따기
        this.loadSound('gather_item', undefined, 0.5) // 일반 채집
        
        // 이동 효과음
        this.loadSound('footstep', undefined, 0.3) // 발소리 (반복 재생 필요)
        
        // UI 효과음
        this.loadSound('ui_click', undefined, 0.4) // 버튼 클릭
        this.loadSound('ui_open', undefined, 0.5) // 메뉴 열기
        this.loadSound('ui_close', undefined, 0.5) // 메뉴 닫기
        
        // 아이템 효과음
        this.loadSound('item_get', undefined, 0.6) // 아이템 획득
        this.loadSound('coin_get', undefined, 0.7) // 코인 획득
        
        // 배경음악은 시간대별로 로드됨 (시간 변화 시)
    }

    /**
     * 배경음악 로드 및 재생
     */
    public loadBackgroundMusic(name: string, url?: string, volume: number = 0.7, loop: boolean = true): void {
        if (this.backgroundMusic) {
            this.backgroundMusic.stop()
            this.backgroundMusic.dispose()
        }

        // 실제 파일이 없으면 빈 사운드 생성 (나중에 파일 추가 가능)
        const musicUrl = url || `data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=`
        
        this.backgroundMusic = new Sound(
            name,
            musicUrl,
            this.scene,
            () => {
                // 로드 완료
                if (this.backgroundMusic) {
                    this.backgroundMusic.setVolume(volume * this.masterVolume * this.musicVolume)
                    this.backgroundMusic.loop = loop
                    if (this.musicEnabled && !this.backgroundMusic.isPlaying) {
                        this.backgroundMusic.play()
                    }
                }
            },
            {
                loop: loop,
                autoplay: false,
                volume: volume * this.masterVolume * this.musicVolume
            }
        )
    }

    /**
     * 효과음 로드
     */
    public loadSound(name: string, url?: string, volume: number = 1.0): void {
        if (this.sounds.has(name)) {
            this.sounds.get(name)?.dispose()
        }

        // 실제 파일이 없으면 빈 사운드 생성 (나중에 파일 추가 가능)
        const soundUrl = url || `data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=`
        
        const sound = new Sound(
            name,
            soundUrl,
            this.scene,
            null,
            {
                loop: false,
                autoplay: false,
                volume: volume * this.masterVolume * this.sfxVolume
            }
        )

        this.sounds.set(name, sound)
    }

    /**
     * 효과음 재생
     */
    public playSound(name: string, volume?: number): void {
        if (!this.soundEnabled) return

        let sound = this.sounds.get(name)
        
        if (!sound) {
            // 사운드가 없으면 동적으로 로드 시도
            this.loadSound(name)
            sound = this.sounds.get(name)
        }

        if (sound) {
            if (volume !== undefined) {
                sound.setVolume(volume * this.masterVolume * this.sfxVolume)
            }
            sound.play()
        }
    }

    /**
     * 배경음악 재생
     */
    public playBackgroundMusic(): void {
        if (!this.musicEnabled || !this.backgroundMusic) return
        if (!this.backgroundMusic.isPlaying) {
            this.backgroundMusic.play()
        }
    }

    /**
     * 배경음악 정지
     */
    public stopBackgroundMusic(): void {
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.backgroundMusic.stop()
        }
    }

    /**
     * 사운드 정지
     */
    public stopSound(name: string): void {
        const sound = this.sounds.get(name)
        if (sound && sound.isPlaying) {
            sound.stop()
        }
    }

    /**
     * 모든 사운드 정지
     */
    public stopAllSounds(): void {
        this.sounds.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop()
            }
        })
    }

    /**
     * 마스터 볼륨 설정
     */
    public setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume))
        this.updateAllVolumes()
    }

    /**
     * 음악 볼륨 설정
     */
    public setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume))
        if (this.backgroundMusic) {
            this.backgroundMusic.setVolume(this.masterVolume * this.musicVolume * 0.7)
        }
    }

    /**
     * 효과음 볼륨 설정
     */
    public setSFXVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume))
        this.sounds.forEach(sound => {
            sound.setVolume(this.masterVolume * this.sfxVolume * sound.getVolume())
        })
    }

    /**
     * 모든 볼륨 업데이트
     */
    private updateAllVolumes(): void {
        if (this.backgroundMusic) {
            this.backgroundMusic.setVolume(this.masterVolume * this.musicVolume * 0.7)
        }
        this.sounds.forEach(sound => {
            sound.setVolume(this.masterVolume * this.sfxVolume)
        })
    }

    /**
     * 사운드 활성화/비활성화
     */
    public setSoundEnabled(enabled: boolean): void {
        this.soundEnabled = enabled
        if (!enabled) {
            this.stopAllSounds()
        }
    }

    /**
     * 음악 활성화/비활성화
     */
    public setMusicEnabled(enabled: boolean): void {
        this.musicEnabled = enabled
        if (enabled) {
            this.playBackgroundMusic()
        } else {
            this.stopBackgroundMusic()
        }
    }

    /**
     * 사운드 상태 가져오기
     */
    public getSoundEnabled(): boolean {
        return this.soundEnabled
    }

    /**
     * 음악 상태 가져오기
     */
    public getMusicEnabled(): boolean {
        return this.musicEnabled
    }

    /**
     * 볼륨 값 가져오기
     */
    public getMasterVolume(): number {
        return this.masterVolume
    }

    public getMusicVolume(): number {
        return this.musicVolume
    }

    public getSFXVolume(): number {
        return this.sfxVolume
    }

    /**
     * 정리
     */
    public dispose(): void {
        this.stopAllSounds()
        this.stopBackgroundMusic()
        
        this.sounds.forEach(sound => sound.dispose())
        this.sounds.clear()

        if (this.backgroundMusic) {
            this.backgroundMusic.dispose()
            this.backgroundMusic = null
        }
    }
}
