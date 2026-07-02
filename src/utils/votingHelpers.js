import { deriveEventStatus } from './geomath.js';

export function rankCourses(courses, votes) {
  const counts = {};
  for (const vote of votes) {
    counts[vote.courseId] = (counts[vote.courseId] ?? 0) + 1;
  }
  return courses
    .map((c) => ({ ...c, voteCount: counts[c.id] ?? 0 }))
    .sort((a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
}

export function canVote(event, userId, userVotes) {
  if (!event.votingPeriodOpen) return false;
  if (userVotes.some((v) => v.eventId === event.id)) return false;
  return deriveEventStatus(event.date, new Date()) === 'upcoming';
}
