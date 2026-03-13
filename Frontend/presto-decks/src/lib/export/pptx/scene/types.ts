import type { ColorPalette, PresentationData, SlideData } from '../types';

export type SceneNode =
    | SceneTextNode
    | SceneImageNode
    | SceneShapeNode
    | SceneChartNode
    | SceneTableNode;

export interface SceneBaseNode {
    kind: 'text' | 'image' | 'shape' | 'chart' | 'table';
    x: number;
    y: number;
    w: number;
    h: number;
    rotation?: number;
    opacity?: number;
}

export interface SceneTextNode extends SceneBaseNode {
    kind: 'text';
    text: string;
    fontFace: string;
    fontSize: number;
    color: string;
    bold?: boolean;
    italic?: boolean;
    uppercase?: boolean;
    align?: 'left' | 'center' | 'right' | 'justify';
    valign?: 'top' | 'middle' | 'bottom';
    fit?: 'none' | 'shrink' | 'resize';
    breakLine?: boolean;
    margin?: number;
    transparency?: number;
}

export interface SceneImageNode extends SceneBaseNode {
    kind: 'image';
    path?: string;
    data?: string;
    sizing?: 'contain' | 'cover' | 'crop';
    cropX?: number;
    cropY?: number;
    rounding?: boolean;
    shadow?: {
        type: 'outer';
        color: string;
        opacity: number;
        blur: number;
        offset: number;
        angle: number;
    };
    transparency?: number;
}

export interface SceneShapeNode extends SceneBaseNode {
    kind: 'shape';
    shape: 'rect' | 'roundRect' | 'ellipse' | 'line';
    fillColor?: string;
    fillTransparency?: number;
    lineColor?: string;
    lineTransparency?: number;
    lineWidth?: number;
    flipH?: boolean;
    flipV?: boolean;
}

export interface SceneChartSeries {
    name: string;
    labels: string[];
    values: number[];
}

export interface SceneChartNode extends SceneBaseNode {
    kind: 'chart';
    chartType: string;
    series: SceneChartSeries[];
    chartColors?: string[];
    options?: {
        showLegend?: boolean;
        legendPos?: 'b' | 't' | 'l' | 'r' | 'tr';
        showTitle?: boolean;
        showValue?: boolean;
        dataLabelPosition?: 'outEnd' | 'bestFit' | 'ctr' | 'inBase' | 'inEnd' | 'l' | 'r' | 't' | 'b';
        barGrouping?: 'stacked' | 'clustered' | 'percentStacked' | 'standard';
        barDir?: 'bar' | 'col';
        valAxisLabelColor?: string;
        catAxisLabelColor?: string;
        legendColor?: string;
        valAxisLineShow?: boolean;
        valGridLineColor?: string;
    };
}

export interface SceneTableNode extends SceneBaseNode {
    kind: 'table';
    columns?: string[];
    rows: string[][];
    fontFace: string;
    fontSize: number;
    color: string;
    headerFillColor?: string;
    headerColor?: string;
    rowStripeColor?: string;
    borderColor?: string;
    colWidths?: number[];
    rowHeights?: number[];
    alignments?: Array<'left' | 'center' | 'right'>;
    margin?: number;
}

export interface SlideScene {
    family: 'cover' | 'content' | 'image' | 'stats' | 'chart' | 'text-columns' | 'comparison' | 'timeline' | 'infographic' | 'table' | 'bento' | 'section' | 'quote' | 'showcase' | 'swot' | 'executive';
    variation: string;
    backgroundColor: string;
    nodes: SceneNode[];
}

export interface SceneBuildContext {
    slide: SlideData;
    presentation: PresentationData;
    colors: ColorPalette;
}

export interface SceneBuildResult {
    supported: boolean;
    scene?: SlideScene;
    fallbackReason?: string;
}
