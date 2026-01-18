# 동물의 숲 스타일 웹 게임

웹으로 즐길 수 있는 '동물의 숲' 스타일 게임 개발을 위한 프로젝트입니다.

## 🎯 3D 게임 개발

이 프로젝트는 **3D**로 개발됩니다.

### **3D의 장점:**
- ✅ **입체감과 현실감**: 더 몰입감 있는 경험
- ✅ **자유로운 카메라**: 다양한 각도에서 마을 감상 가능
- ✅ **조명/그림자**: 시간대별 분위기 연출 (낮/밤, 계절)
- ✅ **3D 모델 배치**: 건물, 나무, 아이템을 입체적으로 배치
- ✅ **시각적 임팩트**: 웹 게임에서 차별화된 경험

### **3D 개발 시 고려사항:**
- ⚠️ **성능 최적화**: LOD(Level of Detail), 오클루전 컬링 필요
- ⚠️ **에셋 최적화**: 모델 폴리곤 수, 텍스처 크기 관리
- ⚠️ **모바일 대응**: 저성능 기기 고려 (WebGL 폴백)
- ⚠️ **타일 시스템**: 3D 공간에서의 타일 기반 맵 구현

## 🎮 3D 게임 엔진 추천

### 1. **Babylon.js** ⭐ 가장 추천 (3D 게임용)

- **장점:**
  - **완전한 게임 엔진**: 렌더링, 물리, 애니메이션, 사운드 내장
  - **애니메이션 시스템**: 캐릭터 애니메이션 블렌딩, 타임라인 지원
  - **물리 엔진 통합**: Cannon.js, Ammo.js 등과 통합 쉬움
  - **씬 관리**: 씬 그래프, 로딩 시스템 내장
  - **TypeScript 지원**: 완벽한 타입 정의
  - **성능 최적화**: LOD, 인스턴싱, 오클루전 컬링
  - **에디터**: Babylon.js Editor (선택사항)
  - **풍부한 문서**: 공식 문서와 예제가 많음

- **적합한 이유:**
  - 동물의 숲 스타일 게임에 필요한 모든 기능 포함
  - 캐릭터 이동, 상호작용, 물리 효과 구현 용이
  - 타일 기반 3D 맵 시스템 구현 가능

- **설치:**
```bash
npm install @babylonjs/core @babylonjs/loaders
```

### 2. **Three.js** (렌더링 중심)

- **장점:**
  - **유연성**: 저수준 제어 가능, 커스터마이징 자유도 높음
  - **거대한 커뮤니티**: 많은 예제와 플러그인
  - **경량**: 필요한 기능만 선택 가능
  - **Shader 제어**: 커스텀 쉐이더 작성 용이

- **단점:**
  - 물리 엔진, 고급 애니메이션은 별도 라이브러리 필요
  - 게임 로직은 직접 구현해야 함

- **적합한 경우:**
  - 커스텀 렌더링 파이프라인이 필요한 경우
  - 최대한 가볍게 시작하고 싶은 경우

- **설치:**
```bash
npm install three
npm install @types/three  # TypeScript 사용 시
```

### 3. **PlayCanvas** (브라우저 에디터)

- **장점:**
  - 브라우저 기반 시각적 에디터
  - 협업 기능
  - 빠른 프로토타이핑

- **단점:**
  - 클라우드 의존성
  - 커스터마이징 제약

### 💡 추천: **Babylon.js**

동물의 숲 스타일 게임에는 **Babylon.js**를 추천합니다:
- 게임에 필요한 기능이 모두 내장
- 애니메이션과 물리 효과 구현이 쉬움
- 성능 최적화 도구 제공
- 학습 자료가 풍부

## 🛠 추천 기술 스택

### 필수
- **게임 엔진:** Babylon.js (최신 버전)
- **언어:** TypeScript (강력 권장)
- **빌드 도구:** Vite 또는 Webpack
- **3D 모델 포맷:** GLTF/GLB (권장), FBX, OBJ

