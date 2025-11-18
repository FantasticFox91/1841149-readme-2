import { PrismaClient } from '@prisma/client';

const FIRST_TAG_UUID = '77646648-c595-4e49-89f0-fabfdd311010';
const SECOND_TAG_UUID = 'f7c13f14-e2de-4958-be55-1918f0a86c1f';

const FIRST_POST_UUID = 'b182f2f1-740f-4d6e-a304-e9a159f236e6';
const SECOND_POST_UUID = '290c23ed-5c50-42d9-a258-aa30ffd58f36';
const THIRD_POST_UUID = 'd956e310-2e54-43bc-b92e-703031c2b659';
const FOURTH_POST_UUID = 'd47c83b3-51f0-4b0a-9f6a-6201d8f3a57c';
const FIFTH_POST_UUID = '72c7aa70-c2c1-43ec-8662-56be13d9d19a';
const SIXTH_POST_UUID = '46ed8856-bb03-4344-bbef-2cb0cc59aa24';

const FIRST_USER_ID = '686d211ea0db1cee2faab282';
const SECOND_USER_ID = '686d22155a6bfd4bd6a24947';

function getTags() {
  return [
    { id: FIRST_TAG_UUID, title: 'знаменитость' },
    { id: SECOND_TAG_UUID, title: 'достопримечательность' },
  ];
}

function getTextPosts() {
  return [
    {
      id: FIRST_POST_UUID,
      authorId: FIRST_USER_ID,
      type: 'text' as const, // ✅ ИСПРАВЛЕНО: 'text' вместо 'TEXT'
      status: 'published' as const, // ✅ ИСПРАВЛЕНО: 'published' вместо 'PUBLISHED'
      tags: {
        connect: [{ id: FIRST_TAG_UUID }, { id: SECOND_TAG_UUID }],
      },
      textPost: {
        create: {
          title: `Руководство по современной веб-разработке`,
          announce: `Краткое введение в основы веб-разработки. В этой статье мы рассмотрим ключевые концепции и инструменты современного веб-программирования, которые должен знать каждый разработчик.`,
          text: `Подробное содержание статьи. В современном мире веб-разработки существует множество инструментов и технологий. JavaScript остается основным языком фронтенда, а фреймворки как React, Vue и Angular упрощают создание интерактивных пользовательских интерфейсов. Серверная часть может быть реализована на Node.js, Python, Java или других языках. Базы данных, как реляционные (PostgreSQL, MySQL), так и NoSQL (MongoDB, Redis), играют важную роль в хранении данных. DevOps практики с использованием Docker, Kubernetes и CI/CD пайплайнов помогают автоматизировать процесс разработки и деплоя приложений.`,
        },
      },
    },
    {
      id: SECOND_POST_UUID,
      authorId: SECOND_USER_ID,
      type: 'text' as const, // ✅ ИСПРАВЛЕНО
      status: 'published' as const, // ✅ ИСПРАВЛЕНО
      tags: {
        connect: [{ id: SECOND_TAG_UUID }],
      },
      textPost: {
        create: {
          title: `Путь к профессиональному росту в IT`,
          announce: `Практические советы для карьерного развития в сфере информационных технологий.`,
          text: `Детальное руководство по построению карьеры в IT. Начните с изучения основ программирования, затем специализируйтесь в выбранной области. Непрерывное обучение, участие в open-source проектах и нетворкинг помогут вам расти профессионально.`,
        },
      },
    },
  ];
}

function getVideoPosts() {
  return [
    {
      id: THIRD_POST_UUID,
      authorId: FIRST_USER_ID,
      type: 'video' as const, // ✅ ИСПРАВЛЕНО: 'video' вместо 'VIDEO'
      status: 'published' as const, // ✅ ИСПРАВЛЕНО
      tags: {
        connect: [{ id: SECOND_TAG_UUID }],
      },
      videoPost: {
        create: {
          title: 'Основы программирования для новичков',
          videoLink: 'https://youtube.com/watch?v=programming-basics-101',
        },
      },
    },
  ];
}

function getQuotePosts() {
  return [
    {
      id: FOURTH_POST_UUID,
      authorId: FIRST_USER_ID,
      type: 'quote' as const, // ✅ ИСПРАВЛЕНО: 'quote' вместо 'QUOTE'
      status: 'published' as const, // ✅ ИСПРАВЛЕНО
      tags: {
        connect: [{ id: FIRST_TAG_UUID }, { id: SECOND_TAG_UUID }],
      },
      quotePost: {
        create: {
          quote:
            'Код - это поэзия в действии. Каждая строка должна быть продумана и элегантна.',
          quoteAuthor: 'Стив Джобс',
        },
      },
    },
  ];
}

