"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateUser = getOrCreateUser;
exports.addFriend = addFriend;
exports.listFriends = listFriends;
exports.removeFriend = removeFriend;
exports.addPersonalExpense = addPersonalExpense;
exports.splitExpenseWithFriends = splitExpenseWithFriends;
exports.getBalances = getBalances;
exports.settleFriend = settleFriend;
exports.getStats = getStats;
const prisma_1 = require("./prisma");
async function getOrCreateUser(id, username) {
    return prisma_1.prisma.user.upsert({
        where: { id: BigInt(id) },
        update: { username },
        create: { id: BigInt(id), username },
    });
}
// Friend Management
async function addFriend(userId, name) {
    return prisma_1.prisma.friend.create({
        data: {
            userId: BigInt(userId),
            name: name.trim(),
        },
    });
}
async function listFriends(userId) {
    return prisma_1.prisma.friend.findMany({
        where: { userId: BigInt(userId) },
    });
}
async function removeFriend(userId, name) {
    return prisma_1.prisma.friend.delete({
        where: {
            userId_name: {
                userId: BigInt(userId),
                name: name.trim(),
            },
        },
    });
}
// Expense Management
async function addPersonalExpense(userId, amount, description) {
    return prisma_1.prisma.expense.create({
        data: {
            userId: BigInt(userId),
            amount,
            description,
            isPersonal: true,
        },
    });
}
async function splitExpenseWithFriends(userId, totalAmount, description, friendNames) {
    // Find all friends by name for this user
    const friends = await prisma_1.prisma.friend.findMany({
        where: {
            userId: BigInt(userId),
            name: { in: friendNames.map((n) => n.trim()) },
        },
    });
    if (friends.length === 0) {
        throw new Error("No valid friends found. Add them first using /friend add");
    }
    // Calculate split (total / (1 user + N friends))
    const splitCount = friends.length + 1;
    const splitAmount = totalAmount / splitCount;
    // Create the main expense
    const expense = await prisma_1.prisma.expense.create({
        data: {
            userId: BigInt(userId),
            amount: totalAmount,
            description,
            isPersonal: false,
        },
    });
    // Create splits for each friend
    await Promise.all(friends.map((friend) => prisma_1.prisma.expenseSplit.create({
        data: {
            expenseId: expense.id,
            friendId: friend.id,
            amount: splitAmount,
        },
    })));
    return { expense, splitAmount, participantCount: splitCount };
}
// Balance & Settlement
async function getBalances(userId) {
    const unsettedSplits = await prisma_1.prisma.expenseSplit.findMany({
        where: {
            isSettled: false,
            expense: { userId: BigInt(userId) },
        },
        include: {
            friend: true,
        },
    });
    // Aggregate by friend
    const balances = {};
    for (const split of unsettedSplits) {
        if (!balances[split.friend.name]) {
            balances[split.friend.name] = { name: split.friend.name, amount: 0 };
        }
        balances[split.friend.name].amount += split.amount;
    }
    return Object.values(balances);
}
async function settleFriend(userId, friendName) {
    // Find friend
    const friend = await prisma_1.prisma.friend.findUnique({
        where: {
            userId_name: {
                userId: BigInt(userId),
                name: friendName.trim(),
            },
        },
    });
    if (!friend)
        throw new Error("Friend not found");
    // Settle all unsetted splits for this friend
    return prisma_1.prisma.expenseSplit.updateMany({
        where: {
            friendId: friend.id,
            isSettled: false,
            expense: { userId: BigInt(userId) },
        },
        data: {
            isSettled: true,
        },
    });
}
// Stats
async function getStats(userId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenses = await prisma_1.prisma.expense.findMany({
        where: { userId: BigInt(userId) },
        include: { splits: true },
    });
    let todayTotal = 0;
    let monthTotal = 0;
    let allTimeTotal = 0;
    for (const exp of expenses) {
        const d = new Date(exp.date);
        // For personal total, we count the full amount if personal,
        // or just the user's portion if it was a split.
        // user portion = total - sum of all splits
        const friendPortion = exp.splits.reduce((acc, s) => acc + s.amount, 0);
        const userPortion = exp.amount - friendPortion;
        if (d >= todayStart)
            todayTotal += userPortion;
        if (d >= monthStart)
            monthTotal += userPortion;
        allTimeTotal += userPortion;
    }
    return { todayTotal, monthTotal, allTimeTotal };
}
