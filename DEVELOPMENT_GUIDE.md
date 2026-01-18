# 개발 가이드

## 📚 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [시작하기](#시작하기)
3. [프로젝트 구조](#프로젝트-구조)
4. [주요 시스템](#주요-시스템)
5. [개발 가이드라인](#개발-가이드라인)
6. [API 문서](#api-문서)

## 프로젝트 개요

이 프로젝트는 **동물의 숲(Animal Crossing)** 스타일의 웹 기반 3D 게임입니다. Babylon.js를 사용하여 구현되었으며, TypeScript로 작성되었습니다.

### 기술 스택

- **게임 엔진**: Babylon.js
- **언어**: TypeScript
- **빌드 도구**: Vite
- **저장소**: Supabase (PostgreSQL)
- **인증**: Supabase Auth

## 시작하기

### 필수 요구사항

- Node.js 16 이상
- npm 또는 yarn

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`이 자동으로 열립니다.

### 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

## 프로젝트 구조

```
dm/
├── src/
│   ├── main.ts                    # 게임 진입점
│   ├── PlayerController.ts        # 플레이어 컨트롤러
│   ├── InventoryManager.ts        # 인벤토리 관리
│   ├── CraftingSystem.ts          # 제작 시스템
│   ├── Recipe.ts                  # 제작 레시피
│   ├── gathering/                 # 채집 시스템
│   │   ├── GatheringSystem.ts
│   │   ├── GatheringNode.ts
│   │   ├── GatheringNodeManager.ts
│   │   ├── DropTable.ts
│   │   └── BonusGame.ts
│   ├── systems/                   # 게임 시스템
│   │   ├── TimeSystem.ts          # 시간 시스템
│   │   ├── WeatherSystem.ts       # 날씨 시스템
│   │   ├── SaveSystem.ts          # 저장 시스템
│   │   ├── ShopSystem.ts          # 상점 시스템
│   │   ├── CodexSystem.ts         # 도감 시스템
│   │   ├── MissionSystem.ts       # 미션 시스템
│   │   ├── MuseumSystem.ts        # 박물관 시스템
│   │   ├── BuildingSystem.ts      # 건물 시스템
│   │   ├── DecorationSystem.ts    # 꾸미기 시스템
│   │   ├── FarmingSystem.ts       # 농장 시스템
│   │   ├── FishingSystem.ts       # 낚시 시스템
│   │   ├── BugCatchingSystem.ts   # 곤충 채집 시스템
│   │   ├── NPCSystem.ts           # NPC 시스템
│   │   ├── PetSystem.ts           # 펫 시스템
│   │   ├── EventSystem.ts         # 이벤트 시스템
│   │   ├── CurrencySystem.ts      # 통화 시스템
│   │   ├── CharacterCustomizationSystem.ts  # 캐릭터 커스터마이징
│   │   ├── BuildingInteriorSystem.ts  # 건물 내부 시스템
│   │   ├── AchievementSystem.ts   # 성취 시스템
│   │   ├── AuthSystem.ts          # 인증 시스템
│   │   ├── TutorialSystem.ts      # 튜토리얼 시스템
│   │   ├── SoundSystem.ts         # 사운드 시스템
│   │   ├── PhotoMode.ts           # 사진 모드
│   │   └── QuickSlotSystem.ts     # 퀵슬롯 시스템
│   ├── ui/                        # UI 컴포넌트
│   │   ├── UIManagerNew.ts        # UI 매니저
│   │   ├── LeftMenuBar.ts        # 왼쪽 메뉴 바
│   │   ├── TopStatusBar.ts        # 상단 상태 바
│   │   ├── BottomActionBar.ts     # 하단 액션 바
│   │   ├── ContextPanel.ts        # 컨텍스트 패널
│   │   ├── QuickSlotBar.ts        # 퀵슬롯 바
│   │   ├── MiniMap.ts             # 미니맵
│   │   ├── GameStartScreen.ts     # 게임 시작 화면
│   │   ├── TutorialPanel.ts       # 튜토리얼 패널
│   │   ├── SettingsPanel.ts       # 설정 패널
│   │   ├── LoadingScreen.ts       # 로딩 화면
│   │   ├── SaveNotification.ts    # 저장 알림
│   │   ├── CoinCounterAnimation.ts # 코인 카운터 애니메이션
│   │   ├── HarvestProgressBar.ts  # 채집 진행 바
│   │   ├── ObjectInteractionPopup.ts # 오브젝트 상호작용 팝업
│   │   └── ErrorHandler.ts        # 에러 핸들러
│   ├── utils/                     # 유틸리티
│   │   ├── ParticleEffects.ts     # 파티클 효과
│   │   ├── HighlightManager.ts    # 하이라이트 매니저
│   │   ├── LODManager.ts          # LOD 관리자
│   │   ├── EnvironmentAnimation.ts # 환경 애니메이션
│   │   ├── ItemRarity.ts          # 아이템 희귀도
│   │   ├── MobileSupport.ts       # 모바일 지원
│   │   ├── AccessibilityManager.ts # 접근성 관리자
│   │   └── StatisticsManager.ts   # 통계 관리자
│   └── config/
│       └── supabase.ts            # Supabase 설정
├── public/                        # 정적 파일
├── dist/                          # 빌드 결과물
└── docs/                          # 문서
```

## 주요 시스템

### 1. 채집 시스템 (GatheringSystem)

채집 가능한 오브젝트로부터 재료를 획득하는 시스템입니다.

**주요 기능:**
- 오브젝트 타입별 채집 (나무, 돌, 열매, 꽃, 버섯 등)
- 도구 필요 여부 (도끼, 곡괭이 등)
- 드롭 테이블 기반 아이템 획득
- 채집 횟수 제한 (3회 후 사라짐)
- 자동 채집 모드

### 2. 제작 시스템 (CraftingSystem)

재료를 사용하여 아이템을 제작하는 시스템입니다.

**주요 기능:**
- 레시피 기반 제작
- 재료 확인 및 소비
- 제작 카테고리 필터 (도구, 요리, 가구, 장식)
- 제작 애니메이션

### 3. 저장 시스템 (SaveSystem)

게임 진행 상황을 저장하고 불러오는 시스템입니다.

**주요 기능:**
- Supabase를 통한 클라우드 저장
- localStorage를 통한 로컬 저장
- 자동 저장 (30초마다)
- 수동 저장
- 저장 데이터 마이그레이션

### 4. 시간 시스템 (TimeSystem)

게임 내 시간을 관리하는 시스템입니다.

**주요 기능:**
- 실시간 대비 시간 배율 조정
- 낮/밤 사이클
- 계절 시스템
- 날짜/시간 표시

### 5. 날씨 시스템 (WeatherSystem)

날씨를 관리하고 시각적 효과를 제공하는 시스템입니다.

**주요 기능:**
- 날씨 타입 (맑음, 비, 눈)
- 파티클 효과 (비, 눈)
- 날씨에 따른 아이템 드롭 변화

### 6. 펫 시스템 (PetSystem)

펫을 획득하고 관리하는 시스템입니다.

**주요 기능:**
- 펫 타입 (고양이, 강아지 등)
- 펫 능력 (자동 채집, 희귀 아이템 발견, 해충 방제, 농장 도움)
- 펫 하우스 시스템
- 펫 성장 및 친밀도
- 펫 커스터마이징
- 펫 번식

### 7. 농장 시스템 (FarmingSystem)

작물을 재배하고 수확하는 시스템입니다.

**주요 기능:**
- 작물 타입 (순무, 당근, 토마토 등)
- 심기, 물 주기, 수확
- 성장 단계 (싹, 성장, 수확 가능, 시듦)
- 물 주기 보너스
- 씨앗 구매 및 저장

### 8. 건물 시스템 (BuildingSystem)

건물을 건설하고 관리하는 시스템입니다.

**주요 기능:**
- 건물 타입 (집, 상점, 박물관 등)
- 건물 건설 (재료 및 코인 필요)
- 건물 배치 및 이동
- 건물 충돌 체크
- 건물 미리보기

### 9. 꾸미기 시스템 (DecorationSystem)

인테리어 및 가구 배치 시스템입니다.

**주요 기능:**
- 가구 배치 및 이동
- 가구 회전 및 배치 취소
- 벽지/바닥재 변경
- 인테리어 평가 시스템

### 10. 인증 시스템 (AuthSystem)

사용자 인증을 처리하는 시스템입니다.

**주요 기능:**
- 회원가입 (이메일/비밀번호)
- 로그인 (이메일/비밀번호)
- 게스트 모드
- 비밀번호 재설정
- Supabase Auth 통합

## 개발 가이드라인

### 코드 스타일

- TypeScript를 사용합니다.
- 클래스 기반 구조를 사용합니다.
- 인터페이스를 활용하여 타입 안정성을 확보합니다.
- 주석은 한국어로 작성합니다.

### 네이밍 컨벤션

- 클래스: PascalCase (예: `PlayerController`)
- 메서드/변수: camelCase (예: `handleHarvest`)
- 상수: UPPER_SNAKE_CASE (예: `MAX_INVENTORY_SIZE`)
- 인터페이스: PascalCase 또는 I 접두사 (예: `GameSettings`)

### 파일 구조

- 각 시스템은 별도의 파일로 분리합니다.
- 관련된 타입과 인터페이스는 같은 파일에 정의합니다.
- 유틸리티 함수는 `utils/` 폴더에 배치합니다.

### 에러 처리

- `try-catch` 블록을 사용하여 에러를 처리합니다.
- 사용자에게 친화적인 에러 메시지를 표시합니다.
- 콘솔에 상세한 에러 로그를 남깁니다.

### 성능 최적화

- LOD(Level of Detail)를 활용하여 렌더링 성능을 최적화합니다.
- 파티클 효과는 적절한 개수로 제한합니다.
- 메모리 누수를 방지하기 위해 불필요한 리소스를 정리합니다.

## API 문서

### PlayerController

플레이어 캐릭터의 이동, 상호작용, 애니메이션을 관리합니다.

**주요 메서드:**
- `update()`: 플레이어 상태 업데이트
- `handleHarvest()`: 채집 처리
- `handleInteraction()`: 상호작용 처리

### InventoryManager

인벤토리 아이템을 관리합니다.

**주요 메서드:**
- `add(itemName, count)`: 아이템 추가
- `remove(itemName, count)`: 아이템 제거
- `has(itemName, count)`: 아이템 보유 여부 확인
- `list()`: 인벤토리 목록 반환

### CraftingSystem

아이템 제작을 처리합니다.

**주요 메서드:**
- `craft(recipeId)`: 아이템 제작
- `canCraft(recipeId)`: 제작 가능 여부 확인
- `getAvailableRecipes()`: 제작 가능한 레시피 목록 반환

### SaveSystem

게임 데이터를 저장하고 불러옵니다.

**주요 메서드:**
- `save()`: 게임 데이터 저장
- `load()`: 게임 데이터 불러오기
- `delete()`: 저장 데이터 삭제

## 문제 해결

### 자주 발생하는 문제

1. **저장 데이터 로드 실패**
   - Supabase 연결 상태를 확인합니다.
   - localStorage에 저장된 데이터를 확인합니다.

2. **성능 저하**
   - LOD 설정을 확인합니다.
   - 파티클 효과 개수를 줄입니다.
   - 브라우저 콘솔에서 경고 메시지를 확인합니다.

3. **모델 로드 실패**
   - 모델 파일 경로를 확인합니다.
   - GLB 파일 형식이 올바른지 확인합니다.

## 기여 방법

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트의 라이선스는 [LICENSE](LICENSE) 파일을 참조하세요.
