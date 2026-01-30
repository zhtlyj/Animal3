export const animalCategories = [
  '猫', '狗', '兔', '鸟', '爬宠', '其他'
];

export const animalStatuses = [
  '可领养', '救助中', '已领养', '紧急求助'
];

export const locations = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'
];

export const sampleAnimals = [
  {
    id: 'a1',
    name: '小橘',
    species: '猫',
    status: '可领养',
    city: '上海',
    age: '1岁',
    cover: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=1200&auto=format&fit=crop',
    media: [
      'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=1200&auto=format&fit=crop'
    ],
    description: '温顺亲人，已驱虫体检，等待一个温暖的家。'
  },
  {
    id: 'a2',
    name: '豆包',
    species: '狗',
    status: '救助中',
    city: '成都',
    age: '3岁',
    cover: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?q=80&w=1200&auto=format&fit=crop',
    media: [
      'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?q=80&w=1200&auto=format&fit=crop'
    ],
    description: '腿部受伤正在康复，性格温和，适合有耐心的家庭。'
  },
  {
    id: 'a3',
    name: '雪球',
    species: '兔',
    status: '可领养',
    city: '北京',
    age: '8个月',
    cover: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=1200&auto=format&fit=crop',
    media: [
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=1200&auto=format&fit=crop'
    ],
    description: '活泼可爱，喜欢胡萝卜和安静的环境。'
  },
  {
    id: 'a4',
    name: '可可',
    species: '猫',
    status: '紧急求助',
    city: '深圳',
    age: '2岁',
    cover: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=1200&auto=format&fit=crop',
    media: [
      'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=1200&auto=format&fit=crop'
    ],
    description: '需要手术费用支持，请伸出援手。'
  }
];

// 模拟链上统计（后续可替换为区块链查询接口）
export const chainStats = {
  totalDonations: 12876.52, // 单位：CNY 等值
  totalAdoptions: 342,
  totalRescues: 1298
};

export const heroSlides = [
  {
    id: 's1',
    title: '为生命点亮一盏灯',
    subtitle: '每一次伸手，都是改变命运的开始',
    image: '/images/carousel1.jpg'
  },
  {
    id: 's2',
    title: '与爱同行，领养代替购买',
    subtitle: '给它一个家，它将用一生感谢你',
    image: '/images/carousel2.jpg'
  },
  {
    id: 's3',
    title: '透明公益，链上可追溯',
    subtitle: '每一笔捐赠都清清楚楚',
    image: '/images/carousel3.jpg'
  }
];



