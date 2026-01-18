# Supabase 설정 가이드

이 게임은 Supabase를 사용하여 유저별 데이터 저장을 지원합니다.

## 📋 설정 단계

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속
2. "Start your project" 클릭
3. GitHub로 로그인 (또는 이메일)
4. 새 프로젝트 생성
   - 프로젝트 이름: `animal-life-game` (원하는 이름)
   - 데이터베이스 비밀번호 설정
   - 리전 선택 (가장 가까운 지역)

### 2. 데이터베이스 테이블 생성

Supabase 대시보드에서 SQL Editor로 이동하여 다음 SQL을 실행:

```sql
-- 게임 저장 데이터 테이블
CREATE TABLE game_saves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  save_data JSONB NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 읽고 쓸 수 있도록 정책 설정
CREATE POLICY "Users can read own saves"
  ON game_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saves"
  ON game_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saves"
  ON game_saves FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saves"
  ON game_saves FOR DELETE
  USING (auth.uid() = user_id);
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성 (없는 경우):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Supabase URL과 Anon Key 확인 방법:**
1. Supabase 대시보드 → Settings → API
2. `Project URL` → `VITE_SUPABASE_URL`에 복사
3. `anon public` 키 → `VITE_SUPABASE_ANON_KEY`에 복사

### 4. 인증 설정 (선택사항)

Supabase 대시보드 → Authentication → Providers에서 원하는 인증 방식 활성화:

- **Email**: 이메일/비밀번호 로그인
- **Google**: 구글 로그인 (OAuth 설정 필요)
- **Anonymous**: 익명 로그인 (빠른 시작)

### 5. 게임 실행

설정이 완료되면 게임을 실행하면 Supabase가 자동으로 연동됩니다.

```bash
npm run dev
```

## 🔐 작동 방식

### 하이브리드 저장 방식

1. **localStorage**: 항상 저장 (오프라인 백업)
   - 빠른 로딩
   - 오프라인 플레이 지원

2. **Supabase**: 로그인된 경우에만 저장
   - 모든 기기에서 동일한 데이터
   - 클라우드 백업
   - 데이터 안전성

### 저장 우선순위

1. 게임 시작 시: localStorage에서 먼저 로드 (빠른 시작)
2. Supabase 로드 완료 시: 더 최신 데이터가 있으면 동기화
3. 저장 시: localStorage와 Supabase 둘 다 저장

## 📝 참고사항

- **Supabase 설정 없이도 게임은 작동합니다** (localStorage만 사용)
- Supabase를 사용하려면 `.env` 파일에 설정값을 추가해야 합니다
- `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다
