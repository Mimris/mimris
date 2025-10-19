// @ts-nocheck
import * as go from 'gojs';

type DropPattern = 'grid' | 'circle' | 'radial' | 'spiral';

type DropAnchor = 'dropPoint' | 'diagramCenter' | 'groupCenter' | 'topLeft';

export interface DropLayoutMetadata {
  poolTypeIds?: string[];
  laneTypeIds?: string[];
  containerTypeIds?: string[];
  poolPadding?: number;
  lanePadding?: number;
}

export interface DropTypeRule {
  id?: string;
  order?: number;
  matchProperty?: string;
  matchValues?: Array<string | number>;
  categories?: string[];
  templates?: string[];
  layout?: Partial<DropLayoutConfig>;
  anchor?: DropAnchor;
  offset?: {
    x?: number;
    y?: number;
  };
}

export interface DropLayoutConfig {
  pattern: DropPattern;
  anchor: DropAnchor;
  avoidOverlap: boolean;
  padding: number;
  grid: {
    columns: number;
    spacingX: number;
    spacingY: number;
    align: 'center' | 'topLeft';
  };
  circle: {
    radius: number;
    startAngle: number;
    clockwise: boolean;
    radiusStep: number;
  };
  radial: {
    baseRadius: number;
    radiusStep: number;
    nodesPerRing: number;
    nodesPerRingIncrement: number;
    startAngle: number;
    clockwise: boolean;
  };
  spiral: {
    startAngle: number;
    angleStep: number;
    radiusStep: number;
    initialRadius: number;
    clockwise: boolean;
  };
  rules?: DropTypeRule[];
  metadata?: DropLayoutMetadata;
}

export interface DropLayoutOverrides extends Partial<DropLayoutConfig> {
  preset?: string | null;
}

export interface ApplyDropLayoutArgs {
  diagram: go.Diagram | null | undefined;
  parts: readonly go.Part[] | go.Iterable<go.Part> | null | undefined;
  dropPoint?: go.Point | null;
  config?: Partial<DropLayoutConfig>;
  targetGroup?: go.Group | null;
}

export const defaultDropLayoutConfig: DropLayoutConfig = Object.freeze({
  pattern: 'grid' as DropPattern,
  anchor: 'dropPoint' as DropAnchor,
  avoidOverlap: true,
  padding: 1,   // 24 pixels of padding around nodes to avoid overlap
  grid: {
    columns: 3,
    spacingX: 20, //220,
    spacingY: 16, //140,
    align: 'center',
  },
  circle: {
    radius: 180,
    startAngle: -90,
    clockwise: true,
    radiusStep: 40,
  },
  radial: {
    baseRadius: 220,
    radiusStep: 160,
    nodesPerRing: 6,
    nodesPerRingIncrement: 6,
    startAngle: -90,
    clockwise: true,
  },
  spiral: {
    startAngle: -90,
    angleStep: 40,
    radiusStep: 45,
    initialRadius: 140,
    clockwise: true,
  },
  rules: [],
});

export function resolveDropLayoutPreset(layoutName?: string | null): DropLayoutConfig {
  const normalized = (layoutName ?? '').toString().trim().toLowerCase();
  switch (normalized) {
    case 'circular':
    case 'circle':
      return mergeDropLayoutConfig(defaultDropLayoutConfig, { pattern: 'circle' });
    case 'forcedirected':
      return mergeDropLayoutConfig(defaultDropLayoutConfig, {
        pattern: 'circle',
        circle: { radius: 220, radiusStep: 60 },
      });
    case 'layereddigraph':
    case 'tree':
      return mergeDropLayoutConfig(defaultDropLayoutConfig, {
        pattern: 'grid',
        grid: { columns: 3, spacingY: 200 },
      });
    case 'stack':
    case 'vertical':
      return mergeDropLayoutConfig(defaultDropLayoutConfig, {
        pattern: 'grid',
        grid: { columns: 1 },
      });
    case 'horizontal':
      return mergeDropLayoutConfig(defaultDropLayoutConfig, {
        pattern: 'grid',
        grid: { columns: Number.MAX_SAFE_INTEGER, spacingX: 140, spacingY: 40 },
      });
    case 'grid':
    case 'default':
    case '':
      return cloneDropLayoutConfig(defaultDropLayoutConfig);
    default:
      return cloneDropLayoutConfig(defaultDropLayoutConfig);
  }
}

