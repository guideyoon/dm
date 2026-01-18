import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase 설정
// 프로젝트 설정 후 .env 파일에 추가하세요:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Supabase 클라이언트 생성
export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Supabase 사용 가능 여부 확인
export const isSupabaseEnabled = (): boolean => {
  return supabase !== null && supabaseUrl !== '' && supabaseAnonKey !== ''
}
