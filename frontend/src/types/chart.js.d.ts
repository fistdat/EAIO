declare module 'chart.js/auto' {
  import { Chart } from 'chart.js';
  const chart: typeof Chart;
  export default chart;
}

declare module 'chart.js' {
  export interface ChartTooltipContext {
    chart: Chart;
    label: string;
    dataIndex: number;
    dataset: any;
    datasetIndex: number;
    element: any;
    formattedValue: string;
    parsed: { x: number; y: number };
    raw: any;
    tooltip: any;
  }

  export interface ScaleTickContext {
    chart: Chart;
    getLabelForValue: (value: number) => string;
    max: number;
    min: number;
    scale: {
      options: any;
      chart: Chart;
      id: string;
    };
    tick: {
      value: number;
    };
  }

  export class Chart<TType extends keyof ChartTypeRegistry = keyof ChartTypeRegistry, TData = any, TLabel = string> {
    constructor(
      context: CanvasRenderingContext2D | HTMLCanvasElement,
      config: {
        type: TType;
        data: {
          labels?: TLabel[];
          datasets: any[];
        };
        options?: any;
      }
    );
    
    destroy(): void;
    update(): void;
    data: any;
    options: any;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    config: any;
    render(): void;
    stop(): void;
    resize(): void;
    
    static register(...items: any[]): void;
    static unregister(...items: any[]): void;
    static getChart(canvas: HTMLCanvasElement): Chart | undefined;
    static defaults: any;
  }

  export interface ChartTypeRegistry {
    bar: any;
    line: any;
    scatter: any;
    bubble: any;
    pie: any;
    doughnut: any;
    polarArea: any;
    radar: any;
  }

  export type ChartType = keyof ChartTypeRegistry;
  
  export type ChartDataset = { 
    data: any[]; 
    label?: string; 
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
    tension?: number;
    [key: string]: any;
  };
  
  export interface ChartData {
    datasets: ChartDataset[];
    labels?: any[];
  }

  export class CategoryScale { }
  export class LinearScale { }
  export class PointElement { }
  export class LineElement { }
  export class BarElement { }
  export class ArcElement { }
  export class RadialLinearScale { }
  export class Title { }
  export class Tooltip { }
  export class Legend { }
  export class Filler { }
}

declare module 'chartjs-plugin-annotation' {
  const annotationPlugin: any;
  export default annotationPlugin;
}
