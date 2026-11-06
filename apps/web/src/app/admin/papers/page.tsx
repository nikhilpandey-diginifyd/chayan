import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, exams, pyqPapers } from "@chayan/db";
import { PAPER_LANGUAGE_LABELS } from "@chayan/shared";
import { PaperUploadForm } from "@/components/content/paper-upload-form";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/content";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { deletePaper, togglePaperPublished } from "./actions";

export const metadata: Metadata = { title: "Papers", robots: { index: false } };

export default async function AdminPapersPage() {
  await requireRole(["admin"], "/admin/papers");
  const db = getDb();
  const [examOptions, papers] = await Promise.all([
    db
      .select({ id: exams.id, shortName: exams.shortName })
      .from(exams)
      .orderBy(asc(exams.sortOrder)),
    db
      .select({
        id: pyqPapers.id,
        slug: pyqPapers.slug,
        title: pyqPapers.title,
        year: pyqPapers.year,
        language: pyqPapers.language,
        isPublished: pyqPapers.isPublished,
        downloadCount: pyqPapers.downloadCount,
        fileSizeBytes: pyqPapers.fileSizeBytes,
        answerKeyStorageKey: pyqPapers.answerKeyStorageKey,
        exam: exams.shortName,
      })
      .from(pyqPapers)
      .innerJoin(exams, eq(exams.id, pyqPapers.examId))
      .orderBy(desc(pyqPapers.createdAt))
      .limit(300),
  ]);

  return (
    <div className="py-10">
      <h1 className="text-3xl font-extrabold">Previous year papers</h1>
      <p className="text-ink-muted mt-2 max-w-prose">
        Upload official papers from upsc.gov.in and ssc.gov.in. Each paper gets its own public page
        for Google search; downloading needs a free account.
      </p>

      <section className="border-line bg-surface mt-8 rounded-[var(--radius-panel)] border p-6">
        <h2 className="text-xl font-bold">Add a paper</h2>
        <div className="mt-4">
          <PaperUploadForm exams={examOptions} />
        </div>
      </section>

      <h2 className="mt-10 text-xl font-bold">All papers ({papers.length})</h2>
      {papers.length === 0 ? (
        <p className="text-ink-muted mt-4">No papers yet.</p>
      ) : (
        <div className="border-line bg-surface mt-4 overflow-x-auto rounded-[var(--radius-control)] border">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-line text-ink-muted border-b">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Paper
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Language
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Downloads
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {papers.map((paper) => (
                <tr key={paper.id}>
                  <td className="px-4 py-3">
                    <Link href={`/papers/${paper.slug}`} className="text-pen font-semibold">
                      {paper.exam} {paper.year}: {paper.title}
                    </Link>
                    <span className="text-ink-muted block">
                      {formatFileSize(paper.fileSizeBytes)}
                      {paper.answerKeyStorageKey ? " · answer key" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">{PAPER_LANGUAGE_LABELS[paper.language]}</td>
                  <td className="px-4 py-3">{paper.downloadCount}</td>
                  <td className="px-4 py-3">{paper.isPublished ? "Live" : "Hidden"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <form action={togglePaperPublished}>
                        <input type="hidden" name="paperId" value={paper.id} />
                        <input
                          type="hidden"
                          name="publish"
                          value={paper.isPublished ? "false" : "true"}
                        />
                        <Button type="submit" variant="secondary" size="sm">
                          {paper.isPublished ? "Hide" : "Publish"}
                        </Button>
                      </form>
                      <form action={deletePaper}>
                        <input type="hidden" name="paperId" value={paper.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
