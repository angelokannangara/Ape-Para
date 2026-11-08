import test from 'node:test';
import assert from 'node:assert/strict';
import { routeReport, pointInRing } from './routing.js';
import { SAMPLE_DEPARTMENTS as D } from './sampleDepartments.js';

const route = (category, lat, lng) => routeReport(D, { category, lat, lng });

test('pothole inside municipal boundary -> polygon match', () => {
  const r = route('pothole', 6.925, 79.86);
  assert.equal(r.method, 'polygon');
  assert.equal(r.department.id, 'colombo-mc');
});

test('street light inside CEB boundary -> CEB by polygon', () => {
  const r = route('broken_street_light', 6.90, 79.855);
  assert.equal(r.method, 'polygon');
  assert.equal(r.department.type, 'ceb');
});

test('street light inside municipal area (no CEB polygon there) -> nearest CEB', () => {
  const r = route('broken_street_light', 6.925, 79.86);
  assert.equal(r.method, 'nearest');
  assert.equal(r.department.id, 'ceb-colombo-central');
});

test('drainage block far from any water board (Jaffna) -> unrouted', () => {
  const r = route('drainage_block', 9.66, 80.02);
  assert.equal(r.method, 'unrouted');
  assert.equal(r.department, null);
});

test('unknown category and empty department list -> unrouted', () => {
  assert.equal(route('nonsense', 6.925, 79.86).method, 'unrouted');
  assert.equal(routeReport([], { category: 'pothole', lat: 6.9, lng: 79.8 }).method, 'unrouted');
});

test('smallest overlapping region wins', () => {
  const big = { id: 'big', type: 'municipal', polygons: [{ points: [{ lat: 6, lng: 79 }, { lat: 6, lng: 81 }, { lat: 8, lng: 81 }, { lat: 8, lng: 79 }] }] };
  const small = { id: 'small', type: 'municipal', polygons: [{ points: [{ lat: 6.9, lng: 79.8 }, { lat: 6.9, lng: 79.9 }, { lat: 7, lng: 79.9 }, { lat: 7, lng: 79.8 }] }] };
  const r = routeReport([big, small], { category: 'pothole', lat: 6.95, lng: 79.85 });
  assert.equal(r.department.id, 'small');
});

test('pointInRing basics', () => {
  const ring = D[0].polygons[0].points;
  assert.equal(pointInRing(6.925, 79.86, ring), true);
  assert.equal(pointInRing(7.5, 79.86, ring), false);
});
