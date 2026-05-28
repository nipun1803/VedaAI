import { getRedisConnection } from "@/config/redis.js";

const ASSIGNMENT_TTL = 300;
const PAPER_TTL = 300;
const ASSIGNMENT_LIST_TTL = 120;

function key(prefix: string, id: string) {
  return `vedai:cache:${prefix}:${id}`;
}

export async function getCached<T>(cacheKey: string): Promise<T | null> {
  try {
    const raw = await getRedisConnection().get(cacheKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setCache(cacheKey: string, data: unknown, ttl: number) {
  try {
    await getRedisConnection().set(cacheKey, JSON.stringify(data), "EX", ttl);
  } catch {
    // Cache writes are non-critical; swallow errors.
  }
}

async function deleteCache(cacheKey: string) {
  try {
    await getRedisConnection().del(cacheKey);
  } catch {
    // Cache deletions are non-critical.
  }
}

export async function getCachedAssignment<T>(id: string) {
  return getCached<T>(key("assignment", id));
}

export async function setCachedAssignment(id: string, data: unknown) {
  await setCache(key("assignment", id), data, ASSIGNMENT_TTL);
}

export async function invalidateAssignment(id: string) {
  await deleteCache(key("assignment", id));
}

export async function getCachedPaper<T>(assignmentId: string) {
  return getCached<T>(key("paper", assignmentId));
}

export async function setCachedPaper(assignmentId: string, data: unknown) {
  await setCache(key("paper", assignmentId), data, PAPER_TTL);
}

export async function invalidatePaper(assignmentId: string) {
  await deleteCache(key("paper", assignmentId));
}

export async function getCachedAssignmentList<T>(teacherId: string) {
  return getCached<T>(key("assignments-list", teacherId));
}

export async function setCachedAssignmentList(teacherId: string, data: unknown) {
  await setCache(key("assignments-list", teacherId), data, ASSIGNMENT_LIST_TTL);
}

export async function invalidateTeacherAssignments(teacherId: string) {
  try {
    const redis = getRedisConnection();
    const pattern = `vedai:cache:assignments-list:${teacherId}*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Cache deletions are non-critical.
  }
}

const GROUP_LIST_TTL = 120;

export async function getCachedGroupList<T>(teacherId: string, archived: boolean) {
  return getCached<T>(key(`groups-list:${archived}`, teacherId));
}

export async function setCachedGroupList(teacherId: string, archived: boolean, data: unknown) {
  await setCache(key(`groups-list:${archived}`, teacherId), data, GROUP_LIST_TTL);
}

export async function invalidateTeacherGroups(teacherId: string) {
  try {
    const redis = getRedisConnection();
    const pattern = `vedai:cache:groups-list:*:${teacherId}`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Cache deletions are non-critical.
  }
}
