'use client';

import {useEffect, useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {browserSupportsWebAuthn, startAuthentication, startRegistration} from '@simplewebauthn/browser';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {
  confirmAuthenticatorAction,
  passkeyRegisterOptionsAction,
  passkeyRegisterVerifyAction,
  passkeySignInOptionsAction,
  passkeySignInVerifyAction,
  regenerateBackupCodesAction,
  removePasskeyAction,
  startAuthenticatorSetupAction,
  verifySignInCodeAction,
} from '@/app/account/two-factor-actions';
import {MaterialIcon} from '@/components/icons/MaterialIcon';
import styles from './account.module.css';

const err = (m?: string | null) => (m ? {type: 'error' as const, message: m} : undefined);

/** WebAuthn errors the user caused (cancelled, timed out) don't need a scary message. */
function passkeyErrorMessage(e: unknown): string {
  const name = e instanceof Error ? e.name : '';
  if (name === 'NotAllowedError' || name === 'AbortError') return 'Passkey request was cancelled or timed out.';
  if (name === 'InvalidStateError') return 'This device already has a passkey for your account.';
  return 'Passkey did not work on this device. Use your authenticator code instead.';
}

function useWebAuthn() {
  const [supported, setSupported] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser capability is only known on the client
  useEffect(() => setSupported(browserSupportsWebAuthn()), []);
  return supported;
}

// ── Backup codes ─────────────────────────────────────────────────────────────

export function BackupCodes({codes}: {codes: string[]}) {
  const [copied, setCopied] = useState(false);
  const text = `Madarth Casting backup codes\nEach code works once.\n\n${codes.join('\n')}\n`;
  // data-clarity-mask: keeps backup codes out of Clarity session recordings.
  return (
    <div className={styles.backup} data-clarity-mask="True">
      <Banner
        status="warning"
        title="Save these backup codes now"
        description="If you lose your phone, a backup code lets you sign in. Each code works once. You won't see them again."
      />
      <ol className={styles.codeGrid} aria-label="Backup codes">
        {codes.map((c) => (
          <li key={c}>
            <code>{c}</code>
          </li>
        ))}
      </ol>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="sm"
          label={copied ? 'Copied' : 'Copy codes'}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          label="Download .txt"
          onClick={() => {
            const url = URL.createObjectURL(new Blob([text], {type: 'text/plain'}));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'madarth-casting-backup-codes.txt';
            a.click();
            URL.revokeObjectURL(url);
          }}
        />
      </div>
    </div>
  );
}

// ── Authenticator setup (first time, or replace) ─────────────────────────────

export function AuthenticatorSetup({mode, onCancel}: {mode: 'first' | 'replace'; onCancel?: () => void}) {
  const router = useRouter();
  const [stage, setStage] = useState<'start' | 'scan' | 'codes'>('start');
  const [current, setCurrent] = useState('');
  const [qr, setQr] = useState<{qr: string; manualKey: string} | null>(null);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  const begin = () =>
    start(async () => {
      setError(null);
      const res = await startAuthenticatorSetupAction(mode === 'replace' ? current : undefined);
      if (!res.ok) return setError(res.message);
      setQr({qr: res.qr, manualKey: res.manualKey});
      setStage('scan');
    });

  if (stage === 'codes') {
    return (
      <div className={styles.form}>
        <Banner
          status="success"
          title={mode === 'first' ? 'Two-factor sign-in is on' : 'Authenticator app changed'}
          description={mode === 'replace' ? 'Other devices were signed out.' : undefined}
        />
        <BackupCodes codes={codes} />
        <div className={styles.actions}>
          <Button
            variant="primary"
            label="I've saved my codes, continue"
            onClick={() => {
              router.push('/account');
              router.refresh();
            }}
          />
        </div>
      </div>
    );
  }

  if (stage === 'scan' && qr) {
    return (
      <form
        className={styles.form}
        data-clarity-mask="True"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            setError(null);
            const res = await confirmAuthenticatorAction(code);
            if (!res.ok) return setError(res.message);
            setCodes(res.backupCodes);
            setStage('codes');
          });
        }}
      >
        <ol className={styles.steps}>
          <li>
            Open an authenticator app on your phone (Google Authenticator, Microsoft Authenticator, Authy or your
            password manager) and add a new account.
          </li>
          <li>Scan this QR code:</li>
        </ol>
        {/* eslint-disable-next-line @next/next/no-img-element -- server-generated data URL */}
        <img src={qr.qr} alt="QR code for your authenticator app" width={200} height={200} className={styles.qr} />
        <p className={styles.meta}>
          Can&apos;t scan? Enter this key in the app instead:
          <br />
          <code className={styles.manualKey}>{qr.manualKey}</code>
        </p>
        <TextInput
          label="Enter the 6-digit code the app shows"
          value={code}
          onChange={setCode}
          inputMode="numeric"
          autoComplete="one-time-code"
          isRequired
          status={err(error)}
          width="100%"
        />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" label="Turn on two-factor" isLoading={isPending} />
          {onCancel && <Button variant="ghost" label="Cancel" onClick={onCancel} />}
        </div>
      </form>
    );
  }

  return (
    <div className={styles.form} data-clarity-mask="True">
      {mode === 'first' ? (
        <p className={styles.text}>
          To keep actor profiles safe, every sign-in needs a code from an authenticator app on your phone as well as
          your password. It takes about a minute to set up.
        </p>
      ) : (
        <TextInput
          label="Current code"
          description="Enter a code from your current authenticator app, or a backup code."
          value={current}
          onChange={setCurrent}
          autoComplete="one-time-code"
          status={err(error)}
          width="100%"
        />
      )}
      {mode === 'first' && error && <Banner status="error" title={error} />}
      <div className={styles.actions}>
        <Button
          variant="primary"
          label={mode === 'first' ? 'Set up authenticator app' : 'Continue'}
          isLoading={isPending}
          onClick={begin}
        />
        {onCancel && <Button variant="ghost" label="Cancel" onClick={onCancel} />}
      </div>
    </div>
  );
}

