import { GuildMember } from "discord.js";
import prisma from "../database/database";
import redis from "../database/redis";
import { getAchievements } from "./utils";

/**
 * returns true if user has met requirements for achievement
 */
export async function addAchievementProgress(userId: string, achievementId: string) {
    const query = await prisma.achievements.upsert({
        create: {
            userId: userId,
            achievementId: achievementId,
        },
        update: {
            progress: { increment: 1 },
        },
        where: {
            userId_achievementId: {
                userId: userId,
                achievementId: achievementId,
            },
        },
        select: {
            progress: true,
        },
    });

    const achievements = getAchievements();

    if (query.progress >= achievements[achievementId].target) {
        return true;
    } else {
        return false;
    }
}

export async function setAchievementProgress(userId: string, achievementId: string, progress: number) {
    const query = await prisma.achievements.upsert({
        create: {
            userId: userId,
            achievementId: achievementId,
        },
        update: {
            progress: progress,
        },
        where: {
            userId_achievementId: {
                userId: userId,
                achievementId: achievementId,
            },
        },
        select: {
            progress: true,
        },
    });

    const achievements = getAchievements();

    if (query.progress >= achievements[achievementId].target) {
        return true;
    } else {
        return false;
    }
}

export async function getAllAchievements(member: GuildMember) {
    return await prisma.achievements.findMany({
        where: {
            userId: member.user.id,
        },
    });
}

export async function getCompletedAchievements(member: GuildMember) {
    return await prisma.achievements.findMany({
        where: {
            AND: [{ userId: member.user.id }, { completed: true }],
        },
    });
}

export async function getUncompletedAchievements(member: GuildMember) {
    return await prisma.achievements.findMany({
        where: {
            AND: [{ userId: member.user.id }, { progress: { gt: 0 } }],
        },
    });
}

export async function completeAchievement(userId: string, achievementId: string) {
    await prisma.achievements.update({
        where: {
            userId_achievementId: {
                userId: userId,
                achievementId: achievementId,
            },
        },
        data: {
            completed: true,
            completedAt: new Date(),
        },
    });

    await redis.set(`achievements:completed:${userId}`, achievementId);
}