export function deriveDropLayoutConfig(
  presetName?: string | null,
  overrides?: DropLayoutOverrides | null
): DropLayoutConfig {
  const preset = overrides?.preset ?? presetName;
  const base = resolveDropLayoutPreset(preset);
  return mergeDropLayoutConfig(base, overrides ?? undefined);
}

export function mergeDropLayoutConfig(
  base: DropLayoutConfig,
  override?: Partial<DropLayoutConfig>
): DropLayoutConfig {
  if (!override) {
    return cloneDropLayoutConfig(base);
  }
  const {
    grid: gridOverride,
    circle: circleOverride,
    radial: radialOverride,
    spiral: spiralOverride,
    rules: rulesOverride,
    metadata: metadataOverride,
    ...rest
  } = override;
  return {
    ...base,
    ...rest,
    grid: {
      ...base.grid,
      ...(gridOverride ?? {}),
    },
    circle: {
      ...base.circle,
      ...(circleOverride ?? {}),
    },
    radial: {
      ...base.radial,
      ...(radialOverride ?? {}),
    },
    spiral: {
      ...base.spiral,
      ...(spiralOverride ?? {}),
    },
    rules: Array.isArray(rulesOverride)
      ? cloneDropLayoutRules(rulesOverride)
      : base.rules
      ? cloneDropLayoutRules(base.rules)
      : undefined,
    metadata: mergeDropLayoutMetadata(base.metadata, metadataOverride),
  };
}

export function cloneDropLayoutConfig(config: DropLayoutConfig): DropLayoutConfig {
  return {
    pattern: config.pattern,
    anchor: config.anchor,
    avoidOverlap: config.avoidOverlap,
    padding: config.padding,
    grid: {
      columns: config.grid.columns,
      spacingX: config.grid.spacingX,
      spacingY: config.grid.spacingY,
      align: config.grid.align,
    },
    circle: {
      radius: config.circle.radius,
      startAngle: config.circle.startAngle,
      clockwise: config.circle.clockwise,
      radiusStep: config.circle.radiusStep,
    },
    radial: {
      baseRadius: config.radial.baseRadius,
      radiusStep: config.radial.radiusStep,
      nodesPerRing: config.radial.nodesPerRing,
      nodesPerRingIncrement: config.radial.nodesPerRingIncrement,
      startAngle: config.radial.startAngle,
      clockwise: config.radial.clockwise,
    },
    spiral: {
      startAngle: config.spiral.startAngle,
      angleStep: config.spiral.angleStep,
      radiusStep: config.spiral.radiusStep,
      initialRadius: config.spiral.initialRadius,
      clockwise: config.spiral.clockwise,
    },
    rules: config.rules ? cloneDropLayoutRules(config.rules) : undefined,
    metadata: config.metadata ? cloneDropLayoutMetadata(config.metadata) : undefined,
  };
}

function cloneDropLayoutRules(rules: DropTypeRule[]): DropTypeRule[] {
  return rules.map(cloneDropLayoutRule);
}

function cloneDropLayoutMetadata(metadata: DropLayoutMetadata): DropLayoutMetadata {
  return {
    poolTypeIds: metadata.poolTypeIds ? [...metadata.poolTypeIds] : undefined,
    laneTypeIds: metadata.laneTypeIds ? [...metadata.laneTypeIds] : undefined,
    containerTypeIds: metadata.containerTypeIds ? [...metadata.containerTypeIds] : undefined,
    poolPadding: metadata.poolPadding,
    lanePadding: metadata.lanePadding,
  };
}

function mergeDropLayoutMetadata(
  base?: DropLayoutMetadata,
  override?: DropLayoutMetadata
): DropLayoutMetadata | undefined {
  if (!base && !override) {
    return undefined;
  }
  const merged: DropLayoutMetadata = {
    poolTypeIds: base?.poolTypeIds ? [...base.poolTypeIds] : undefined,
    laneTypeIds: base?.laneTypeIds ? [...base.laneTypeIds] : undefined,
    containerTypeIds: base?.containerTypeIds ? [...base.containerTypeIds] : undefined,
    poolPadding: base?.poolPadding,
    lanePadding: base?.lanePadding,
  };
  if (override) {
    if (override.poolTypeIds) {
      merged.poolTypeIds = [...override.poolTypeIds];
    }
    if (override.laneTypeIds) {
      merged.laneTypeIds = [...override.laneTypeIds];
    }
    if (override.containerTypeIds) {
      merged.containerTypeIds = [...override.containerTypeIds];
    }
    if (override.poolPadding !== undefined) {
      merged.poolPadding = override.poolPadding;
    }
    if (override.lanePadding !== undefined) {
      merged.lanePadding = override.lanePadding;
    }
  }
  return merged;
}

