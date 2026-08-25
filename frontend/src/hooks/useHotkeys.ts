import { useEffect, useRef } from 'react';

type KeyCombo = string;
type HotkeyCallback = (e: KeyboardEvent) => void;

interface HotkeyOptions {
  enabled?: boolean;
  enableOnFormTags?: boolean;
  preventDefault?: boolean;
}

/**
 * Universal keyboard shortcuts hook.
 * Example usage:
 * useHotkeys('ctrl+k, meta+k', () => toggleCommandPalette());
 * useHotkeys('escape', () => closeModal());
 */
export function useHotkeys(
  keyCombo: KeyCombo,
  callback: HotkeyCallback,
  options: HotkeyOptions = {}
) {
  const {
    enabled = true,
    enableOnFormTags = false,
    preventDefault = true,
  } = options;

  const callbackRef = useRef<HotkeyCallback>(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const combos = keyCombo.toLowerCase().split(',').map((c) => c.trim());

    function handleKeyDown(e: KeyboardEvent) {
      // Check if target is an editable element unless explicitly allowed
      if (!enableOnFormTags) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
        ) {
          // If the key is Escape, still allow it to dismiss modals
          if (e.key !== 'Escape') {
            return;
          }
        }
      }

      for (const combo of combos) {
        const keys = combo.split('+').map((k) => k.trim());
        const hasCtrl = keys.includes('ctrl') || keys.includes('control');
        const hasMeta = keys.includes('meta') || keys.includes('cmd') || keys.includes('command');
        const hasShift = keys.includes('shift');
        const hasAlt = keys.includes('alt') || keys.includes('option');

        const mainKey = keys.find(
          (k) => !['ctrl', 'control', 'meta', 'cmd', 'command', 'shift', 'alt', 'option'].includes(k)
        );

        const matchCtrl = hasCtrl ? e.ctrlKey : true;
        const matchMeta = hasMeta ? e.metaKey : true;
        const matchShift = hasShift ? e.shiftKey : !e.shiftKey || hasShift;
        const matchAlt = hasAlt ? e.altKey : !e.altKey || hasAlt;

        // Modifier logic: either ctrl or meta match when 'ctrl+k, meta+k'
        const modifierMatch =
          (hasCtrl && e.ctrlKey) ||
          (hasMeta && e.metaKey) ||
          (!hasCtrl && !hasMeta);

        let keyMatch = false;
        if (mainKey) {
          if (mainKey === 'escape' || mainKey === 'esc') {
            keyMatch = e.key === 'Escape';
          } else if (mainKey === 'enter' || mainKey === 'return') {
            keyMatch = e.key === 'Enter';
          } else if (mainKey === 'space') {
            keyMatch = e.key === ' ' || e.code === 'Space';
          } else if (mainKey === 'arrowup' || mainKey === 'up') {
            keyMatch = e.key === 'ArrowUp';
          } else if (mainKey === 'arrowdown' || mainKey === 'down') {
            keyMatch = e.key === 'ArrowDown';
          } else {
            keyMatch = e.key.toLowerCase() === mainKey;
          }
        }

        if (modifierMatch && matchShift && matchAlt && keyMatch) {
          if (preventDefault) {
            e.preventDefault();
          }
          callbackRef.current(e);
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyCombo, enabled, enableOnFormTags, preventDefault]);
}