// ── Second step at sign-in ───────────────────────────────────────────────────

export function SignInSecondStep({passkeysOffered}: {passkeysOffered: boolean}) {
  const router = useRouter();
  const webauthn = useWebAuthn();
  const [useBackup, setUseBackup] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  const done = () => {
    router.push('/account');
    router.refresh();
  };

  const withPasskey = () =>
    start(async () => {
      setError(null);
      const opts = await passkeySignInOptionsAction();
      if (!opts.ok) return setError(opts.message);
      try {
        const response = await startAuthentication({optionsJSON: opts.options});
        const res = await passkeySignInVerifyAction(response);
        if (res.ok) done();
        else setError(res.message);
      } catch (e) {
        setError(passkeyErrorMessage(e));
      }
    });

  return (
    <div className={styles.form}>
      {passkeysOffered && webauthn && (
        <>
          <Button variant="primary" size="lg" label="Use fingerprint or Face ID" isLoading={isPending} onClick={withPasskey} />
          <p className={styles.or}>or</p>
        </>
      )}
      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            setError(null);
            const res = await verifySignInCodeAction(code);
            if (res.ok) done();
            else setError(res.message);
          });
        }}
      >
        <TextInput
          label={useBackup ? 'Backup code' : 'Authenticator code'}
          description={useBackup ? 'One of the 10-character codes you saved (XXXXX-XXXXX).' : 'The 6-digit code from your authenticator app.'}
          value={code}
          onChange={setCode}
          inputMode={useBackup ? 'text' : 'numeric'}
          autoComplete="one-time-code"
          hasAutoFocus={!passkeysOffered}
          isRequired
          width="100%"
        />
        {error && <Banner status="error" title={error} />}
        <div className={styles.actions}>
          <Button type="submit" variant={passkeysOffered && webauthn ? 'secondary' : 'primary'} size="lg" label="Verify" isLoading={isPending} />
        </div>
      </form>
      <div className={styles.links}>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => {
            setUseBackup((b) => !b);
            setCode('');
            setError(null);
          }}
        >
          {useBackup ? 'Use authenticator code' : 'Lost your phone? Use a backup code'}
        </button>
      </div>
    </div>
  );
}

// ── Security card on the account page ────────────────────────────────────────

type PasskeyRow = {id: string; name: string; created: string; lastUsed: string | null};