function cloneDropLayoutRule(rule: DropTypeRule): DropTypeRule {
  return {
    id: rule.id,
    order: rule.order,
    matchProperty: rule.matchProperty,
    matchValues: rule.matchValues ? [...rule.matchValues] : undefined,
    categories: rule.categories ? [...rule.categories] : undefined,
    templates: rule.templates ? [...rule.templates] : undefined,
    layout: cloneDropLayoutPartial(rule.layout),
    anchor: rule.anchor,
    offset: rule.offset ? { ...rule.offset } : undefined,
  };
}

function cloneDropLayoutPartial(
  partial?: Partial<DropLayoutConfig>
): Partial<DropLayoutConfig> | undefined {
  if (!partial) {
    return undefined;
  }
  const { grid, circle, radial, spiral, rules, ...rest } = partial;
  const cloned: Partial<DropLayoutConfig> = { ...rest };
  if (grid) {
    cloned.grid = { ...grid };
  }
  if (circle) {
    cloned.circle = { ...circle };
  }
  if (radial) {
    cloned.radial = { ...radial };
  }
  if (spiral) {
    cloned.spiral = { ...spiral };
  }
  if (Array.isArray(rules)) {
    cloned.rules = cloneDropLayoutRules(rules);
  }
  if (partial.metadata) {
    cloned.metadata = cloneDropLayoutMetadata(partial.metadata);
  }
  return cloned;
}

export function applyDropLayout(args: ApplyDropLayoutArgs): void {
  const { diagram, parts, dropPoint, config, targetGroup } = args;
  if (!diagram || !parts) {
    return;
  }

  const nodes = collectNodes(parts);
  if (!nodes.length) {
    return;
  }

  const layoutConfig = mergeDropLayoutConfig(
    cloneDropLayoutConfig(defaultDropLayoutConfig),
    config ?? undefined
  );

  const baseAnchorPoint = resolveAnchorPoint(diagram, dropPoint, targetGroup, layoutConfig.anchor);
  const nodeSizeMap = new Map<go.Node, go.Size>();
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    nodeSizeMap.set(node, getNodeSize(node));
  }

  const existingRects = collectExistingRects(diagram, nodes, layoutConfig.padding);
  const placedRects: go.Rect[] = [];

  const shouldCommit = !diagram.isInTransaction;
  if (shouldCommit) {
    diagram.startTransaction('apply-drop-layout');
  }

  try {
    const processedNodes = new Set<go.Node>();
    const sortedRules = Array.isArray(layoutConfig.rules)
      ? [...layoutConfig.rules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : [];
    const poolGroups = new Set<go.Group>();
    const poolTypeIds = Array.isArray(layoutConfig.metadata?.poolTypeIds)
      ? layoutConfig.metadata?.poolTypeIds.map(id => String(id))
      : [];
    const laneTypeIds = Array.isArray(layoutConfig.metadata?.laneTypeIds)
      ? layoutConfig.metadata?.laneTypeIds.map(id => String(id))
      : [];

    for (const rule of sortedRules) {
      const matchingNodes = nodes.filter(
        node => !processedNodes.has(node) && matchesDropRule(node, rule)
      );
      if (!matchingNodes.length) {
        continue;
      }

      const ruleOverride = cloneDropLayoutPartial(rule.layout);
      if (ruleOverride && 'rules' in ruleOverride) {
        delete (ruleOverride as Partial<DropLayoutConfig> & { rules?: DropTypeRule[] }).rules;
      }

      const ruleConfig = ruleOverride
        ? mergeDropLayoutConfig(layoutConfig, ruleOverride)
        : layoutConfig;

      const anchorSource = rule.anchor
        ? resolveAnchorPoint(diagram, dropPoint, targetGroup, rule.anchor)
        : baseAnchorPoint;
      const anchorPoint = copyPoint(anchorSource);
      if (rule.offset) {
        anchorPoint.offset(rule.offset.x ?? 0, rule.offset.y ?? 0);
      }

      layoutNodeGroup({
        diagram,
        nodes: matchingNodes,
        nodeSizeMap,
        anchorPoint,
        config: ruleConfig,
        existingRects,
        placedRects,
        targetGroup,
      });

      for (const node of matchingNodes) {
        processedNodes.add(node);
      }
    }

    const remainingNodes = nodes.filter(node => !processedNodes.has(node));
    if (remainingNodes.length) {
      layoutNodeGroup({
        diagram,
        nodes: remainingNodes,
        nodeSizeMap,
        anchorPoint: copyPoint(baseAnchorPoint),
        config: layoutConfig,
        existingRects,
        placedRects,
        targetGroup,
      });
    }

    if (poolTypeIds.length) {
      for (const node of nodes) {
        if (node instanceof go.Group) {
          const typeRef = getTypeRefFromNodeData(node?.data);
          if (typeRef && poolTypeIds.includes(typeRef)) {
            poolGroups.add(node);
          }
        }
      }
      if (targetGroup instanceof go.Group) {
        const targetTypeRef = getTypeRefFromNodeData(targetGroup?.data);
        if (targetTypeRef && poolTypeIds.includes(targetTypeRef)) {
          poolGroups.add(targetGroup);
        }
      }
      if (poolGroups.size) {
        const padding =
          typeof layoutConfig.metadata?.poolPadding === 'number' &&
          !isNaN(layoutConfig.metadata.poolPadding)
            ? layoutConfig.metadata.poolPadding
            : 80;
        poolGroups.forEach(group => {
          resizeGroupToMembers(group, padding);
        });
      }
    }
  } finally {
    if (shouldCommit && diagram.isInTransaction) {
      diagram.commitTransaction('apply-drop-layout');
    }
  }
}

