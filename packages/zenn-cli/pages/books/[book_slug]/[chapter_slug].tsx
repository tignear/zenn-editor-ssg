import Head from "next/head";
import { NextPage, GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { promises as fs } from "fs";
import markdownToHtml from "zenn-markdown-html";
import initEmbed from "zenn-init-embed";
import { ContentBody } from "@components/ContentBody";
import { ChapterHeader } from "@components/ChapterHeader";
import { MainContainer } from "@components/MainContainer";
import { getBookNavCollections } from "@utils/nav-collections";
import { getChapter } from "@utils/api/chapters";
import { join } from "path";
import { Chapter, NavCollections } from "@types";

type Props = {
  chapter: Chapter;
  bookNavCollections: NavCollections;
};

const Page: NextPage<Props> = ({ chapter, bookNavCollections }) => {
  const router = useRouter();

  useEffect(() => {
    initEmbed(); // reInit everytime page changes
  }, [router.asPath]);

  return (
    <>
      <Head>
        <title>{chapter.title || `${chapter.slug}.md`}のプレビュー</title>
      </Head>
      <MainContainer navCollections={bookNavCollections}>
        <article>
          <ChapterHeader chapter={chapter} />
          <ContentBody content={chapter.content} />
        </article>
      </MainContainer>
    </>
  );
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const bookSlug = params.book_slug as string;
  const chapterSlug = params.chapter_slug as string;

  const bookNavCollections = getBookNavCollections(bookSlug);

  const chapter = getChapter(bookSlug, chapterSlug);

  if (!chapter) {
    throw new Error("Chapterの読み込みに失敗しました。");
  }

  const content = markdownToHtml(chapter.content);

  return {
    props: {
      chapter: {
        ...chapter,
        content,
      },
      bookNavCollections,
    },
  };
};
export const getStaticPaths: GetStaticPaths = async () => {
  const paths: { params: { book_slug: string; chapter_slug: string } }[] = [];
  for (const dir of await fs.readdir(join("books/"))) {
    const stat = await fs.stat(join("books/", dir));
    if (!stat.isDirectory()) {
      continue;
    }
    for (const file of await fs.readdir(join("books/", dir))) {
      if (!file.endsWith(".md")) {
        continue;
      }
      paths.push({
        params: {
          book_slug: dir,
          chapter_slug: file.slice(0, -3),
        },
      });
    }
  }
  return {
    fallback: false,
    paths: paths,
  };
};
export default Page;
