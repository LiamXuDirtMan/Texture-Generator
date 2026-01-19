
export interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type Resolution = 16 | 32 | 64 | 128;

export interface TextureState {
  pixels: Pixel[][];
  resolution: Resolution;
}

export enum PatternType {
  NONE = 'none',
  STRIPES = 'stripes',
  SPOTS = 'spots',
  BRICK = 'brick'
}

export enum ShapeType {
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  DIAMOND = 'diamond'
}

export type BorderType = 'darken' | 'lighten';
export type GradientType = 'none' | 'linear-v' | 'linear-h' | 'radial';

export interface Layer {
  id: string;
  name: string;
  layerType: 'image' | 'shape' | 'procedural' | 'pattern';
  pixels?: Pixel[][];
  shapeType?: ShapeType;
  patternType?: PatternType;
  patternColor?: string;
  patternScale?: number;
  patternJitter?: number;
  patternShading?: number;
  patternBorderWidth?: number;
  patternBorderIntensity?: number;
  color?: string;
  size?: number;
  shading?: number;
  width: number;
  height: number;
  x: number;
  y: number;
  opacity: number;
  visible: boolean;
  tiling: boolean;
}

export interface ProceduralParams {
  baseColor: string;
  baseColorEnd: string;
  gradientType: GradientType;
  noiseAmount: number;
  shadingIntensity: number;
  contrast: number;
  borderType: BorderType;
  useCustomBorderColor: boolean;
  borderColor: string;
  borderSize: number;
  borderIntensity: number;
  borderSides: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
}
