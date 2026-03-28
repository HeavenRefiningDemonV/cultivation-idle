import { listProgressionFixtures } from '../tests/fixtures/progression/index.js';
const args = process.argv.slice(2);
const packetArg = args.find((arg) => arg.startsWith('--packet='));
const tagArg = args.find((arg) => arg.startsWith('--tag='));
const jsonMode = args.includes('--json');
const fixtures = listProgressionFixtures({
    packet: packetArg?.split('=')[1] ?? undefined,
    tag: tagArg?.split('=')[1] ?? undefined,
});
if (jsonMode) {
    console.log(JSON.stringify(fixtures, null, 2));
    process.exit(0);
}
console.log('Progression Fixtures');
console.log('====================');
fixtures.forEach((fixture) => {
    console.log(`- ${fixture.id} [${fixture.kind}]`);
    console.log(`  ${fixture.description}`);
    console.log(`  owner=${fixture.ownerPacket} consumers=${fixture.intendedConsumerPackets.join(', ')}`);
    console.log(`  tags=${fixture.tags.join(', ')}`);
});
