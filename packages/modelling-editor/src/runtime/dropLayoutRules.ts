/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import { getObjectTypesForDropLayout, normalizeToKey, uniqueStringValues } from './dropLayoutData.js';

export function buildDropLayoutOverridesFromMetis(myMetis: any, viewkinds: { CONT?: unknown; POOL?: unknown; LANE?: unknown }) {
  const objectTypes = getObjectTypesForDropLayout(myMetis);
  if (!objectTypes.length) {
    return undefined;
  }

  const containerIds: any[] = [];
  const poolIds: any[] = [];
  const laneIds: any[] = [];
  const eventIds: any[] = [];
  const gatewayIds: any[] = [];
  const taskIds: any[] = [];

  const containerViewkind = normalizeToKey(viewkinds && viewkinds.CONT);
  const poolViewkind = normalizeToKey(viewkinds && viewkinds.POOL);
  const laneViewkind = normalizeToKey(viewkinds && viewkinds.LANE);

  for (let i = 0; i < objectTypes.length; i++) {
    const type = objectTypes[i];
    if (!type || type.markedAsDeleted) continue;
    const id = type.id;
    if (!id) continue;
    const viewkind = normalizeToKey(type.viewkind);
    const nameKey = normalizeToKey(type.name);
    const isContainerType =
      (containerViewkind && viewkind === containerViewkind) ||
      (typeof type.isContainer === 'function' && type.isContainer());
    if (isContainerType) {
      containerIds.push(id);
      continue;
    }
    if (poolViewkind && viewkind === poolViewkind) {
      poolIds.push(id);
      continue;
    }
    if (laneViewkind && viewkind === laneViewkind) {
      laneIds.push(id);
      continue;
    }
    if (nameKey.indexOf('gateway') !== -1 || nameKey.indexOf('gate') !== -1) {
      gatewayIds.push(id);
      continue;
    }
    const isEventType =
      nameKey.indexOf('event') !== -1 ||
      nameKey.indexOf('start') !== -1 ||
      nameKey === 'end' ||
      nameKey.endsWith(' end') ||
      nameKey.startsWith('end ');
    if (isEventType) {
      eventIds.push(id);
      continue;
    }
    if (
      nameKey.indexOf('task') !== -1 ||
      nameKey.indexOf('activity') !== -1 ||
      nameKey.indexOf('process') !== -1
    ) {
      taskIds.push(id);
      continue;
    }
  }

  const rules: any[] = [];

  const pools = uniqueStringValues(poolIds);
  if (pools.length) {
    rules.push({
      id: 'drop-rule-pools',
      order: -40,
      matchProperty: 'objtypeRef',
      matchValues: pools,
      anchor: 'dropPoint',
      layout: {
        pattern: 'grid',
        padding: 3,
        grid: {
          columns: 1,
          spacingX: 220,
          spacingY: 360,
          align: 'topLeft',
        },
      },
    });
  }

  const lanes = uniqueStringValues(laneIds);
  if (lanes.length) {
    rules.push({
      id: 'drop-rule-lanes',
      order: -35,
      matchProperty: 'objtypeRef',
      matchValues: lanes,
      anchor: 'dropPoint',
      layout: {
        pattern: 'grid',
        padding: 2,
        grid: {
          columns: 1,
          spacingX: 140,
          spacingY: 260,
          align: 'topLeft',
        },
      },
    });
  }

  const containers = uniqueStringValues(containerIds);
  if (containers.length) {
    rules.push({
      id: 'drop-rule-containers',
      order: -30,
      matchProperty: 'objtypeRef',
      matchValues: containers,
      anchor: 'dropPoint',
      layout: {
        pattern: 'grid',
        padding: 2,
        grid: {
          columns: 2,
          spacingX: 240,
          spacingY: 200,
          align: 'center',
        },
      },
    });
  }

  const gateways = uniqueStringValues(gatewayIds);
  if (gateways.length) {
    rules.push({
      id: 'drop-rule-gateways',
      order: 5,
      matchProperty: 'objtypeRef',
      matchValues: gateways,
      layout: {
        pattern: 'circle',
        circle: {
          radius: 140,
          radiusStep: 40,
          startAngle: -90,
          clockwise: true,
        },
      },
    });
  }

  const events = uniqueStringValues(eventIds);
  if (events.length) {
    rules.push({
      id: 'drop-rule-events',
      order: 10,
      matchProperty: 'objtypeRef',
      matchValues: events,
      layout: {
        pattern: 'circle',
        circle: {
          radius: 110,
          radiusStep: 30,
          startAngle: -90,
          clockwise: true,
        },
      },
    });
  }

  const tasks = uniqueStringValues(taskIds);
  if (tasks.length) {
    rules.push({
      id: 'drop-rule-tasks',
      order: 20,
      matchProperty: 'objtypeRef',
      matchValues: tasks,
      anchor: 'dropPoint',
      layout: {
        pattern: 'grid',
        grid: {
          columns: 4,
          spacingX: 200,
          spacingY: 160,
          align: 'center',
        },
      },
    });
  }

  if (!rules.length) {
    if (!pools.length && !lanes.length && !containers.length) {
      return undefined;
    }
  }

  return {
    rules,
    metadata: {
      poolTypeIds: pools,
      laneTypeIds: lanes,
      containerTypeIds: containers,
      poolPadding: 80,
    },
  };
}