### 추가 라이브러리
- **물리 엔진:** @babylonjs/cannon (Babylon.js 내장) 또는 Ammo.js
- **애니메이션:** Babylon.js 내장 애니메이션 시스템
- **상태 관리:** Zustand 또는 Redux Toolkit (게임 상태 관리)
- **서버 통신:** Socket.io (멀티플레이어), Firebase/Supabase (데이터 저장)
- **3D 모델 에디터:** Blender (무료), Maya, 3ds Max
- **맵 에디터:** Blender 또는 커스텀 에디터

## 📁 프로젝트 구조 예시

```
dm/
├── src/
│   ├── core/
│   │   ├── Game.ts           # 게임 메인 클래스
│   │   ├── SceneManager.ts   # 씬 관리자
│   │   └── InputManager.ts   # 입력 관리
│   ├── scenes/
│   │   ├── GameScene.ts      # 메인 게임 씬
│   │   ├── MenuScene.ts      # 메뉴 씬
│   │   └── InventoryScene.ts # 인벤토리 씬
│   ├── entities/
│   │   ├── Player.ts         # 플레이어 캐릭터 (3D 모델)
│   │   ├── NPC.ts            # NPC 캐릭터
│   │   └── Building.ts       # 건물 오브젝트
│   ├── systems/
│   │   ├── Inventory.ts      # 인벤토리 시스템
│   │   ├── TimeSystem.ts     # 시간 시스템 (낮/밤, 계절)
│   │   ├── TileSystem.ts     # 3D 타일 시스템
│   │   └── PlacementSystem.ts # 아이템 배치 시스템
│   ├── utils/
│   │   ├── CameraController.ts # 카메라 컨트롤러
│   │   └── Loader.ts         # 에셋 로더
│   └── main.ts               # 게임 진입점
├── assets/
│   ├── models/               # 3D 모델 (GLTF/GLB)
│   │   ├── characters/       # 캐릭터 모델
│   │   ├── buildings/        # 건물 모델
│   │   └── items/            # 아이템 모델
│   ├── textures/             # 텍스처 이미지
│   ├── audio/                # 사운드 파일
│   └── maps/                 # 맵 데이터 (JSON)
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts (또는 webpack.config.js)
```

## 🚀 빠른 시작

