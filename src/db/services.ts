import { prisma } from "./prisma";

export async function getOrCreateUser(id: number | bigint, username?: string) {
  return prisma.user.upsert({
    where: { id: BigInt(id) },
    update: { username },
    create: { id: BigInt(id), username },
  });
}

// Friend Management
export async function addFriend(userId: number | bigint, name: string) {
  return prisma.friend.create({
    data: {
      userId: BigInt(userId),
      name: name.trim(),
    },
  });
}

export async function listFriends(userId: number | bigint) {
  return prisma.friend.findMany({
    where: { userId: BigInt(userId) },
  });
}

export async function removeFriend(userId: number | bigint, name: string) {
  return prisma.friend.delete({
    where: {
      userId_name: {
        userId: BigInt(userId),
        name: name.trim(),
      },
    },
  });
}

// Expense Management
export async function addPersonalExpense(
  userId: number | bigint,
  amount: number,
  description: string,
) {
  return prisma.expense.create({
    data: {
      userId: BigInt(userId),
      amount,
      description,
      isPersonal: true,
    },
  });
}

export async function splitExpenseWithFriends(
  userId: number | bigint,
  totalAmount: number,
  description: string,
  friendNames: string[],
) {
  // Find all friends by name for this user
  const friends = await prisma.friend.findMany({
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
  const expense = await prisma.expense.create({
    data: {
      userId: BigInt(userId),
      amount: totalAmount,
      description,
      isPersonal: false,
    },
  });

  // Create splits for each friend
  await Promise.all(
    friends.map((friend) =>
      prisma.expenseSplit.create({
        data: {
          expenseId: expense.id,
          friendId: friend.id,
          amount: splitAmount,
        },
      }),
    ),
  );

  return { expense, splitAmount, participantCount: splitCount };
}

// Balance & Settlement
export async function getBalances(userId: number | bigint) {
  const unsettedSplits = await prisma.expenseSplit.findMany({
    where: {
      isSettled: false,
      expense: { userId: BigInt(userId) },
    },
    include: {
      friend: true,
    },
  });

  // Aggregate by friend
  const balances: Record<string, { name: string; amount: number }> = {};
  for (const split of unsettedSplits) {
    if (!balances[split.friend.name]) {
      balances[split.friend.name] = { name: split.friend.name, amount: 0 };
    }
    balances[split.friend.name].amount += split.amount;
  }

  return Object.values(balances);
}

export async function settleFriend(
  userId: number | bigint,
  friendName: string,
) {
  // Find friend
  const friend = await prisma.friend.findUnique({
    where: {
      userId_name: {
        userId: BigInt(userId),
        name: friendName.trim(),
      },
    },
  });

  if (!friend) throw new Error("Friend not found");

  // Settle all unsetted splits for this friend
  return prisma.expenseSplit.updateMany({
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
export async function getStats(userId: number | bigint) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const expenses = await prisma.expense.findMany({
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

    if (d >= todayStart) todayTotal += userPortion;
    if (d >= monthStart) monthTotal += userPortion;
    allTimeTotal += userPortion;
  }

  return { todayTotal, monthTotal, allTimeTotal };
}
