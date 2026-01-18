웹용 힐링 생활 시뮬레이션 게임 채집 시스템 설계
대상 낚시 벌레채집과 분리된 지상 채집 중심
목표 짧은 입력으로 즉시 보상, 장기적으로 제작 박물관 꾸미기와 연결

1 설계 원칙
채집은 2초 안쪽으로 끝난다
기본은 버튼 한 번으로 완료한다
선택형 보너스는 있어도 실패 페널티는 없다
채집물은 돈 재료 컬렉션 전시 테마 점수 중 최소 2개와 연결한다
희귀 재료는 반복 노동이 아니라 조건 기반과 추천 동선으로 유도한다

2 채집 카테고리
식물형 열매 꽃 약초 버섯 씨앗
목재형 가지 통나무 수액
광물형 돌 철광 점토 보석 조각
해변형 조개 해초 유리병
특수형 잃어버린 물건 화석 조각 고대 파편

3 도구와 상호작용
손줍기 도구 없음 소형 채집 대상
도끼 나무 대상
곡괭이 바위 대상
삽 땅 파기 씨앗 심기 발굴
물뿌리개 농사 성장 보조와 특정 식물 출현 조건
도구는 내구도가 있으나 수리 기능을 제공해 스트레스를 낮춘다

4 노드 타입
고정 노드 맵에 항상 존재 나무 바위 꽃밭 약초 군락 해변 조개 라인
동적 노드 시간대나 일일 리셋으로 위치가 바뀜 버섯 희귀 약초 화석 잃어버린 물건
고정 노드는 익숙함을 주고 동적 노드는 탐색 동기를 만든다

5 스폰과 재생 규칙
두 축으로 운영한다
시간 재생 고정 노드 중심
일일 리셋 동적 노드 중심

권장 재생 시간
나무 가지 6분
나무 수액 12분
나무 통나무 20분
바위 돌 10분
바위 광석 18분
꽃 약초 8분
조개 5분
희귀 노드 버섯 희귀 약초 화석은 일일 리셋

일일 리셋 시각은 서버 기준 05시로 고정한다
동적 노드 수량은 마을 등급이 오를수록 소폭 증가한다

6 드랍 테이블 구조
채집 결과는 기본 드랍과 보너스 드랍으로 구성한다
기본 드랍은 최소 1종 이상 확정 지급한다
보너스 드랍은 확률 지급이며 조건을 가질 수 있다

권장 데이터 필드
nodeId
category
zone
requiredToolType
interactTimeSec
respawnType time or daily
respawnMinutes time 타입일 때
dailyResetAt daily 타입일 때
durabilityCost
xpReward
baseDrops 배열
bonusDrops 배열

드랍 엔트리 필드
itemId
min
max
chancePct
conditions 선택 사항

7 숙련도와 성장
숙련도는 카테고리별로 분리한다
식물 숙련
목재 숙련
광물 숙련
해변 숙련
특수 숙련

숙련도 효과는 3가지로 제한한다
채집 시간 단축 최대 20퍼
보너스 드랍 확률 증가 최대 10퍼
도구 내구 소모 감소 최대 15퍼

숙련도 레벨은 1에서 20으로 둔다
레벨 보상은 레시피 장식 아이템 칭호를 섞는다

8 선택형 보너스 미니게임
기본은 즉시 완료한다
선택형 보너스는 짧은 타이밍 1회로 끝낸다
성공 보상은 수량 추가 또는 희귀 재료 확률 소폭 증가
실패해도 기본 보상은 그대로 지급

권장 적용 대상
광물 노드
목재 노드
식물 노드는 미니게임을 넣지 않는다

9 일일 목표와 추천 동선
일일 목표는 채집 카테고리를 분산한다
예 꽃 5개 돌 3회 조개 6개
홈 화면에서 오늘 추천 3개만 보여준다
추천은 현재 시간 날씨 계절을 반영한다
지도 메뉴에서 핀으로 바로 안내한다

10 인벤토리와 정리
채집물은 재료 탭에 자동 분류한다
중복 재료는 자동 스택한다
가방 용량은 초반에 충분히 제공한다
창고 확장은 장기 목표로 둔다
빠른 판매 추천은 과잉 재료일 때만 노출한다

11 경제와 밸런스 원칙
기본 수입은 조개와 흔한 재료 판매로 확보한다
제작 핵심 재료는 보너스 드랍 또는 동적 노드에서 얻는다
꾸미기 핵심 재료는 이벤트와 박물관 보상에서도 얻도록 분산한다

12 오프라인과 시설 연동
오프라인 보상은 직접 채집 대체가 아니라 보조로 둔다
농장 성장과 시설 가공 생산을 오프라인 대상으로 둔다
직접 채집은 접속했을 때 하는 즐거움으로 남긴다
오프라인 상한은 8시간을 기본으로 둔다

13 악용 방지 최소 규칙
동적 노드 희귀 재료는 하루 획득 상한을 둔다
같은 노드 연속 입력 간격을 검사한다
서버 동기화 시 채집 결과는 시간 스탬프와 노드 id로 검증한다

14 마스터 데이터 샘플 노드 템플릿 10개
표기 규칙 chancePct는 0에서 100