function copyPoint(point: go.Point): go.Point {
  return new go.Point(point.x, point.y);
}

function layoutNodeGroup(args: {
  diagram: go.Diagram;
  nodes: go.Node[];
  nodeSizeMap: Map<go.Node, go.Size>;
  anchorPoint: go.Point;
  config: DropLayoutConfig;
  existingRects: go.Rect[];
  placedRects: go.Rect[];
  targetGroup?: go.Group | null;
}): void {
  const { diagram, nodes, nodeSizeMap, anchorPoint, config, existingRects, placedRects, targetGroup } =
    args;

  if (!nodes.length) {
    return;
  }

  const nodeSizes = nodes.map(node => {
    const knownSize = nodeSizeMap.get(node);
    if (knownSize) {
      return knownSize;
    }
    const calculated = getNodeSize(node);
    nodeSizeMap.set(node, calculated);
    return calculated;
  });

  if (config.pattern === 'circle') {
    positionAsCircle({
      diagram,
      nodes,
      nodeSizes,
      anchorPoint,
      config,
      existingRects,
      placedRects,
      targetGroup,
    });
    return;
  }

  const maxWidth = Math.max(...nodeSizes.map(size => size.width || 160), 160);
  const maxHeight = Math.max(...nodeSizes.map(size => size.height || 70), 70);

  positionAsGrid({
    diagram,
    nodes,
    nodeSizes,
    anchorPoint,
    config,
    maxWidth,
    maxHeight,
    existingRects,
    placedRects,
    targetGroup,
  });
}

function matchesDropRule(node: go.Node, rule: DropTypeRule): boolean {
  if (!rule) {
    return false;
  }

  let hasCriteria = false;

  if (rule.matchValues && rule.matchValues.length) {
    hasCriteria = true;
    const property = rule.matchProperty ?? 'objtypeRef';
    const propertyValue = getNodeDataValue(node, property);
    if (!valueMatchesList(propertyValue, rule.matchValues)) {
      return false;
    }
  }

  if (rule.categories && rule.categories.length) {
    hasCriteria = true;
    const category = getNodeCategory(node);
    if (!valueMatchesList(category, rule.categories)) {
      return false;
    }
  }

  if (rule.templates && rule.templates.length) {
    hasCriteria = true;
    const template = getNodeTemplate(node);
    if (!valueMatchesList(template, rule.templates)) {
      return false;
    }
  }

  if (!hasCriteria) {
    return true;
  }

  return true;
}

function getNodeCategory(node: go.Node): unknown {
  return (node && (node as any).category) ?? node?.data?.category ?? node?.data?.template;
}

function getNodeTemplate(node: go.Node): unknown {
  return node?.data?.template;
}

function getNodeDataValue(node: go.Node, property: string): unknown {
  if (!property) {
    return undefined;
  }
  if (property === 'category') {
    return getNodeCategory(node);
  }
  if (property === 'template') {
    return getNodeTemplate(node);
  }

  const data = node?.data ?? {};
  const segments = property.split('.');
  let current: any = data;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (current == null) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

function valueMatchesList(value: unknown, acceptable: Array<string | number>): boolean {
  if (!acceptable.length) {
    return false;
  }
  const targets = new Set(acceptable.map(normalizeMatchValue));

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (targets.has(normalizeMatchValue(entry))) {
        return true;
      }
    }
    return false;
  }

  return targets.has(normalizeMatchValue(value));
}

function normalizeMatchValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  return String(value);
}

function parsePointString(value: unknown): go.Point | null {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    const parsed = go.Point.parse(value);
    return parsed ?? null;
  } catch (_err) {
    return null;
  }
}

function isContainerNode(node: go.Node | null | undefined): boolean {
  if (!node || !node.data) {
    return false;
  }
  if (node instanceof go.Group) {
    return true;
  }
  const viewkind = (node.data.viewkind || node.data.viewKind || '').toString().toLowerCase();
  if (viewkind === 'container' || viewkind === 'lane' || viewkind === 'pool') {
    return true;
  }
  const template = (node.data.template || node.data.category || '').toString().toLowerCase();
  if (template.includes('lane') || template.includes('pool') || template.includes('container')) {
    return true;
  }
  return false;
}

function getGroupKeyFromData(data: any): string | number | null {
  if (!data) {
    return null;
  }
  const key = data.group;
  if (key === undefined || key === null) {
    return null;
  }
  if (typeof key === 'string' || typeof key === 'number') {
    return key;
  }
  return String(key);
}

function getTypeRefFromNodeData(data: any): string | null {
  if (!data) {
    return null;
  }
  const candidates = [
    data.objtypeRef,
    data.objecttype?.id,
    data.objecttype?.typeRef,
    data.typeRef,
    data.type?.id,
    data.type?.typeRef,
    data.objTypeRef,
  ];
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate !== undefined && candidate !== null) {
      return String(candidate);
    }
  }
  return null;
}

function resizeGroupToMembers(group: go.Group, padding: number): void {
  if (!group) {
    return;
  }

  const memberParts = group.memberParts;
  if (!memberParts) {
    return;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let it = memberParts.iterator; it?.next();) {
    const part = it.value;
    if (!(part instanceof go.Part) || part === group) continue;
    const bounds = part.actualBounds;
    if (!bounds) continue;
    if (bounds.x < minX) minX = bounds.x;
    if (bounds.y < minY) minY = bounds.y;
    if (bounds.right > maxX) maxX = bounds.right;
    if (bounds.bottom > maxY) maxY = bounds.bottom;
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return;
  }

  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);
  const paddedWidth = width + padding * 2;
  const paddedHeight = height + padding * 2;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;
  const centerPoint = new go.Point(centerX, centerY);
  const desiredSize = new go.Size(paddedWidth, paddedHeight);
  const model = group.diagram?.model;

  if (group.data) {
    const sizeString = go.Size.stringify(desiredSize);
    const locString = go.Point.stringify(centerPoint);
    if (model && typeof model.setDataProperty === 'function') {
      model.setDataProperty(group.data, 'size', sizeString);
      model.setDataProperty(group.data, 'loc', locString);
    } else {
      group.data.size = sizeString;
      group.data.loc = locString;
    }
  }

  const resizeObj = group.resizeObject || group.reshapeObject || group;
  if (resizeObj) {
    resizeObj.desiredSize = desiredSize;
  }

  group.location = centerPoint;
  group.ensureBounds();
}

interface PositioningBaseArgs {
  diagram: go.Diagram;
  nodes: go.Node[];
  nodeSizes: go.Size[];
  anchorPoint: go.Point;
  config: DropLayoutConfig;
  existingRects: go.Rect[];
  placedRects: go.Rect[];
  targetGroup?: go.Group | null;
}

interface GridPositioningArgs extends PositioningBaseArgs {
  maxWidth: number;
  maxHeight: number;
}

interface CirclePositioningArgs extends PositioningBaseArgs {}

