import { getWebXPanel, runsInContainerApp } from '@crestron/ch5-webxpanel';
import { ipId, processorHost } from '../config';
import type { CrComLibApi } from './types';

export type ConnectionState = 'native' | 'connecting' | 'online' | 'offline' | 'error';

export interface CrestronRuntime {
  isWebXPanel: boolean;
  setConnectionHandler(handler: (state: ConnectionState, detail?: string) => void): void;
}

function attachNativeBridges(): void {
  const api = window.CrComLib as CrComLibApi | undefined;
  if (!api) {
    throw new Error('CrComLib did not attach to window. Check that cr-com-lib.js loaded.');
  }

  window.bridgeReceiveIntegerFromNative = api.bridgeReceiveIntegerFromNative;
  window.bridgeReceiveBooleanFromNative = api.bridgeReceiveBooleanFromNative;
  window.bridgeReceiveStringFromNative = api.bridgeReceiveStringFromNative;
  window.bridgeReceiveObjectFromNative = api.bridgeReceiveObjectFromNative;
}

/**
 * WebXPanel must initialize before we use joins in a browser.
 * On a TST-1080 (or any native CH5 panel) isActive is false — skip it.
 */
export function initCrestron(): CrestronRuntime {
  attachNativeBridges();

  const { isActive, WebXPanel, WebXPanelEvents } = getWebXPanel(!runsInContainerApp());
  let handler: (state: ConnectionState, detail?: string) => void = () => undefined;

  const notify = (state: ConnectionState, detail?: string) => handler(state, detail);

  if (!isActive) {
    console.info('CrComLib native panel mode (WebXPanel inactive)');
    return {
      isWebXPanel: false,
      setConnectionHandler(next) {
        handler = next;
        notify('native', 'TST-1080 / native CH5');
      },
    };
  }

  // Do not pass roomId — this project is 4-Series only, not VC-4.
  const configuration = {
    host: processorHost,
    ipId,
  };

  console.info('Initializing WebXPanel', configuration);
  notify('connecting', `${processorHost} IP-ID ${ipId}`);
  WebXPanel.initialize(configuration);

  window.addEventListener(WebXPanelEvents.CONNECT_WS, () => {
    console.info('WebXPanel WebSocket connected');
  });
  window.addEventListener(WebXPanelEvents.CONNECT_CIP, () => {
    console.info('WebXPanel CIP connected');
    notify('online', `${processorHost} IP-ID ${ipId}`);
  });
  window.addEventListener(WebXPanelEvents.DISCONNECT_CIP, (event: Event) => {
    const detail = (event as CustomEvent<{ reason?: string }>).detail;
    console.warn('WebXPanel CIP disconnected', detail);
    notify('offline', detail?.reason ?? 'CIP disconnected');
  });
  window.addEventListener(WebXPanelEvents.DISCONNECT_WS, (event: Event) => {
    const detail = (event as CustomEvent<{ reason?: string }>).detail;
    console.warn('WebXPanel WebSocket disconnected', detail);
    notify('offline', detail?.reason ?? 'WebSocket disconnected');
  });
  window.addEventListener(WebXPanelEvents.ERROR_WS, (event: Event) => {
    const detail = (event as CustomEvent).detail;
    console.error('WebXPanel WebSocket error', detail);
    notify('error', 'WebSocket error');
  });
  window.addEventListener(WebXPanelEvents.AUTHENTICATION_FAILED, () => {
    notify('error', 'Authentication failed');
  });
  window.addEventListener(WebXPanelEvents.NOT_AUTHORIZED, (event: Event) => {
    const detail = (event as CustomEvent<{ redirectTo?: string }>).detail;
    notify('error', 'Not authorized');
    if (detail?.redirectTo) {
      window.location.assign(detail.redirectTo);
    }
  });

  return {
    isWebXPanel: true,
    setConnectionHandler(next) {
      handler = next;
      notify('connecting', `${processorHost} IP-ID ${ipId}`);
    },
  };
}
