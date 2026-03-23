import { prisma } from '../lib/prisma';

async function syncEnrollments() {
  console.log('Starting enrollment sync...');

  // 1. Find all LessonProgress records
  const progressRecords = await prisma.lessonProgress.findMany({
    include: {
      lesson: {
        include: {
          module: true
        }
      }
    }
  });

  console.log(`Found ${progressRecords.length} progress records.`);

  const missingEnrollments = [];

  for (const record of progressRecords) {
    const { userId } = record;
    const courseId = record.lesson.module.courseId;

    // 2. Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (!enrollment) {
      missingEnrollments.push({ userId, courseId });
    }
  }

  console.log(`Identified ${missingEnrollments.length} missing enrollment records.`);

  // 3. Create missing enrollments
  let createdCount = 0;
  for (const item of missingEnrollments) {
    try {
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: item.userId,
            courseId: item.courseId
          }
        },
        create: {
          userId: item.userId,
          courseId: item.courseId,
          status: 'ACTIVE'
        },
        update: {}
      });
      createdCount++;
    } catch (error) {
      console.error(`Failed to create enrollment for User ${item.userId} and Course ${item.courseId}`, error);
    }
  }

  console.log(`Successfully created ${createdCount} enrollment records.`);
}

syncEnrollments()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
