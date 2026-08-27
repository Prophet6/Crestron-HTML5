import { getWebXPanel, runsInContainerApp } from '@crestron/ch5-webxpanel';
import { authToken, ipId, processorHost } from '../config';
import { ensureIncomingDigitalHook } from './bridge';
import type { CrComLibApi } from './types';

export type ConnectionState = 'native' | 'connecting' | 'online' | 'offline' | 'error';

export interface CrestronRuntime {
  isWebXPanel: boolean;
  setConnectionHandler(handler: (state: ConnectionState, detail?: string) => void): void;
}

function attachNativeBridges(): boolean {
  const api = window.CrComLib as CrComLibApi | undefined;
  if (!api) {
    console.warn('CrComLib not on window — partition UI will run locally until the library loads.');
    return false;
  }

  window.bridgeReceiveIntegerFromNative = api.bridgeReceiveIntegerFromNative;
  window.bridgeReceiveBooleanFromNative = api.bridgeReceiveBooleanFromNative;
  window.bridgeReceiveStringFromNative = api.bridgeReceiveStringFromNative;
  window.bridgeReceiveObjectFromNative = api.bridgeReceiveObjectFromNative;
  ensureIncomingDigitalHook();
  return true;
}

export function initCrestron(): CrestronRuntime {
  attachNativeBridges();

  const { isActive, WebXPanel, WebXPanelEvents } = getWebXPanel(!runsInContainerApp());
  let handler: (state: ConnectionState, detail?: string) => void = () => undefined;
  const notify = (state: ConnectionState, detail?: string) => handler(state, detail);

  if (!isActive) {
    return {
      isWebXPanel: false,
      setConnectionHandler(next) {
        handler = next;
        notify('native', 'TST-1080 / native CH5');
      },
    };
  }

  const configuration: { host: string; ipId: string; authToken?: string } = {
    host: processorHost,
    ipId,
  };
  if (authToken) {
    configuration.authToken = authToken;
  }

  console.info('Initializing WebXPanel', {
    host: configuration.host,
    ipId: configuration.ipId,
    authToken: configuration.authToken ? '(present)' : '(none)',
  });
  notify('connecting', `${processorHost} IP-ID ${ipId}`);
  WebXPanel.initialize(configuration);

  window.addEventListener(WebXPanelEvents.CONNECT_CIP, () => {
    notify('online', `${processorHost} IP-ID ${ipId}`);
  });
  window.addEventListener(WebXPanelEvents.DISCONNECT_CIP, (event: Event) => {
    const detail = (event as CustomEvent<{ reason?: string }>).detail;
    notify('offline', detail?.reason ?? 'CIP disconnected');
  });
  window.addEventListener(WebXPanelEvents.DISCONNECT_WS, (event: Event) => {
    const detail = (event as CustomEvent<{ reason?: string }>).detail;
    notify('offline', detail?.reason ?? 'WebSocket disconnected');
  });
  window.addEventListener(WebXPanelEvents.ERROR_WS, () => notify('error', 'WebSocket error'));
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
