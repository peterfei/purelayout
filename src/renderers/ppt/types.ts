/**
 * PPT 渲染器通用类型
 */

export interface PPTSlideObject {
  type: 'text' | 'rect' | 'image';
  x: number;      // Inches
  y: number;      // Inches
  w: number;      // Inches
  h: number;      // Inches
  fill?: string;  // Hex color
  border?: {
    color: string;
    width: number; // pt
  };
  text?: {
    content: string;
    fontSize: number; // pt
    color: string;
    bold: boolean;
    align: 'left' | 'center' | 'right';
  };
  src?: string; // For image type, path to the image file or base64 data
}

export interface PPTSlide {
  objects: PPTSlideObject[];
}

export interface PPTDocument {
  slides: PPTSlide[];
}
