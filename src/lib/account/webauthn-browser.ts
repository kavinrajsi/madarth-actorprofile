'use client';

import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';

/**
 * Minimal browser side of WebAuthn (passkeys), using the built-in API directly.
 * Converts between the server's JSON (base64url) and the ArrayBuffers navigator.credentials needs.
 */

function fromB64url(s: string): ArrayBuffer {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function toB64url(buf: ArrayBuffer | ArrayBufferView | null | undefined): string {
  if (!buf) return '';
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function browserSupportsWebAuthn(): boolean {
  return typeof window !== 'undefined' && typeof window.PublicKeyCredential === 'function' && !!navigator.credentials;
}

const descriptor = (d: {id: string; transports?: string[]}): PublicKeyCredentialDescriptor => ({
  type: 'public-key',
  id: fromB64url(d.id),
  transports: d.transports as AuthenticatorTransport[] | undefined,
});

export async function startRegistration(options: PublicKeyCredentialCreationOptionsJSON): Promise<RegistrationResponseJSON> {
  const publicKey: PublicKeyCredentialCreationOptions = {
    rp: options.rp,
    user: {id: fromB64url(options.user.id), name: options.user.name, displayName: options.user.displayName},
    challenge: fromB64url(options.challenge),
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    excludeCredentials: options.excludeCredentials?.map(descriptor),
    authenticatorSelection: options.authenticatorSelection,
    attestation: options.attestation,
  };
  const cred = (await navigator.credentials.create({publicKey})) as PublicKeyCredential | null;
  if (!cred) throw new DOMException('No passkey was created', 'NotAllowedError');
  const r = cred.response as AuthenticatorAttestationResponse;
  return {
    id: cred.id,
    rawId: toB64url(cred.rawId),
    type: 'public-key',
    authenticatorAttachment: (cred.authenticatorAttachment ?? undefined) as AuthenticatorAttachment | undefined,
    clientExtensionResults: cred.getClientExtensionResults(),
    response: {
      clientDataJSON: toB64url(r.clientDataJSON),
      attestationObject: toB64url(r.attestationObject),
      transports: typeof r.getTransports === 'function' ? r.getTransports() : undefined,
    },
  };
}

export async function startAuthentication(options: PublicKeyCredentialRequestOptionsJSON): Promise<AuthenticationResponseJSON> {
  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: fromB64url(options.challenge),
    timeout: options.timeout,
    rpId: options.rpId,
    allowCredentials: options.allowCredentials?.map(descriptor),
    userVerification: options.userVerification,
  };
  const cred = (await navigator.credentials.get({publicKey})) as PublicKeyCredential | null;
  if (!cred) throw new DOMException('No passkey was used', 'NotAllowedError');
  const r = cred.response as AuthenticatorAssertionResponse;
  return {
    id: cred.id,
    rawId: toB64url(cred.rawId),
    type: 'public-key',
    authenticatorAttachment: (cred.authenticatorAttachment ?? undefined) as AuthenticatorAttachment | undefined,
    clientExtensionResults: cred.getClientExtensionResults(),
    response: {
      clientDataJSON: toB64url(r.clientDataJSON),
      authenticatorData: toB64url(r.authenticatorData),
      signature: toB64url(r.signature),
      userHandle: r.userHandle ? toB64url(r.userHandle) : undefined,
    },
  };
}