프로젝트 구조와 기본 코드가 이미 준비되어 있습니다!

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`이 자동으로 열립니다.

### 3. 빌드 (프로덕션)
```bash
npm run build
```

### 현재 구현된 기능

#### 🎮 핵심 게임플레이
- ✅ 플레이어 캐릭터 (이동, 달리기, 애니메이션)
- ✅ 채집 시스템 (나무, 돌, 열매, 꽃, 버섯 등)
- ✅ 제작 시스템 (도구, 요리, 가구, 장식)
- ✅ 인벤토리 시스템 (정렬, 필터링)
- ✅ 상점 시스템 (구매/판매, 가격 변동)
- ✅ 농장 시스템 (작물 재배, 수확)
- ✅ 낚시 시스템 (미니게임)
- ✅ 곤충 채집 시스템
- ✅ 건물 시스템 (건설, 배치, 이동)
- ✅ 꾸미기 시스템 (가구 배치, 인테리어)

#### 🎯 게임 시스템
- ✅ 시간 시스템 (낮/밤, 계절)
- ✅ 날씨 시스템 (맑음, 비, 눈)
- ✅ 저장/로드 시스템 (Supabase 통합)
- ✅ 미션 시스템 (일일/주간/계절)
- ✅ 도감 시스템 (발견, 수집)
- ✅ 박물관 시스템 (기증, 전시)
- ✅ NPC 시스템 (대화, 친밀도, 선물)
- ✅ 펫 시스템 (획득, 관리, 능력)
- ✅ 이벤트 시스템 (생일, 축제)
- ✅ 성취 시스템 (목표 달성, 보상)
- ✅ 통계 시스템 (플레이 기록)

#### 🎨 UI/UX
- ✅ 게임 시작 화면 (회원가입, 로그인, 게스트)
- ✅ 튜토리얼 시스템 (단계별 가이드)
- ✅ 설정 패널 (사운드, 그래픽, 접근성)
- ✅ 로딩 화면 (진행률, 팁)
- ✅ 대시보드 (통계, 미션, 빠른 이동)
- ✅ 미니맵
- ✅ 퀵슬롯 시스템 (1-9 숫자 키)
- ✅ 사진 모드 (스크린샷)

#### 🔊 사운드 및 효과
- ✅ 사운드 시스템 (BGM, 효과음)
- ✅ 파티클 효과 (아이템 획득, 코인, 성취)
- ✅ 하이라이트 효과 (상호작용 가능 오브젝트)
- ✅ 환경 애니메이션 (나뭇잎 흔들림, 물 파도)

#### 🎭 캐릭터 및 커스터마이징
- ✅ 캐릭터 커스터마이징 (머리, 옷, 액세서리)
- ✅ 감정 표현 (행복, 피곤, 흥분)
- ✅ 가구 사용 (침대, 의자)

#### 🏠 건물 내부
- ✅ 건물 내부 시스템 (집, 상점 등)
- ✅ 가구 배치 및 이동
- ✅ 벽지/바닥재 변경
- ✅ 인테리어 평가 시스템

#### 📱 접근성 및 최적화
- ✅ 모바일 대응 (터치 조작, 반응형 UI)
- ✅ 접근성 개선 (키보드 네비게이션, 고대비, 자막)
- ✅ LOD 최적화 (성능 향상)
- ✅ 그림자 및 조명 효과
- ✅ 에러 처리 및 사용자 안내

### 문서

- [개발 가이드](DEVELOPMENT_GUIDE.md) - 프로젝트 구조 및 개발 가이드
- [게임 밸런스](GAME_BALANCE.md) - 게임 밸런스 조정 내역
- [버그 수정](BUG_FIXES.md) - 버그 수정 내역
- [성능 최적화](PERFORMANCE_OPTIMIZATION.md) - 성능 최적화 내역
- [완성도 체크리스트](COMPLETION_CHECKLIST.md) - 구현 완료 항목
- [동물의 숲 경험](ANIMAL_CROSSING_EXPERIENCE.md) - 사용자 경험 개선 계획

### Three.js로 시작하기

1. 프로젝트 초기화:
```bash
npm init -y
npm install three
npm install -D typescript vite @types/three
```

2. 물리 엔진 추가 (선택):
```bash
npm install cannon-es  # 또는 @react-three/cannon
```

## 📚 학습 자료

### Babylon.js
- [Babylon.js 공식 문서](https://doc.babylonjs.com/)
- [Babylon.js Playground](https://playground.babylonjs.com/) - 온라인 코드 에디터
- [Babylon.js 예제](https://doc.babylonjs.com/divingDeeper/scene)
- [Babylon.js 튜토리얼](https://doc.babylonjs.com/start)

### Three.js
- [Three.js 공식 문서](https://threejs.org/docs/)
- [Three.js 예제](https://threejs.org/examples/)
- [Three.js Journey](https://threejs-journey.com/) - 유료 강의

### 3D 모델링
- [Blender](https://www.blender.org/) - 무료 3D 모델링 툴
- [Sketchfab](https://sketchfab.com/) - 3D 모델 다운로드
- [Poly Haven](https://polyhaven.com/) - 무료 3D 에셋

### GLTF 관련
- [glTF Overview](https://www.khronos.org/gltf/)
- [glTF Validator](https://github.khronos.org/glTF-Validator/)

## 🎯 구현할 주요 기능

### 핵심 기능
- [ ] 3D 씬 설정 및 카메라 컨트롤
- [ ] 3D 타일 기반 맵 시스템
- [ ] 플레이어 캐릭터 (3D 모델 로드 및 애니메이션)
- [ ] 캐릭터 이동 및 컨트롤
- [ ] 상호작용 시스템 (아이템 수집, NPC 대화)
- [ ] 인벤토리 시스템
- [ ] 건물/아이템 3D 배치 시스템
- [ ] 물리 엔진 (충돌 감지, 중력)
- [ ] 시간 시스템 (낮/밤, 계절) - 조명 변화
- [ ] 저장/로드 기능

### 고급 기능
- [ ] LOD (Level of Detail) 최적화
- [ ] 그림자 및 조명 효과
- [ ] 파티클 효과 (비, 눈, 꽃잎 등)
- [ ] 사운드 시스템
- [ ] 멀티플레이어 (선택사항)