14 1 node_tree_small_branch
category 목재형
zone 숲
requiredToolType 손줍기
interactTimeSec 1.0
respawnType time
respawnMinutes 6
durabilityCost 0
xpReward 2
baseDrops
wood_branch 1에서 2 chancePct 100
bonusDrops
sap_small 1에서 1 chancePct 5 conditions 날씨 맑음
recipe_hint_paper 1에서 1 chancePct 1 conditions 마을 등급 2 이상

14 2 node_tree_tap_sap
category 목재형
zone 숲
requiredToolType 도끼
interactTimeSec 1.6
respawnType time
respawnMinutes 12
durabilityCost 1
xpReward 4
baseDrops
sap_small 1에서 1 chancePct 100
bonusDrops
sap_rare 1에서 1 chancePct 2 conditions 계절 봄
insect_lure 1에서 1 chancePct 3 conditions 이벤트 없음

14 3 node_tree_log
category 목재형
zone 숲
requiredToolType 도끼
interactTimeSec 1.8
respawnType time
respawnMinutes 20
durabilityCost 2
xpReward 6
baseDrops
wood_log 1에서 1 chancePct 100
bonusDrops
wood_hard 1에서 1 chancePct 6 conditions 도구 등급 2 이상
decor_token 1에서 1 chancePct 1 conditions 주간 목표 완료 1회 이상

14 4 node_rock_stone
category 광물형
zone 언덕
requiredToolType 곡괭이
interactTimeSec 1.6
respawnType time
respawnMinutes 10
durabilityCost 1
xpReward 4
baseDrops
stone 1에서 3 chancePct 100
bonusDrops
clay 1에서 2 chancePct 10
ore_iron 1에서 1 chancePct 6
gem_shard 1에서 1 chancePct 1 conditions 타이밍 보너스 성공

14 5 node_rock_iron
category 광물형
zone 언덕
requiredToolType 곡괭이
interactTimeSec 1.8
respawnType time
respawnMinutes 18
durabilityCost 2
xpReward 7
baseDrops
ore_iron 1에서 2 chancePct 100
bonusDrops
ore_silver 1에서 1 chancePct 4 conditions 마을 등급 3 이상
gem_shard 1에서 1 chancePct 2 conditions 타이밍 보너스 성공
museum_fragment 1에서 1 chancePct 1 conditions 일일 첫 채광

14 6 node_flower_patch
category 식물형
zone 초원
requiredToolType 손줍기
interactTimeSec 1.2
respawnType time
respawnMinutes 8
durabilityCost 0
xpReward 3
baseDrops
flower_common 1에서 2 chancePct 100
bonusDrops
flower_rare 1에서 1 chancePct 5 conditions 계절 여름
seed_random 1에서 1 chancePct 6

14 7 node_herb_cluster
category 식물형
zone 숲
requiredToolType 손줍기
interactTimeSec 1.2
respawnType time
respawnMinutes 8
durabilityCost 0
xpReward 3
baseDrops
herb_green 1에서 2 chancePct 100
bonusDrops
herb_blue 1에서 1 chancePct 3 conditions 날씨 비
recipe_potion_basic 1에서 1 chancePct 1 conditions 특수 숙련 5 이상

14 8 node_beach_shell_line
category 해변형
zone 해변
requiredToolType 손줍기
interactTimeSec 0.9
respawnType time
respawnMinutes 5
durabilityCost 0
xpReward 2
baseDrops
shell_common 1에서 2 chancePct 100
bonusDrops
seaweed 1에서 1 chancePct 12
bottle_message 1에서 1 chancePct 2 conditions 하루 1회 제한

14 9 node_mushroom_spot_daily
category 식물형
zone 숲
requiredToolType 손줍기
interactTimeSec 1.4
respawnType daily
dailyResetAt 05시
durabilityCost 0
xpReward 8
baseDrops
mushroom_common 1에서 2 chancePct 100
bonusDrops
mushroom_rare 1에서 1 chancePct 15 conditions 계절 가을
theme_item_forest 1에서 1 chancePct 2 conditions 박물관 완성도 10퍼 이상

14 10 node_fossil_dig_daily
category 특수형
zone 주거구역 주변 또는 언덕
requiredToolType 삽
interactTimeSec 1.9
respawnType daily
dailyResetAt 05시
durabilityCost 1
xpReward 10
baseDrops
fossil_fragment 1에서 1 chancePct 100
bonusDrops
fossil_complete 1에서 1 chancePct 8 conditions 특수 숙련 8 이상
ancient_shard 1에서 1 chancePct 4 conditions 날씨 흐림
decor_token 1에서 1 chancePct 2 conditions 일일 첫 발굴

15 UI 연결 포인트
대상 선택 시 하단 상호작용 바에 행동 버튼을 노출한다
선택형 보너스가 있는 노드는 채집 후 1초 타이밍 UI를 띄운다
획득 아이템은 토스트로 2초 표시한다
희귀 획득은 상단에 작은 배너로 3초 표시한다
도감 등록이 발생하면 도감 메뉴에 점 배지를 표시한다

16 로그 이벤트 권장
gather_start nodeId zone toolType
gather_complete nodeId itemsGained xpGained bonusSuccess
tool_durability_changed toolId delta
daily_node_claimed nodeId
