import { prisma } from '../lib/prisma';

async function checkQuizzes() {
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: 'venpep' }
  });

  if (!tenant) {
    console.log("Tenant 'venpep' not found");
    return;
  }

  const courses = await prisma.course.findMany({
    where: { tenantId: tenant.id },
    include: {
      modules: {
        include: {
          lessons: {
            where: { type: 'QUIZ' },
            include: {
              quiz: {
                include: {
                  questions: {
                    include: { options: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  console.log(`\nQuizzes for tenant: ${tenant.name}`);
  courses.forEach(course => {
    console.log(`Course: ${course.title}`);
    course.modules.forEach(mod => {
      console.log(`  Module: ${mod.title}`);
      mod.lessons.forEach(lesson => {
        console.log(`    Quiz Lesson: ${lesson.title} (ID: ${lesson.id})`);
        if (lesson.quiz) {
          console.log(`      Quiz ID: ${lesson.quiz.id}`);
          console.log(`      Questions: ${lesson.quiz.questions.length}`);
          lesson.quiz.questions.forEach((q, idx) => {
            console.log(`        Q${idx + 1}: ${q.text}`);
            console.log(`          Options: ${q.options.map(o => `${o.text} (${o.isCorrect ? 'Correct' : 'Wrong'})`).join(', ')}`);
          });
        } else {
          console.log(`      !! NO QUIZ DATA FOUND !!`);
        }
      });
    });
  });
}

checkQuizzes()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