function getPhotoPosts() {
  return [
    {
      id: FIFTH_POST_UUID,
      authorId: FIRST_USER_ID,
      type: 'photo' as const, // ✅ ИСПРАВЛЕНО: 'photo' вместо 'PHOTO'
      status: 'published' as const, // ✅ ИСПРАВЛЕНО
      tags: {
        connect: [{ id: FIRST_TAG_UUID }, { id: SECOND_TAG_UUID }],
      },
      photoPost: {
        create: {
          photoLink:
            'https://example.com/photos/modern-architecture-building.jpg',
        },
      },
    },
  ];
}

function getLinkPosts() {
  return [
    {
      id: SIXTH_POST_UUID,
      authorId: SECOND_USER_ID,
      type: 'link' as const, // ✅ ИСПРАВЛЕНО: 'link' вместо 'LINK'
      status: 'published' as const, // ✅ ИСПРАВЛЕНО
      tags: {
        connect: [{ id: FIRST_TAG_UUID }, { id: SECOND_TAG_UUID }],
      },
      linkPost: {
        create: {
          link: 'https://github.com/microsoft/vscode',
          description:
            'Популярный редактор кода от Microsoft с огромным количеством расширений',
        },
      },
    },
  ];
}

function getComments() {
  return [
    {
      text: 'Отличная статья! Очень полезная информация.',
      authorId: FIRST_USER_ID,
      postId: FIRST_POST_UUID,
    },
    {
      text: 'Полностью согласен с автором.',
      authorId: SECOND_USER_ID,
      postId: THIRD_POST_UUID,
    },
  ];
}

function getLikes() {
  return [
    {
      userId: FIRST_USER_ID, // ✅ ИСПРАВЛЕНО: userId вместо authorId
      postId: SIXTH_POST_UUID,
    },
    {
      userId: SECOND_USER_ID, // ✅ ИСПРАВЛЕНО: userId вместо authorId
      postId: FOURTH_POST_UUID,
    },
  ];
}

async function seedDb(prismaClient: PrismaClient) {
  const mockTags = getTags();
  for (const tag of mockTags) {
    await prismaClient.tag.upsert({
      where: { id: tag.id },
      update: {},
      create: {
        id: tag.id,
        title: tag.title,
      },
    });
  }

  const mockTextPosts = getTextPosts();
  const mockVideoPosts = getVideoPosts();
  const mockQuotePosts = getQuotePosts();
  const mockPhotoPosts = getPhotoPosts();
  const mockLinkPosts = getLinkPosts();

  for (const post of mockTextPosts) {
    await prismaClient.post.create({
      data: {
        id: post.id,
        authorId: post.authorId,
        type: post.type,
        status: post.status,
        tags: post.tags,
        textPost: post.textPost,
      },
    });
  }

  for (const post of mockVideoPosts) {
    await prismaClient.post.create({
      data: {
        id: post.id,
        authorId: post.authorId,
        type: post.type,
        status: post.status,
        tags: post.tags,
        videoPost: post.videoPost,
      },
    });
  }

  for (const post of mockQuotePosts) {
    await prismaClient.post.create({
      data: {
        id: post.id,
        authorId: post.authorId,
        type: post.type,
        status: post.status,
        tags: post.tags,
        quotePost: post.quotePost,
      },
    });
  }

  for (const post of mockPhotoPosts) {
    await prismaClient.post.create({
      data: {
        id: post.id,
        authorId: post.authorId,
        type: post.type,
        status: post.status,
        tags: post.tags,
        photoPost: post.photoPost,
      },
    });
  }

  for (const post of mockLinkPosts) {
    await prismaClient.post.create({
      data: {
        id: post.id,
        authorId: post.authorId,
        type: post.type,
        status: post.status,
        tags: post.tags,
        linkPost: post.linkPost,
      },
    });
  }

  const mockComments = getComments();

  for (const comment of mockComments) {
    await prismaClient.comment.create({
      data: {
        text: comment.text,
        authorId: comment.authorId,
        postId: comment.postId,
      },
    });
  }

  const mockLikes = getLikes();

  for (const like of mockLikes) {
    await prismaClient.like.create({
      data: {
        userId: like.userId, // ✅ ИСПРАВЛЕНО: userId вместо authorId
        postId: like.postId,
      },
    });
  }

  console.info('🤘️ Database was filled');
}

async function bootstrap() {
  const prismaClient = new PrismaClient();

  try {
    await seedDb(prismaClient);
    globalThis.process.exit(0);
  } catch (error: unknown) {
    console.error(error);
    globalThis.process.exit(1);
  } finally {
    await prismaClient.$disconnect();
  }
}

bootstrap();
