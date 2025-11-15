
export enum NodeType {
  ROOT = 'ROOT',
  REQUIRED = 'REQUIRED',
  COMPATIBLE = 'COMPATIBLE'
}

export interface LabNode {
  id: string;
  name: string;
  type: NodeType;
  description: string;
  children?: LabNode[];
  isExpanded?: boolean;
  isGenerating?: boolean;
  specs?: Record<string, string>;
  inInventory?: boolean;
}

export interface TreeData {
  name: string;
  children?: TreeData[];
  attributes?: {
    id: string;
    type: NodeType;
    description: string;
    isGenerating?: boolean;
  };
}
