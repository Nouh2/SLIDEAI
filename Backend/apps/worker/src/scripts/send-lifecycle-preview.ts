import 'dotenv/config';
import { buildTrialEmailContent, sendLifecycleEmail } from '../lifecycle-email.js';

const [, , emailType, to, legacyFreeArg, presentationCountArg, trialEndsAtArg] = process.argv;
const subjectPrefix = process.env.EMAIL_SUBJECT_PREFIX ?? '[Preview] ';

if (!emailType || !to) {
  console.error('Usage: node dist/scripts/send-lifecycle-preview.js <emailType> <to> [legacyFree] [presentationCount] [trialEndsAt]');
  process.exit(1);
}

const legacyFree = legacyFreeArg === 'true';
const presentationCount = Number.parseInt(presentationCountArg || '0', 10);
const trialEndsAt = trialEndsAtArg || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

const content = buildTrialEmailContent({
  emailType,
  legacyFree,
  presentationCount,
  trialEndsAt,
});

if (!content) {
  console.error(`Unknown emailType: ${emailType}`);
  process.exit(1);
}

const result = await sendLifecycleEmail({
  to,
  subject: `${subjectPrefix}${content.subject}`,
  html: content.html,
});

console.log(JSON.stringify({
  emailType,
  to,
  legacyFree,
  presentationCount,
  trialEndsAt,
  result,
}, null, 2));
