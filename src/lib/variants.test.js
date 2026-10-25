import { describe, expect, it } from 'vitest';
import { groupByColor, hasColors, sameColor, variantLabel } from './variants';

describe('variantLabel', () => {
  it('junta cor e tamanho', () => {
    expect(variantLabel('Verde', 'M')).toBe('Verde · M');
  });

  it('sem cor mostra so o tamanho; Único com cor mostra so a cor', () => {
    expect(variantLabel('', 'M')).toBe('M');
    expect(variantLabel(null, 'M')).toBe('M');
    expect(variantLabel('Verde', 'Único')).toBe('Verde');
  });
});

describe('groupByColor', () => {
  const v = (variantId, color, size, colorHex = null) => ({ variantId, color, size, colorHex });

  it('agrupa na ordem de criacao das cores e ordena os tamanhos', () => {
    const groups = groupByColor([
      v(13, 'Azul', 'G', '#1565C0'),
      v(11, 'Verde', 'G'),
      v(10, 'verde', 'P'),
      v(12, 'Azul', 'P', '#1565C0'),
    ]);

    expect(groups.map((g) => g.color)).toEqual(['verde', 'Azul']);
    expect(groups[0].variants.map((x) => x.size)).toEqual(['P', 'G']);
    expect(groups[1].colorHex).toBe('#1565C0');
  });

  it('a ordem escolhida no admin (colorOrder) vem antes da ordem de criacao', () => {
    const groups = groupByColor([
      { ...v(10, 'Verde', 'P'), colorOrder: 1 },
      { ...v(13, 'Azul', 'M'), colorOrder: 0 },
      { ...v(11, 'Verde', 'G'), colorOrder: 1 },
      { ...v(12, 'Azul', 'P'), colorOrder: 0 },
    ]);

    expect(groups.map((g) => g.color)).toEqual(['Azul', 'Verde']);
    expect(groups[0].variants.map((x) => x.size)).toEqual(['P', 'M']);
  });

  it('produto sem cor vira um grupo so', () => {
    const groups = groupByColor([v(1, '', 'M'), v(2, '', 'P')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].color).toBe('');
    expect(groups[0].variants.map((x) => x.size)).toEqual(['P', 'M']);
  });
});

describe('hasColors / sameColor', () => {
  it('detecta cor e compara sem diferenciar maiusculas', () => {
    expect(hasColors([{ color: '' }, { color: null }])).toBe(false);
    expect(hasColors([{ color: 'Verde' }])).toBe(true);
    expect(sameColor(' verde', 'Verde')).toBe(true);
    expect(sameColor('Verde', 'Azul')).toBe(false);
  });
});
