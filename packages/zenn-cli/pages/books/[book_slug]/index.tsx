import { useMemo } from "react";
import Head from "next/head";
import { NextPage, GetStaticProps, GetStaticPaths } from "next";
import { promises as fs } from "fs";
import { join } from "path";

import { BookHeader } from "@components/BookHeader";
import { MainContainer } from "@components/MainContainer";
import { ContentBody } from "@components/ContentBody";
import { ChapterList } from "@components/ChapterList";
import { BookBodyPlaceholder } from "@components/BookBodyPlaceholder";

import { getAllContentsNavCollections } from "@utils/nav-collections";
import { getBookBySlug } from "@utils/api/books";
import { getChapters } from "@utils/api/chapters";

import { Book, Chapter, NavCollections } from "@types";

type Props = {
  book: Book;
  chapters: Chapter[];
  chapterSlugListOnConfig: string[];
  allContentsNavCollection: NavCollections;
};

const Page: NextPage<Props> = (props) => {
  const { chapters, book } = props;
  const isAnyChapter = !!chapters?.length;

  const positionSpecifiedChapters = useMemo(
    () => chapters.filter((chapter) => chapter.position !== null),
    [chapters]
  );
  const positionUnspecifiedChapters = useMemo(
    () => chapters.filter((chapter) => chapter.position === null),
    [chapters]
  );
  const isConfigPositionMode = !!book.chapters;

  return (
    <>
      <Head>
        <title>{book.title || "無題"}のプレビュー</title>
      </Head>
      <MainContainer navCollections={props.allContentsNavCollection}>
        <article>
          <div>
            <BookHeader book={book} />
            <ContentBody>
              {isAnyChapter ? (
                <>
                  <h1>チャプターを編集する</h1>
                  {!isConfigPositionMode && (
                    <div className="msg alert">
                      <code>config.yaml</code>に<code>chapters</code>
                      が指定されていません。<code>数字.md</code>
                      というチャプター番号の指定の仕方は非推奨であり、今後廃止される可能性があります（
                      <a href="https://zenn.dev/zenn/articles/deprecated-book-deployment">
                        詳細
                      </a>
                      ）
                    </div>
                  )}
                  <ChapterList
                    chapters={positionSpecifiedChapters}
                    bookSlug={book.slug}
                  />
                  {!!positionUnspecifiedChapters?.length && (
                    <>
                      <h4>
                        以下のチャプターはconfig.yamlに指定されていないため公開されません
                      </h4>
                      <ChapterList
                        chapters={positionUnspecifiedChapters}
                        bookSlug={book.slug}
                        unordered={true}
                      />
                    </>
                  )}
                </>
              ) : (
                <BookBodyPlaceholder />
              )}
            </ContentBody>
          </div>
        </article>
      </MainContainer>
    </>
  );
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params.book_slug as string;
  const book = getBookBySlug(slug);

  if (!book) {
    throw new Error(
      `本の設定ファイル（books/${slug}/config.yaml）の内容が取得できませんでした`
    );
  }

  const chapters = getChapters(slug, book.chapters);

  const allContentsNavCollection = getAllContentsNavCollections();

  return {
    props: {
      book: {
        ...book,
        slug,
      },
      chapters,
      allContentsNavCollection,
    } as any,
  };
};
export const getStaticPaths: GetStaticPaths = async () => {
  const paths: { params: { book_slug: string; } }[] = [];
  for (const dir of await fs.readdir(join("books/"))) {
    const stat = await fs.stat(join("books/", dir));
    if (!stat.isDirectory()) {
      continue;
    }
    paths.push({
      params: {
        book_slug: dir,
      },
    });
  }
  return {
    fallback: false,
    paths: paths,
  };
};
export default Page;
