import { useState } from 'react';

import { confirm } from '@/components/admin';
import { Banner, Button, ErrorBanner, Field, OptionCard, Screen, TopBar, Txt } from '@/components/ui/kit';
import { adminApi } from '@/lib/admin';
import { useSubmit } from '@/lib/useSubmit';

type Audience = 'all' | 'patients' | 'dermatologists';
const LABEL: Record<Audience, string> = { all: 'everyone', patients: 'all patients', dermatologists: 'all dermatologists' };

/** Send an in-app notification to a group. Suspended accounts are skipped. */
export default function Broadcast() {
  const [audience, setAudience] = useState<Audience>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const { busy, error, run } = useSubmit();

  const errors = {
    title: title.trim().length < 3 ? 'Write a title of at least 3 characters.' : title.trim().length > 120 ? 'Keep the title under 120 characters.' : null,
    body: body.length > 300 ? `Keep it under 300 characters (${body.length} now).` : null,
  };

  const send = () => {
    setTried(true);
    setSent(null);
    if (errors.title || errors.body) return;
    confirm(`Send to ${LABEL[audience]}?`, `"${title.trim()}" appears in their notifications.`, 'Send', () =>
      void run(async () => {
        const r = await adminApi.broadcast({ audience, title: title.trim(), body: body.trim() });
        setSent(`Sent to ${r.sent} ${r.sent === 1 ? 'person' : 'people'}.`);
        setTitle('');
        setBody('');
        setTried(false);
      }),
    false);
  };

  return (
    <Screen keyboard header={<TopBar title="Announcement" />} footer={<Button variant="ink" icon="campaign" label="Send announcement" loading={busy} onPress={send} />}>
      {sent ? <Banner icon="check-circle" tone="clinician" text={sent} /> : null}
      <ErrorBanner error={error} />
      <Txt variant="heading">Who gets it</Txt>
      <OptionCard title="Everyone" subtitle="Patients and dermatologists" icon="groups" selected={audience === 'all'} onPress={() => setAudience('all')} />
      <OptionCard title="Patients" icon="face" selected={audience === 'patients'} onPress={() => setAudience('patients')} />
      <OptionCard title="Dermatologists" icon="stethoscope" selected={audience === 'dermatologists'} onPress={() => setAudience('dermatologists')} />
      <Field label="Title" value={title} onChangeText={setTitle} error={tried ? errors.title : null} />
      <Field label="Message (optional)" value={body} onChangeText={setBody} multiline error={tried ? errors.body : null} hint={`${body.length}/300`} />
    </Screen>
  );
}
