import { router, useLocalSearchParams } from 'expo-router';
import { Share, View } from 'react-native';

import { Banner, Button, Disclaimer, EmptyState, IconButton, levelTone, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { ConcernBar, FaceMap } from '@/components/visual';
import { CONCERNS } from '@/data/seed';
import { rankedConcerns } from '@/lib/analysis';
import { dayMonth } from '@/lib/format';
import { deltaLine, previousScan, scanById, useCountUp, zoneSummary } from '@/lib/selectors';
import { useStore } from '@/store/AppStore';
import { concernScale } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

function close() {
  if (router.canDismiss()) router.dismissTo('/home');
  else router.replace('/home');
}

/** C5 Results: face map first, then the concerns that matter most. */
export default function Results() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { state } = useStore();
  const scan = scanById(state, id);
  const score = useCountUp(scan?.score ?? 0, fresh === '1');

  if (!scan) {
    return (
      <Screen header={<TopBar left="close" onLeft={close} />}>
        <EmptyState icon="history" title="This scan isn't here any more" body="It may have been deleted. Your other scans are in Scan history." action="Scan history" onAction={() => router.replace('/history')} />
      </Screen>
    );
  }

  const prev = previousScan(state, scan);
  const top = rankedConcerns(scan).slice(0, 4);
  const openConcern = (key: string) => router.push({ pathname: '/scan/concern/[key]', params: { key, scan: scan.id } });

  return (
    <Screen
      header={
        <TopBar
          left="close"
          onLeft={close}
          title={`${dayMonth(scan.date)} scan`}
          right={
            <IconButton
              icon="ios-share"
              label="Share results"
              onPress={() =>
                Share.share({
                  message: `My DermAI skin scan, ${dayMonth(scan.date)}: ${scan.score}/100. ${top
                    .map((k) => `${CONCERNS[k].label} ${scan.concerns[k].level.toLowerCase()}`)
                    .join(', ')}. DermAI gives guidance, not a diagnosis.`,
                })
              }
            />
          }
        />
      }
      footer={<Button label="See my routine" variant="brand" onPress={() => { close(); router.navigate('/routine'); }} />}>
      <View style={{ flexDirection: 'row', gap: space.lg, alignItems: 'center' }}>
        <FaceMap
          zones={scan.zones}
          width={140}
          animate={fresh === '1'}
          onZonePress={(z) => {
            const key = top.find((k) => scan.where[k]?.includes(z)) ?? top[0];
            openConcern(key);
          }}
        />
        <View style={{ flex: 1, gap: space.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }} accessibilityLabel={`Skin score ${scan.score} out of 100`}>
            <Txt variant="score">{score}</Txt>
            <Txt variant="body" color="muted" style={{ marginBottom: 6 }}>
              /100
            </Txt>
          </View>
          <Txt variant="small" color="secondary">
            {deltaLine(scan, prev)}
          </Txt>
          <View style={{ gap: 4, marginTop: space.xs }}>
            {zoneSummary(scan.zones).map((z) => (
              <View key={z.level} style={{ flexDirection: 'row', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: concernScale[z.level], marginTop: 4 }} />
                <Txt variant="small" color="secondary" style={{ flex: 1, ...type.small }}>
                  {z.text}
                </Txt>
              </View>
            ))}
          </View>
        </View>
      </View>
      {scan.quality === 'dim' ? <Banner tone="watch" icon="light-mode" text="This photo was a little dim, so we scored it with caution." /> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt variant="heading">Your concerns</Txt>
        <Txt variant="smallStrong" color="brand" onPress={() => router.push({ pathname: '/scan/concerns/[id]', params: { id: scan.id } })}>
          See all
        </Txt>
      </View>
      <List>
        {top.map((k) => (
          <Row
            key={k}
            onPress={() => openConcern(k)}
            label={`${CONCERNS[k].label}, ${scan.concerns[k].level}`}
            title={
              <View style={{ gap: 8, paddingRight: space.sm }}>
                <Txt variant="bodyStrong">{CONCERNS[k].label}</Txt>
                <ConcernBar reading={scan.concerns[k]} />
              </View>
            }
            right={<StatusPill label={scan.concerns[k].level} tone={levelTone(scan.concerns[k].level)} />}
          />
        ))}
      </List>
      <Disclaimer />
    </Screen>
  );
}