function positionAsGrid(args: GridPositioningArgs): void {
  const {
    diagram,
    nodes,
    nodeSizes,
    anchorPoint,
    config,
    maxWidth,
    maxHeight,
    existingRects,
    placedRects,
    targetGroup,
  } = args;

  const { columns, spacingX, spacingY } = config.grid;
  const nodeCount = nodes.length;
  const effectiveColumns =
    columns && columns > 0 && columns !== Number.MAX_SAFE_INTEGER
      ? Math.min(columns, nodeCount)
      : Math.max(1, Math.round(Math.sqrt(nodeCount)));

  const metadata = (config as any)?.metadata ?? {};
  const laneTypeIds = Array.isArray(metadata?.laneTypeIds)
    ? metadata.laneTypeIds.map((id: any) => String(id))
    : [];
  const laneNodesByGroup = new Map<string | number, go.Node[]>();
  const overlapNodesByGroup = new Map<string | number, go.Node[]>();
  const laneNodeSet = new Set<go.Node>();

  const slotWidth = maxWidth + spacingX;
  const slotHeight = maxHeight + spacingY;
  const rows = Math.ceil(nodeCount / effectiveColumns);

  const totalWidth = Math.max(1, Math.min(nodeCount, effectiveColumns)) * slotWidth;
  const totalHeight = Math.max(1, rows) * slotHeight;

  const offsetX = anchorPoint.x - totalWidth / 2 + slotWidth / 2;
  const offsetY = anchorPoint.y - totalHeight / 2 + slotHeight / 2;
  let slotIndex = 0;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeSize = nodeSizes[i];
    const groupKey = getGroupKeyFromData(node?.data);
    const typeRef = getTypeRefFromNodeData(node?.data);
    const viewkind = (node?.data?.viewkind || node?.data?.viewKind || '').toString().toLowerCase();
    const templateName = (node?.data?.template || node?.data?.category || '').toString().toLowerCase();
    const isLaneNode = Boolean(
      (typeRef && laneTypeIds.includes(typeRef)) ||
        viewkind === 'lane' ||
        templateName.includes('lane')
    );
    const containerNode = isContainerNode(node);

    if (containerNode) {
      const existingLocation =
        node?.location?.copy() ??
        parsePointString(node?.data?.loc) ??
        anchorPoint.copy();
      applyLocation(diagram, node, existingLocation, nodeSize, placedRects, config.padding);

      if (groupKey !== null && groupKey !== undefined && isLaneNode) {
        const laneList = laneNodesByGroup.get(groupKey) ?? [];
        laneList.push(node);
        laneNodesByGroup.set(groupKey, laneList);
        laneNodeSet.add(node);
      }
      continue;
    }

    if (groupKey !== null && groupKey !== undefined) {
      const overlapList = overlapNodesByGroup.get(groupKey) ?? [];
      overlapList.push(node);
      overlapNodesByGroup.set(groupKey, overlapList);
      continue;
    }

    let location: go.Point | null = null;

    while (!location) {
      const row = Math.floor(slotIndex / effectiveColumns);
      const col = slotIndex % effectiveColumns;
      slotIndex++;

      const centerX = offsetX + col * slotWidth;
      const centerY = offsetY + row * slotHeight;
      const candidate = new go.Point(centerX, centerY);
      const clamped = clampToGroup(candidate, nodeSize, targetGroup, config.padding);

      if (!config.avoidOverlap || !hasCollision(clamped, nodeSize, existingRects, placedRects, config.padding)) {
        location = clamped;
      }
    }

    applyLocation(diagram, node, location, nodeSize, placedRects, config.padding);

  }

  laneNodesByGroup.forEach((laneNodes, groupKey) => {
    const group = diagram.findNodeForKey(groupKey);
    if (!(group instanceof go.Group)) {
      return;
    }
    const bounds = group.actualBounds;
    if (!bounds) {
      return;
    }
    const laneCount = laneNodes.length;
    if (!laneCount) {
      return;
    }
    const padding = config.padding ?? 0;
    const desiredWidth = Math.max(0, bounds.width - padding * 2);
    const desiredHeight = Math.max(0, bounds.height - padding * 2);
    const centerPoint = bounds.center;

    for (let i = 0; i < laneNodes.length; i++) {
      const lane = laneNodes[i];
      if (typeof diagram.model.setDataProperty === 'function' && lane.data) {
        diagram.model.setDataProperty(lane.data, 'size', `${desiredWidth} ${desiredHeight}`);
        diagram.model.setDataProperty(lane.data, 'loc', go.Point.stringify(centerPoint));
      } else if (lane.data) {
        lane.data.size = `${desiredWidth} ${desiredHeight}`;
        lane.data.loc = go.Point.stringify(centerPoint);
      }
      lane.location = centerPoint.copy();
      lane.ensureBounds();
      const resizeObj = lane.resizeObject || lane.reshapeObject || lane;
      if (resizeObj) {
        resizeObj.desiredSize = new go.Size(desiredWidth, desiredHeight);
      }
    }
  });

  overlapNodesByGroup.forEach((memberNodes, groupKey) => {
    const group = diagram.findNodeForKey(groupKey);
    if (!(group instanceof go.Group)) {
      return;
    }
    const bounds = group.actualBounds;
    if (!bounds) {
      return;
    }
    const referenceLane = laneNodesByGroup.get(groupKey)?.[0];
    const laneBounds = referenceLane?.actualBounds ?? bounds;
    const padding = (config.padding ?? 0) + 20;
    const availableWidth = Math.max(1, laneBounds.width - padding * 2);
    const availableHeight = Math.max(1, laneBounds.height - padding * 2);
    const nodesToPlace = memberNodes.filter(node => !laneNodeSet.has(node) && !isContainerNode(node));
    if (!nodesToPlace.length) {
      return;
    }

    const columns = Math.max(1, Math.floor(Math.sqrt(nodesToPlace.length)));
    const rows = Math.max(1, Math.ceil(nodesToPlace.length / columns));
    const slotWidth = availableWidth / columns;
    const slotHeight = availableHeight / rows;
    const startX = laneBounds.x + padding + slotWidth / 2;
    const startY = laneBounds.y + padding + slotHeight / 2;

    nodesToPlace.forEach((member, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const centerX = startX + col * slotWidth;
      const centerY = startY + row * slotHeight;
      const loc = new go.Point(centerX, centerY);
      const memberSize = nodeSizeMap.get(member) ?? getNodeSize(member);
      applyLocation(diagram, member, loc, memberSize, placedRects, config.padding);
    });
  });
}

