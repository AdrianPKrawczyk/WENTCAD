
const zones = {
  'zone-1': {
    id: 'zone-1',
    nr: '1.01',
    name: 'Biuro',
    calculatedVolume: 300,
    calculatedExhaust: 280,
    systemSupplyId: 'N1',
    systemExhaustId: 'W1',
  }
};

const systems = [
  { id: 'N1', name: 'Nawiew 1' },
  { id: 'W1', name: 'Wywiew 1' },
];

const globalTagSettings = {
  fields: [
    { type: 'FLOW_SUPPLY_WITH_SYSTEM', enabled: true, prefix: '', suffix: ' m3/h', order: 1, column: 1 },
    { type: 'FLOW_EXHAUST_WITH_SYSTEM', enabled: true, prefix: '', suffix: ' m3/h', order: 2, column: 1 },
  ]
};

function generateTagText(zoneId) {
  const zone = zones[zoneId];
  if (!zone) return { col1: '', col2: '' };

  const activeFields = globalTagSettings.fields
    .filter(f => f.enabled)
    .sort((a, b) => a.order - b.order);

  const getColumnText = (col) => activeFields
    .filter(f => f.column === col)
    .map(f => {
      let val = '--';
      switch (f.type) {
        case 'FLOW_SUPPLY_WITH_SYSTEM': {
          const flow = Math.round(zone.calculatedVolume || 0);
          const system = systems.find(s => s.id === zone.systemSupplyId)?.id || '--';
          val = `${system}: ${flow}`;
          break;
        }
        case 'FLOW_EXHAUST_WITH_SYSTEM': {
          const flow = Math.round(zone.calculatedExhaust || 0);
          const system = systems.find(s => s.id === zone.systemExhaustId)?.id || '--';
          val = `${system}: ${flow}`;
          break;
        }
      }
      return `${f.prefix}${val}${f.suffix}`;
    })
    .join('\n');

  return {
    col1: getColumnText(1),
    col2: getColumnText(2)
  };
}

const result = generateTagText('zone-1');
console.log('Result Col 1:', result.col1);
console.log('Result Col 2:', result.col2);
