declare module 'react-sketch' {
  import * as React from 'react';

  export enum Tool {
    Pencil,
    Line,
    Rectangle,
    Circle,
    Pan,
  }

  interface SketchProps {
    tool: Tool;
    lineColor?: string;
    lineWidth?: number;

    // Define other props here as needed
  }

  export default class Sketch extends React.Component<SketchProps, {}> {}
}
