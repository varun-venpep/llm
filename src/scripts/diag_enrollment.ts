import { prisma } from '../lib/prisma';

async function checkData() {
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: 'venpep' }
  });

  if (!tenant) {
    console.log("Tenant 'venpep' not found");
    return;
  }

  console.log(`Tenant: ${tenant.name} (${tenant.id})`);

  const courses = await prisma.course.findMany({
    where: { tenantId: tenant.id },
    include: {
      _count: { select: { enrollments: true } }
    }
  });

  console.log("\nCourses in venpep:");
  courses.forEach(c => {
    console.log(`- ${c.title} (ID: ${c.id}): ${c._count.enrollments} enrolled`);
  });

  const students = await prisma.user.findMany({
    where: { tenantId: tenant.id, role: 'STUDENT' }
  });

  console.log("\nStudents in venpep:");
  for (const s of students) {
    const enrollment = await prisma.enrollment.findMany({
        where: { userId: s.id }
    });
    console.log(`- ${s.name} (${s.email}): ${enrollment.length} enrollments`);
    
    const progress = await prisma.lessonProgress.findMany({
        where: { userId: s.id },
        include: { lesson: { include: { module: true } } }
    });
    console.log(`  Progress records: ${progress.length}`);
    
    const distinctCoursesWithProgress = new Set(progress.map(p => p.lesson.module.courseId));
    console.log(`  Courses with progress: ${distinctCoursesWithProgress.size}`);
    
    for (const cid of distinctCoursesWithProgress) {
        const e = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId: s.id, courseId: cid } }
        });
        if (!e) {
            console.log(`  ! MISSING ENROLLMENT for course ID: ${cid}`);
        }
    }
  }
}

checkData()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
