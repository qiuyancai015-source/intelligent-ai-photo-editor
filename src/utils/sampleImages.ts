export interface SampleImage {
  id: string;
  title: string;
  category: "portrait" | "product" | "watermark" | "eraser" | "pet";
  badge: string;
  description: string;
  url: string;
  recommendedTool: "cutout" | "background" | "watermark" | "eraser" | "adjust";
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "sample_portrait",
    title: "标准商务人像",
    category: "portrait",
    badge: "证件照 / 抠图推荐",
    description: "清晰人像轮廓，适合测试一键抠图与更换红/蓝/白底色",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop",
    recommendedTool: "cutout",
  },
  {
    id: "sample_product",
    title: "潮牌运动鞋",
    category: "product",
    badge: "电商换背景",
    description: "商品主体明显，测试一键抠图、换商业纯色背景与投影阴影",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
    recommendedTool: "background",
  },
  {
    id: "sample_watermark",
    title: "风景水印照",
    category: "watermark",
    badge: "智能去水印",
    description: "带右下角水印与文字标注，测试AI水印一键框选智能抹除",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop",
    recommendedTool: "watermark",
  },
  {
    id: "sample_eraser",
    title: "旅行路人杂物",
    category: "eraser",
    badge: "消除笔抹除",
    description: "画面含有背景多余路人与杂物，测试智能涂抹一键消除",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
    recommendedTool: "eraser",
  },
  {
    id: "sample_pet",
    title: "蓬松金渐层猫咪",
    category: "pet",
    badge: "毛发级抠图",
    description: "细腻毛发边缘，测试智能发丝羽化与背景融合算法",
    url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1000&auto=format&fit=crop",
    recommendedTool: "cutout",
  },
];
