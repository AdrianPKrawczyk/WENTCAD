import { expect, test } from 'vitest'

// Prosty test stałej fizycznej z Twojego pliku HVAC_FORMULAS.md
const AIR_DENSITY = 1.2; // kg/m3

test('Air density constant is correctly defined', () => {
    expect(AIR_DENSITY).toBe(1.2);
});

// Test wzoru na pole powierzchni kanału okrągłego
const calculateCircleArea = (dMm: number) => {
    const r = (dMm / 1000) / 2;
    return Math.PI * Math.pow(r, 2);
};

test('Calculate area for D200 duct', () => {
    const area = calculateCircleArea(200);
    expect(area).toBeCloseTo(0.0314, 4);
});