export function SecuritySettings({
  enabledOn,
  backupLeft,
  passkeys,
  passkeysAvailable,
}: {
  enabledOn: string;
  backupLeft: number;
  passkeys: PasskeyRow[];
  passkeysAvailable: boolean;
}) {
  const router = useRouter();
  const webauthn = useWebAuthn();
  const [panel, setPanel] = useState<'none' | 'replace' | 'codes'>('none');
  const [code, setCode] = useState('');
  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [removing, setRemoving] = useState<PasskeyRow | null>(null);
  const [isPending, start] = useTransition();

  const close = () => {
    setPanel('none');
    setCode('');
    setError(null);
  };

  const addPasskey = () =>
    start(async () => {
      setError(null);
      setNotice(null);
      const opts = await passkeyRegisterOptionsAction();
      if (!opts.ok) return setError(opts.message);
      try {
        const response = await startRegistration({optionsJSON: opts.options});
        const res = await passkeyRegisterVerifyAction(response, deviceName());
        if (!res.ok) return setError(res.message);
        setNotice('Passkey added. Next time, sign in with your fingerprint or Face ID.');
        router.refresh();
      } catch (e) {
        setError(passkeyErrorMessage(e));
      }
    });

  return (
    <div className={styles.securityBody} data-clarity-mask="True">
      {notice && <Banner status="success" title={notice} />}
      {error && panel === 'none' && <Banner status="error" title={error} />}
      <ul className={styles.settings}>
        <li>
          <MaterialIcon name="shield_lock" />
          <div className={styles.settingBody}>
            <span className={styles.settingLabel}>Authenticator app</span>
            <span className={styles.meta}>On since {enabledOn}</span>
          </div>
          {panel !== 'replace' && <Button variant="secondary" size="sm" label="Change app" onClick={() => (close(), setPanel('replace'))} />}
        </li>
        {panel === 'replace' && (
          <li className={styles.settingPanel}>
            <AuthenticatorSetup mode="replace" onCancel={close} />
          </li>
        )}

        <li>
          <MaterialIcon name="key" />
          <div className={styles.settingBody}>
            <span className={styles.settingLabel}>Backup codes</span>
            <span className={styles.meta}>
              {backupLeft} of 10 left{backupLeft <= 3 ? ' — create new ones soon' : ''}
            </span>
          </div>
          {panel !== 'codes' && <Button variant="secondary" size="sm" label="New codes" onClick={() => (close(), setNewCodes(null), setPanel('codes'))} />}
        </li>
        {panel === 'codes' && (
          <li className={styles.settingPanel}>
            {newCodes ? (
              <div className={styles.form}>
                <BackupCodes codes={newCodes} />
                <div className={styles.actions}>
                  <Button variant="primary" label="Done" onClick={() => (close(), router.refresh())} />
                </div>
              </div>
            ) : (
              <form
                className={styles.form}
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  start(async () => {
                    setError(null);
                    const res = await regenerateBackupCodesAction(code);
                    if (!res.ok) return setError(res.message);
                    setNewCodes(res.backupCodes);
                  });
                }}
              >
                <TextInput
                  label="Authenticator code"
                  description="New codes replace all your old ones."
                  value={code}
                  onChange={setCode}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  status={err(error)}
                  width="100%"
                />
                <div className={styles.actions}>
                  <Button type="submit" variant="primary" label="Create new codes" isLoading={isPending} />
                  <Button variant="ghost" label="Cancel" onClick={close} />
                </div>
              </form>
            )}
          </li>
        )}

        <li>
          <MaterialIcon name="fingerprint" />
          <div className={styles.settingBody}>
            <span className={styles.settingLabel}>Fingerprint / Face ID (passkeys)</span>
            <span className={styles.meta}>
              {passkeys.length ? 'Use instead of the authenticator code.' : 'Optional. Faster than typing a code.'}
            </span>
          </div>
          {passkeysAvailable && webauthn && (
            <Button variant="secondary" size="sm" label="Add passkey" isLoading={isPending && panel === 'none'} onClick={addPasskey} />
          )}
        </li>
        {passkeys.map((p) => (
          <li key={p.id} className={styles.passkeyRow}>
            <span aria-hidden />
            <div className={styles.settingBody}>
              <span>{p.name}</span>
              <span className={styles.meta}>
                Added {p.created}
                {p.lastUsed ? ` · last used ${p.lastUsed}` : ''}
              </span>
            </div>
            <Button variant="ghost" size="sm" label="Remove" onClick={() => setRemoving(p)} />
          </li>
        ))}
        {!passkeysAvailable && (
          <li className={styles.passkeyRow}>
            <span aria-hidden />
            <span className={styles.meta}>Passkeys can be added on casting.madarth.com.</span>
          </li>
        )}
      </ul>
      <AlertDialog
        isOpen={removing !== null}
        onOpenChange={(o) => !o && !isPending && setRemoving(null)}
        title={`Remove "${removing?.name ?? ''}"?`}
        description="You won't be able to sign in with this passkey any more. Your authenticator code still works."
        actionLabel="Remove passkey"
        isActionLoading={isPending}
        onAction={() =>
          start(async () => {
            const res = await removePasskeyAction(removing!.id);
            setRemoving(null);
            if (!res.ok) return setError(res.message);
            setNotice('Passkey removed.');
            router.refresh();
          })
        }
      />
    </div>
  );
}

/** A friendly default name for a new passkey, e.g. "iPhone" or "Mac". */
function deviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android phone';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  return 'Passkey';
}