function positionAsCircle(args: CirclePositioningArgs): void {
  const {
    diagram,
    nodes,
    nodeSizes,
    anchorPoint,
    config,
    existingRects,
    placedRects,
    targetGroup,
  } = args;

  const count = nodes.length;
  if (count === 0) {
    return;
  }

  const baseRadius = Math.max(config.circle.radius, getRadiusFromSizes(nodeSizes));
  let radius = baseRadius;
  const angleStep = 360 / count;
  const directionMultiplier = config.circle.clockwise ? 1 : -1;
  const initialPlacedCount = placedRects.length;

  for (let attempt = 0; attempt < 10; attempt++) {
    let collisionDetected = false;
    placedRects.length = initialPlacedCount;

    for (let i = 0; i < count; i++) {
      const node = nodes[i];
      const nodeSize = nodeSizes[i];
      const angleDegrees = config.circle.startAngle + directionMultiplier * angleStep * i;
      const radians = (angleDegrees * Math.PI) / 180;

      const centerX = anchorPoint.x + radius * Math.cos(radians);
      const centerY = anchorPoint.y + radius * Math.sin(radians);
      const candidate = new go.Point(centerX, centerY);
      const clamped = clampToGroup(candidate, nodeSize, targetGroup, config.padding);

      if (config.avoidOverlap && hasCollision(clamped, nodeSize, existingRects, placedRects, config.padding)) {
        collisionDetected = true;
        break;
      }

      applyLocation(diagram, node, clamped, nodeSize, placedRects, config.padding);
    }

    if (!collisionDetected) {
      return;
    }

    radius += Math.max(config.circle.radiusStep, 20);
  }

  placedRects.length = initialPlacedCount;
  // Fallback to grid if repeated collisions occur
  positionAsGrid({
    diagram,
    nodes,
    nodeSizes,
    anchorPoint,
    config: mergeDropLayoutConfig(config, { pattern: 'grid' }),
    maxWidth: Math.max(...nodeSizes.map(size => size.width)),
    maxHeight: Math.max(...nodeSizes.map(size => size.height)),
    existingRects,
    placedRects,
    targetGroup,
  });
}

function collectNodes(parts: readonly go.Part[] | go.Iterable<go.Part>): go.Node[] {
  const nodes: go.Node[] = [];

  if (Array.isArray(parts)) {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part instanceof go.Node) {
        nodes.push(part);
      }
    }
    return nodes;
  }

  const iterator = (parts as go.Iterable<go.Part>).iterator;
  while (iterator?.next()) {
    const part = iterator.value;
    if (part instanceof go.Node) {
      nodes.push(part);
    }
  }

  return nodes;
}

