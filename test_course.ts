import { prisma } from './src/lib/prisma';

async function main() {
  const courseId = 'cmmxae0wm000g4ryn38id9luj';
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { tenant: true }
    });
    console.log('Course:', JSON.stringify(course, null, 2));
  } catch (e: any) {
    console.error('Query failed:', e.message);
  } finally {
    process.exit();
  }
}

main();
