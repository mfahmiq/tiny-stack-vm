// tiny-stack-vm: a faithful interpreter for make.fun's tiny stack ISA v1.
// Ten traps with their own exit codes; a trap keeps the output written
// before it. Run: MAKEFUN_INPUT_DIR=in MAKEFUN_OUTPUT_DIR=out node main.ts
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const enc = new TextEncoder();
const POPS = { 0x03: 1, 0x04: 1, 0x05: 2, 0x06: 2, 0x07: 3, 0x10: 2, 0x11: 2, 0x12: 2, 0x13: 2, 0x14: 2, 0x15: 2, 0x16: 2, 0x17: 1, 0x18: 2, 0x19: 2, 0x1a: 2, 0x1b: 1, 0x1c: 2, 0x1d: 2, 0x1e: 2, 0x20: 2, 0x21: 2, 0x22: 2, 0x31: 1, 0x32: 1, 0x40: 1, 0x41: 2, 0x50: 1, 0x51: 1, 0x53: 1 };
const PUSHES = { 0x01: 1, 0x02: 1, 0x04: 2, 0x05: 2, 0x06: 3, 0x07: 3, 0x10: 1, 0x11: 1, 0x12: 1, 0x13: 1, 0x14: 1, 0x15: 1, 0x16: 1, 0x17: 1, 0x18: 1, 0x19: 1, 0x1a: 1, 0x1b: 1, 0x1c: 1, 0x1d: 1, 0x1e: 1, 0x20: 1, 0x21: 1, 0x22: 1, 0x40: 1, 0x52: 1 };
const IMM = { 0x01: 1, 0x02: 4, 0x30: 2, 0x31: 2, 0x32: 2, 0x33: 2 };
const BIN = { 0x10: 1, 0x11: 1, 0x12: 1, 0x13: 1, 0x14: 1, 0x15: 1, 0x16: 1, 0x18: 1, 0x19: 1, 0x1a: 1, 0x1c: 1, 0x1d: 1, 0x1e: 1, 0x20: 1, 0x21: 1, 0x22: 1 };

function run(program, input) {
  const n = program.length;
  const D = new Int32Array(256);
  let sp = 0;
  const C = new Int32Array(64);
  let csp = 0;
  const M = new Int32Array(256);
  const out = new Uint8Array(65536);
  let olen = 0;
  let inPos = 0;
  let pc = 0;
  let steps = 0;
  const end = (exit) => ({ out: out.slice(0, olen), code: exit });
  for (;;) {
    if (steps === 1000000) return end(10);
    if (pc < 0 || pc >= n) return end(9);
    const op = program[pc];
    const imm = IMM[op] ?? 0;
    if (!(op in POPS || op in PUSHES || op === 0 || op === 0x30 || op === 0x33 || op === 0x34 || op === 0x52)) return end(5);
    if (pc + imm >= n) return end(9);
    steps++;
    const next = pc + 1 + imm;
    const pops = POPS[op] ?? 0;
    const pushes = PUSHES[op] ?? 0;
    if (sp < pops) return end(2);
    if (sp - pops + pushes > 256) return end(3);
    pc = next;
    if (op === 0x00) return end(0);
    if (op === 0x01) { D[sp++] = (program[next - 1] << 24) >> 24; continue; }
    if (op === 0x02) { D[sp++] = program[next - 4] | (program[next - 3] << 8) | (program[next - 2] << 16) | (program[next - 1] << 24); continue; }
    if (op === 0x03) { sp--; continue; }
    if (op === 0x04) { D[sp] = D[sp - 1]; sp++; continue; }
    if (op === 0x05) { const t = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = t; continue; }
    if (op === 0x06) { D[sp] = D[sp - 2]; sp++; continue; }
    if (op === 0x07) { const a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; continue; }
    if (op === 0x17) { D[sp - 1] = -D[sp - 1] | 0; continue; }
    if (op === 0x1b) { D[sp - 1] = ~D[sp - 1]; continue; }
    if (BIN[op]) {
      const b = D[sp - 1];
      const a = D[sp - 2];
      let r;
      if (op === 0x10) r = (a + b) | 0;
      else if (op === 0x11) r = (a - b) | 0;
      else if (op === 0x12) r = Math.imul(a, b);
      else if (op === 0x13) { if (b === 0) return end(4); r = a === -2147483648 && b === -1 ? a : (a / b) | 0; }
      else if (op === 0x14) { if (b === 0) return end(4); r = b === -1 ? 0 : a % b | 0; }
      else if (op === 0x15) { if (b === 0) return end(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; }
      else if (op === 0x16) { if (b === 0) return end(4); r = (a >>> 0) % (b >>> 0) | 0; }
      else if (op === 0x18) r = a & b;
      else if (op === 0x19) r = a | b;
      else if (op === 0x1a) r = a ^ b;
      else if (op === 0x1c) r = a << (b & 31);
      else if (op === 0x1d) r = a >> (b & 31);
      else if (op === 0x1e) r = (a >>> (b & 31)) | 0;
      else if (op === 0x20) r = a === b ? 1 : 0;
      else if (op === 0x21) r = a < b ? 1 : 0;
      else r = a >>> 0 < b >>> 0 ? 1 : 0;
      sp -= 2;
      D[sp++] = r;
      continue;
    }
    if (op === 0x30 || op === 0x31 || op === 0x32) {
      const rel = ((program[next - 2] | (program[next - 1] << 8)) << 16) >> 16;
      let take = true;
      if (op !== 0x30) { const v = D[--sp]; take = op === 0x31 ? v === 0 : v !== 0; }
      if (take) pc = next + rel;
      continue;
    }
    if (op === 0x33) {
      if (csp === 64) return end(7);
      C[csp++] = next;
      pc = program[next - 2] | (program[next - 1] << 8);
      continue;
    }
    if (op === 0x34) {
      if (csp === 0) return end(8);
      pc = C[--csp];
      continue;
    }
    if (op === 0x40) {
      const addr = D[sp - 1];
      if (addr < 0 || addr >= 256) return end(6);
      D[sp - 1] = M[addr];
      continue;
    }
    if (op === 0x41) {
      const addr = D[sp - 1];
      const v = D[sp - 2];
      if (addr < 0 || addr >= 256) return end(6);
      sp -= 2;
      M[addr] = v;
      continue;
    }
    if (op === 0x50) {
      const bytes = enc.encode(String(D[sp - 1]));
      if (olen + bytes.length > 65536) return end(11);
      sp--;
      out.set(bytes, olen);
      olen += bytes.length;
      continue;
    }
    if (op === 0x51) {
      if (olen + 1 > 65536) return end(11);
      out[olen++] = D[--sp] & 255;
      continue;
    }
    if (op === 0x52) { D[sp++] = inPos < input.length ? input[inPos++] : -1; continue; }
    if (op === 0x53) return end(D[--sp] & 255);
    return end(5);
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const r = run(new Uint8Array(readFileSync(join(I, id, 'program.bin'))), new Uint8Array(readFileSync(join(I, id, 'input.bin'))));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.out);
  writeFileSync(join(O, id, 'exit.txt'), `${r.code}\n`);
}