function collectExistingRects(
  diagram: go.Diagram,
  droppedNodes: go.Node[],
  padding: number
): go.Rect[] {
  const droppedKeys = new Set(
    droppedNodes
      .map(node => node?.data?.key)
      .filter(key => key !== undefined && key !== null)
  );

  const rects: go.Rect[] = [];
  const it = diagram.nodes.iterator;
  while (it?.next()) {
    const node = it.value;
    if (!(node instanceof go.Node)) continue;
    const key = node?.data?.key;
    if (key !== undefined && droppedKeys.has(key)) continue;
    const bounds = node.actualBounds;
    const rect = new go.Rect(bounds.x, bounds.y, bounds.width, bounds.height);
    rect.inflate(padding, padding);
    rects.push(rect);
  }

  return rects;
}

function getNodeSize(node: go.Node): go.Size {
  const dataSize = node?.data?.size;
  if (typeof dataSize === 'string') {
    const parts = dataSize
      .split(/[\s,]+/)
      .map(token => parseFloat(token))
      .filter(num => !isNaN(num));
    if (parts.length >= 2) {
      return new go.Size(parts[0], parts[1]);
    }
  }

  const bounds = node?.actualBounds;
  if (bounds && bounds.width && bounds.height) {
    return new go.Size(bounds.width, bounds.height);
  }

  return new go.Size(160, 70);
}

function resolveAnchorPoint(
  diagram: go.Diagram,
  dropPoint: go.Point | null | undefined,
  targetGroup: go.Group | null | undefined,
  anchor: DropAnchor
): go.Point {
  switch (anchor) {
    case 'groupCenter':
      if (targetGroup) {
        const groupBounds = targetGroup.actualBounds;
        return groupBounds.center;
      }
      return dropPoint ?? diagram.viewportBounds.center;
    case 'diagramCenter':
      return diagram.viewportBounds.center;
    case 'topLeft':
      if (targetGroup) {
        return targetGroup.actualBounds.position;
      }
      return dropPoint ?? diagram.viewportBounds.position;
    case 'dropPoint':
    default:
      if (dropPoint) return dropPoint;
      if (targetGroup) {
        const groupBounds = targetGroup.actualBounds;
        return groupBounds.center;
      }
      return diagram.viewportBounds.center;
  }
}

function clampToGroup(
  candidate: go.Point,
  nodeSize: go.Size,
  group: go.Group | null | undefined,
  padding: number
): go.Point {
  if (!group) {
    return candidate;
  }

  const bounds = group.actualBounds.copy();
  bounds.inflate(-padding, -padding);

  const minX = bounds.x + nodeSize.width / 2;
  const maxX = bounds.right - nodeSize.width / 2;
  const minY = bounds.y + nodeSize.height / 2;
  const maxY = bounds.bottom - nodeSize.height / 2;

  const clampedX = Math.min(Math.max(candidate.x, minX), maxX);
  const clampedY = Math.min(Math.max(candidate.y, minY), maxY);

  return new go.Point(clampedX, clampedY);
}

function hasCollision(
  location: go.Point,
  nodeSize: go.Size,
  existing: go.Rect[],
  placed: go.Rect[],
  padding: number
): boolean {
  const halfWidth = (nodeSize.width || 160) / 2;
  const halfHeight = (nodeSize.height || 70) / 2;
  const rect = new go.Rect(
    location.x - halfWidth,
    location.y - halfHeight,
    nodeSize.width || 160,
    nodeSize.height || 70
  );
  rect.inflate(padding, padding);

  for (let i = 0; i < existing.length; i++) {
    if (rect.intersectsRect(existing[i])) {
      return true;
    }
  }
  for (let j = 0; j < placed.length; j++) {
    if (rect.intersectsRect(placed[j])) {
      return true;
    }
  }

  return false;
}

function applyLocation(
  diagram: go.Diagram,
  node: go.Node,
  location: go.Point,
  nodeSize: go.Size,
  placedRects: go.Rect[],
  padding: number
): void {
  const locationString = go.Point.stringify(location);
  if (node?.data) {
    diagram.model.setDataProperty(node.data, 'loc', locationString);
  }
  node.location = location;
  node.ensureBounds();

  const halfWidth = (nodeSize.width || 160) / 2;
  const halfHeight = (nodeSize.height || 70) / 2;
  const rect = new go.Rect(
    location.x - halfWidth,
    location.y - halfHeight,
    nodeSize.width || 160,
    nodeSize.height || 70
  );
  rect.inflate(padding, padding);
  placedRects.push(rect);
}

function getRadiusFromSizes(nodeSizes: go.Size[]): number {
  if (!nodeSizes.length) {
    return 180;
  }
  const maxDiagonal = Math.max(
    ...nodeSizes.map(size => Math.sqrt(size.width * size.width + size.height * size.height))
  );
  return Math.max(180, maxDiagonal);
}
