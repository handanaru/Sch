import { Person } from '../types';

export const persons: Person[] = [
  {
    id: 'darwin',
    name: '찰스 다윈',
    category: 'science',
    shortDescription: '진화론을 창시한 생물학자',
    tagline: '매일의 산책이 위대한 발견을 만든다',
    difficulty: 2,
    sourceNote: '『찰스 다윈 자서전』, 다윈의 일기 및 편지 모음',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Charles_Darwin_sepia_photograph_1853.jpg',
  },
  {
    id: 'beethoven',
    name: '루트비히 판 베토벤',
    category: 'music',
    shortDescription: '악성(樂聖)으로 불리는 작곡가',
    tagline: '청각을 잃어도 음악은 멈추지 않는다',
    difficulty: 4,
    sourceNote: '『베토벤의 생애』 로맹 롤랑, 베토벤 대화록',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Beethoven.jpg',
  },
  {
    id: 'jobs',
    name: '스티브 잡스',
    category: 'business',
    shortDescription: '애플 공동창업자, 혁신의 아이콘',
    tagline: '오늘이 마지막 날인 것처럼 살아라',
    difficulty: 5,
    sourceNote: '『스티브 잡스』 월터 아이작슨',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg',
  },
  {
    id: 'aurelius',
    name: '마르쿠스 아우렐리우스',
    category: 'philosophy',
    shortDescription: '로마 황제이자 스토아 철학자',
    tagline: '새벽의 고요함이 하루를 지배한다',
    difficulty: 3,
    sourceNote: '『명상록』 마르쿠스 아우렐리우스',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/MSR-ra-61-b-1.jpg/440px-MSR-ra-61-b-1.jpg',
  },
  {
    id: 'king',
    name: '스티븐 킹',
    category: 'literature',
    shortDescription: '공포 소설의 거장',
    tagline: '매일 2,000 단어, 예외는 없다',
    difficulty: 3,
    sourceNote: '『유혹하는 글쓰기』 스티븐 킹',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Stephen_King%2C_Comicon.jpg',
  },
  {
    id: 'curie',
    name: '마리 퀴리',
    category: 'science',
    shortDescription: '노벨상을 두 번 받은 과학자',
    tagline: '끈질긴 호기심이 역사를 바꾼다',
    difficulty: 4,
    sourceNote: '『마리 퀴리』 이브 퀴리',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Marie_Curie_c1920.jpg',
  },
  {
    id: 'franklin',
    name: '벤자민 프랭클린',
    category: 'politics',
    shortDescription: '미국 건국의 아버지, 발명가',
    tagline: '13가지 덕목으로 완벽한 하루를',
    difficulty: 4,
    sourceNote: '『벤자민 프랭클린 자서전』',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/25/BenFranklinDuplessis.jpg',
  },
  {
    id: 'picasso',
    name: '파블로 피카소',
    category: 'art',
    shortDescription: '입체주의를 창시한 화가',
    tagline: '영감은 일하는 자에게 찾아온다',
    difficulty: 3,
    sourceNote: '『피카소: 삶과 예술』 패트릭 오브라이언',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Pablo_picasso_1.jpg',
  },
];

export const getPersonById = (id: string): Person | undefined =>
  persons.find((p) => p.id === id);

export const getPersonsByCategory = (categoryId: string): Person[] =>
  persons.filter((p) => p.category === categoryId);
