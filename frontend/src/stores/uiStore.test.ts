import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore, FONT_SIZE_CONFIG, FONT_SIZES_ORDER } from './uiStore';

describe('useUiStore font sizing', () => {
  beforeEach(() => {
    useUiStore.setState({
      fontSize: 'medium',
      sidebarOpen: true,
      activeInspectorFileId: null,
      sourceViewerOpen: false,
    });
  });

  it('initializes with default font size', () => {
    expect(useUiStore.getState().fontSize).toBe('medium');
    expect(FONT_SIZE_CONFIG['medium'].basePx).toBe('16.5px');
    expect(FONT_SIZE_CONFIG['medium'].codePx).toBe(15);
  });

  it('sets font size explicitly', () => {
    useUiStore.getState().setFontSize('large');
    expect(useUiStore.getState().fontSize).toBe('large');
    expect(FONT_SIZE_CONFIG['large'].codePx).toBe(16.5);
  });

  it('increases font size up to xlarge', () => {
    useUiStore.getState().setFontSize('large');
    useUiStore.getState().increaseFontSize();
    expect(useUiStore.getState().fontSize).toBe('xlarge');

    // should not exceed xlarge
    useUiStore.getState().increaseFontSize();
    expect(useUiStore.getState().fontSize).toBe('xlarge');
  });

  it('decreases font size down to compact', () => {
    useUiStore.getState().setFontSize('normal');
    useUiStore.getState().decreaseFontSize();
    expect(useUiStore.getState().fontSize).toBe('compact');

    // should not go below compact
    useUiStore.getState().decreaseFontSize();
    expect(useUiStore.getState().fontSize).toBe('compact');
  });
});

