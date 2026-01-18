import { supabase, isSupabaseEnabled } from '../config/supabase'

export interface AuthUser {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    avatar_url?: string
  }
}

export interface AuthError {
  message: string
  code?: string
}

export class AuthSystem {
  private currentUser: AuthUser | null = null
  private authStateListeners: Array<(user: AuthUser | null) => void> = []

  constructor() {
    this.initializeAuth()
  }

  /**
   * 인증 시스템 초기화
   */
  private async initializeAuth() {
    if (!isSupabaseEnabled()) {
      console.warn('Supabase가 설정되지 않았습니다. 로컬 모드로 실행됩니다.')
      return
    }

    if (!supabase) {
      console.warn('Supabase 클라이언트를 사용할 수 없습니다.')
      return
    }

    // 현재 세션 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      this.currentUser = {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata
      }
      this.notifyAuthStateChange()
    }

    // 인증 상태 변경 리스너
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.currentUser = {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata
        }
      } else {
        this.currentUser = null
      }
      this.notifyAuthStateChange()
    })
  }

  /**
   * 회원가입 (이메일/비밀번호)
   */
  async signUp(email: string, password: string, displayName?: string): Promise<{ success: boolean; error?: AuthError; user?: AuthUser }> {
    if (!isSupabaseEnabled() || !supabase) {
      return {
        success: false,
        error: { message: 'Supabase가 설정되지 않았습니다.' }
      }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      })

      if (error) {
        return {
          success: false,
          error: {
            message: this.getErrorMessage(error.message),
            code: error.status?.toString()
          }
        }
      }

      if (data.user) {
        this.currentUser = {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata
        }
        this.notifyAuthStateChange()

        return {
          success: true,
          user: this.currentUser
        }
      }

      return {
        success: false,
        error: { message: '회원가입에 실패했습니다.' }
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || '회원가입 중 오류가 발생했습니다.'
        }
      }
    }
  }

  /**
   * 로그인 (이메일/비밀번호)
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: AuthError; user?: AuthUser }> {
    if (!isSupabaseEnabled() || !supabase) {
      return {
        success: false,
        error: { message: 'Supabase가 설정되지 않았습니다.' }
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return {
          success: false,
          error: {
            message: this.getErrorMessage(error.message),
            code: error.status?.toString()
          }
        }
      }

      if (data.user) {
        this.currentUser = {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata
        }
        this.notifyAuthStateChange()

        return {
          success: true,
          user: this.currentUser
        }
      }

      return {
        success: false,
        error: { message: '로그인에 실패했습니다.' }
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || '로그인 중 오류가 발생했습니다.'
        }
      }
    }
  }

  /**
   * 로그아웃
   */
  async signOut(): Promise<{ success: boolean; error?: AuthError }> {
    if (!isSupabaseEnabled() || !supabase) {
      return {
        success: false,
        error: { message: 'Supabase가 설정되지 않았습니다.' }
      }
    }

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: {
            message: this.getErrorMessage(error.message)
          }
        }
      }

      this.currentUser = null
      this.notifyAuthStateChange()

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || '로그아웃 중 오류가 발생했습니다.'
        }
      }
    }
  }

  /**
   * 현재 사용자 정보 가져오기
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  /**
   * 로그인 상태 확인
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  /**
   * 익명 로그인 (빠른 시작)
   */
  async signInAnonymously(): Promise<{ success: boolean; error?: AuthError; user?: AuthUser }> {
    if (!isSupabaseEnabled() || !supabase) {
      // Supabase가 없으면 로컬 모드로 진행
      this.currentUser = {
        id: `local_${Date.now()}`,
        user_metadata: {
          name: '게스트'
        }
      }
      this.notifyAuthStateChange()
      return {
        success: true,
        user: this.currentUser
      }
    }

    try {
      const { data, error } = await supabase.auth.signInAnonymously()

      if (error) {
        return {
          success: false,
          error: {
            message: this.getErrorMessage(error.message)
          }
        }
      }

      if (data.user) {
        this.currentUser = {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata
        }
        this.notifyAuthStateChange()

        return {
          success: true,
          user: this.currentUser
        }
      }

      return {
        success: false,
        error: { message: '익명 로그인에 실패했습니다.' }
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || '익명 로그인 중 오류가 발생했습니다.'
        }
      }
    }
  }

  /**
   * 비밀번호 재설정 이메일 전송
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: AuthError }> {
    if (!isSupabaseEnabled() || !supabase) {
      return {
        success: false,
        error: { message: 'Supabase가 설정되지 않았습니다.' }
      }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return {
          success: false,
          error: {
            message: this.getErrorMessage(error.message)
          }
        }
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || '비밀번호 재설정 이메일 전송 중 오류가 발생했습니다.'
        }
      }
    }
  }

  /**
   * 인증 상태 변경 리스너 추가
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback)
    
    // 즉시 현재 상태 전달
    callback(this.currentUser)

    // 리스너 제거 함수 반환
    return () => {
      const index = this.authStateListeners.indexOf(callback)
      if (index > -1) {
        this.authStateListeners.splice(index, 1)
      }
    }
  }

  /**
   * 인증 상태 변경 알림
   */
  private notifyAuthStateChange() {
    this.authStateListeners.forEach(callback => {
      callback(this.currentUser)
    })
  }

  /**
   * 에러 메시지 한글화
   */
  private getErrorMessage(errorMessage: string): string {
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
      'Email not confirmed': '이메일 인증이 완료되지 않았습니다.',
      'User already registered': '이미 등록된 이메일입니다.',
      'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
      'Signup is disabled': '회원가입이 비활성화되어 있습니다.',
      'Email rate limit exceeded': '이메일 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
    }

    // 정확한 매칭 시도
    if (errorMap[errorMessage]) {
      return errorMap[errorMessage]
    }

    // 부분 매칭 시도
    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.includes(key)) {
        return value
      }
    }

    return errorMessage
  }
}
