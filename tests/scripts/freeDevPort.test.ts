import { describe, expect, it } from 'vitest';
import { parseListeningPids } from '../../scripts/free-dev-port.mjs';

const NETSTAT_SAMPLE = [
  '',
  '  Proto  Local Address          Foreign Address        State           PID',
  '  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1234',
  '  TCP    127.0.0.1:3000         0.0.0.0:0              LISTENING       1740',
  '  TCP    [::1]:3000             [::]:0                 LISTENING       1740',
  '  TCP    0.0.0.0:3006           0.0.0.0:0              LISTENING       9999',
  '  TCP    127.0.0.1:3000         127.0.0.1:51234        ESTABLISHED     4321',
  '  TCP    [::1]:3000             [::1]:51234            TIME_WAIT       5555',
  '  UDP    0.0.0.0:3000           *:*                                    7777',
  '  TCP    127.0.0.1:30000        0.0.0.0:0              LISTENING       8888',
].join('\r\n');

describe('parseListeningPids', () => {
  it('finds an IPv4 listener', () => {
    const row = '  TCP    127.0.0.1:3000         0.0.0.0:0              LISTENING       1740';
    expect(parseListeningPids(row, 3000)).toEqual(['1740']);
  });

  it('finds an IPv6-only listener', () => {
    const row = '  TCP    [::1]:3000             [::]:0                 LISTENING       1740';
    expect(parseListeningPids(row, 3000)).toEqual(['1740']);
  });

  it('deduplicates the same PID seen across address families', () => {
    expect(parseListeningPids(NETSTAT_SAMPLE, 3000)).toEqual(['1740']);
  });

  it('ignores sockets that are not LISTENING', () => {
    const rows = [
      '  TCP    127.0.0.1:3000         127.0.0.1:51234        ESTABLISHED     4321',
      '  TCP    [::1]:3000             [::1]:51234            TIME_WAIT       5555',
    ].join('\n');
    expect(parseListeningPids(rows, 3000)).toEqual([]);
  });

  it('ignores other ports, including ones sharing a prefix', () => {
    const rows = [
      '  TCP    0.0.0.0:3006           0.0.0.0:0              LISTENING       9999',
      '  TCP    127.0.0.1:30000        0.0.0.0:0              LISTENING       8888',
    ].join('\n');
    expect(parseListeningPids(rows, 3000)).toEqual([]);
  });

  it('ignores non-TCP rows', () => {
    const row = '  UDP    0.0.0.0:3000           *:*                                    7777';
    expect(parseListeningPids(row, 3000)).toEqual([]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(parseListeningPids('', 3000)).toEqual([]);
  });
});
